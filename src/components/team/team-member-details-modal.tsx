"use client";

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Removed tabs in favor of a single, richer layout
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame } from '@tabler/icons-react';

function statusLabel(status?: string): string {
  switch ((status || '').toLowerCase()) {
    case 'todo':
      return 'To Do';
    case 'in_progress':
      return 'In Progress';
    case 'review':
      return 'Review';
    case 'done':
      return 'Completed';
    case 'blocked':
      return 'Blocked';
    default:
      return (status || '').toString();
  }
}

function statusBadgeClass(status?: string): string {
  switch ((status || '').toLowerCase()) {
    case 'todo':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'review':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
    case 'done':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'blocked':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    default:
      return 'bg-muted text-foreground';
  }
}

function getPriorityIcon(priority?: string) {
  switch ((priority || '').toLowerCase()) {
    case 'low':
      return <IconArrowNarrowDown className="h-4 w-4 text-blue-500" aria-label="Low priority" title="Low" />;
    case 'medium':
      return <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Medium priority" title="Medium" />;
    case 'high':
      return <IconArrowNarrowUp className="h-4 w-4 text-orange-500" aria-label="High priority" title="High" />;
    case 'urgent':
      return <IconFlame className="h-4 w-4 text-red-600" aria-label="Urgent priority" title="Urgent" />;
    default:
      return <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Priority" title={String(priority || '')} />;
  }
}

import { Id } from '@/convex/_generated/dataModel';

export function TeamMemberDetailsModal({ memberId, open, onOpenChange }: { memberId: string; open: boolean; onOpenChange: (open: boolean) => void; }) {
  // Convex generics can trigger deep type instantiation in some TS versions; cast to any for this UI-only usage
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore convex query typing too deep here
  const memberDetails = (useQuery as any)((api as any).users.getTeamMemberDetails as any, { userId: memberId as any }) as any;

  if (!memberDetails) return null;

  const { member, currentFocus, upcomingWork, capacityBreakdown } = memberDetails;

  const hasCapacity = (capacityBreakdown?.totalHours ?? 0) > 0 || (capacityBreakdown?.utilizationPercentage ?? 0) > 0;
  const hasCurrent = Array.isArray(currentFocus) && currentFocus.length > 0;
  const hasUpcoming = Array.isArray(upcomingWork) && upcomingWork.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[85vh] overflow-y-auto">
        <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={member?.image || undefined} />
            <AvatarFallback>{(member?.name || 'U')?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <DialogHeader className="text-left p-0">
                <DialogTitle className="text-xl font-semibold leading-tight">{member?.name || member?.email}</DialogTitle>
                <DialogDescription>{member?.jobTitle || ''}</DialogDescription>
              </DialogHeader>
              {/* Removed top-right capacity bar */}
            </div>
          </div>
        </div>

        {/* Stats summary (compact) */}
        {hasCapacity && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="py-1.5 gap-1">
              <CardHeader className="py-1.5 pb-0">
                <CardTitle className="text-[12px] font-semibold">Total Workload</CardTitle>
              </CardHeader>
              <CardContent className="py-1">
                <div className="text-2xl md:text-3xl font-bold leading-tight">{capacityBreakdown.totalHours}h</div>
                <Progress value={capacityBreakdown.utilizationPercentage} className="h-2 mt-1" />
                <p className="text-[11px] text-muted-foreground mt-1">{capacityBreakdown.utilizationPercentage}% of capacity</p>
              </CardContent>
            </Card>
            <Card className="py-1.5 gap-1">
              <CardHeader className="py-1.5 pb-0">
                <CardTitle className="text-[12px] font-semibold">In Progress</CardTitle>
              </CardHeader>
              <CardContent className="py-1">
                <div className="text-2xl md:text-3xl font-bold leading-tight">{capacityBreakdown.inProgressHours}h</div>
                <p className="text-[11px] text-muted-foreground">{currentFocus.length} tasks</p>
              </CardContent>
            </Card>
            <Card className="py-1.5 gap-1">
              <CardHeader className="py-1.5 pb-0">
                <CardTitle className="text-[12px] font-semibold">Upcoming</CardTitle>
              </CardHeader>
              <CardContent className="py-1">
                <div className="text-2xl md:text-3xl font-bold leading-tight">{capacityBreakdown.upcomingHours}h</div>
                <p className="text-[11px] text-muted-foreground">{upcomingWork.length} tasks</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Single data table with grouped sections */}
        <div className="mt-2 text-sm">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Task</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-center">Priority</TableHead>
                <TableHead className="font-bold">Project</TableHead>
                <TableHead className="font-bold">Size</TableHead>
                <TableHead className="text-right font-bold">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableCell colSpan={6} className="text-xs font-semibold">Current Focus</TableCell>
              </TableRow>
              {hasCurrent ? (
                currentFocus.map((task: { _id: string; title: string; hours: number; status?: string; priority?: string; project?: { name: string }; dueDate?: number }) => (
                  <TableRow key={`cur-${task._id}`}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(String(task.status))}>{statusLabel(String(task.status))}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">{getPriorityIcon(String(task.priority))}</div>
                    </TableCell>
                    <TableCell>{task.project?.name || '—'}</TableCell>
                    <TableCell>{task.hours || 0}h</TableCell>
                    <TableCell className="text-right">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">No current tasks in progress.</TableCell>
                </TableRow>
              )}

              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableCell colSpan={6} className="text-xs font-semibold">Upcoming</TableCell>
              </TableRow>
              {hasUpcoming ? (
                upcomingWork.map((task: { _id: string; title: string; hours: number; status?: string; priority?: string; project?: { name: string }; dueDate?: number }) => (
                  <TableRow key={`up-${task._id}`}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(String(task.status))}>{statusLabel(String(task.status))}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">{getPriorityIcon(String(task.priority))}</div>
                    </TableCell>
                    <TableCell>{task.project?.name || '—'}</TableCell>
                    <TableCell>{task.hours || 0}h</TableCell>
                    <TableCell className="text-right">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">No upcoming work assigned.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
