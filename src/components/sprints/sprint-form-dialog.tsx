"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSprintForm } from "@/hooks/use-sprint-form";
import { Id } from "@/convex/_generated/dataModel";

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
  hideDescription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint?: Sprint;
  initialClientId?: Id<"clients">;
  initialDepartmentId?: Id<"departments">;
  onSuccess?: (sprintId: Id<"sprints">) => void;
  hideDescription?: boolean;
}) {
  const {
    formData,
    isFormValid,
    clientOptions,
    departmentOptions,
    handleSubmit,
    updateField,
    setSelectedClientId,
    setSelectedDepartment,
    isEditMode,
    canProceed,
  } = useSprintForm({
    sprint,
    initialClientId,
    initialDepartmentId,
    onSuccess,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Sprint" : "Create New Sprint"}</DialogTitle>
          <DialogDescription>Provide basic sprint details</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Client</label>
              <Select value={formData.selectedClientId} onValueChange={(v) => setSelectedClientId(v as Id<'clients'>)}>
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
              <Select value={formData.selectedDepartment} onValueChange={(v) => setSelectedDepartment(v as Id<'departments'>)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((d) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!canProceed ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              Select a client and department to continue.
            </div>
          ) : null}

          <div className={!canProceed ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-sm font-medium">Sprint Name</label>
            <Input 
              disabled={!canProceed} 
              value={formData.name} 
              onChange={(e) => updateField('name', e.target.value)} 
              placeholder="Sprint name" 
            />
          </div>

          {!hideDescription && (
            <div className={!canProceed ? "opacity-50 pointer-events-none" : ""}>
              <label className="text-sm font-medium">Description</label>
              <Input 
                disabled={!canProceed} 
                value={formData.description} 
                onChange={(e) => updateField('description', e.target.value)} 
                placeholder="Optional" 
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className={!canProceed ? "opacity-50 pointer-events-none" : ""}>
              <label className="text-sm font-medium">Start Date</label>
              <Input 
                disabled={!canProceed} 
                type="date" 
                value={formData.startDate} 
                onChange={(e) => updateField('startDate', e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Target End Date</label>
              <Input type="date" value={formData.endDate} readOnly disabled />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            {isEditMode ? "Update Sprint" : "Create Sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


