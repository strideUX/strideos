import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { IconRun, IconTrendingUp, IconBriefcase, IconGauge } from '@tabler/icons-react';

export interface TeamKPIStats {
  // New KPI metrics
  activeSprints: number;
  avgVelocity: number; // story points per sprint (treated as hours equivalent internally)
  activeProjects: number;
  totalProjects: number;
  avgProjectProgress: number; // 0-100
  capacityUtilization: number; // 0-100
  committedHours: number; // hours committed across active sprints
  totalCapacityHours: number; // hours capacity across active sprints
}

export function TeamStatsCards({ stats }: { stats?: TeamKPIStats | null }) {
  const activeSprints = stats?.activeSprints ?? 0;
  const avgVelocity = Math.round(stats?.avgVelocity ?? 0);
  const activeProjects = stats?.activeProjects ?? 0;
  const totalProjects = stats?.totalProjects ?? 0;
  const avgProjectProgress = Math.round(stats?.avgProjectProgress ?? 0);
  const capacityUtilization = Math.round(stats?.capacityUtilization ?? 0);
  const committedHours = Math.round(stats?.committedHours ?? 0);
  const totalCapacityHours = Math.round(stats?.totalCapacityHours ?? 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Active Sprints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sprints</CardTitle>
          <IconRun className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSprints}</div>
          <CardDescription>Currently running</CardDescription>
        </CardContent>
      </Card>

      {/* Avg Velocity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Velocity</CardTitle>
          <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgVelocity}</div>
          <CardDescription>Story points / sprint</CardDescription>
        </CardContent>
      </Card>

      {/* Active Projects with progress bar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <IconBriefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}/{totalProjects}</div>
          <div className="mt-2">
            <Progress value={avgProjectProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">Avg progress {avgProjectProgress}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Utilization */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
          <IconGauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{capacityUtilization}%</div>
          <CardDescription>
            {committedHours}h of {totalCapacityHours}h
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
