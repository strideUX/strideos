import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SprintItem {
  _id: string;
  name: string;
  status: string;
  departmentId: string;
  department?: { _id: string; name: string };
}

interface ClientSprintsCardProps {
  title: string;
  description?: string;
  sprints: SprintItem[] | undefined;
  emptyMessage: string;
  onViewAll?: () => void;
  showDepartment?: boolean;
}

export function ClientSprintsCard({ title, description, sprints, emptyMessage, onViewAll, showDepartment }: ClientSprintsCardProps) {
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
        {sprints === undefined && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {sprints && sprints.length === 0 && (
          <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        )}
        {sprints && sprints.length > 0 && (
          <div className="space-y-3">
            {sprints.map((s) => (
              <div key={s._id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.name}</div>
                  <Badge variant="secondary">{s.status}</Badge>
                </div>
                {showDepartment && s.department && (
                  <div className="text-xs text-muted-foreground mt-1">{s.department.name}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
