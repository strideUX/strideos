"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SprintOverviewTab({ sprint }: { sprint: any }) {
  const committed = sprint.tasks?.reduce((sum: number, t: any) => sum + (t.estimatedHours ?? 0), 0) ?? 0;
  const completed = sprint.tasks?.filter((t: any) => t.status === "done").reduce((sum: number, t: any) => sum + (t.actualHours ?? t.estimatedHours ?? 0), 0) ?? 0;
  const capacity = sprint.totalCapacity ?? 0;
  const utilization = capacity ? Math.min(100, (committed / capacity) * 100) : 0;
  const progress = committed ? Math.round((completed / committed) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground">Timeline</div>
          <div className="font-medium">{formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground">Capacity</div>
          <div className="font-medium">{committed}/{capacity} hours</div>
          <Progress value={utilization} className="mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground">Progress</div>
          <div className="font-medium">{progress}%</div>
          <Progress value={progress} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}


