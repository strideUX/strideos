/**
 * TeamMemberDetailsModal - Detailed view modal for team member information and workload
 *
 * @remarks
 * Displays comprehensive team member details including profile information, capacity breakdown,
 * current focus tasks, and upcoming work assignments. Provides visual workload indicators
 * and task management interface for team resource planning.
 *
 * @example
 * ```tsx
 * <TeamMemberDetailsModal
 *   memberId="user123"
 *   open={isModalOpen}
 *   onOpenChange={setIsModalOpen}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { useQuery } from 'convex/react';
import { IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame } from '@tabler/icons-react';

// 2. Internal imports
import { api } from '@/../convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// 3. Types
interface TeamMemberDetailsModalProps {
  /** ID of the team member to display */
  memberId: string;
  /** Controls modal visibility */
  open: boolean;
  /** Callback for modal open state changes */
  onOpenChange: (open: boolean) => void;
}

interface Task {
  _id: string;
  title: string;
  hours: number;
  status?: string;
  priority?: string;
  project?: { name: string };
  dueDate?: number;
}

interface CapacityBreakdown {
  totalHours: number;
  utilizationPercentage: number;
  inProgressHours: number;
  upcomingHours: number;
}

interface MemberDetails {
  member: {
    name?: string;
    email?: string;
    jobTitle?: string;
    image?: string;
  };
  currentFocus: Task[];
  upcomingWork: Task[];
  capacityBreakdown: CapacityBreakdown;
}

