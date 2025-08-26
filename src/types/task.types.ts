/**
 * Task-related type definitions
 * 
 * @remarks
 * Comprehensive types for task management, including statuses, priorities,
 * and enriched task data from Convex queries.
 */

import type { Id } from '@/convex/_generated/dataModel';
import type { User } from './user.types';
import type { Client, Department } from './client.types';
import type { Project } from './project.types';

/** Core task entity */
export interface Task {
  _id: Id<'tasks'>;
  _creationTime: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  size?: TaskSize;
  sizeHours?: number; // Hours-based sizing
  assigneeId?: Id<'users'>;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  projectId?: Id<'projects'>;
  sprintId?: Id<'sprints'>;
  dueDate?: number; // Unix timestamp
  blockedBy?: Id<'tasks'>[];
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
}

/** Task with enriched relational data from queries */
export interface EnrichedTask extends Task {
  assignee?: User | null;
  client?: Client | null;
  department?: Department | null;
  project?: Project | null;
  sprint?: Sprint | null;
  createdByUser?: User | null;
  dependentTasks?: Task[];
  blockingTasks?: Task[];
  commentCount?: number;
  attachmentCount?: number;
}

/** Task status enumeration */
export type TaskStatus = 
  | 'todo' 
  | 'in_progress' 
  | 'review' 
  | 'done' 
  | 'archived';

/** Task priority enumeration */
export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

/** Task size enumeration (T-shirt sizing) */
export type TaskSize = 
  | 'XS' 
  | 'S' 
  | 'M' 
  | 'L' 
  | 'XL';

/** Task type for categorization */
export type TaskType = 
  | 'feature'
  | 'bug'
  | 'improvement'
  | 'documentation'
  | 'testing'
  | 'maintenance'
  | 'research'
  | 'personal';

/** Sprint entity for task organization */
export interface Sprint {
  _id: Id<'sprints'>;
  _creationTime: number;
  name: string;
  description?: string;
  status: SprintStatus;
  startDate: number;
  endDate: number;
  capacity: number;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
}

/** Sprint status enumeration */
export type SprintStatus = 
  | 'planning' 
  | 'active' 
  | 'completed' 
  | 'archived';

/** Task creation input */
export type CreateTaskInput = Omit<Task, 
  | '_id' 
  | '_creationTime' 
  | 'createdAt' 
  | 'updatedAt'
> & {
  createdAt?: number;
  updatedAt?: number;
};

/** Task update input */
export type UpdateTaskInput = Partial<Omit<Task, 
  | '_id' 
  | '_creationTime' 
  | 'createdBy' 
  | 'createdAt'
>> & {
  updatedAt?: number;
};

/** Task filter criteria */
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: Id<'users'>[];
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
  projectId?: Id<'projects'>;
  sprintId?: Id<'sprints'>;
  dueAfter?: number;
  dueBefore?: number;
  search?: string;
}

/** Task statistics */
export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  unassigned: number;
}

/** Task dependency relationship */
export interface TaskDependency {
  _id: Id<'taskDependencies'>;
  taskId: Id<'tasks'>;
  dependsOnTaskId: Id<'tasks'>;
  createdAt: number;
  createdBy: Id<'users'>;
}

/** Type guards */
export function isTask(value: unknown): value is Task {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'title' in value &&
    'status' in value &&
    'priority' in value
  );
}

export function isEnrichedTask(value: unknown): value is EnrichedTask {
  return isTask(value);
}

/** Status transition validation */
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'done', 'archived'],
  in_progress: ['todo', 'review', 'done', 'archived'],
  review: ['in_progress', 'done', 'archived'],
  done: ['review', 'archived'],
  archived: ['todo'] // Can be restored
} as const;

/** Priority color mapping for UI */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600'
} as const;

/** Status color mapping for UI */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'text-gray-600',
  in_progress: 'text-blue-600',
  review: 'text-purple-600',
  done: 'text-green-600',
  archived: 'text-gray-400'
} as const;