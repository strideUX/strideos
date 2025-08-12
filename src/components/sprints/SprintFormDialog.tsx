"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function SprintFormDialog({
  open,
  onOpenChange,
  sprint,
  initialClientId,
  initialDepartmentId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint?: Sprint;
  initialClientId?: Id<"clients">;
  initialDepartmentId?: Id<"departments">;
  onSuccess?: (sprintId: Id<"sprints">) => void;
}) {
  const createSprint = useMutation(api.sprints.createSprint);
  const updateSprint = useMutation(api.sprints.updateSprint);

  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | "">(initialClientId || "");
  const [selectedDepartment, setSelectedDepartment] = useState<Id<"departments"> | "">(initialDepartmentId || "");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [durationWeeks, setDurationWeeks] = useState<number>(2);

  const org = useQuery(api.organizations.getCurrentOrganization, {});
  const clientOptionsQuery = useQuery(api.clients.listClients, {});
  const deptOptionsQuery = useQuery(
    api.departments.listDepartmentsByClient,
    selectedClientId ? { clientId: selectedClientId } : "skip"
  );

  const clientOptions: Client[] = (clientOptionsQuery ?? []) as Client[];
  const departmentOptions: Department[] = (deptOptionsQuery ?? []) as Department[];

  useEffect(() => {
    if (sprint) {
      if (sprint.clientId) setSelectedClientId(sprint.clientId);
      if (sprint.departmentId) setSelectedDepartment(sprint.departmentId);
      setName(sprint.name ?? "");
      setDescription(sprint.description ?? "");
      if (sprint.startDate) {
        const d = new Date(sprint.startDate);
        if (!isNaN(d.getTime())) setStartDate(d.toISOString().substring(0, 10));
      }
      if (sprint.endDate) {
        const d = new Date(sprint.endDate);
        if (!isNaN(d.getTime())) setEndDate(d.toISOString().substring(0, 10));
      }
      if (typeof sprint.duration === "number") setDurationWeeks(sprint.duration);
    } else {
      setDurationWeeks(org?.defaultSprintDuration ?? 2);
    }
  }, [sprint, org]);

  // Compute target end date from start date and duration (business weeks → 5 days/week)
  function addBusinessDays(start: Date, businessDays: number): Date {
    const result = new Date(start);
    let added = 1;
    if (businessDays <= 1) return result;
    while (added < businessDays) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) added += 1;
    }
    return result;
  }
  useEffect(() => {
    if (!startDate) {
      setEndDate("");
      return;
    }
    try {
      const start = new Date(startDate + "T00:00:00");
      const days = Math.max(1, durationWeeks * 5);
      const end = addBusinessDays(start, days);
      setEndDate(end.toISOString().substring(0, 10));
    } catch {
      setEndDate("");
    }
  }, [startDate, durationWeeks]);

  const filteredDepartments = useMemo(() => {
    return departmentOptions.filter((d) => (selectedClientId ? d.clientId === selectedClientId : true));
  }, [departmentOptions, selectedClientId]);

  const handleSubmit = async () => {
    if (!name.trim() || !selectedClientId || !selectedDepartment || !startDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || start >= end) {
      toast.error("Invalid dates");
      return;
    }

    try {
      if (sprint?._id) {
        await updateSprint({ id: sprint._id, name: name.trim(), description: description.trim() || undefined, startDate: start, endDate: end, duration: durationWeeks });
        toast.success("Sprint updated");
        onOpenChange(false);
        onSuccess?.(sprint._id);
      } else {
        const newId = await createSprint({
          name: name.trim(),
          description: description.trim() || undefined,
          clientId: selectedClientId,
          departmentId: selectedDepartment,
          startDate: start,
          endDate: end,
          duration: org?.defaultSprintDuration ?? 2,
          totalCapacity: (departmentOptions.find((d) => d._id === selectedDepartment)?.workstreamCount || 0) * (org?.defaultWorkstreamCapacity ?? 32),
        });
        toast.success("Sprint created");
        onOpenChange(false);
        onSuccess?.(newId);
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error?.message ?? "Failed to save sprint");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sprint ? "Edit Sprint" : "Create New Sprint"}</DialogTitle>
          <DialogDescription>Provide basic sprint details</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Client</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments.map((d) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!(selectedClientId && selectedDepartment) ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              Select a client and department to continue.
            </div>
          ) : null}

          <div className={!(selectedClientId && selectedDepartment) ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-sm font-medium">Sprint Name</label>
            <Input disabled={!(selectedClientId && selectedDepartment)} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint name" />
          </div>

          <div className={!(selectedClientId && selectedDepartment) ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-sm font-medium">Description</label>
            <Input disabled={!(selectedClientId && selectedDepartment)} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={!(selectedClientId && selectedDepartment) ? "opacity-50 pointer-events-none" : ""}>
              <label className="text-sm font-medium">Start Date</label>
              <Input disabled={!(selectedClientId && selectedDepartment)} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Target End Date</label>
              <Input type="date" value={endDate} readOnly disabled />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedDepartment || !selectedClientId || !name.trim()}>
            {sprint ? "Update Sprint" : "Create Sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


