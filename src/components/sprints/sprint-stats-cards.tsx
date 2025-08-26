"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCalendar, IconTarget, IconTrendingUp, IconUsers } from "@tabler/icons-react";

export interface SprintStats {
  totalSprints: number;
  activeSprints: number;
  completedSprints?: number;
  averageVelocity: number; // hours per sprint
  totalCapacityHours: number;
  committedHours: number;
  capacityUtilization: number; // percentage
}

export function SprintStatsCards({ stats }: { stats?: SprintStats | null }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Total Sprints</CardTitle>
          <IconCalendar className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">{stats?.totalSprints ?? 0}</div>
        </CardContent>
      </Card>

      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Active Sprints</CardTitle>
          <IconTarget className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">{stats?.activeSprints ?? 0}</div>
        </CardContent>
      </Card>

      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Capacity Utilization</CardTitle>
          <IconTrendingUp className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold leading-none">{Number(stats?.capacityUtilization ?? 0).toFixed(0)}%</div>
            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground">
                {(stats?.committedHours ?? 0)}h of {(stats?.totalCapacityHours ?? 0)}h
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
          <div className="text-4xl font-bold leading-none">{Number(stats?.averageVelocity ?? 0).toFixed(0)}</div>
        </CardContent>
      </Card>
    </div>
  );
}


