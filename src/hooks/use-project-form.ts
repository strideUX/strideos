import { useEffect, useMemo, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useDialogState } from "./use-dialog-state";
import { useFormValidation } from "./use-form-validation";

interface ProjectFormData {
  title: string;
  description: string;
  selectedClientId: Id<"clients"> | "";
  selectedDepartmentId: Id<"departments"> | "";
  dueDate: string;
}

interface UseProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    clientId?: Id<"clients">;
    departmentId?: Id<"departments">;
  };
  hideDescription?: boolean;
  showDueDate?: boolean;
  onSuccess?: (result: { projectId: Id<"projects">; documentId: Id<"documents"> }) => void;
}

interface ClientOption { 
  _id: Id<"clients">; 
  name: string; 
}

interface DepartmentOption { 
  _id: Id<"departments">; 
  name: string; 
  clientId: Id<"clients">; 
}

/**
 * useProjectForm - Manages project form state and business logic
 *
 * @param props - Project form configuration
 * @returns Project form state and methods
 */
export function useProjectForm({
  open,
  onOpenChange,
  defaultValues,
  hideDescription,
  showDueDate,
  onSuccess,
}: UseProjectFormProps) {
  const { close } = useDialogState();

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    selectedClientId: "",
    selectedDepartmentId: "",
    dueDate: "",
  });

  // Convex mutations and queries
  const createProject = useMutation(api.projects.createProject);
  const clients = (useQuery(api.clients.listClients, {}) ?? []) as ClientOption[];
  const departmentsQuery = useQuery(
    api.departments.listDepartmentsByClient,
    formData.selectedClientId ? { clientId: formData.selectedClientId } : "skip"
  ) as DepartmentOption[] | undefined;

  // Form validation
  const validationRules = [
    { field: 'title', validator: (value: string) => value.trim() ? null : 'Title is required', required: true },
    { field: 'selectedClientId', validator: (value: string) => value ? null : 'Client is required', required: true },
    { field: 'selectedDepartmentId', validator: (value: string) => value ? null : 'Department is required', required: true },
  ];

  const {
    errors,
    isValid,
    validateForm,
    clearErrors,
    setFieldError,
    clearFieldError,
  } = useFormValidation(validationRules);

  // Computed values
  const departments = useMemo(() => departmentsQuery ?? [], [departmentsQuery]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => 
      formData.selectedClientId ? d.clientId === formData.selectedClientId : true
    );
  }, [departments, formData.selectedClientId]);

  const isFormValid = useMemo(() => {
    return formData.title.trim() && 
           formData.selectedClientId && 
           formData.selectedDepartmentId;
  }, [formData.title, formData.selectedClientId, formData.selectedDepartmentId]);

  // Actions
  const updateField = useCallback((field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field as any);
  }, [clearFieldError]);

  const setSelectedClientId = useCallback((clientId: Id<"clients"> | "") => {
    updateField('selectedClientId', clientId);
    // Reset department when client changes
    updateField('selectedDepartmentId', "");
  }, [updateField]);

  const setSelectedDepartment = useCallback((departmentId: Id<"departments"> | "") => {
    updateField('selectedDepartmentId', departmentId);
  }, [updateField]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      toast.error("Please provide title, client and department");
      return;
    }

    try {
      const result = await createProject({
        title: formData.title.trim(),
        clientId: formData.selectedClientId,
        departmentId: formData.selectedDepartmentId,
        description: hideDescription ? undefined : (formData.description.trim() || undefined),
        template: "project_brief",
        targetDueDate: showDueDate && formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        visibility: "client",
      });

      toast.success("Project created");
      onOpenChange(false);
      onSuccess?.(result);
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error?.message ?? "Failed to create project");
    }
  }, [
    isFormValid,
    formData,
    hideDescription,
    showDueDate,
    createProject,
    onOpenChange,
    onSuccess,
  ]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        description: "",
        selectedClientId: defaultValues?.clientId ?? "",
        selectedDepartmentId: defaultValues?.departmentId ?? "",
        dueDate: "",
      });
      clearErrors();
    }
  }, [open, defaultValues?.clientId, defaultValues?.departmentId, clearErrors]);

  return useMemo(() => ({
    // Form data
    formData,
    
    // Validation
    errors,
    isValid: isFormValid,
    
    // Options
    clients,
    filteredDepartments,
    
    // Actions
    handleSubmit,
    updateField,
    setSelectedClientId,
    setSelectedDepartment,
    
    // Computed
    isFormValid,
  }), [
    formData,
    errors,
    isFormValid,
    clients,
    filteredDepartments,
    handleSubmit,
    updateField,
    setSelectedClientId,
    setSelectedDepartment,
  ]);
}
