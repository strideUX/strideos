"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCalendar, IconTarget, IconTrendingUp, IconUsers } from "@tabler/icons-react";
import { useSprintStatistics } from "@/hooks/use-sprint-statistics";
import type { Doc } from "@/convex/_generated/dataModel";

export interface SprintStats {
  totalSprints: number;
  activeSprints: number;
  completedSprints?: number;
  averageVelocity: number; // hours per sprint
  totalCapacityHours: number;
  committedHours: number;
  capacityUtilization: number; // percentage
}

interface SprintStatsCardsProps {
  stats?: SprintStats | null;
  // Optional: allow passing raw data for local calculation
  sprints?: Doc<'sprints'>[];
  tasks?: Doc<'tasks'>[];
}

export function SprintStatsCards({ stats, sprints, tasks }: SprintStatsCardsProps) {
  // Use hook if raw data is provided, otherwise use passed stats
  const calculatedStats = useSprintStatistics({ sprints, tasks });
  
  // Prefer passed stats, fall back to calculated stats
  const displayStats = stats || calculatedStats;
  
  if (!displayStats) {
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
        {/* Repeat for other cards */}
      </div>
    );
  }

  // Map calculated stats to expected interface if needed
  const mappedStats: SprintStats = stats || {
    totalSprints: displayStats.total,
    activeSprints: displayStats.active,
    completedSprints: displayStats.completed,
    averageVelocity: displayStats.averageVelocity,
    totalCapacityHours: 0, // Not calculated in hook
    committedHours: 0, // Not calculated in hook
    capacityUtilization: displayStats.capacityUtilization,
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Total Sprints</CardTitle>
          <IconCalendar className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">{mappedStats.totalSprints ?? 0}</div>
        </CardContent>
      </Card>

      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Active Sprints</CardTitle>
          <IconTarget className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">{mappedStats.activeSprints ?? 0}</div>
        </CardContent>
      </Card>

      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Capacity Utilization</CardTitle>
          <IconTrendingUp className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold leading-none">{Number(mappedStats.capacityUtilization ?? 0).toFixed(0)}%</div>
            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground">
                {(mappedStats.committedHours ?? 0)}h of {(mappedStats.totalCapacityHours ?? 0)}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Avg Velocity</CardTitle>
          <IconUsers className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">{Number(mappedStats.averageVelocity ?? 0).toFixed(0)}</div>
        </CardContent>
      </Card>
    </div>
  );
}


