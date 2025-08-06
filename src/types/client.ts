import { User } from './user';

export interface Client {
  _id: string;
  _creationTime: number;
  name: string;
  logo?: string;
  website?: string;
  isInternal?: boolean;
  status: 'active' | 'inactive' | 'archived';
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  // Extended fields from queries
  departmentCount?: number;
  activeDepartmentCount?: number;
  projectCount?: number;
  activeProjectCount?: number;
}

export interface Department {
  _id: string;
  _creationTime: number;
  name: string;
  clientId: string;
  primaryContactId: string;
  leadId: string;
  teamMemberIds: string[];
  workstreamCount: number;
  slackChannelId?: string;
  createdBy: string;
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

export type ClientStatus = 'active' | 'inactive' | 'archived';
export type ClientSize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type DepartmentStatus = 'active' | 'inactive'; 