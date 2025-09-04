/**
 * SprintFormDialog - Form dialog for creating and editing sprints with validation
 *
 * @remarks
 * Handles both creation and editing modes for sprints. Validates client/department selection,
 * sprint name requirements, and date constraints. Integrates with sprint hooks for form
 * state management and submission. Provides conditional field enabling based on selection state.
 *
 * @example
 * ```tsx
 * <SprintFormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   sprint={existingSprint}
 *   initialClientId={clientId}
 *   initialDepartmentId={departmentId}
 *   onSuccess={(id) => router.push(`/sprint/${id}`)}
 *   hideDescription={false}
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
import { useSprintForm } from "@/hooks/use-sprint-form";
import { Id } from "@/convex/_generated/dataModel";

// 3. Types (if not in separate file)
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

interface SprintFormDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback to control dialog open/close state */
  onOpenChange: (open: boolean) => void;
  /** Sprint to edit (undefined for creation mode) */
  sprint?: Sprint;
  /** Pre-selected client for new sprints */
  initialClientId?: Id<"clients">;
  /** Pre-selected department for new sprints */
  initialDepartmentId?: Id<"departments">;
  /** Callback fired when sprint is successfully created/updated */
  onSuccess?: (sprintId: Id<"sprints">) => void;
  /** Hide description field for simplified creation */
  hideDescription?: boolean;
}

// 4. Component definition
export const SprintFormDialog = memo(function SprintFormDialog({
  open,
  onOpenChange,
  sprint,
  initialClientId,
  initialDepartmentId,
  onSuccess,
  hideDescription = false,
}: SprintFormDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
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

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const dialogTitle = useMemo(() => {
    return isEditMode ? "Edit Sprint" : "Create New Sprint";
  }, [isEditMode]);

  const submitButtonText = useMemo(() => {
    return isEditMode ? "Update Sprint" : "Create Sprint";
  }, [isEditMode]);

  const formDisabled = useMemo(() => {
    return !canProceed;
  }, [canProceed]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleClientChange = useCallback((value: string) => {
    setSelectedClientId(value as Id<'clients'>);
  }, [setSelectedClientId]);

  const handleDepartmentChange = useCallback((value: string) => {
    setSelectedDepartment(value as Id<'departments'>);
  }, [setSelectedDepartment]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('name', e.target.value);
  }, [updateField]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('description', e.target.value);
  }, [updateField]);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('startDate', e.target.value);
  }, [updateField]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed in this component)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>Provide basic sprint details</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Client</label>
              <Select value={formData.selectedClientId} onValueChange={handleClientChange}>
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
              <Select value={formData.selectedDepartment} onValueChange={handleDepartmentChange}>
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

          <div className={formDisabled ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-sm font-medium">Sprint Name</label>
            <Input 
              disabled={formDisabled} 
              value={formData.name} 
              onChange={handleNameChange} 
              placeholder="Sprint name" 
            />
          </div>

          {!hideDescription && (
            <div className={formDisabled ? "opacity-50 pointer-events-none" : ""}>
              <label className="text-sm font-medium">Description</label>
              <Input 
                disabled={formDisabled} 
                value={formData.description} 
                onChange={handleDescriptionChange} 
                placeholder="Optional" 
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className={formDisabled ? "opacity-50 pointer-events-none" : ""}>
              <label className="text-sm font-medium">Start Date</label>
              <Input 
                disabled={formDisabled} 
                type="date" 
                value={formData.startDate} 
                onChange={handleStartDateChange} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Target End Date</label>
              <Input type="date" value={formData.endDate} readOnly disabled />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});


