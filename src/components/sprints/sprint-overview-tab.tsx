/**
 * SprintOverviewTab - Overview display component for sprint statistics and progress
 *
 * @remarks
 * Displays key sprint metrics including timeline, capacity utilization, and progress.
 * Calculates committed hours, completed work, and capacity utilization percentages.
 * Integrates with sprint management workflow for capacity planning and progress tracking.
 *
 * @example
 * ```tsx
 * <SprintOverviewTab sprint={sprintData} />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// 3. Types
interface SprintTask {
  estimatedHours?: number;
  actualHours?: number;
  status: string;
}

interface SprintData {
  startDate: number;
  endDate: number;
  totalCapacity?: number;
  tasks?: SprintTask[];
}

interface SprintOverviewTabProps {
  /** Sprint data to display */
  sprint: SprintData;
}

// 4. Component definition
export const SprintOverviewTab = memo(function SprintOverviewTab({ 
  sprint 
}: SprintOverviewTabProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const committed = useMemo(() => {
    return sprint.tasks?.reduce((sum: number, t: SprintTask) => 
      sum + (t.estimatedHours ?? 0), 0) ?? 0;
  }, [sprint.tasks]);

  const completed = useMemo(() => {
    return sprint.tasks?.filter((t: SprintTask) => 
      t.status === "done").reduce((sum: number, t: SprintTask) => 
        sum + (t.actualHours ?? t.estimatedHours ?? 0), 0) ?? 0;
  }, [sprint.tasks]);

  const capacity = useMemo(() => {
    return sprint.totalCapacity ?? 0;
  }, [sprint.totalCapacity]);

  const utilization = useMemo(() => {
    return capacity ? Math.min(100, (committed / capacity) * 100) : 0;
  }, [capacity, committed]);

  const progress = useMemo(() => {
    return committed ? Math.round((completed / committed) * 100) : 0;
  }, [committed, completed]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const formatDate = useCallback((timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground">Timeline</div>
          <div className="font-medium">
            {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
          </div>
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
});


