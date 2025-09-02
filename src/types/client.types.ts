/**
 * Client and Department type definitions
 * 
 * @remarks
 * Core types for client management, departments, and organizational structure.
 */

import type { User } from './user.types';
import type { Id } from '@/convex/_generated/dataModel';

/** Core client entity */
export interface Client {
  _id: Id<'clients'>;
  _creationTime: number;
  name: string;
  projectKey?: string; // Project key for slug generation (e.g., "SQRL", "RESP")
  logo?: Id<'_storage'>;
  website?: string;
  isInternal?: boolean;
  status: ClientStatus;
  description?: string;
  industry?: string;
  size?: ClientSize;
  contactEmail?: string;
  contactPhone?: string;
  address?: ClientAddress;
  timezone?: string;
  currency?: string;
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
}

/** Client with enriched query data */
export interface EnrichedClient extends Client {
  // Statistics from queries
  departmentCount?: number;
  activeDepartmentCount?: number;
  projectCount?: number;
  activeProjectCount?: number;
  teamMemberCount?: number;
  // Related data
  departments?: Department[];
  teamMembers?: User[];
}

/** Client address structure */
export interface ClientAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/** Department entity */
export interface Department {
  _id: Id<'departments'>;
  _creationTime: number;
  name: string;
  description?: string;
  clientId: Id<'clients'>;
  primaryContactId: Id<'users'>;
  leadId: Id<'users'>;
  teamMemberIds: Id<'users'>[];
  workstreamCount: number;
  capacity: number;
  slackChannelId?: string;
  status: DepartmentStatus;
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
}

/** Department with enriched query data */
export interface EnrichedDepartment extends Department {
  // Related entities
  client?: Client;
  primaryContact?: User;
  lead?: User;
  teamMembers?: User[];
  // Statistics
  projectCount?: number;
  activeProjectCount?: number;
  taskCount?: number;
  activeTasks?: number;
}

/** API response type for departments with embedded user data */
export interface DepartmentWithStats {
  _id: Id<'departments'>;
  _creationTime: number;
  name: string;
  clientId: Id<'clients'>;
  primaryContactId: Id<'users'>;
  leadId: Id<'users'>;
  teamMemberIds: Id<'users'>[];
  workstreamCount: number;
  slackChannelId?: string;
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
  primaryContact: { _id: Id<'users'>; name: string | undefined; email: string | undefined } | null;
  lead: { _id: Id<'users'>; name: string | undefined; email: string | undefined } | null;
  teamMembers: { _id: Id<'users'>; name: string | undefined; email: string | undefined }[];
  projectCount: number;
  activeProjectCount: number;
}

/** Client status enumeration */
export type ClientStatus = 'active' | 'inactive' | 'archived';

/** Client size enumeration */
export type ClientSize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

/** Department status enumeration */
export type DepartmentStatus = 'active' | 'inactive';

/** Client creation input */
export type CreateClientInput = Omit<Client, 
  | '_id' 
  | '_creationTime' 
  | 'createdAt' 
  | 'updatedAt'
> & {
  createdAt?: number;
  updatedAt?: number;
};

/** Client update input */
export type UpdateClientInput = Partial<Omit<Client, 
  | '_id' 
  | '_creationTime' 
  | 'createdBy' 
  | 'createdAt'
>> & {
  updatedAt?: number;
};

/** Department creation input */
export type CreateDepartmentInput = Omit<Department, 
  | '_id' 
  | '_creationTime' 
  | 'createdAt' 
  | 'updatedAt'
> & {
  createdAt?: number;
  updatedAt?: number;
};

/** Department update input */
export type UpdateDepartmentInput = Partial<Omit<Department, 
  | '_id' 
  | '_creationTime' 
  | 'createdBy' 
  | 'createdAt'
>> & {
  updatedAt?: number;
};

/** Type guards */
export function isClient(value: unknown): value is Client {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'name' in value &&
    'status' in value
  );
}

export function isDepartment(value: unknown): value is Department {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'name' in value &&
    'clientId' in value
  );
}

/** Client statistics */
export interface ClientStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalTeamMembers: number;
  activeDepartments: number;
}