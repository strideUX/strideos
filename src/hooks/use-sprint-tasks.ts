/**
 * useSprintTasks - Manages sprint task data, grouping, and filtering
 *
 * @remarks
 * Custom hook for comprehensive sprint task management including filtering,
 * grouping by various criteria, sorting utilities, and statistical analysis.
 * Integrates with Convex for real-time data synchronization and provides
 * flexible task organization capabilities.
 *
 * @example
 * ```tsx
 * const {
 *   tasks,
 *   groupedByStatus,
 *   taskStats,
 *   sortTasksByPriority
 * } = useSprintTasks({ 
 *   sprintId: 'sprint123',
 *   clientId: 'client456'
 * });
 * ```
 */

// 1. External imports
import { useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';

// 3. Types
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'completed';

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
  assignee?: { 
    _id: Id<'users'>; 
    name?: string; 
    email?: string; 
    image?: string 
  } | null;
  dueDate?: number;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL';
}

interface UseSprintTasksProps {
  /** Optional sprint ID to filter tasks */
  sprintId?: Id<'sprints'>;
  /** Optional client ID to filter tasks */
  clientId?: Id<'clients'>;
  /** Optional status filter */
  status?: TaskStatus;
  /** Whether to include archived tasks */
  includeArchived?: boolean;
}

interface TaskStats {
  total: number;
  byStatus: Record<string, number>;
  completed: number;
  inProgress: number;
  pending: number;
  progressPercentage: number;
}

interface UseSprintTasksReturn {
  // Data
  tasks: EnrichedTask[];
  sprint: Doc<'sprints'> | undefined;
  
  // Grouped data
  groupedByStatus: Record<TaskStatus, EnrichedTask[]>;
  groupedByAssignee: { assigned: Record<string, EnrichedTask[]>; unassigned: EnrichedTask[] };
  groupedByProject: { byProject: Record<string, EnrichedTask[]>; noProject: EnrichedTask[] };
  
  // Statistics
  taskStats: TaskStats;
  
  // Utilities
  sortTasksByPriority: (taskList: EnrichedTask[]) => EnrichedTask[];
  sortTasksByDueDate: (taskList: EnrichedTask[]) => EnrichedTask[];
  sortTasksBySize: (taskList: EnrichedTask[]) => EnrichedTask[];
  searchTasks: (query: string) => EnrichedTask[];
  
  // Computed values
  hasTasks: boolean;
  totalTasks: number;
}

