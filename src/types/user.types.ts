/**
 * User type definitions
 * 
 * @remarks
 * Core types for user management, authentication, and role-based access control.
 */

import type { Id } from '@/convex/_generated/dataModel';

/** Core user entity */
export interface User {
  _id: Id<'users'>;
  _creationTime: number;
  name?: string;
  image?: string;
  email?: string;
  emailVerificationTime?: number;
  phone?: string;
  phoneVerificationTime?: number;
  isAnonymous?: boolean;
  
  // Custom application fields
  role: UserRole;
  status: UserStatus;
  
  // Organization relationship
  organizationId?: Id<'organizations'>;
  
  // Assignment fields
  clientId?: Id<'clients'>;
  departmentIds?: Id<'departments'>[];
  
  // User profile fields
  jobTitle?: string;
  bio?: string;
  timezone?: string;
  preferredLanguage?: string;
  
  // Invitation fields
  invitedBy?: Id<'users'>;
  invitedAt?: number;
  invitationToken?: string;
  
  // Audit fields
  lastLoginAt?: number;
  createdAt: number;
  updatedAt: number;
}

/** User with enriched relational data */
export interface EnrichedUser extends User {
  // Related entities
  client?: Client | null;
  departments?: Department[];
  organization?: Organization | null;
  invitedByUser?: User | null;
  // Statistics
  assignedTaskCount?: number;
  completedTaskCount?: number;
  overdueTasks?: number;
  workload?: UserWorkload;
}

/** User role enumeration */
export type UserRole = 'admin' | 'pm' | 'task_owner' | 'client';

/** User status enumeration */
export type UserStatus = 'active' | 'inactive' | 'invited';

/** User workload information */
export interface UserWorkload {
  totalHours: number;
  availableHours: number;
  utilization: number; // Percentage
  taskCount: number;
  upcomingDeadlines: number;
}

/** User statistics */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  invited: number;
  byRole: Record<UserRole, number>;
  assignedToClients: number;
  assignedToDepartments: number;
}

/** User creation input */
export type CreateUserInput = Omit<User, 
  | '_id' 
  | '_creationTime' 
  | 'createdAt' 
  | 'updatedAt'
  | 'lastLoginAt'
  | 'emailVerificationTime'
  | 'phoneVerificationTime'
> & {
  createdAt?: number;
  updatedAt?: number;
};

/** User update input */
export type UpdateUserInput = Partial<Omit<User, 
  | '_id' 
  | '_creationTime' 
  | 'createdAt'
  | 'emailVerificationTime'
  | 'phoneVerificationTime'
>> & {
  updatedAt?: number;
};

/** User profile update input (limited fields for self-service) */
export type UpdateUserProfileInput = Pick<User,
  | 'name'
  | 'bio'
  | 'jobTitle'
  | 'timezone'
  | 'preferredLanguage'
> & {
  updatedAt?: number;
};

/** User invitation input */
export interface InviteUserInput {
  email: string;
  name?: string;
  role: UserRole;
  clientId?: Id<'clients'>;
  departmentIds?: Id<'departments'>[];
  invitedBy: Id<'users'>;
}

/** User authentication context */
export interface UserAuthContext {
  user: User;
  permissions: UserPermission[];
  sessionId: string;
  expiresAt: number;
}

/** User permission structure */
export interface UserPermission {
  resource: string;
  action: PermissionAction;
  conditions?: Record<string, unknown>;
}

/** Permission actions */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

/** Role-based permissions mapping */
export interface RolePermissions {
  role: UserRole;
  permissions: UserPermission[];
}

/** User team membership */
export interface TeamMembership {
  userId: Id<'users'>;
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
  role: TeamRole;
  joinedAt: number;
  isActive: boolean;
}

/** Team role within a client/department */
export type TeamRole = 'lead' | 'member' | 'observer';

/** User notification preferences */
export interface UserNotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  taskAssigned: boolean;
  taskDue: boolean;
  taskCompleted: boolean;
  commentMention: boolean;
  weeklyDigest: boolean;
}

/** Type guards */
export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'role' in value &&
    'status' in value
  );
}

export function isEnrichedUser(value: unknown): value is EnrichedUser {
  return isUser(value);
}

/** Role hierarchy for permission checks */
export const USER_ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  pm: 3,
  task_owner: 2,
  client: 1
} as const;

/** Role display names */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  pm: 'Project Manager',
  task_owner: 'Task Owner',
  client: 'Client User'
} as const;

/** Status display colors for UI */
export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  active: 'text-green-600',
  inactive: 'text-gray-600',
  invited: 'text-yellow-600'
} as const;

// Forward declarations to avoid circular dependencies
interface Client {
  _id: Id<'clients'>;
  name: string;
}

interface Department {
  _id: Id<'departments'>;
  name: string;
}

interface Organization {
  _id: Id<'organizations'>;
  name: string;
}