/**
 * TeamStatsCards - Key performance indicator cards for team productivity and capacity
 *
 * @remarks
 * Displays team KPI metrics including active sprints, velocity, project progress, and capacity utilization.
 * Provides visual progress indicators and real-time statistics for team performance monitoring.
 * Integrates with team management workflow for productivity tracking and resource planning.
 *
 * @example
 * ```tsx
 * <TeamStatsCards stats={teamKPIStats} />
 * ```
 */

// 1. External imports
import React, { useMemo, memo } from 'react';
import { IconRun, IconTrendingUp, IconBriefcase, IconGauge } from '@tabler/icons-react';

// 2. Internal imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// 3. Types
export interface TeamKPIStats {
  /** Number of currently active sprints */
  activeSprints: number;
  /** Average velocity in story points per sprint (treated as hours equivalent) */
  avgVelocity: number;
  /** Number of currently active projects */
  activeProjects: number;
  /** Total number of projects */
  totalProjects: number;
  /** Average project progress percentage (0-100) */
  avgProjectProgress: number;
  /** Team capacity utilization percentage (0-100) */
  capacityUtilization: number;
  /** Hours committed across active sprints */
  committedHours: number;
  /** Total capacity hours across active sprints */
  totalCapacityHours: number;
}

interface TeamStatsCardsProps {
  /** Team KPI statistics to display */
  stats?: TeamKPIStats | null;
}

// 4. Component definition
export const TeamStatsCards = memo(function TeamStatsCards({ 
  stats 
}: TeamStatsCardsProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const activeSprints = useMemo(() => {
    return stats?.activeSprints ?? 0;
  }, [stats?.activeSprints]);

  const avgVelocity = useMemo(() => {
    return Math.round(stats?.avgVelocity ?? 0);
  }, [stats?.avgVelocity]);

  const activeProjects = useMemo(() => {
    return stats?.activeProjects ?? 0;
  }, [stats?.activeProjects]);

  const totalProjects = useMemo(() => {
    return stats?.totalProjects ?? 0;
  }, [stats?.totalProjects]);

  const avgProjectProgress = useMemo(() => {
    return Math.round(stats?.avgProjectProgress ?? 0);
  }, [stats?.avgProjectProgress]);

  const capacityUtilization = useMemo(() => {
    return Math.round(stats?.capacityUtilization ?? 0);
  }, [stats?.capacityUtilization]);

  const committedHours = useMemo(() => {
    return Math.round(stats?.committedHours ?? 0);
  }, [stats?.committedHours]);

  const totalCapacityHours = useMemo(() => {
    return Math.round(stats?.totalCapacityHours ?? 0);
  }, [stats?.totalCapacityHours]);

  const statCards = useMemo(() => [
    {
      title: 'Active Sprints',
      value: activeSprints,
      icon: <IconRun className="h-6 w-6 text-muted-foreground" />,
      content: (
        <div className="text-4xl font-bold leading-none">{activeSprints}</div>
      )
    },
    {
      title: 'Avg Velocity',
      value: avgVelocity,
      icon: <IconTrendingUp className="h-6 w-6 text-muted-foreground" />,
      content: (
        <div className="text-4xl font-bold leading-none">{avgVelocity}h</div>
      )
    },
    {
      title: 'Active Projects',
      value: `${activeProjects}/${totalProjects}`,
      icon: <IconBriefcase className="h-6 w-6 text-muted-foreground" />,
      content: (
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold leading-none">{activeProjects}/{totalProjects}</div>
          <div className="flex-1">
            <Progress value={avgProjectProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              Avg progress {avgProjectProgress}%
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Capacity Utilization',
      value: `${capacityUtilization}%`,
      icon: <IconGauge className="h-6 w-6 text-muted-foreground" />,
      content: (
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold leading-none">{capacityUtilization}%</div>
          <div className="flex-1 text-right">
            <p className="text-xs text-muted-foreground">
              {committedHours}h of {totalCapacityHours}h
            </p>
          </div>
        </div>
      )
    }
  ], [
    activeSprints, avgVelocity, activeProjects, totalProjects, 
    avgProjectProgress, capacityUtilization, committedHours, totalCapacityHours
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