// 4. Hook definition
export function useSprintTasks({ 
  sprintId, 
  clientId, 
  status, 
  includeArchived = false 
}: UseSprintTasksProps = {}): UseSprintTasksReturn {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // Convex queries
  const tasks = useQuery(
    sprintId 
      ? api.tasks.listTasks as any
      : clientId 
        ? api.tasks.listTasks as any
        : api.tasks.listTasks as any, 
    sprintId 
      ? { sprintId } 
      : clientId 
        ? { clientId } 
        : {}
  ) as EnrichedTask[] | undefined;

  const sprint = useQuery(
    sprintId ? api.sprints.getSprint as any : 'skip',
    sprintId ? { sprintId } : 'skip'
  ) as Doc<'sprints'> | undefined;

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // Task filtering and grouping
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    let filtered = tasks;
    
    // Filter by status if specified
    if (status) {
      filtered = filtered.filter(task => task.status === status);
    }
    
    // Filter by client if specified
    if (clientId) {
      filtered = filtered.filter(task => task.clientId === clientId);
    }
    
    // Filter archived tasks
    if (!includeArchived) {
      filtered = filtered.filter(task => task.status !== 'archived');
    }
    
    return filtered;
  }, [tasks, status, clientId, includeArchived]);

  // Task grouping by status
  const groupedByStatus = useMemo((): Record<TaskStatus, EnrichedTask[]> => {
    const initial: Record<TaskStatus, EnrichedTask[]> = { 
      todo: [], 
      in_progress: [], 
      review: [], 
      done: [], 
      completed: [] 
    };
    
    for (const task of filteredTasks) {
      const taskStatus = (task.status as TaskStatus) || 'todo';
      
      // Map 'done' and 'completed' to the same group
      if (taskStatus === 'done' || taskStatus === 'completed') {
        initial['done'].push(task);
      } else if (initial[taskStatus]) {
        initial[taskStatus].push(task);
      } else {
        // Unknown status goes to todo
        initial['todo'].push(task);
      }
    }
    
    return initial;
  }, [filteredTasks]);

  // Task grouping by assignee
  const groupedByAssignee = useMemo(() => {
    const grouped: Record<string, EnrichedTask[]> = {};
    const unassigned: EnrichedTask[] = [];
    
    for (const task of filteredTasks) {
      if (task.assigneeId) {
        const assigneeId = task.assigneeId as string;
        if (!grouped[assigneeId]) {
          grouped[assigneeId] = [];
        }
        grouped[assigneeId].push(task);
      } else {
        unassigned.push(task);
      }
    }
    
    return { assigned: grouped, unassigned };
  }, [filteredTasks]);

  // Task grouping by project
  const groupedByProject = useMemo(() => {
    const grouped: Record<string, EnrichedTask[]> = {};
    const noProject: EnrichedTask[] = [];
    
    for (const task of filteredTasks) {
      if (task.projectId) {
        const projectId = task.projectId as string;
        if (!grouped[projectId]) {
          grouped[projectId] = [];
        }
        grouped[projectId].push(task);
      } else {
        noProject.push(task);
      }
    }
    
    return { byProject: grouped, noProject };
  }, [filteredTasks]);

  // Task statistics
  const taskStats = useMemo((): TaskStats => {
    const total = filteredTasks.length;
    const byStatus = Object.entries(groupedByStatus).reduce((acc, [status, taskList]) => {
      acc[status] = taskList.length;
      return acc;
    }, {} as Record<string, number>);
    
    const completed = (byStatus['done'] || 0) + (byStatus['completed'] || 0);
    const inProgress = (byStatus['in_progress'] || 0) + (byStatus['review'] || 0);
    const pending = byStatus['todo'] || 0;
    
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      byStatus,
      completed,
      inProgress,
      pending,
      progressPercentage,
    };
  }, [filteredTasks, groupedByStatus]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  // Task sorting utilities
  const sortTasksByPriority = useCallback((taskList: EnrichedTask[]): EnrichedTask[] => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    
    return [...taskList].sort((a, b) => {
      const aPriority = a.priority || 'medium';
      const bPriority = b.priority || 'medium';
      
      const aOrder = priorityOrder[aPriority] ?? 2;
      const bOrder = priorityOrder[bPriority] ?? 2;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Secondary sort by title
      return (a.title || '').localeCompare(b.title || '');
    });
  }, []);

  const sortTasksByDueDate = useCallback((taskList: EnrichedTask[]): EnrichedTask[] => {
    return [...taskList].sort((a, b) => {
      const aDue = a.dueDate || 0;
      const bDue = b.dueDate || 0;
      
      if (aDue === 0 && bDue === 0) return 0;
      if (aDue === 0) return 1;
      if (bDue === 0) return -1;
      
      return aDue - bDue;
    });
  }, []);

  const sortTasksBySize = useCallback((taskList: EnrichedTask[]): EnrichedTask[] => {
    const sizeOrder = { XS: 0, S: 1, M: 2, L: 3, XL: 4 };
    
    return [...taskList].sort((a, b) => {
      const aSize = a.size || 'M';
      const bSize = b.size || 'M';
      
      const aOrder = sizeOrder[aSize] ?? 2;
      const bOrder = sizeOrder[bSize] ?? 2;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Secondary sort by title
      return (a.title || '').localeCompare(b.title || '');
    });
  }, []);

  // Search and filter utilities
  const searchTasks = useCallback((query: string): EnrichedTask[] => {
    if (!query.trim()) return filteredTasks;
    
    const searchTerm = query.toLowerCase();
    
    return filteredTasks.filter(task => {
      return (
        (task.title || '').toLowerCase().includes(searchTerm) ||
        (task.description || '').toLowerCase().includes(searchTerm) ||
        (task.client?.name || '').toLowerCase().includes(searchTerm) ||
        (task.project?.title || '').toLowerCase().includes(searchTerm) ||
        (task.sprint?.name || '').toLowerCase().includes(searchTerm) ||
        (task.assignee?.name || '').toLowerCase().includes(searchTerm) ||
        (task.assignee?.email || '').toLowerCase().includes(searchTerm)
      );
    });
  }, [filteredTasks]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RETURN (Hook return value) ===
  return useMemo(() => ({
    // Data
    tasks: filteredTasks,
    sprint,
    
    // Grouped data
    groupedByStatus,
    groupedByAssignee,
    groupedByProject,
    
    // Statistics
    taskStats,
    
    // Utilities
    sortTasksByPriority,
    sortTasksByDueDate,
    sortTasksBySize,
    searchTasks,
    
    // Computed values
    hasTasks: filteredTasks.length > 0,
    totalTasks: filteredTasks.length,
  }), [
    filteredTasks,
    sprint,
    groupedByStatus,
    groupedByAssignee,
    groupedByProject,
    taskStats,
    sortTasksByPriority,
    sortTasksByDueDate,
    sortTasksBySize,
    searchTasks,
  ]);
}
