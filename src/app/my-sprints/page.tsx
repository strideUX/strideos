'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconCalendar, IconUsers, IconTarget, IconCheck, IconClock, IconTrendingUp } from '@tabler/icons-react';

export default function MySprintsPage() {
  const { user } = useAuth();
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  // Queries
  const mySprints = useQuery(api.sprints.getSprints, {});
  const selectedSprintData = useQuery(
    api.sprints.getSprint,
    selectedSprint ? { id: selectedSprint } : 'skip'
  );

  // Filter sprints to only show those with user's assigned tasks
  const sprintsWithMyTasks = mySprints?.filter(sprint => {
    // This would need to be enhanced with a proper query to get sprints with user's tasks
    // For now, we'll show all sprints the user has access to
    return true;
  }) || [];

  if (!user) {
    return <div>Loading...</div>;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'planning': return 'secondary';
      case 'active': return 'default';
      case 'review': return 'outline';
      case 'complete': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <IconTarget className="h-4 w-4" />;
      case 'in_progress': return <IconClock className="h-4 w-4" />;
      case 'review': return <IconCheck className="h-4 w-4" />;
      case 'done': return <IconCheck className="h-4 w-4" />;
      default: return <IconTarget className="h-4 w-4" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'text-gray-600';
      case 'in_progress': return 'text-blue-600';
      case 'review': return 'text-yellow-600';
      case 'done': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Filter tasks to only show user's assigned tasks
  const myTasks = selectedSprintData?.tasks?.filter(task => 
    task.assigneeId === user._id
  ) || [];

  const otherTasks = selectedSprintData?.tasks?.filter(task => 
    task.assigneeId !== user._id
  ) || [];

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Sprints</h1>
              <p className="text-gray-600">View sprints containing your assigned tasks</p>
            </div>
          </div>

          {/* Sprint List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sprintsWithMyTasks.map((sprint) => (
              <Card 
                key={sprint._id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedSprint === sprint._id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedSprint(sprint._id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCalendar className="h-5 w-5" />
                    {sprint.name}
                  </CardTitle>
                  <CardDescription>
                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={getStatusBadgeVariant(sprint.status)}>
                        {sprint.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Capacity</span>
                      <span className="text-sm font-medium">
                        {sprint.committedPoints} / {sprint.totalCapacity} pts
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${sprint.totalCapacity > 0 
                            ? Math.min((sprint.committedPoints / sprint.totalCapacity) * 100, 100)
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Sprint Detail */}
          {selectedSprintData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="h-5 w-5" />
                  {selectedSprintData.name} - Sprint Details
                </CardTitle>
                <CardDescription>
                  {formatDate(selectedSprintData.startDate)} - {formatDate(selectedSprintData.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sprint Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedSprintData.committedPoints}
                    </div>
                    <div className="text-sm text-blue-800">Committed Points</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSprintData.totalCapacity}
                    </div>
                    <div className="text-sm text-green-800">Total Capacity</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedSprintData.tasks?.length || 0}
                    </div>
                    <div className="text-sm text-purple-800">Total Tasks</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {myTasks.length}
                    </div>
                    <div className="text-sm text-orange-800">My Tasks</div>
                  </div>
                </div>

                {/* My Tasks */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    My Assigned Tasks ({myTasks.length})
                  </h3>
                  <div className="space-y-3">
                    {myTasks.map((task) => (
                      <div key={task._id} className="p-4 border rounded-lg bg-blue-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={getTaskStatusColor(task.status)}>
                                {getTaskStatusIcon(task.status)}
                              </span>
                              <h4 className="font-medium">{task.title}</h4>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityBadgeVariant(task.priority)}>
                                {task.priority}
                              </Badge>
                              {task.storyPoints && (
                                <Badge variant="outline">{task.storyPoints} pts</Badge>
                              )}
                              <Badge variant="secondary">{task.status}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {myTasks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No tasks assigned to you in this sprint
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Tasks (Read-only) */}
                {otherTasks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <IconTrendingUp className="h-5 w-5" />
                      Team Tasks ({otherTasks.length})
                    </h3>
                    <div className="space-y-3">
                      {otherTasks.map((task) => (
                        <div key={task._id} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={getTaskStatusColor(task.status)}>
                                  {getTaskStatusIcon(task.status)}
                                </span>
                                <h4 className="font-medium">{task.title}</h4>
                              </div>
                              {task.description && (
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant={getPriorityBadgeVariant(task.priority)}>
                                  {task.priority}
                                </Badge>
                                {task.storyPoints && (
                                  <Badge variant="outline">{task.storyPoints} pts</Badge>
                                )}
                                <Badge variant="secondary">{task.status}</Badge>
                                {task.assigneeId && (
                                  <Badge variant="outline">Assigned</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sprint Goals */}
                {selectedSprintData.goals && selectedSprintData.goals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Sprint Goals</h3>
                    <div className="space-y-2">
                      {selectedSprintData.goals.map((goal, index) => (
                        <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm">{goal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {sprintsWithMyTasks.length === 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">No Sprints Found</h2>
                  <p className="text-gray-600">You don't have any tasks assigned to sprints yet.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 