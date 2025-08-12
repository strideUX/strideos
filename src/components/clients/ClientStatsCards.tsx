import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconFolder, IconTrendingUp, IconUsers, IconUser, IconAlertTriangle, IconGauge } from '@tabler/icons-react';
import { Progress } from '@/components/ui/progress';

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
  stats?: Partial<ClientStats> | null;
  client?: { phone?: string; address?: string } | null;
}

export function ClientStatsCards({ stats, client }: ClientStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sprint Capacity</CardTitle>
          <IconGauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(((stats?.activeSprintCommittedHours ?? 0) / Math.max(1, stats?.activeSprintCapacityHours ?? 1)) * 100)}%
          </div>
          <Progress value={((stats?.activeSprintCommittedHours ?? 0) / Math.max(1, stats?.activeSprintCapacityHours ?? 1)) * 100} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {(stats?.activeSprintCommittedHours ?? 0)}h / {(stats?.activeSprintCapacityHours ?? 0)}h
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <IconFolder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalProjects ?? 0}</div>
          <p className="text-xs text-muted-foreground">{stats?.activeProjectsCount ?? 0} active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projects At Risk</CardTitle>
          <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats?.atRiskProjects ?? 0}</div>
          <p className="text-xs text-muted-foreground">In review or near due date</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalTeamMembers ?? 0}</div>
          <p className="text-xs text-muted-foreground">Across all projects</p>
        </CardContent>
      </Card>
    </div>
  );
}
