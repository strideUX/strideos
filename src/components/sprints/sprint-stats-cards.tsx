/**
 * SprintStatsCards - Statistical overview cards for sprint metrics and performance
 *
 * @remarks
 * Displays key sprint statistics including total counts, active sprints, completion rates,
 * and capacity utilization. Can work with pre-calculated stats or calculate from raw data.
 * Integrates with sprint management workflow for performance monitoring and reporting.
 *
 * @example
 * ```tsx
 * <SprintStatsCards
 *   stats={preCalculatedStats}
 *   sprints={sprintList}
 *   tasks={taskList}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { IconCalendar, IconClock, IconCheck, IconTrendingUp } from '@tabler/icons-react';

// 2. Internal imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSprintStatistics } from "@/hooks/use-sprint-statistics";
import { Doc } from "@/convex/_generated/dataModel";

// 3. Types (if not in separate file)
interface SprintStats {
  totalSprints: number;
  activeSprints: number;
  completedSprints: number;
  averageVelocity: number;
  totalCapacityHours: number;
  committedHours: number;
  capacityUtilization: number;
}

interface SprintStatsCardsProps {
  /** Pre-calculated sprint statistics */
  stats?: SprintStats;
  /** Raw sprint data for calculation */
  sprints?: Doc<'sprints'>[];
  /** Raw task data for calculation */
  tasks?: Doc<'tasks'>[];
}

// 4. Component definition
export const SprintStatsCards = memo(function SprintStatsCards({ 
  stats, 
  sprints, 
  tasks 
}: SprintStatsCardsProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const calculatedStats = useSprintStatistics({ sprints, tasks });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const displayStats = useMemo(() => {
    return stats || calculatedStats;
  }, [stats, calculatedStats]);

  const mappedStats = useMemo((): SprintStats => {
    if (stats) return stats;
    
    // Check if displayStats is SprintStatistics (from hook) or SprintStats (from props)
    if (displayStats && 'total' in displayStats) {
      // It's SprintStatistics from the hook
      return {
        totalSprints: displayStats.total ?? 0,
        activeSprints: displayStats.active ?? 0,
        completedSprints: displayStats.completed ?? 0,
        averageVelocity: displayStats.averageVelocity ?? 0,
        totalCapacityHours: 0, // Not calculated in hook
        committedHours: 0, // Not calculated in hook
        capacityUtilization: displayStats.capacityUtilization ?? 0,
      };
    }
    
    // It's SprintStats from props
    return displayStats || {
      totalSprints: 0,
      activeSprints: 0,
      completedSprints: 0,
      averageVelocity: 0,
      totalCapacityHours: 0,
      committedHours: 0,
      capacityUtilization: 0,
    };
  }, [stats, displayStats]);

  const hasStats = useMemo(() => {
    return !!displayStats;
  }, [displayStats]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const formatNumber = useCallback((value: number): string => {
    return value.toLocaleString();
  }, []);

  const formatPercentage = useCallback((value: number): string => {
    return `${Math.round(value)}%`;
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!hasStats) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gap-3 py-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
            <CardTitle className="text-xs font-medium">Total Sprints</CardTitle>
            <IconCalendar className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <div className="text-4xl font-bold leading-none">—</div>
          </CardContent>
        </Card>
        <Card className="gap-3 py-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
            <CardTitle className="text-xs font-medium">Active Sprints</CardTitle>
            <IconClock className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <div className="text-4xl font-bold leading-none">—</div>
          </CardContent>
        </Card>
        <Card className="gap-3 py-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
            <CardTitle className="text-xs font-medium">Completed Sprints</CardTitle>
            <IconCheck className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <div className="text-4xl font-bold leading-none">—</div>
          </CardContent>
        </Card>
        <Card className="gap-3 py-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
            <CardTitle className="text-xs font-medium">Average Velocity</CardTitle>
            <IconTrendingUp className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <div className="text-4xl font-bold leading-none">—</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Total Sprints</CardTitle>
          <IconCalendar className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">
            {formatNumber(mappedStats.totalSprints)}
          </div>
        </CardContent>
      </Card>
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Active Sprints</CardTitle>
          <IconClock className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">
            {formatNumber(mappedStats.activeSprints)}
          </div>
        </CardContent>
      </Card>
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Completed Sprints</CardTitle>
          <IconCheck className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">
            {formatNumber(mappedStats.completedSprints)}
          </div>
        </CardContent>
      </Card>
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Average Velocity</CardTitle>
          <IconTrendingUp className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">
            {formatNumber(mappedStats.averageVelocity)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});


