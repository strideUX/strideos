import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { toast } from 'sonner';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type EnrichedTask = Doc<'tasks'> & {
  project?: { _id: Id<'projects'>; title: string } | null;
  sprint?: { _id: Id<'sprints'>; name: string } | null;
};

const STATUS_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

function getCountBadgeClass(status: TaskStatus): string {
  switch (status) {
    case 'todo':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'review':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'done':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

/**
 * useClientSprintKanban - Manages client sprint kanban board state and operations
 *
 * @param props - Client sprint kanban configuration
 * @returns Client sprint kanban state and methods
 */
export function useClientSprintKanban({ clientId }: { clientId: Id<'clients'> }) {
  const router = useRouter();
  
  // State
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTask, setActiveTask] = useState<Doc<'tasks'> | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null);

  // Convex queries and mutations
  const activeSprints = (useQuery as any)((api as any).sprints.getSprints, { status: 'active', clientId }) as any[] | undefined;
  const tasks = useQuery(api.tasks.getTasks as any, {});
  const departments = useQuery(api.departments.listDepartments as any, {} as any) as any[] | undefined;
  const updateTask = useMutation(api.tasks.updateTask as any);

  // Computed values
  const filteredDepartments = useMemo(() => {
    const list = (departments || []).filter((d: any) => String(d.clientId) === String(clientId));
    return list;
  }, [departments, clientId]);

  const filteredActiveSprints = useMemo(() => {
    const list = (activeSprints || []) as any[];
    if (departmentId === 'all') return list;
    return list.filter((s) => String(s.departmentId) === String(departmentId));
  }, [activeSprints, departmentId]);

  const sprintIdSet = useMemo(() => {
    return new Set<string>((filteredActiveSprints || []).map((s: any) => s._id as string));
  }, [filteredActiveSprints]);

  const filteredTasks = useMemo((): EnrichedTask[] => {
    return ((tasks as any[]) || [])
      .filter((t) => t.clientId === clientId && t.sprintId && sprintIdSet.has(t.sprintId as string))
      .filter((t) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return String(t.title || '').toLowerCase().includes(q);
      })
      .map((t) => t as EnrichedTask);
  }, [tasks, clientId, sprintIdSet, searchQuery]);

  const selectedDeptName = useMemo(() => {
    if (departmentId === 'all') return 'All Active Sprints';
    const d = filteredDepartments.find((d: any) => String(d._id) === String(departmentId));
    return d ? `${d.name} Sprint` : 'All Active Sprints';
  }, [departmentId, filteredDepartments]);

  const grouped = useMemo((): Record<TaskStatus, EnrichedTask[]> => {
    const initial: Record<TaskStatus, EnrichedTask[]> = { 
      todo: [], 
      in_progress: [], 
      review: [], 
      done: [] 
    };
    
    for (const t of filteredTasks) {
      const status = (t.status as TaskStatus) || 'todo';
      if (['todo', 'in_progress', 'review', 'done'].includes(status)) {
        initial[status].push(t);
      } else {
        initial['todo'].push(t);
      }
    }
    
    return initial;
  }, [filteredTasks]);

  // Actions
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const all = (filteredTasks || []) as Doc<'tasks'>[];
    const found = all.find((t) => (t as any)._id === id) || null;
    setActiveTask(found);
  }, [filteredTasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    
    const overId = String(over.id);
    let targetStatus: TaskStatus | null = null;
    
    if (overId.startsWith('column:')) {
      targetStatus = overId.split(':')[1] as TaskStatus;
    } else {
      const all = (filteredTasks || []) as EnrichedTask[];
      const overTask = all.find((t) => (t as any)._id === overId);
      if (overTask) targetStatus = (overTask.status as TaskStatus) ?? null;
    }
    
    if (!targetStatus) return;
    const taskId = active.id as Id<'tasks'>;

    try {
      await updateTask({ id: taskId, status: targetStatus });
    } catch (error) {
      console.error('Failed to update task status', error);
      toast.error('You do not have permission to move this task');
    }
  }, [filteredTasks, updateTask]);

  const openTaskDialog = useCallback((task: EnrichedTask) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  }, []);

  const closeTaskDialog = useCallback(() => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  }, []);

  const setDepartment = useCallback((deptId: string) => {
    setDepartmentId(deptId);
  }, []);

  const setSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return useMemo(() => ({
    // Data
    activeSprints: filteredActiveSprints,
    tasks: filteredTasks,
    departments: filteredDepartments,
    grouped,
    
    // State
    departmentId,
    searchQuery,
    activeTask,
    isTaskDialogOpen,
    editingTask,
    selectedDeptName,
    
    // Constants
    STATUS_COLUMNS,
    
    // Actions
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
    setDepartment,
    setSearch,
    
    // Utilities
    getCountBadgeClass,
  }), [
    filteredActiveSprints,
    filteredTasks,
    filteredDepartments,
    grouped,
    departmentId,
    searchQuery,
    activeTask,
    isTaskDialogOpen,
    editingTask,
    selectedDeptName,
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
    setDepartment,
    setSearch,
  ]);
}
