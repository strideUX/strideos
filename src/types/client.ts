/**
 * Client and Department type definitions
 * 
 * @remarks
 * Core types for client management, departments, and organizational structure.
 */

import type { User } from './user.types';
import type { Id } from '@/convex/_generated/dataModel';

export interface Client {
  _id: Id<'clients'>;
  _creationTime: number;
  name: string;
  projectKey?: string; // Project key for slug generation (e.g., "SQRL", "RESP")
  logo?: Id<'_storage'>;
  website?: string;
  isInternal?: boolean;
  status: 'active' | 'inactive' | 'archived';
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
  // Extended fields from queries
  departmentCount?: number;
  activeDepartmentCount?: number;
  projectCount?: number;
  activeProjectCount?: number;
}

export interface Department {
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
  // Extended fields from queries
  client?: Client;
  primaryContact?: User;
  lead?: User;
  teamMembers?: User[];
  projectCount?: number;
  activeProjectCount?: number;
}

// API response type for departments with embedded user data
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
  // API response fields
  primaryContact: { _id: Id<'users'>; name: string | undefined; email: string | undefined } | null;
  lead: { _id: Id<'users'>; name: string | undefined; email: string | undefined } | null;
  teamMembers: { _id: Id<'users'>; name: string | undefined; email: string | undefined }[];
  projectCount: number;
  activeProjectCount: number;
}

export type ClientStatus = 'active' | 'inactive' | 'archived';
export type ClientSize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type DepartmentStatus = 'active' | 'inactive'; 