import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconFolder, IconUsers, IconAlertTriangle, IconGauge } from '@tabler/icons-react';

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
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Active Sprint Capacity</CardTitle>
          <IconGauge className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold leading-none">
              {Math.round(((stats?.activeSprintCommittedHours ?? 0) / Math.max(1, stats?.activeSprintCapacityHours ?? 1)) * 100)}%
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground">
                {(stats?.activeSprintCommittedHours ?? 0)}h of {(stats?.activeSprintCapacityHours ?? 0)}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Total Projects</CardTitle>
          <IconFolder className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">{stats?.totalProjects ?? 0}</div>
          <p className="text-xs text-muted-foreground">{stats?.activeProjectsCount ?? 0} active</p>
        </CardContent>
      </Card>

      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Projects At Risk</CardTitle>
          <IconAlertTriangle className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none text-yellow-600">{stats?.atRiskProjects ?? 0}</div>
          <p className="text-xs text-muted-foreground">In review or near due date</p>
        </CardContent>
      </Card>

      <Card className="gap-3 py-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
          <CardTitle className="text-xs font-medium">Team Members</CardTitle>
          <IconUsers className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-4xl font-bold leading-none">{stats?.totalTeamMembers ?? 0}</div>
          <p className="text-xs text-muted-foreground">Across all projects</p>
        </CardContent>
      </Card>
    </div>
  );
}