// 4. Component definition
export const TeamMemberDetailsModal = memo(function TeamMemberDetailsModal({ 
  memberId, 
  open, 
  onOpenChange 
}: TeamMemberDetailsModalProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // Convex generics can trigger deep type instantiation in some TS versions; cast to any for this UI-only usage
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore convex query typing too deep here
  const memberDetails = (useQuery as any)((api as any).users.getTeamMemberDetails as any, { userId: memberId as any }) as any;

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const statusLabelMap = useMemo(() => {
    return {
      'todo': 'To Do',
      'in_progress': 'In Progress',
      'review': 'Review',
      'done': 'Completed',
      'blocked': 'Blocked'
    } as const;
  }, []);

  const statusBadgeClassMap = useMemo(() => {
    return {
      'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
      'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'review': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      'done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'blocked': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    } as const;
  }, []);

  const priorityIconMap = useMemo(() => {
    return {
      'low': <IconArrowNarrowDown className="h-4 w-4 text-blue-500" aria-label="Low priority" title="Low" />,
      'medium': <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Medium priority" title="Medium" />,
      'high': <IconArrowNarrowUp className="h-4 w-4 text-orange-500" aria-label="High priority" title="High" />,
      'urgent': <IconFlame className="h-4 w-4 text-red-600" aria-label="Urgent priority" title="Urgent" />
    } as const;
  }, []);

  const member = useMemo(() => {
    return memberDetails?.member;
  }, [memberDetails]);

  const currentFocus = useMemo(() => {
    return memberDetails?.currentFocus || [];
  }, [memberDetails]);

  const upcomingWork = useMemo(() => {
    return memberDetails?.upcomingWork || [];
  }, [memberDetails]);

  const capacityBreakdown = useMemo(() => {
    return memberDetails?.capacityBreakdown || {};
  }, [memberDetails]);

  const hasCapacity = useMemo(() => {
    return (capacityBreakdown?.totalHours ?? 0) > 0 || (capacityBreakdown?.utilizationPercentage ?? 0) > 0;
  }, [capacityBreakdown]);

  const hasCurrent = useMemo(() => {
    return Array.isArray(currentFocus) && currentFocus.length > 0;
  }, [currentFocus]);

  const hasUpcoming = useMemo(() => {
    return Array.isArray(upcomingWork) && upcomingWork.length > 0;
  }, [upcomingWork]);

  const memberName = useMemo(() => {
    return member?.name || member?.email || 'Unknown Member';
  }, [member]);

  const memberInitial = useMemo(() => {
    return memberName.charAt(0);
  }, [memberName]);

  const capacityStats = useMemo(() => [
    {
      title: 'Total Workload',
      value: `${capacityBreakdown.totalHours}h`,
      progress: capacityBreakdown.utilizationPercentage,
      subtitle: `${capacityBreakdown.utilizationPercentage}% of capacity`
    },
    {
      title: 'In Progress',
      value: `${capacityBreakdown.inProgressHours}h`,
      subtitle: `${currentFocus.length} tasks`
    },
    {
      title: 'Upcoming',
      value: `${capacityBreakdown.upcomingHours}h`,
      subtitle: `${upcomingWork.length} tasks`
    }
  ], [capacityBreakdown, currentFocus.length, upcomingWork.length]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const getStatusLabel = useCallback((status?: string): string => {
    const normalizedStatus = (status || '').toLowerCase();
    return statusLabelMap[normalizedStatus as keyof typeof statusLabelMap] || normalizedStatus;
  }, [statusLabelMap]);

  const getStatusBadgeClass = useCallback((status?: string): string => {
    const normalizedStatus = (status || '').toLowerCase();
    return statusBadgeClassMap[normalizedStatus as keyof typeof statusBadgeClassMap] || 'bg-muted text-foreground';
  }, [statusBadgeClassMap]);

  const getPriorityIcon = useCallback((priority?: string) => {
    const normalizedPriority = (priority || '').toLowerCase();
    return priorityIconMap[normalizedPriority as keyof typeof priorityIconMap] || 
           <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Priority" title={String(priority || '')} />;
  }, [priorityIconMap]);

  const formatDueDate = useCallback((dueDate?: number): React.ReactNode => {
    if (!dueDate) return <span className="text-muted-foreground">—</span>;
    return new Date(dueDate).toLocaleDateString();
  }, []);

  const renderTaskRow = useCallback((task: Task, prefix: string) => (
    <TableRow key={`${prefix}-${task._id}`}>
      <TableCell className="font-medium">{task.title}</TableCell>
      <TableCell>
        <Badge className={getStatusBadgeClass(task.status)}>
          {getStatusLabel(task.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center">
          {getPriorityIcon(task.priority)}
        </div>
      </TableCell>
      <TableCell>{task.project?.name || '—'}</TableCell>
      <TableCell>{task.hours || 0}h</TableCell>
      <TableCell className="text-right">
        {formatDueDate(task.dueDate)}
      </TableCell>
    </TableRow>
  ), [getStatusBadgeClass, getStatusLabel, getPriorityIcon, formatDueDate]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!memberDetails) return null;

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[85vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={member?.image || undefined} />
              <AvatarFallback>{memberInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <DialogHeader className="text-left p-0">
                  <DialogTitle className="text-xl font-semibold leading-tight">
                    {memberName}
                  </DialogTitle>
                  <DialogDescription>{member?.jobTitle || ''}</DialogDescription>
                </DialogHeader>
              </div>
            </div>
          </div>

          {/* Stats summary (compact) */}
          {hasCapacity && (
            <div className="grid gap-4 sm:grid-cols-3">
              {capacityStats.map((stat, index) => (
                <Card key={index} className="py-1.5 gap-1">
                  <CardHeader className="py-1.5 pb-0">
                    <CardTitle className="text-[12px] font-semibold">{stat.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-1">
                    <div className="text-2xl md:text-3xl font-bold leading-tight">
                      {stat.value}
                    </div>
                    {stat.progress !== undefined && (
                      <Progress value={stat.progress} className="h-2 mt-1" />
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  </CardContent>
                </Card>
              ))}
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
                    currentFocus.map((task: Task) => renderTaskRow(task, 'cur'))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No current tasks in progress.
                      </TableCell>
                    </TableRow>
                  )}

                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={6} className="text-xs font-semibold">Upcoming</TableCell>
                  </TableRow>
                  {hasUpcoming ? (
                    upcomingWork.map((task: Task) => renderTaskRow(task, 'up'))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No upcoming work assigned.
                      </TableCell>
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
});
