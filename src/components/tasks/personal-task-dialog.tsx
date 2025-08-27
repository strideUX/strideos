/**
 * PersonalTaskDialog - Dialog component for creating and editing personal tasks
 *
 * @remarks
 * Provides a comprehensive form interface for personal task management including title,
 * description, priority, due date, size, and attachments. Supports both creation and
 * editing modes with real-time validation and file management.
 *
 * @example
 * ```tsx
 * <PersonalTaskDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   task={selectedTask}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */

// 1. External imports
import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame } from '@tabler/icons-react';
import { toast } from 'sonner';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import TaskDescriptionEditor from '@/components/tasks/task-description-editor';
import { AttachmentUploader } from '@/components/attachments/attachment-uploader';
import { AttachmentList } from '@/components/attachments/attachment-list';

// 3. Types
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface PersonalTaskDialogTask {
  _id: Id<'tasks'>;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: number;
  sizeHours?: number;
  taskType?: 'personal' | string;
}

interface PersonalTaskDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback for dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Task to edit, or undefined for new task creation */
  task?: PersonalTaskDialogTask | null;
  /** Callback for successful task creation/update */
  onSuccess?: () => void;
}

// 4. Component definition
export const PersonalTaskDialog = memo(function PersonalTaskDialog({ 
  open, 
  onOpenChange, 
  task, 
  onSuccess 
}: PersonalTaskDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const createPersonalTodo = useMutation(api.tasks.createPersonalTodo);
  const updateTask = useMutation(api.tasks.updateTask);

  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [sizeHours, setSizeHours] = useState<number | undefined>(undefined);

  // Attachments only in edit mode
  const taskId = task?._id ? String(task._id) : null;
  const listAttachments = (useQuery as unknown as <T1, T2>(fn: any, args: T1) => T2)(
    api.attachments.listByEntity,
    (taskId ? { entityType: 'task', entityId: taskId } : 'skip') as any
  ) as any[] | undefined;
  const deleteAttachmentMutation = useMutation(api.attachments.deleteAttachment);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const attachments = useMemo(() => listAttachments ?? [], [listAttachments]);

  const isEditMode = useMemo(() => {
    return !!task;
  }, [task]);

  const dialogTitle = useMemo(() => {
    return isEditMode ? 'Edit Personal Task' : 'New Personal Task';
  }, [isEditMode]);

  const submitButtonText = useMemo(() => {
    return isSaving ? 'Saving...' : (isEditMode ? 'Update Task' : 'Create Task');
  }, [isSaving, isEditMode]);

  const hasAttachments = useMemo(() => {
    return attachments && attachments.length > 0;
  }, [attachments]);

  const canSubmit = useMemo(() => {
    return title.trim() && !isSaving;
  }, [title, isSaving]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const getPriorityIcon = useCallback((p: string) => {
    switch (p) {
      case 'low':
        return <IconArrowNarrowDown className="h-4 w-4 text-blue-500" aria-label="Low priority" />;
      case 'medium':
        return <IconArrowsDiff className="h-4 w-4 text-gray-500" aria-label="Medium priority" />;
      case 'high':
        return <IconArrowNarrowUp className="h-4 w-4 text-orange-500" aria-label="High priority" />;
      case 'urgent':
        return <IconFlame className="h-4 w-4 text-red-600" aria-label="Urgent priority" />;
      default:
        return <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Priority" />;
    }
  }, []);

  const handleDeleteAttachment = useCallback(async (id: string) => {
    try {
      await deleteAttachmentMutation({ attachmentId: id as any });
      toast.success('Attachment deleted');
    } catch {
      toast.error('Failed to delete attachment');
    }
  }, [deleteAttachmentMutation]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
  }, []);

  const handlePriorityChange = useCallback((value: string) => {
    setPriority(value as TaskPriority);
  }, []);

  const handleDueDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
  }, []);

  const handleSizeHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeHours(e.target.value ? parseInt(e.target.value, 10) : undefined);
  }, []);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      if (isEditMode && task) {
        await updateTask({
          taskId: task._id,
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
          sizeHours,
        });
        toast.success('Task updated successfully');
      } else {
        await createPersonalTodo({
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
          sizeHours,
        });
        toast.success('Task created successfully');
      }
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, priority, dueDate, sizeHours, isEditMode, task, updateTask, createPersonalTodo, onSuccess, onOpenChange]);

  // === 5. EFFECTS (useEffect for side effects) ===
  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setSizeHours(task.sizeHours);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setSizeHours(undefined);
    }
  }, [open, task]);

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-4 pb-3 border-b">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={handleTitleChange} 
                placeholder="Enter task title" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <div id="description">
                <TaskDescriptionEditor value={description} onChange={handleDescriptionChange} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon('low')}<span>Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon('medium')}<span>Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon('high')}<span>High</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon('urgent')}<span>Urgent</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input 
                  type="date" 
                  value={dueDate} 
                  onChange={handleDueDateChange} 
                />
              </div>
              <div className="space-y-2">
                <Label>Size (hours)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  step="1" 
                  value={sizeHours ?? ''} 
                  onChange={handleSizeHoursChange} 
                  placeholder="Optional" 
                />
              </div>
            </div>

            {/* Attachments (edit mode only) */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label>Attachments</Label>
                {isEditMode ? (
                  <>
                    <AttachmentUploader entityType="task" entityId={taskId!} taskId={task!._id} className="p-4" />
                    {hasAttachments && (
                      <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2">
                        <AttachmentList attachments={attachments} onDelete={handleDeleteAttachment} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-3 bg-muted/30 rounded-lg mt-1">
                    Create the task to add attachments
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t px-6 py-4 h-16 flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitButtonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default PersonalTaskDialog;


