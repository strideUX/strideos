/**
 * DepartmentSprintCards - Department-level sprint overview and capacity cards
 *
 * @remarks
 * Displays sprint statistics and capacity utilization for each department.
 * Shows planning, active, and completed sprints with capacity and commitment metrics.
 * Integrates with sprint management workflow for department-level planning and monitoring.
 *
 * @example
 * ```tsx
 * <DepartmentSprintCards departments={departmentData} />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// 3. Types
interface DepartmentAggregate {
  department: { 
    _id: string; 
    name: string; 
    workstreamCount: number; 
  };
  planningSprints: number;
  activeSprints: number;
  completedSprints: number;
  totalCapacity: number; // hours
  totalCommitted: number; // hours
  aggregatedVelocity: number; // hours
}

interface DepartmentSprintCardsProps {
  /** List of department aggregates with sprint data */
  departments?: DepartmentAggregate[] | null;
}

// 4. Component definition
export const DepartmentSprintCards = memo(function DepartmentSprintCards({ 
  departments 
}: DepartmentSprintCardsProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const safeDepartments = useMemo(() => {
    return departments ?? [];
  }, [departments]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const calculateUtilization = useCallback((totalCapacity: number, totalCommitted: number): number => {
    return totalCapacity > 0 ? (totalCommitted / totalCapacity) * 100 : 0;
  }, []);

  const formatHours = useCallback((hours: number): string => {
    return `${hours}h`;
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {safeDepartments.map((dept) => {
        const utilization = calculateUtilization(dept.totalCapacity, dept.totalCommitted);
        
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
                  <span className="font-medium">{formatHours(dept.totalCapacity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Committed</span>
                  <span className="font-medium">{formatHours(dept.totalCommitted)}</span>
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
});


