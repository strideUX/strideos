import React from 'react';
import type { Id } from '@/convex/_generated/dataModel';

// Define UserRole type if it doesn't exist elsewhere
export type UserRole = 'admin' | 'pm' | 'task_owner' | 'client';

/**
 * Consolidated type definitions for the application
 * 
 * @remarks
 * This file exports all domain-specific types and provides common utilities.
 * Organized by domain to maintain clear boundaries and prevent circular dependencies.
 */

// Domain-specific type exports
export * from './client.types';
export * from './user.types';
export * from './project.types';
export * from './task.types';
export * from "./documents.types";
export * from "./pages.types";
export * from "./comments.types";
export * from "./editor.types";
export * from "./api.types";
export * from "./presence.types";

// Re-export Convex types
export type { Id } from '@/convex/_generated/dataModel';

/**
 * Common utility types
 */

/** Generic result type for async operations */
export type AsyncResult<T, E = Error> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

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