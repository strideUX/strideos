/**
 * ProjectFormDialog - Form dialog for creating new projects with validation
 *
 * @remarks
 * Provides a comprehensive form interface for project creation including title, client,
 * department, description, and optional due date. Integrates with project form hooks
 * for form state management and submission. Supports conditional field display.
 *
 * @example
 * ```tsx
 * <ProjectFormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   defaultValues={{ clientId: "client123", departmentId: "dept456" }}
 *   hideDescription={false}
 *   showDueDate={true}
 *   onSuccess={handleProjectCreated}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Id } from "@/convex/_generated/dataModel";
import { useProjectForm } from "@/hooks/use-project-form";

// 3. Types
interface ProjectFormDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback for dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Default values for client and department selection */
  defaultValues?: {
    clientId?: Id<"clients">;
    departmentId?: Id<"departments">;
  };
  /** Whether to hide the description field */
  hideDescription?: boolean;
  /** Whether to show the due date field */
  showDueDate?: boolean;
  /** Callback for successful project creation */
  onSuccess?: (result: { projectId: Id<"projects">; documentId: Id<"documents"> }) => void;
}

// 4. Component definition
export const ProjectFormDialog = memo(function ProjectFormDialog({ 
  open, 
  onOpenChange, 
  defaultValues, 
  hideDescription, 
  showDueDate, 
  onSuccess 
}: ProjectFormDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
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

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const shouldShowDescription = useMemo(() => {
    return !hideDescription;
  }, [hideDescription]);

  const shouldShowDueDate = useMemo(() => {
    return showDueDate;
  }, [showDueDate]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('title', e.target.value);
  }, [updateField]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateField('description', e.target.value);
  }, [updateField]);

  const handleDueDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('dueDate', e.target.value);
  }, [updateField]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmitClick = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
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
              onChange={handleTitleChange} 
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
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
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
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {shouldShowDescription && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={formData.description} 
                onChange={handleDescriptionChange} 
                placeholder="Optional description" 
              />
            </div>
          )}
          {shouldShowDueDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Due Date</label>
              <Input 
                type="date" 
                value={formData.dueDate} 
                onChange={handleDueDateChange} 
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmitClick}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
