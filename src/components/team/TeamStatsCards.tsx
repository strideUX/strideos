import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconUsers, IconFolder, IconTrendingUp, IconBuilding } from '@tabler/icons-react';

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalProjects: number;
  averageWorkload: number; // percentage
  totalDepartments: number;
}

export function TeamStatsCards({ stats }: { stats?: TeamStats | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalMembers ?? 0}</div>
          <CardDescription>All users in scope</CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <IconFolder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalProjects ?? 0}</div>
          <CardDescription>In progress</CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Workload</CardTitle>
          <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(stats?.averageWorkload ?? 0)}%</div>
          <CardDescription>Of weekly capacity</CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Departments</CardTitle>
          <IconBuilding className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalDepartments ?? 0}</div>
          <CardDescription>Represented</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
