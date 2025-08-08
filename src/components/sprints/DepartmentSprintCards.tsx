"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DepartmentAggregate {
  department: { _id: string; name: string; workstreamCount: number };
  planningSprints: number;
  activeSprints: number;
  completedSprints: number;
  totalCapacity: number; // hours
  totalCommitted: number; // hours
  aggregatedVelocity: number; // hours
}

export function DepartmentSprintCards({ departments }: { departments?: DepartmentAggregate[] | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {(departments ?? []).map((dept) => {
        const utilization = dept.totalCapacity > 0 ? (dept.totalCommitted / dept.totalCapacity) * 100 : 0;
        return (
          <Card key={dept.department._id}>
            <CardHeader>
              <CardTitle className="text-lg">{dept.department.name}</CardTitle>
              <CardDescription>
                {dept.department.workstreamCount} workstreams • {dept.activeSprints} active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Capacity</span>
                  <span className="font-medium">{dept.totalCapacity}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Committed</span>
                  <span className="font-medium">{dept.totalCommitted}h</span>
                </div>
                <Progress value={utilization} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{dept.planningSprints} planning</span>
                  <span>{dept.completedSprints} completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


