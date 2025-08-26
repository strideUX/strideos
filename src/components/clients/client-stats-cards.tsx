/**
 * ClientStatsCards - Statistical overview cards for client performance and capacity
 *
 * @remarks
 * Displays key client metrics including sprint capacity, project counts, risk assessment,
 * and team composition. Provides visual indicators for client performance monitoring
 * and resource allocation planning.
 *
 * @example
 * ```tsx
 * <ClientStatsCards
 *   stats={clientStatistics}
 *   client={clientData}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, memo } from 'react';
import { IconFolder, IconUsers, IconAlertTriangle, IconGauge } from '@tabler/icons-react';

// 2. Internal imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 3. Types
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

interface ClientStatsCardsProps {
  /** Client statistics data to display */
  stats?: Partial<ClientStats> | null;
  /** Client information for additional context */
  client?: { phone?: string; address?: string } | null;
}

// 4. Component definition
export const ClientStatsCards = memo(function ClientStatsCards({ 
  stats, 
  client 
}: ClientStatsCardsProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const capacityUtilization = useMemo(() => {
    const committed = stats?.activeSprintCommittedHours ?? 0;
    const capacity = Math.max(1, stats?.activeSprintCapacityHours ?? 1);
    return Math.round((committed / capacity) * 100);
  }, [stats?.activeSprintCommittedHours, stats?.activeSprintCapacityHours]);

  const committedHours = useMemo(() => {
    return stats?.activeSprintCommittedHours ?? 0;
  }, [stats?.activeSprintCapacityHours]);

  const capacityHours = useMemo(() => {
    return stats?.activeSprintCapacityHours ?? 0;
  }, [stats?.activeSprintCapacityHours]);

  const totalProjects = useMemo(() => {
    return stats?.totalProjects ?? 0;
  }, [stats?.totalProjects]);

  const activeProjectsCount = useMemo(() => {
    return stats?.activeProjectsCount ?? 0;
  }, [stats?.activeProjectsCount]);

  const atRiskProjects = useMemo(() => {
    return stats?.atRiskProjects ?? 0;
  }, [stats?.atRiskProjects]);

  const totalTeamMembers = useMemo(() => {
    return stats?.totalTeamMembers ?? 0;
  }, [stats?.totalTeamMembers]);

  const statCards = useMemo(() => [
    {
      title: 'Active Sprint Capacity',
      icon: <IconGauge className="h-6 w-6 text-muted-foreground" />,
      content: (
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold leading-none">
            {capacityUtilization}%
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-muted-foreground">
              {committedHours}h of {capacityHours}h
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Total Projects',
      icon: <IconFolder className="h-6 w-6 text-muted-foreground" />,
      content: (
        <>
          <div className="text-4xl font-bold leading-none">{totalProjects}</div>
          <p className="text-xs text-muted-foreground">{activeProjectsCount} active</p>
        </>
      )
    },
    {
      title: 'Projects At Risk',
      icon: <IconAlertTriangle className="h-6 w-6 text-muted-foreground" />,
      content: (
        <>
          <div className="text-4xl font-bold leading-none text-yellow-600">
            {atRiskProjects}
          </div>
          <p className="text-xs text-muted-foreground">In review or near due date</p>
        </>
      )
    },
    {
      title: 'Team Members',
      icon: <IconUsers className="h-6 w-6 text-muted-foreground" />,
      content: (
        <>
          <div className="text-4xl font-bold leading-none">{totalTeamMembers}</div>
          <p className="text-xs text-muted-foreground">Across all projects</p>
        </>
      )
    }
  ], [
    capacityUtilization, committedHours, capacityHours, totalProjects, 
    activeProjectsCount, atRiskProjects, totalTeamMembers
  ]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <Card key={index} className="gap-3 py-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
            <CardTitle className="text-xs font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            {card.content}
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
