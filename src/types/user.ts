export interface User {
  _id: string;
  _creationTime: number;
  name?: string;
  image?: string;
  email?: string;
  emailVerificationTime?: number;
  phone?: string;
  phoneVerificationTime?: number;
  isAnonymous?: boolean;
  
  // Custom application fields
  role: 'admin' | 'pm' | 'task_owner' | 'client';
  status: 'active' | 'inactive' | 'invited';
  
  // Organization relationship
  organizationId?: string;
  
  // Assignment fields
  clientId?: string;
  departmentIds?: string[];
  
  // User profile fields
  jobTitle?: string;
  bio?: string;
  timezone?: string;
  preferredLanguage?: string;
  
  // Invitation fields
  invitedBy?: string;
  invitedAt?: number;
  invitationToken?: string;
  
  // Audit fields
  lastLoginAt?: number;
  createdAt: number;
  updatedAt: number;
  
  // Extended fields from queries
  client?: Client | null;
  departments?: Department[];
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  invited: number;
  byRole: {
    admin: number;
    pm: number;
    task_owner: number;
    client: number;
  };
  assignedToClients: number;
  assignedToDepartments: number;
}

export interface Client {
  _id: string;
  _creationTime: number;
  name: string;
  description?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  status: 'active' | 'inactive' | 'archived';
  timezone?: string;
  currency?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
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
}

export type UserRole = 'admin' | 'pm' | 'task_owner' | 'client';
export type UserStatus = 'active' | 'inactive' | 'invited'; 