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
import { Input } from '@/components/ui/input';
import { SprintFormDialog } from '@/components/sprints/SprintFormDialog';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActiveSprintsKanban } from '@/components/sprints/ActiveSprintsKanban';

export default function SprintsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // Queries
  const router = useRouter();
  const sprints = useQuery(api.sprints.getSprintsWithDetails, {});
  const planningSprints = useQuery(api.sprints.getSprintsWithDetails, { status: 'planning' });
  const completedSprints = useQuery(api.sprints.getSprintsWithDetails, { status: 'complete' });
  const sprintStats = useQuery(api.sprints.getSprintStats, {});

  // Department aggregation view removed per UX refinement

  // Role-based permissions
  const canCreateSprints = user?.role === 'admin' || user?.role === 'pm';

  const filterBySearch = (items?: any[] | null) => {
    const list = items ?? [];
    const q = searchQuery.toLowerCase();
    if (!q) return list;
    return list.filter((sprint: any) =>
      sprint.name.toLowerCase().includes(q) ||
      sprint.description?.toLowerCase().includes(q) ||
      sprint.client?.name?.toLowerCase().includes(q) ||
      sprint.department?.name?.toLowerCase().includes(q)
    );
  };
  const filteredSprints = filterBySearch(sprints);
  const filteredPlanning = filterBySearch(planningSprints);
  const filteredCompleted = filterBySearch(completedSprints);

  // Note: moved to unified sprint page; keep table-only here

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
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Sprint
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        {sprintStats && <SprintStatsCards stats={sprintStats} />}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Sprints</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* Active Sprints Kanban */}
          <TabsContent value="active" className="mt-2">
            <ActiveSprintsKanban />
          </TabsContent>

          {/* Upcoming (planning) */}
          <TabsContent value="upcoming" className="mt-2">
            <div className="mb-4">
              <Input
                placeholder="Search sprints"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <SprintsTable
              sprints={filteredPlanning}
              onEditSprint={(sprint) => router.push(`/sprint/${sprint._id}`)}
              onViewDetails={(sprint) => router.push(`/sprint/${sprint._id}`)}
              title="Upcoming Sprints"
              description="Sprints in planning"
              statusFilter="planning"
            />
          </TabsContent>

          {/* Completed */}
          <TabsContent value="completed" className="mt-2">
            <div className="mb-4">
              <Input
                placeholder="Search sprints"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <SprintsTable
              sprints={filteredCompleted}
              onEditSprint={(sprint) => router.push(`/sprint/${sprint._id}`)}
              onViewDetails={(sprint) => router.push(`/sprint/${sprint._id}`)}
              title="Completed Sprints"
              description="Sprints that have been completed"
              statusFilter="completed"
            />
          </TabsContent>
        </Tabs>
      </div>

      <SprintFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={(id) => router.push(`/sprint/${id}`)}
      />
    </>
  );
}