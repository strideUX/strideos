"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Id } from "@/convex/_generated/dataModel";
import { useProjectForm } from "@/hooks/use-project-form";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    clientId?: Id<"clients">;
    departmentId?: Id<"departments">;
  };
  hideDescription?: boolean;
  showDueDate?: boolean;
  // Note: priority not yet in schema; will add later when approved
  onSuccess?: (result: { projectId: Id<"projects">; documentId: Id<"documents"> }) => void;
}



export function ProjectFormDialog({ open, onOpenChange, defaultValues, hideDescription, showDueDate, onSuccess }: ProjectFormDialogProps) {
  const {
    formData,
    clients,
    filteredDepartments,
    handleSubmit,
    updateField,
    setSelectedClientId,
    setSelectedDepartment,
  } = useProjectForm({
    open,
    onOpenChange,
    defaultValues,
    hideDescription,
    showDueDate,
    onSuccess,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Start a new project for this client.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input 
              value={formData.title} 
              onChange={(e) => updateField('title', e.target.value)} 
              placeholder="Project title" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <Select value={formData.selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={formData.selectedDepartmentId} onValueChange={setSelectedDepartment}>
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
          {!hideDescription && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => updateField('description', e.target.value)} 
                placeholder="Optional description" 
              />
            </div>
          )}
          {showDueDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Due Date</label>
              <Input 
                type="date" 
                value={formData.dueDate} 
                onChange={(e) => updateField('dueDate', e.target.value)} 
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
