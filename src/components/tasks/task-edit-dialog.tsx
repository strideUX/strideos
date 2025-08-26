'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface EditableTask {
  _id: Id<'tasks'>;
  title: string;
  description?: string;
  priority: Priority;
  estimatedHours?: number;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | string;
  assigneeId?: Id<'users'>;
  projectId?: Id<'projects'>;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
}

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: EditableTask | null;
}

const SIZE_TO_HOURS: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };

export function TaskEditDialog({ open, onOpenChange, task }: TaskEditDialogProps) {
  const updateTask = useMutation(api.tasks.updateTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState<Id<'users'> | 'unassigned' | undefined>('unassigned');
  const [sizeDays, setSizeDays] = useState<number | undefined>(undefined);

  // Queries for eligible assignees (reuse ProjectTasksTab rules)
  const projectTeam = useQuery(
    api.projects.getProjectTeam,
    task?.projectId ? { projectId: task.projectId } : 'skip'
  ) as unknown[] | undefined;
  const allActiveUsers = useQuery(api.users.getTeamWorkload, { includeInactive: false }) as unknown[] | undefined;
  const departmentDetails = useQuery(
    api.departments.getDepartmentById,
    task ? { departmentId: task.departmentId } : 'skip'
  );

  type User = {
    _id: Id<'users'>;
    name?: string;
    email?: string;
    role: 'admin' | 'pm' | 'task_owner' | 'client';
    status?: 'active' | 'inactive' | 'invited';
    clientId?: Id<'clients'>;
    departmentIds?: Id<'departments'>[];
  };

  const eligibleAssignees: User[] = useMemo(() => {
    const internal: User[] = (allActiveUsers || [])
      .filter(Boolean)
      .map((u: any) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        clientId: u.clientId,
        departmentIds: u.departmentIds,
      }))
      .filter((u) => ['admin', 'pm', 'task_owner'].includes(u.role) && (u.status === 'active' || !u.status));

    const deptUsers: User[] = (
      departmentDetails
        ? [departmentDetails.primaryContact, ...(departmentDetails.teamMembers || [])]
        : []
    )
      .filter(Boolean)
      .map((u: any) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        clientId: u.clientId,
        departmentIds: u.departmentIds,
      }))
      .filter((u) => u.role === 'client' && (u.status === 'active' || !u.status));

    const projTeam: User[] = (projectTeam || [])
      .filter(Boolean)
      .map((u: any) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        clientId: u.clientId,
        departmentIds: u.departmentIds,
      }));

    const merged = ([] as User[]).concat(internal).concat(deptUsers).concat(projTeam)
      .filter(Boolean)
      .filter((u, idx, arr) => arr.findIndex((x) => x && x._id === u._id) === idx)
      .sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''));
    return merged;
  }, [allActiveUsers, departmentDetails, projectTeam]);

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority || 'medium');
    setAssigneeId(task.assigneeId || 'unassigned');
    const hrs = task.estimatedHours ?? (task.size ? SIZE_TO_HOURS[String(task.size).toUpperCase()] : undefined);
    setSizeDays(hrs !== undefined ? hrs / 8 : undefined);
  }, [open, task]);

  const handleUpdate = async () => {
    if (!task) return;
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      await updateTask({
        id: task._id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigneeId: assigneeId && assigneeId !== 'unassigned' ? (assigneeId as Id<'users'>) : undefined,
        estimatedHours: sizeDays !== undefined ? sizeDays * 8 : undefined,
      });
      toast.success('Task updated');
      onOpenChange(false);
    } catch (err) {
      console.error('Update task failed', err);
      toast.error('Failed to update task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Task description" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
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
                value={sizeDays !== undefined ? String(sizeDays) : undefined}
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
                value={assigneeId as any}
                onValueChange={(v) => setAssigneeId(v === 'unassigned' ? 'unassigned' : (v as Id<'users'>))}
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
            <Button onClick={handleUpdate}>Update Task</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


