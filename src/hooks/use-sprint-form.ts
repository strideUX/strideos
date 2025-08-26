import { useEffect, useMemo, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Department = { _id: Id<"departments">; name: string; workstreamCount: number; clientId: Id<"clients"> };
type Client = { _id: Id<"clients">; name: string };

interface Sprint {
  _id: Id<"sprints">;
  name?: string;
  description?: string;
  clientId?: Id<"clients">;
  departmentId?: Id<"departments">;
  startDate?: number;
  endDate?: number;
  duration?: number;
}

interface SprintFormData {
  selectedClientId: Id<"clients"> | "";
  selectedDepartment: Id<"departments"> | "";
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
}

interface UseSprintFormProps {
  sprint?: Sprint;
  initialClientId?: Id<"clients">;
  initialDepartmentId?: Id<"departments">;
  onSuccess?: (sprintId: Id<"sprints">) => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * useSprintForm - Manages sprint form state and business logic
 * 
 * @param props - Sprint form configuration
 * @returns Sprint form state and methods
 */
export function useSprintForm({
  sprint,
  initialClientId,
  initialDepartmentId,
  onSuccess,
  onOpenChange,
}: UseSprintFormProps) {
  // Convex mutations
  const createSprint = useMutation(api.sprints.createSprint);
  const updateSprint = useMutation(api.sprints.updateSprint);

  // Form state
  const [formData, setFormData] = useState<SprintFormData>({
    selectedClientId: initialClientId || "",
    selectedDepartment: initialDepartmentId || "",
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    durationWeeks: 2,
  });

  // Convex queries
  const org = useQuery(api.organizations.getCurrentOrganization, {});
  const clientOptionsQuery = useQuery(api.clients.listClients, {});
  const deptOptionsQuery = useQuery(
    api.departments.listDepartmentsByClient,
    formData.selectedClientId ? { clientId: formData.selectedClientId } : "skip"
  );

  // Computed values
  const clientOptions: Client[] = (clientOptionsQuery ?? []) as Client[];
  const departmentOptionsQuery = deptOptionsQuery as Department[] | undefined;
  const departmentOptions: Department[] = useMemo(() => departmentOptionsQuery ?? [], [departmentOptionsQuery]);

  const filteredDepartments = useMemo(() => {
    return departmentOptions.filter((d) => (formData.selectedClientId ? d.clientId === formData.selectedClientId : true));
  }, [departmentOptions, formData.selectedClientId]);

  const isFormValid = useMemo(() => {
    return !!(
      formData.name.trim() && 
      formData.selectedClientId && 
      formData.selectedDepartment && 
      formData.startDate
    );
  }, [formData.name, formData.selectedClientId, formData.selectedDepartment, formData.startDate]);

  // Business logic: Compute target end date from start date and duration
  const addBusinessDays = useCallback((start: Date, businessDays: number): Date => {
    const result = new Date(start);
    let added = 1;
    if (businessDays <= 1) return result;
    while (added < businessDays) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) added += 1;
    }
    return result;
  }, []);

  // Update end date when start date or duration changes
  useEffect(() => {
    if (!formData.startDate) {
      setFormData(prev => ({ ...prev, endDate: "" }));
      return;
    }
    try {
      const start = new Date(formData.startDate + "T00:00:00");
      const days = Math.max(1, formData.durationWeeks * 5);
      const end = addBusinessDays(start, days);
      setFormData(prev => ({ ...prev, endDate: end.toISOString().substring(0, 10) }));
    } catch {
      setFormData(prev => ({ ...prev, endDate: "" }));
    }
  }, [formData.startDate, formData.durationWeeks, addBusinessDays]);

  // Initialize form data when sprint or org changes
  useEffect(() => {
    if (sprint) {
      setFormData({
        selectedClientId: sprint.clientId || "",
        selectedDepartment: sprint.departmentId || "",
        name: sprint.name ?? "",
        description: sprint.description ?? "",
        startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().substring(0, 10) : "",
        endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().substring(0, 10) : "",
        durationWeeks: typeof sprint.duration === "number" ? sprint.duration : 2,
      });
    } else {
      setFormData(prev => ({
        ...prev,
        durationWeeks: org?.defaultSprintDuration ?? 2,
      }));
    }
  }, [sprint, org]);

  // Form submission handler
  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    const start = new Date(formData.startDate).getTime();
    const end = new Date(formData.endDate).getTime();
    
    if (isNaN(start) || isNaN(end) || start >= end) {
      toast.error("Invalid dates");
      return;
    }

    try {
      if (sprint?._id) {
        // Update existing sprint
        await updateSprint({ 
          id: sprint._id, 
          name: formData.name.trim(), 
          description: formData.description.trim() || undefined, 
          startDate: start, 
          endDate: end, 
          duration: formData.durationWeeks 
        });
        toast.success("Sprint updated");
        onOpenChange(false);
        onSuccess?.(sprint._id);
      } else {
        // Create new sprint
        const newId = await createSprint({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          clientId: formData.selectedClientId as Id<"clients">,
          departmentId: formData.selectedDepartment as Id<"departments">,
          startDate: start,
          endDate: end,
          duration: org?.defaultSprintDuration ?? 2,
          totalCapacity: (departmentOptions.find((d) => d._id === formData.selectedDepartment)?.workstreamCount || 0) * (org?.defaultWorkstreamCapacity ?? 32),
        });
        toast.success("Sprint created");
        onOpenChange(false);
        onSuccess?.(newId);
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error?.message ?? "Failed to save sprint");
    }
  }, [
    isFormValid,
    formData,
    sprint,
    updateSprint,
    createSprint,
    org,
    departmentOptions,
    onOpenChange,
    onSuccess,
  ]);

  // Form field update handlers
  const updateField = useCallback((field: keyof SprintFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const setSelectedClientId = useCallback((clientId: Id<"clients"> | "") => {
    setFormData(prev => ({ 
      ...prev, 
      selectedClientId: clientId,
      selectedDepartment: "", // Reset department when client changes
    }));
  }, []);

  const setSelectedDepartment = useCallback((departmentId: Id<"departments"> | "") => {
    setFormData(prev => ({ ...prev, selectedDepartment: departmentId }));
  }, []);

  return useMemo(() => ({
    // Form state
    formData,
    isFormValid,
    
    // Options
    clientOptions,
    departmentOptions: filteredDepartments,
    
    // Actions
    handleSubmit,
    updateField,
    setSelectedClientId,
    setSelectedDepartment,
    
    // Computed values
    isEditMode: !!sprint,
    canProceed: !!(formData.selectedClientId && formData.selectedDepartment),
  }), [
    formData,
    isFormValid,
    clientOptions,
    filteredDepartments,
    handleSubmit,
    updateField,
    setSelectedClientId,
    setSelectedDepartment,
    sprint,
  ]);
}
