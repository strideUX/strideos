import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { toast } from 'sonner';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type EnrichedTask = Doc<'tasks'> & {
  client?: { _id: Id<'clients'>; name: string; logo?: Id<'_storage'> } | null;
  project?: { _id: Id<'projects'>; title: string } | null;
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
 * useSprintKanban - Manages sprint kanban board state and drag-and-drop operations
 *
 * @param props - Sprint kanban configuration
 * @returns Sprint kanban state and methods
 */
export function useSprintKanban({ sprintId }: { sprintId: Id<'sprints'> }) {
  // State
  const [activeTask, setActiveTask] = useState<Doc<'tasks'> | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null);

  // Convex queries and mutations
  const tasks = useQuery(api.tasks.getTasks as any, { sprintId }) as EnrichedTask[] | undefined;
  const updateTask = useMutation(api.tasks.updateTask as any);

  // Computed values
  const grouped = useMemo((): Record<TaskStatus, EnrichedTask[]> => {
    const initial: Record<TaskStatus, EnrichedTask[]> = { 
      todo: [], 
      in_progress: [], 
      review: [], 
      done: [] 
    };
    
    for (const t of tasks || []) {
      const status = (t.status as TaskStatus) || 'todo';
      if (['todo', 'in_progress', 'review', 'done'].includes(status)) {
        initial[status].push(t);
      } else {
        initial['todo'].push(t as EnrichedTask);
      }
    }
    
    return initial;
  }, [tasks]);

  // Actions
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const all = (tasks || []) as Doc<'tasks'>[];
    const found = all.find((t) => (t as any)._id === id) || null;
    setActiveTask(found);
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    
    const overId = String(over.id);
    let targetStatus: TaskStatus | null = null;
    
    if (overId.startsWith('column:')) {
      targetStatus = overId.split(':')[1] as TaskStatus;
    } else {
      const all = (tasks || []) as EnrichedTask[];
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
  }, [tasks, updateTask]);

  const openTaskDialog = useCallback((task: EnrichedTask) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  }, []);

  const closeTaskDialog = useCallback(() => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  }, []);

  return useMemo(() => ({
    // Data
    tasks,
    grouped,
    
    // State
    activeTask,
    isTaskDialogOpen,
    editingTask,
    
    // Constants
    STATUS_COLUMNS,
    
    // Actions
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
    
    // Utilities
    getCountBadgeClass,
  }), [
    tasks,
    grouped,
    activeTask,
    isTaskDialogOpen,
    editingTask,
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
  ]);
}
