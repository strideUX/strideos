import { useEffect, useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
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

interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  assigneeId: Id<'users'> | 'unassigned' | undefined;
  sizeDays: number | undefined;
}

interface UseTaskEditorProps {
  task: EditableTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SIZE_TO_HOURS: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };

/**
 * useTaskEditor - Manages task editing state and business logic
 * 
 * @param props - Task editor configuration
 * @returns Task editor state and methods
 */
export function useTaskEditor({ task, open, onOpenChange }: UseTaskEditorProps) {
  // Convex mutations
  const updateTask = useMutation(api.tasks.updateTask);

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    assigneeId: 'unassigned',
    sizeDays: undefined,
  });

  // Convex queries
  const projectTeam = useQuery(
    api.projects.getProjectTeam,
    task?.projectId ? { projectId: task.projectId } : 'skip'
  ) as unknown[] | undefined;
  
  const allActiveUsers = useQuery(api.users.getTeamWorkload, { includeInactive: false }) as unknown[] | undefined;
  
  const departmentDetails = useQuery(
    api.departments.getDepartmentById,
    task ? { departmentId: task.departmentId } : 'skip'
  );

  // User type definition
  type User = {
    _id: Id<'users'>;
    name?: string;
    email?: string;
    role: 'admin' | 'pm' | 'task_owner' | 'client';
    status?: 'active' | 'inactive' | 'invited';
    clientId?: Id<'clients'>;
    departmentIds?: Id<'departments'>[];
  };

  // Business logic: Compute eligible assignees
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

  // Initialize form data when task or dialog opens
  useEffect(() => {
    if (!open || !task) return;
    
    const hrs = task.estimatedHours ?? (task.size ? SIZE_TO_HOURS[String(task.size).toUpperCase()] : undefined);
    
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      assigneeId: task.assigneeId || 'unassigned',
      sizeDays: hrs !== undefined ? hrs / 8 : undefined,
    });
  }, [open, task]);

  // Form validation
  const isFormValid = useMemo(() => {
    return !!formData.title.trim();
  }, [formData.title]);

  // Task update handler
  const handleUpdate = useCallback(async () => {
    if (!task || !isFormValid) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      await updateTask({
        id: task._id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        assigneeId: formData.assigneeId && formData.assigneeId !== 'unassigned' ? (formData.assigneeId as Id<'users'>) : undefined,
        estimatedHours: formData.sizeDays !== undefined ? formData.sizeDays * 8 : undefined,
      });
      
      toast.success('Task updated');
      onOpenChange(false);
    } catch (err) {
      console.error('Update task failed', err);
      toast.error('Failed to update task');
    }
  }, [task, isFormValid, formData, updateTask, onOpenChange]);

  // Form field update handlers
  const updateField = useCallback((field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const setTitle = useCallback((title: string) => {
    updateField('title', title);
  }, [updateField]);

  const setDescription = useCallback((description: string) => {
    updateField('description', description);
  }, [updateField]);

  const setPriority = useCallback((priority: Priority) => {
    updateField('priority', priority);
  }, [updateField]);

  const setAssigneeId = useCallback((assigneeId: Id<'users'> | 'unassigned') => {
    updateField('assigneeId', assigneeId);
  }, [updateField]);

  const setSizeDays = useCallback((sizeDays: number | undefined) => {
    updateField('sizeDays', sizeDays);
  }, [updateField]);

  return useMemo(() => ({
    // Form state
    formData,
    isFormValid,
    
    // Options
    eligibleAssignees,
    
    // Actions
    handleUpdate,
    updateField,
    setTitle,
    setDescription,
    setPriority,
    setAssigneeId,
    setSizeDays,
    
    // Computed values
    hasTask: !!task,
  }), [
    formData,
    isFormValid,
    eligibleAssignees,
    handleUpdate,
    updateField,
    setTitle,
    setDescription,
    setPriority,
    setAssigneeId,
    setSizeDays,
    task,
  ]);
}
