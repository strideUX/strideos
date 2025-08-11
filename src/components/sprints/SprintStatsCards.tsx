"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCalendar, IconTarget, IconTrendingUp, IconUsers } from "@tabler/icons-react";

export interface SprintStats {
  totalSprints: number;
  activeSprints: number;
  completedSprints?: number;
  averageVelocity: number; // hours per sprint
  totalCapacityHours: number;
  totalCommittedHours: number;
  capacityUtilization: number; // percentage
}

export function SprintStatsCards({ stats }: { stats?: SprintStats | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sprints</CardTitle>
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalSprints ?? 0}</div>
          <CardDescription>All time</CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sprints</CardTitle>
          <IconTarget className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeSprints ?? 0}</div>
          <CardDescription>Currently running</CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
          <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats?.capacityUtilization ?? 0).toFixed(1)}%</div>
          <CardDescription>
            {(stats?.totalCommittedHours ?? 0)} / {(stats?.totalCapacityHours ?? 0)} hours
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Velocity</CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Number(stats?.averageVelocity ?? 0).toFixed(0)}</div>
          <CardDescription>Hours per sprint</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}


