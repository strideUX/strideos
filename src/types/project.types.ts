/**
 * Project type definitions
 * 
 * @remarks
 * Types for project management, including project status, team assignments,
 * and project-related statistics.
 */

import type { Id } from '@/convex/_generated/dataModel';
import type { User } from './user.types';
import type { Client, Department } from './client.types';
import type { Task } from './task.types';

/** Core project entity */
export interface Project {
  _id: Id<'projects'>;
  _creationTime: number;
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  leadId?: Id<'users'>;
  teamMemberIds: Id<'users'>[];
  startDate?: number; // Unix timestamp
  endDate?: number; // Unix timestamp
  estimatedHours?: number;
  actualHours?: number;
  budget?: number;
  currency?: string;
  tags?: string[];
  metadata?: ProjectMetadata;
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
}

/** Project with enriched relational data */
export interface EnrichedProject extends Project {
  // Related entities
  client?: Client;
  department?: Department;
  lead?: User;
  teamMembers?: User[];
  createdByUser?: User;
  // Statistics and computed fields
  taskCount?: number;
  completedTasks?: number;
  overdueTasks?: number;
  progress?: number; // Percentage
  daysRemaining?: number;
  isOverdue?: boolean;
  hoursRemaining?: number;
  budgetUtilized?: number;
}

/** Project status enumeration */
export type ProjectStatus = 
  | 'planning' 
  | 'active' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled' 
  | 'archived';

/** Project priority enumeration */
export type ProjectPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

/** Project metadata structure */
export interface ProjectMetadata {
  category?: string;
  methodology?: 'agile' | 'waterfall' | 'hybrid';
  riskLevel?: 'low' | 'medium' | 'high';
  stakeholders?: string[];
  externalTools?: ProjectTool[];
  customFields?: Record<string, unknown>;
}

/** External project tools integration */
export interface ProjectTool {
  name: string;
  type: 'repository' | 'design' | 'documentation' | 'communication' | 'other';
  url?: string;
  description?: string;
}

/** Project creation input */
export type CreateProjectInput = Omit<Project, 
  | '_id' 
  | '_creationTime' 
  | 'createdAt' 
  | 'updatedAt'
> & {
  createdAt?: number;
  updatedAt?: number;
};

/** Project update input */
export type UpdateProjectInput = Partial<Omit<Project, 
  | '_id' 
  | '_creationTime' 
  | 'createdBy' 
  | 'createdAt'
>> & {
  updatedAt?: number;
};

/** Project filter criteria */
export interface ProjectFilters {
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
  leadId?: Id<'users'>;
  teamMemberId?: Id<'users'>;
  startAfter?: number;
  endBefore?: number;
  tags?: string[];
  search?: string;
}

/** Project statistics */
export interface ProjectStats {
  total: number;
  byStatus: Record<ProjectStatus, number>;
  byPriority: Record<ProjectPriority, number>;
  overdue: number;
  completedThisMonth: number;
  averageCompletionTime: number; // in days
  budgetUtilization: number;
  resourceUtilization: number;
}

/** Project timeline entry */
export interface ProjectTimelineEntry {
  _id: Id<'projectTimeline'>;
  projectId: Id<'projects'>;
  type: TimelineEntryType;
  title: string;
  description?: string;
  date: number; // Unix timestamp
  userId?: Id<'users'>;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

/** Timeline entry types */
export type TimelineEntryType = 
  | 'milestone'
  | 'task_completed'
  | 'status_change'
  | 'team_change'
  | 'note'
  | 'deliverable'
  | 'meeting';

/** Project milestone */
export interface ProjectMilestone {
  _id: Id<'projectMilestones'>;
  projectId: Id<'projects'>;
  title: string;
  description?: string;
  dueDate: number;
  isCompleted: boolean;
  completedAt?: number;
  completedBy?: Id<'users'>;
  tasks?: Id<'tasks'>[];
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
}

/** Project budget tracking */
export interface ProjectBudgetEntry {
  _id: Id<'projectBudget'>;
  projectId: Id<'projects'>;
  type: BudgetEntryType;
  amount: number;
  currency: string;
  description?: string;
  date: number;
  category?: string;
  userId?: Id<'users'>;
  createdAt: number;
}

/** Budget entry types */
export type BudgetEntryType = 
  | 'initial_budget'
  | 'budget_adjustment'
  | 'expense'
  | 'time_entry'
  | 'milestone_payment';

/** Type guards */
export function isProject(value: unknown): value is Project {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'title' in value &&
    'status' in value &&
    'clientId' in value
  );
}

export function isEnrichedProject(value: unknown): value is EnrichedProject {
  return isProject(value);
}

/** Project status transitions */
export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  planning: ['active', 'on_hold', 'cancelled'],
  active: ['planning', 'on_hold', 'completed', 'cancelled'],
  on_hold: ['planning', 'active', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: ['planning'] // Can be restored
} as const;

/** Status color mapping for UI */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'text-gray-600',
  active: 'text-blue-600',
  on_hold: 'text-yellow-600',
  completed: 'text-green-600',
  cancelled: 'text-red-600',
  archived: 'text-gray-400'
} as const;

/** Priority color mapping for UI */
export const PROJECT_PRIORITY_COLORS: Record<ProjectPriority, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600'
} as const;