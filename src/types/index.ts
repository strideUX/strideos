import { Id } from '@/convex/_generated/dataModel';

/**
 * Core application types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'pm' | 'task_owner' | 'client';

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  projectId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Document {
  id: string;
  title: string;
  content?: string;
  type: DocumentType;
  projectId: string;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

export type DocumentType = 'project_brief' | 'requirements' | 'design' | 'deliverable' | 'other';
export type DocumentStatus = 'draft' | 'review' | 'approved' | 'archived';

export interface Comment {
  id: string;
  content: string;
  documentId?: string;
  taskId?: string;
  parentCommentId?: string; // For nested comments
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Form types
 */
export interface FormState {
  isLoading: boolean;
  error?: string;
  success?: string;
}

/**
 * UI Component types
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

/**
 * Navigation types
 */
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
}

/**
 * Dashboard types
 */
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

/**
 * Real-time types
 */
export interface RealtimeUpdate<T> {
  type: 'create' | 'update' | 'delete';
  data: T;
  timestamp: Date;
}

/**
 * Search and filter types
 */
export interface SearchFilters {
  query?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Permission types
 */
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  conditions?: Record<string, unknown>;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Note: Todo and UserTaskOrder types removed as these tables no longer exist
// Personal todos are now stored as tasks with taskType: 'personal'

export interface UnifiedTaskItem {
  id: string;
  type: 'task' | 'personal';
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee: Id<'users'> | null;
  dueDate?: number;
  personalOrderIndex?: number;
  createdAt: number;
  updatedAt: number;
  data: Record<string, unknown>; // The original task data
} 