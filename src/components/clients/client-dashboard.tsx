/**
 * ClientDashboard - Main dashboard interface for client management and overview
 *
 * @remarks
 * Provides a comprehensive view of client information, projects, sprints, and performance
 * metrics. Integrates multiple client management components into a unified dashboard
 * experience.
 *
 * @example
 * ```tsx
 * <ClientDashboard
 *   clientId="client-123"
 *   onClientUpdate={handleClientUpdate}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { IconEdit, IconPhone, IconMail, IconMapPin } from '@tabler/icons-react';

// 2. Internal imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientStatsCards } from './client-stats-cards';
import { ClientSprintOverview } from './client-sprint-overview';
import { ClientProjectList } from './client-project-list';

// 3. Types
interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  status: 'active' | 'inactive' | 'prospect';
  joinedDate: string;
  totalRevenue: number;
  projectsCount: number;
  activeSprintsCount: number;
}

interface ClientStats {
  totalProjects: number;
  activeProjectsCount: number;
  upcomingProjectsCount: number;
  averageProgress: number;
  totalTeamMembers: number;
  activeSprintsCount: number;
  planningSprintsCount: number;
  atRiskProjects: number;
  activeSprintCapacityHours: number;
  activeSprintCommittedHours: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  progress: number;
  startDate: string;
  endDate: string;
  teamMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: string;
  }>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget: number;
  actualCost: number;
}

interface ClientDashboardProps {
  /** Unique identifier for the client */
  clientId: string;
  /** Client information to display */
  client?: Client | null;
  /** Client statistics data */
  stats?: Partial<ClientStats> | null;
  /** Array of client projects */
  projects?: Project[];
  /** Callback function when client data is updated */
  onClientUpdate?: (clientId: string, updates: Partial<Client>) => void;
  /** Callback function when sprint data is updated */
  onSprintUpdate?: (sprintId: string, updates: any) => void;
  /** Callback function when project data is updated */
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
  /** Callback function when new project is created */
  onNewProject?: () => void;
}

// 4. Component definition
export const ClientDashboard = memo(function ClientDashboard({ 
  clientId, 
  client, 
  stats, 
  projects = [], 
  onClientUpdate, 
  onSprintUpdate, 
  onProjectUpdate, 
  onNewProject 
}: ClientDashboardProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const clientName = useMemo(() => {
    return client?.name ?? 'Client';
  }, [client?.name]);

  const clientStatus = useMemo(() => {
    return client?.status ?? 'active';
  }, [client?.status]);

  const clientCompany = useMemo(() => {
    return client?.company ?? 'Company';
  }, [client?.company]);

  const joinedDate = useMemo(() => {
    return client?.joinedDate ? new Date(client.joinedDate).toLocaleDateString() : 'N/A';
  }, [client?.joinedDate]);

  const totalRevenue = useMemo(() => {
    return client?.totalRevenue ? `$${client.totalRevenue.toLocaleString()}` : '$0';
  }, [client?.totalRevenue]);

  const statusColor = useMemo(() => {
    switch (clientStatus) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, [clientStatus]);

  const statusLabel = useMemo(() => {
    switch (clientStatus) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'prospect': return 'Prospect';
      default: return 'Unknown';
    }
  }, [clientStatus]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleClientUpdate = useCallback((updates: Partial<Client>) => {
    onClientUpdate?.(clientId, updates);
  }, [clientId, onClientUpdate]);

  const handleSprintUpdate = useCallback((sprintId: string, updates: any) => {
    onSprintUpdate?.(sprintId, updates);
  }, [onSprintUpdate]);

  const handleProjectUpdate = useCallback((projectId: string, updates: Partial<Project>) => {
    onProjectUpdate?.(projectId, updates);
  }, [onProjectUpdate]);

  const handleNewProject = useCallback(() => {
    onNewProject?.();
  }, [onNewProject]);

  const handleEditClient = useCallback(() => {
    // Implementation for editing client
    console.log('Editing client:', clientId);
  }, [clientId]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!client) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Client not found</p>
        </CardContent>
      </Card>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-6">
      {/* Client Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{clientName}</h1>
                <Badge className={statusColor}>{statusLabel}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="text-sm">{clientCompany}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Joined</p>
                  <p className="text-sm">{joinedDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-sm font-semibold">{totalRevenue}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Projects</p>
                  <p className="text-sm">{client.projectsCount ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <IconMail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2">
                    <IconMapPin className="h-4 w-4" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={handleEditClient} variant="outline" className="gap-2">
              <IconEdit className="h-4 w-4" />
              Edit Client
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <ClientStatsCards stats={stats} client={client} />

      {/* Sprint Overview */}
      <ClientSprintOverview 
        clientId={clientId}
        onSprintUpdate={handleSprintUpdate}
        client={client}
      />

      {/* Project List */}
      <ClientProjectList 
        clientId={clientId}
        projects={projects}
        onProjectUpdate={handleProjectUpdate}
        onNewProject={handleNewProject}
      />
    </div>
  );
});
