/**
 * TaskEditDialog - Dialog component for editing task properties and metadata
 *
 * @remarks
 * Provides a comprehensive form interface for editing task details including title,
 * description, priority, size, and assignee. Integrates with task editor hooks for
 * form state management and validation. Supports real-time updates and form validation.
 *
 * @example
 * ```tsx
 * <TaskEditDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   task={selectedTask}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTaskEditor, type EditableTask } from '@/hooks/use-task-editor';

// 3. Types
interface TaskEditDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback for dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Task to edit, or null for new task creation */
  task: EditableTask | null;
}

// 4. Component definition
export const TaskEditDialog = memo(function TaskEditDialog({ 
  open, 
  onOpenChange, 
  task 
}: TaskEditDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const {
    formData,
    isFormValid,
    eligibleAssignees,
    handleUpdate,
    setTitle,
    setDescription,
    setPriority,
    setAssigneeId,
    setSizeDays,
  } = useTaskEditor({ task, open, onOpenChange });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const sizeOptions = useMemo(() => [
    { value: "0.5", label: "XS • 0.5d (4h)" },
    { value: "2", label: "S • 2d (16h)" },
    { value: "4", label: "M • 4d (32h)" },
    { value: "6", label: "L • 6d (48h)" },
    { value: "8", label: "XL • 8d (64h)" },
  ], []);

  const priorityOptions = useMemo(() => [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ], []);

  const sizeValue = useMemo(() => {
    return formData.sizeDays !== undefined ? String(formData.sizeDays) : undefined;
  }, [formData.sizeDays]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, [setTitle]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  }, [setDescription]);

  const handlePriorityChange = useCallback((value: string) => {
    setPriority(value as any);
  }, [setPriority]);

  const handleSizeChange = useCallback((value: string) => {
    setSizeDays(Number(value));
  }, [setSizeDays]);

  const handleAssigneeChange = useCallback((value: string) => {
    setAssigneeId(value === 'unassigned' ? 'unassigned' : (value as any));
  }, [setAssigneeId]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(() => {
    handleUpdate();
  }, [handleUpdate]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <Input 
              value={formData.title} 
              onChange={handleTitleChange} 
              placeholder="Enter task title" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea 
              value={formData.description} 
              onChange={handleDescriptionChange} 
              rows={3} 
              placeholder="Task description" 
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <Select value={formData.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size (days)
              </label>
              <Select value={sizeValue} onValueChange={handleSizeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <Select value={formData.assigneeId as any} onValueChange={handleAssigneeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {eligibleAssignees.map((u) => (
                    <SelectItem key={u._id} value={u._id as any}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isFormValid}>
              Update Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});


