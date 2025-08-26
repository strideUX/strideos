import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { toast } from 'sonner';

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

type EnrichedTask = Doc<'tasks'> & {
  client?: { _id: Id<'clients'>; name: string; logo?: Id<'_storage'> } | null;
  project?: { _id: Id<'projects'>; title: string } | null;
  sprint?: { _id: Id<'sprints'>; name: string } | null;
};

interface UseKanbanBoardProps {
  clientId?: Id<'clients'>;
}

/**
 * useKanbanBoard - Manages kanban board state and drag-and-drop operations
 * 
 * @param props - Kanban board configuration
 * @returns Kanban board state and methods
 */
export function useKanbanBoard({ clientId }: UseKanbanBoardProps = {}) {
  // Convex queries
  const tasks = useQuery(
    clientId 
      ? api.tasks.getTasksForActiveSprints, { clientId }
      : api.tasks.getTasksForActiveSprints, {}
  ) as EnrichedTask[] | undefined;
  
  const activeSprints = useQuery(api.sprints.getSprints, { status: 'active' });

  // Convex mutations
  const updateTask = useMutation(api.tasks.updateTask);

  // Local state
  const [activeTask, setActiveTask] = useState<Doc<'tasks'> | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null);

  // Task grouping by status
  const grouped = useMemo((): Record<TaskStatus, EnrichedTask[]> => {
    const initial: Record<TaskStatus, EnrichedTask[]> = { 
      todo: [], 
      in_progress: [], 
      review: [], 
      done: [] 
    };
    
    for (const t of tasks || []) {
      // Exclude archived if present; group unknown statuses into todo
      const status = (t.status as TaskStatus) || 'todo';
      if (status === 'done' || status === 'review' || status === 'in_progress' || status === 'todo') {
        initial[status].push(t);
      } else {
        initial['todo'].push(t);
      }
    }
    
    return initial;
  }, [tasks]);

  // Drag start handler
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const all = (tasks || []) as Doc<'tasks'>[];
    const found = all.find((t) => (t as any)._id === id) || null;
    setActiveTask(found);
  }, [tasks]);

  // Drag end handler
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    
    if (!over) return;
    
    const overId = String(over.id);
    let targetStatus: TaskStatus | null = null;
    
    if (overId.startsWith('column:')) {
      // Dropped on a column
      targetStatus = overId.split(':')[1] as TaskStatus;
    } else {
      // Dropped on a task card; infer target column from that task's current status
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

  // Task dialog management
  const openTaskDialog = useCallback((task: EnrichedTask) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  }, []);

  const closeTaskDialog = useCallback(() => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  }, []);

  // Computed values
  const hasActiveSprints = useMemo(() => activeSprints && activeSprints.length > 0, [activeSprints]);
  
  const activeSprintsWithNoTasks = useMemo(() => {
    if (!activeSprints || !tasks) return [];
    
    return activeSprints.filter((sprint) => {
      const sprintTasks = tasks.filter((task) => (task as any).sprintId === sprint._id);
      return sprintTasks.length === 0;
    });
  }, [activeSprints, tasks]);

  const totalTasks = useMemo(() => {
    return Object.values(grouped).reduce((sum, tasks) => sum + tasks.length, 0);
  }, [grouped]);

  const hasTasks = useMemo(() => totalTasks > 0, [totalTasks]);

  return useMemo(() => ({
    // Data
    tasks,
    activeSprints,
    grouped,
    
    // State
    activeTask,
    isTaskDialogOpen,
    editingTask,
    
    // Computed values
    hasActiveSprints,
    activeSprintsWithNoTasks,
    totalTasks,
    hasTasks,
    
    // Actions
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
    setActiveTask,
  }), [
    tasks,
    activeSprints,
    grouped,
    activeTask,
    isTaskDialogOpen,
    editingTask,
    hasActiveSprints,
    activeSprintsWithNoTasks,
    totalTasks,
    hasTasks,
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
  ]);
}
