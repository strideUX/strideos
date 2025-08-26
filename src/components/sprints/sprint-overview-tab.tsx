"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Id } from "@/convex/_generated/dataModel";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface SprintTask {
  _id: Id<'tasks'>;
  status: string;
  estimatedHours?: number;
  actualHours?: number;
}

interface SprintData {
  _id: Id<'sprints'>;
  startDate: number;
  endDate: number;
  totalCapacity?: number;
  tasks?: SprintTask[];
}

export function SprintOverviewTab({ sprint }: { SprintData }) {
  const committed = sprint.tasks?.reduce((sum: number, t: SprintTask) => sum + (t.estimatedHours ?? 0), 0) ?? 0;
  const completed = sprint.tasks?.filter((t: SprintTask) => t.status === "done").reduce((sum: number, t: SprintTask) => sum + (t.actualHours ?? t.estimatedHours ?? 0), 0) ?? 0;
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


