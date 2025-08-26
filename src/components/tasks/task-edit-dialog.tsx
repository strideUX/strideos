'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTaskEditor, type EditableTask } from '@/hooks/use-task-editor';

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: EditableTask | null;
}

export function TaskEditDialog({ open, onOpenChange, task }: TaskEditDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
            <Input value={formData.title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea value={formData.description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Task description" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <Select value={formData.priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size (days)</label>
              <Select
                value={formData.sizeDays !== undefined ? String(formData.sizeDays) : undefined}
                onValueChange={(v) => setSizeDays(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">XS • 0.5d (4h)</SelectItem>
                  <SelectItem value="2">S • 2d (16h)</SelectItem>
                  <SelectItem value="4">M • 4d (32h)</SelectItem>
                  <SelectItem value="6">L • 6d (48h)</SelectItem>
                  <SelectItem value="8">XL • 8d (64h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <Select
                value={formData.assigneeId as any}
                onValueChange={(v) => setAssigneeId(v === 'unassigned' ? 'unassigned' : (v as any))}
              >
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!isFormValid}>Update Task</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


