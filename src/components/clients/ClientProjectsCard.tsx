import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ProjectItem {
  _id: string;
  title: string;
  status: string;
  progress?: number;
  targetDueDate?: number;
}

interface ClientProjectsCardProps {
  title: string;
  description?: string;
  projects: ProjectItem[] | undefined;
  emptyMessage: string;
  onViewAll?: () => void;
  showStatus?: boolean;
}

export function ClientProjectsCard({ title, description, projects, emptyMessage, onViewAll, showStatus }: ClientProjectsCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onViewAll && (
            <Button variant="outline" size="sm" onClick={onViewAll}>View All</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects === undefined && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {projects && projects.length === 0 && (
          <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        )}
        {projects && projects.length > 0 && (
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p._id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.title}</div>
                  {showStatus && (
                    <Badge variant="secondary">{p.status}</Badge>
                  )}
                </div>
                {p.progress !== undefined && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} className="h-2 mt-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
