"use client";

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

function getPriorityVariant(priority?: string) {
  switch ((priority || '').toLowerCase()) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
    default:
      return 'outline';
  }
}

export function TeamMemberDetailsModal({ memberId, open, onOpenChange }: { memberId: string; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const memberDetails = useQuery(api.users.getTeamMemberDetails, { userId: memberId as any });

  if (!memberDetails) return null;

  const { member, currentFocus, upcomingWork, capacityBreakdown } = memberDetails as any;

  const hasCapacity = (capacityBreakdown?.totalHours ?? 0) > 0 || (capacityBreakdown?.utilizationPercentage ?? 0) > 0;
  const hasCurrent = Array.isArray(currentFocus) && currentFocus.length > 0;
  const hasUpcoming = Array.isArray(upcomingWork) && upcomingWork.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={member?.image || member?.avatarUrl} />
              <AvatarFallback>{(member?.name || 'U')?.charAt(0)}</AvatarFallback>
            </Avatar>
            {member?.name || member?.email}
          </DialogTitle>
          <DialogDescription>
            {(member?.jobTitle || '')} {member?.departments?.[0]?.name ? `• ${member?.departments?.[0]?.name}` : ''}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="capacity">
          <TabsList>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
            <TabsTrigger value="current">Current Focus</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Work</TabsTrigger>
          </TabsList>

          <TabsContent value="capacity" className="space-y-4">
            {!hasCapacity ? (
              <div className="text-sm text-muted-foreground p-4">No workload recorded yet.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Workload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{capacityBreakdown.totalHours}h</div>
                    <Progress value={capacityBreakdown.utilizationPercentage} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {capacityBreakdown.utilizationPercentage}% of capacity
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{capacityBreakdown.inProgressHours}h</div>
                    <p className="text-xs text-muted-foreground">{currentFocus.length} tasks</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Upcoming</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{capacityBreakdown.upcomingHours}h</div>
                    <p className="text-xs text-muted-foreground">{upcomingWork.length} tasks</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="current" className="space-y-4">
            {!hasCurrent ? (
              <div className="text-sm text-muted-foreground p-4">No current tasks in progress.</div>
            ) : (
              <div className="space-y-3">
                {currentFocus.map((task: any) => (
                  <Card key={task._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {task.project?.name} • {task.sprint?.name}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                            <Badge variant="outline">{task.hours}h</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {!hasUpcoming ? (
              <div className="text-sm text-muted-foreground p-4">No upcoming work assigned.</div>
            ) : (
              <div className="space-y-3">
                {upcomingWork.map((task: any) => (
                  <Card key={task._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {task.project?.name} • {task.sprint?.name || 'Unassigned'}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                            <Badge variant="outline">{task.hours}h</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
