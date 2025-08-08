'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { SprintStatsCards } from '@/components/sprints/SprintStatsCards';
import { SprintsTable } from '@/components/sprints/SprintsTable';
import { SprintFilters } from '@/components/sprints/SprintFilters';
import { useRouter } from 'next/navigation';

export default function SprintsPage() {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any>(null);

  // Queries
  const router = useRouter();
  const clients = useQuery(api.clients.listClients, {});
  const departments = useQuery(api.departments.listAllDepartments, {});
  
  const sprints = useQuery(api.sprints.getSprintsWithDetails, {
    clientId: selectedClient === 'all' ? undefined : (selectedClient as any),
    departmentId: selectedDepartment === 'all' ? undefined : (selectedDepartment as any),
    status: selectedStatus === 'all' ? undefined : (selectedStatus as any),
  });

  const sprintStats = useQuery(api.sprints.getSprintStats, {
    clientId: selectedClient === 'all' ? undefined : (selectedClient as any),
    departmentId: selectedDepartment === 'all' ? undefined : (selectedDepartment as any),
  });

  // Department aggregation view removed per UX refinement

  // Role-based permissions
  const canCreateSprints = user?.role === 'admin' || user?.role === 'pm';
  const canEditSprints = user?.role === 'admin' || user?.role === 'pm';
  const canDeleteSprints = user?.role === 'admin' || user?.role === 'pm';

  // Filter sprints based on search query
  const filteredSprints = sprints?.filter(sprint => 
    sprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sprint.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sprint.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sprint.department?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sprint Management</h1>
            <p className="text-muted-foreground">
              Plan and manage development sprints with capacity tracking and task assignment.
            </p>
          </div>
          {canCreateSprints && (
            <Button onClick={() => router.push('/sprints/new')}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Sprint
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        {sprintStats && <SprintStatsCards stats={sprintStats as any} />}

        {/* Filters */}
        <SprintFilters
          clients={clients as any}
          departments={departments as any}
          selectedClient={selectedClient}
          selectedDepartment={selectedDepartment}
          selectedStatus={selectedStatus}
          searchQuery={searchQuery}
          onClientChange={setSelectedClient}
          onDepartmentChange={setSelectedDepartment}
          onStatusChange={setSelectedStatus}
          onSearchChange={setSearchQuery}
        />

        {/* Department Aggregation View removed */}

        {/* Sprints Table with Timeline */}
        <SprintsTable
          sprints={filteredSprints as any}
          onEditSprint={(sprint) => router.push(`/sprints/${sprint._id}/edit`)}
          onViewDetails={(sprint) => router.push(`/sprints/${sprint._id}/details`)}
        />
      </div>
    </>
  );
}