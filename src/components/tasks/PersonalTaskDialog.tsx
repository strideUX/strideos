'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import TaskDescriptionEditor from '@/components/tasks/TaskDescriptionEditor';
import AttachmentUploader from '@/components/attachments/AttachmentUploader';
import AttachmentList from '@/components/attachments/AttachmentList';
import { toast } from 'sonner';
import { IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame } from '@tabler/icons-react';

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: PersonalTaskDialogTask | null; // if provided, edit mode
  onSuccess?: () => void;
}

export function PersonalTaskDialog({ open, onOpenChange, task, onSuccess }: PersonalTaskDialogProps) {
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
  const attachments = useMemo(() => listAttachments ?? [], [listAttachments]);

  const handleDeleteAttachment = async (id: string) => {
    try {
      await deleteAttachmentMutation({ attachmentId: id as any });
      toast.success('Attachment deleted');
    } catch {
      toast.error('Failed to delete attachment');
    }
  };

  const getPriorityIcon = (p: string) => {
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
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setIsSaving(true);
    try {
      if (task) {
        await updateTask({
          id: task._id,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
          sizeHours: sizeHours,
        });
        toast.success('Task updated');
      } else {
        // Create via personal todo API (auto-assigns and sets client/department)
        const newId = await createPersonalTodo({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        });
        // If user entered size, follow up with update
        if (sizeHours !== undefined) {
          await updateTask({ id: newId as any, sizeHours });
        }
        toast.success('Task created');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Save personal task failed', err);
      toast.error(task ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-4 pb-3 border-b">
          <DialogTitle>{task ? 'Edit Personal Task' : 'New Personal Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter task title" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <div id="description">
                <TaskDescriptionEditor value={description} onChange={setDescription} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
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
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Size (hours)</Label>
                <Input type="number" min="0" step="1" value={sizeHours ?? ''} onChange={(e) => setSizeHours(e.target.value ? parseInt(e.target.value, 10) : undefined)} placeholder="Optional" />
              </div>
            </div>

            {/* Attachments (edit mode only) */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label>Attachments</Label>
                {task ? (
                  <>
                    <AttachmentUploader entityType="task" entityId={taskId!} taskId={task._id} className="p-4" />
                    {attachments && attachments.length > 0 && (
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PersonalTaskDialog;


