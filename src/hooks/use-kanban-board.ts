/**
 * useKanbanBoard - Manages kanban board state and drag-and-drop operations
 *
 * @remarks
 * Custom hook for managing kanban board functionality including task grouping,
 * drag-and-drop operations, and task status updates. Integrates with Convex
 * for real-time data synchronization and provides comprehensive task management.
 *
 * @example
 * ```tsx
 * const {
 *   tasks,
 *   grouped,
 *   handleDragStart,
 *   handleDragEnd,
 *   openTaskDialog
 * } = useKanbanBoard({ clientId: 'client123' });
 * ```
 */

// 1. External imports
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { toast } from 'sonner';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';

// 3. Types
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

interface EnrichedTask extends Doc<'tasks'> {
  client?: { 
    _id: Id<'clients'>; 
    name: string; 
    logo?: Id<'_storage'> 
  } | null;
  project?: { 
    _id: Id<'projects'>; 
    title: string 
  } | null;
  sprint?: { 
    _id: Id<'sprints'>; 
    name: string 
  } | null;
}

interface UseKanbanBoardProps {
  /** Optional client ID to filter tasks */
  clientId?: Id<'clients'>;
}

interface KanbanBoardReturn {
  // Data
  tasks: EnrichedTask[] | undefined;
  activeSprints: Doc<'sprints'>[] | undefined;
  grouped: Record<TaskStatus, EnrichedTask[]>;
  
  // State
  activeTask: Doc<'tasks'> | null;
  isTaskDialogOpen: boolean;
  editingTask: EnrichedTask | null;
  
  // Computed values
  hasActiveSprints: boolean;
  activeSprintsWithNoTasks: Doc<'sprints'>[];
  totalTasks: number;
  hasTasks: boolean;
  
  // Actions
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
  openTaskDialog: (task: EnrichedTask) => void;
  closeTaskDialog: () => void;
  setActiveTask: (task: Doc<'tasks'> | null) => void;
}

// 4. Hook definition
export function useKanbanBoard({ clientId }: UseKanbanBoardProps = {}): KanbanBoardReturn {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // Convex queries
  const tasks = useQuery(
    clientId 
      ? api.tasks.getTasksForActiveSprints as any
      : api.tasks.getTasksForActiveSprints as any, 
    clientId ? { clientId } : {}
  ) as EnrichedTask[] | undefined;
  
  const activeSprints = useQuery(api.sprints.getSprints, { status: 'active' });

  // Convex mutations
  const updateTask = useMutation(api.tasks.updateTask);

  // Local state
  const [activeTask, setActiveTask] = useState<Doc<'tasks'> | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // Task grouping by status
  const grouped = useMemo((): Record<TaskStatus, EnrichedTask[]> => {
    const initial: Record<TaskStatus, EnrichedTask[]> = { 
      todo: [], 
      in_progress: [], 
      review: [], 
      done: [] 
    };
    
    for (const task of tasks || []) {
      // Exclude archived if present; group unknown statuses into todo
      const status = (task.status as TaskStatus) || 'todo';
      if (status === 'done' || status === 'review' || status === 'in_progress' || status === 'todo') {
        initial[status].push(task);
      } else {
        initial['todo'].push(task);
      }
    }
    
    return initial;
  }, [tasks]);

  const hasActiveSprints = useMemo(() => {
    return Boolean(activeSprints && activeSprints.length > 0);
  }, [activeSprints]);
  
  const activeSprintsWithNoTasks = useMemo(() => {
    if (!activeSprints || !tasks) return [];
    
    return activeSprints.filter((sprint) => {
      const sprintTasks = tasks.filter((task) => task.sprintId === sprint._id);
      return sprintTasks.length === 0;
    });
  }, [activeSprints, tasks]);

  const totalTasks = useMemo(() => {
    return Object.values(grouped).reduce((sum, taskList) => sum + taskList.length, 0);
  }, [grouped]);

  const hasTasks = useMemo(() => {
    return totalTasks > 0;
  }, [totalTasks]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  // Drag start handler
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const allTasks = (tasks || []) as Doc<'tasks'>[];
    const found = allTasks.find((task) => task._id === id) || null;
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
      const allTasks = (tasks || []) as EnrichedTask[];
      const overTask = allTasks.find((task) => task._id === overId);
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

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RETURN (Hook return value) ===
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
