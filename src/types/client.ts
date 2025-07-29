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
  description?: string;
  workstreamCount: number;
  workstreamCapacity: number;
  sprintDuration: number;
  workstreamLabels?: string[];
  timezone?: string;
  workingHours?: {
    start: string;
    end: string;
    daysOfWeek: number[];
  };
  velocityHistory?: Array<{
    sprintId?: string;
    sprintEndDate: number;
    completedPoints: number;
    plannedPoints: number;
  }>;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  // Extended fields from queries
  client?: Client;
  projectCount?: number;
  activeProjectCount?: number;
  totalCapacity?: number;
  averageVelocity?: number;
}

export type ClientStatus = 'active' | 'inactive' | 'archived';
export type ClientSize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type DepartmentStatus = 'active' | 'inactive'; 