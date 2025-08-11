import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconFolder, IconTrendingUp, IconUsers, IconUser } from '@tabler/icons-react';
import { Progress } from '@/components/ui/progress';

interface ClientStats {
  totalProjects: number;
  activeProjectsCount: number;
  upcomingProjectsCount: number;
  averageProgress: number;
  totalTeamMembers: number;
  activeSprintsCount: number;
  planningSprintsCount: number;
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
          <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
          <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(stats?.averageProgress ?? 0)}%</div>
          <Progress value={stats?.averageProgress ?? 0} className="h-2 mt-2" />
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contact</CardTitle>
          <IconUser className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <div className="font-medium">{client?.phone ?? 'No phone'}</div>
            <div className="text-xs text-muted-foreground">{client?.address ?? 'No address'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
