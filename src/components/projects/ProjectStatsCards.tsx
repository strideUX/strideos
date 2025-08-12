import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IconFolder, IconCircleCheck, IconAlertTriangle, IconTrendingUp } from '@tabler/icons-react';

interface ProjectStats {
  totalProjects: number;
  onTrackProjects: number;
  atRiskProjects: number;
  avgProgress: number;
}

interface ProjectStatsCardsProps {
  stats: ProjectStats;
}

export function ProjectStatsCards({ stats }: ProjectStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <IconFolder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProjects}</div>
          <p className="text-xs text-muted-foreground">
            All active projects
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On Track</CardTitle>
          <IconCircleCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.onTrackProjects}</div>
          <p className="text-xs text-muted-foreground">
            Ready for work or in progress
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">At Risk</CardTitle>
          <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.atRiskProjects}</div>
          <p className="text-xs text-muted-foreground">
            In review or approaching due date
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          <IconTrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.avgProgress}%</div>
          <p className="text-xs text-muted-foreground">
            Task completion rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
