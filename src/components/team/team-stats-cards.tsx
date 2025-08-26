import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {/* Active Sprints */}
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Active Sprints</CardTitle>
          <IconRun className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">{activeSprints}</div>
        </CardContent>
      </Card>

      {/* Avg Velocity */}
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Avg Velocity</CardTitle>
          <IconTrendingUp className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">{avgVelocity}h</div>
        </CardContent>
      </Card>

      {/* Active Projects with progress bar */}
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Active Projects</CardTitle>
          <IconBriefcase className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold leading-none">{activeProjects}/{totalProjects}</div>
            <div className="flex-1">
              <Progress value={avgProjectProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-right">Avg progress {avgProjectProgress}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Utilization */}
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Capacity Utilization</CardTitle>
          <IconGauge className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold leading-none">{capacityUtilization}%</div>
            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground">
                {committedHours}h of {totalCapacityHours}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
