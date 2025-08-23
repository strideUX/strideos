'use client';

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

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

function getStatusBadgeClass(status: string): string {
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
}

function formatHoursAsDays(h?: number): string {
  const hours = Math.max(0, Math.round((h ?? 0) * 10) / 10);
  const d = hours / 8;
  const roundedHalf = Math.round(d * 2) / 2;
  return `${roundedHalf}d`;
}

export function ClientActiveSprintsOverview({ clientId }: { clientId: Id<'clients'> }) {
  const router = useRouter();
  const sprints = useQuery(api.sprints.getSprintsWithDetails, { clientId, status: 'active' }) as unknown as Sprint[] | undefined;

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

  if (sprints === undefined) {
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

  if ((sprints?.length ?? 0) === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sprints Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">No active sprints for this client.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([deptName, list]) => (
        <Card key={deptName} className="gap-2">
          <CardHeader className="py-3">
            <CardTitle className="text-md font-semibold flex items-center justify-between">
              <span>{deptName}</span>
              <Badge className="bg-muted text-foreground border-transparent">{list.length} active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((s) => (
                <button
                  key={String(s._id)}
                  onClick={() => router.push(`/sprint/${s._id}`)}
                  className="text-left rounded-md border p-3 hover:shadow-sm hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{s.name}</div>
                    <Badge className={getStatusBadgeClass(s.status)}>{s.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={s.progressPercentage ?? 0} className="w-28" />
                    <span className="text-sm text-muted-foreground">{Math.round(s.progressPercentage ?? 0)}%</span>
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
}


