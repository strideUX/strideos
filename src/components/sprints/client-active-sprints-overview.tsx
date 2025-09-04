/**
 * ClientActiveSprintsOverview - Client-scoped overview of active sprints by department
 *
 * @remarks
 * Displays active sprints for a specific client, grouped by department.
 * Shows sprint progress, task counts, and capacity utilization with navigation to sprint details.
 * Integrates with sprint management workflow for client-level sprint monitoring.
 *
 * @example
 * ```tsx
 * <ClientActiveSprintsOverview clientId="client123" />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// 3. Types
type Sprint = {
  _id: Id<'sprints'>;
  name: string;
  status: string;
  progressPercentage?: number;
  completedTasks?: number;
  totalTasks?: number;
  committedHours?: number;
  capacityHours?: number;
  totalCapacity?: number;
  startDate?: number;
  endDate?: number;
  department?: { _id: Id<'departments'>; name: string } | null;
  client?: { _id: Id<'clients'>; name: string } | null;
};

interface ClientActiveSprintsOverviewProps {
  /** Client ID to scope the sprint overview */
  clientId: Id<'clients'>;
}

// 4. Component definition
export const ClientActiveSprintsOverview = memo(function ClientActiveSprintsOverview({ 
  clientId 
}: ClientActiveSprintsOverviewProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const router = useRouter();
  const sprints = useQuery(api.sprints.getSprintsWithDetails, { 
    clientId, 
    status: 'active' 
  }) as unknown as Sprint[] | undefined;

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const grouped = useMemo(() => {
    const map = new Map<string, Sprint[]>();
    for (const s of (sprints ?? [])) {
      const key = s.department?.name || 'General';
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sprints]);

  const sprintCount = useMemo(() => {
    return sprints?.length ?? 0;
  }, [sprints]);

  const isLoading = useMemo(() => {
    return sprints === undefined;
  }, [sprints]);

  const hasNoSprints = useMemo(() => {
    return sprintCount === 0;
  }, [sprintCount]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const getStatusBadgeClass = useCallback((status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-transparent';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-transparent';
      case 'complete':
        return 'bg-green-100 text-green-800 border-transparent';
      default:
        return 'bg-gray-100 text-gray-800 border-transparent';
    }
  }, []);

  const formatHoursAsDays = useCallback((h?: number): string => {
    const hours = Math.max(0, Math.round((h ?? 0) * 10) / 10);
    const d = hours / 8;
    const roundedHalf = Math.round(d * 2) / 2;
    return `${roundedHalf}d`;
  }, []);

  const handleSprintClick = useCallback((sprintId: Id<'sprints'>) => {
    router.push(`/sprint/${sprintId}`);
  }, [router]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sprints Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Loading…</div>
        </CardContent>
      </Card>
    );
  }

  if (hasNoSprints) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sprints Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No active sprints for this client.
          </div>
        </CardContent>
      </Card>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-4">
      {grouped.map(([deptName, list]) => (
        <Card key={deptName} className="gap-2">
          <CardHeader className="py-3">
            <CardTitle className="text-md font-semibold flex items-center justify-between">
              <span>{deptName}</span>
              <Badge className="bg-muted text-foreground border-transparent">
                {list.length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((s) => (
                <button
                  key={String(s._id)}
                  onClick={() => handleSprintClick(s._id)}
                  className="text-left rounded-md border p-3 hover:shadow-sm hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{s.name}</div>
                    <Badge className={getStatusBadgeClass(s.status)}>{s.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={s.progressPercentage ?? 0} className="w-28" />
                    <span className="text-sm text-muted-foreground">
                      {Math.round(s.progressPercentage ?? 0)}%
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                    <span>Tasks {(s.completedTasks ?? 0)}/{s.totalTasks ?? 0}</span>
                    <span>
                      {formatHoursAsDays(s.committedHours ?? 0)}/{formatHoursAsDays(s.capacityHours ?? s.totalCapacity ?? 0)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});


