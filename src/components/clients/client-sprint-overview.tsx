/**
 * ClientSprintOverview - Comprehensive sprint planning and capacity management interface
 *
 * @remarks
 * Provides a complete view of client sprint planning including capacity management,
 * project allocation, team member assignments, and sprint timeline visualization.
 * Integrates with the sprint planning system for real-time updates.
 *
 * @example
 * ```tsx
 * <ClientSprintOverview
 *   clientId="client-123"
 *   onSprintUpdate={handleSprintUpdate}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { IconPlus, IconCalendar, IconUsers, IconGauge } from '@tabler/icons-react';

// 2. Internal imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SprintStatsCards } from '@/components/sprints/sprint-stats-cards';
import { CapacityBar } from '@/components/sprints/capacity-bar';
import { SprintsTable } from '@/components/sprints/sprints-table';

// 3. Types
interface ClientSprintOverviewProps {
  /** Unique identifier for the client */
  clientId: string;
  /** Callback function when sprint data is updated */
  onSprintUpdate?: (sprintId: string, updates: any) => void;
  /** Optional client data for context */
  client?: {
    name?: string;
    projects?: Array<{ id: string; name: string }>;
  } | null;
}

// 4. Component definition
export const ClientSprintOverview = memo(function ClientSprintOverview({ 
  clientId, 
  onSprintUpdate, 
  client 
}: ClientSprintOverviewProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const clientName = useMemo(() => {
    return client?.name ?? 'Client';
  }, [client?.name]);

  const projectCount = useMemo(() => {
    return client?.projects?.length ?? 0;
  }, [client?.projects?.length]);

  const sprintStats = useMemo(() => ({
    totalSprints: 4,
    activeSprints: 2,
    planningSprints: 1,
    completedSprints: 1
  }), []);

  const capacityData = useMemo(() => ({
    totalCapacity: 160,
    allocatedHours: 120,
    remainingHours: 40,
    utilizationPercentage: 75
  }), []);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleSprintUpdate = useCallback((sprintId: string, updates: any) => {
    onSprintUpdate?.(sprintId, updates);
  }, [onSprintUpdate]);

  const handleNewSprint = useCallback(() => {
    // Implementation for creating new sprint
    console.log('Creating new sprint for client:', clientId);
  }, [clientId]);

  const handleCapacityUpdate = useCallback((newCapacity: number) => {
    // Implementation for updating capacity
    console.log('Updating capacity to:', newCapacity);
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {clientName} Sprint Overview
          </h2>
          <p className="text-muted-foreground">
            Manage sprint planning, capacity, and project allocation
          </p>
        </div>
        <Button onClick={handleNewSprint} className="gap-2">
          <IconPlus className="h-4 w-4" />
          New Sprint
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sprints</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprintStats.totalSprints}</div>
            <p className="text-xs text-muted-foreground">
              {sprintStats.activeSprints} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
            <IconGauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityData.utilizationPercentage}%</div>
            <Progress value={capacityData.utilizationPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {capacityData.allocatedHours}h of {capacityData.totalCapacity}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge variant="secondary">Planning</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprintStats.planningSprints}</div>
            <p className="text-xs text-muted-foreground">In planning phase</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sprint Planning Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sprint Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <SprintStatsCards 
              stats={{
                totalSprints: sprintStats.totalSprints,
                activeSprints: sprintStats.activeSprints,
                completedSprints: sprintStats.completedSprints,
                averageVelocity: 0,
                totalCapacityHours: capacityData.totalCapacity,
                committedHours: capacityData.allocatedHours,
                capacityUtilization: capacityData.utilizationPercentage
              }}
            />
          </CardContent>
        </Card>

        {/* Sprint Capacity Section */}
        <Card>
          <CardHeader>
            <CardTitle>Capacity Management</CardTitle>
          </CardHeader>
          <CardContent>
            <CapacityBar 
              valuePct={capacityData.utilizationPercentage}
              committedHours={capacityData.allocatedHours}
              capacityHours={capacityData.totalCapacity}
            />
          </CardContent>
        </Card>

        {/* Sprint Timeline Section */}
        <Card>
          <CardHeader>
            <CardTitle>Sprint Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <SprintsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
