'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { IconCalendar, IconUsers, IconTarget, IconCheck, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function SprintBoardPage() {
  const { user } = useAuth();
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  // Queries
  const sprints = useQuery(api.sprints.getSprints, {});
  const selectedSprintData = useQuery(
    api.sprints.getSprint,
    selectedSprint ? { id: selectedSprint } : 'skip'
  );

  // Mutations
  const updateTask = useMutation(api.tasks.updateTask);

  // Role-based permissions
  const canManageSprints = user?.role === 'admin' || user?.role === 'pm';

  if (!user) {
    return <div>Loading...</div>;
  }

  if (!canManageSprints) {
    return (
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <SiteHeader user={user} />
          <div className="flex flex-col gap-6 p-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                  <p className="text-gray-600">Only Project Managers and Administrators can access sprint boards.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask({
        id: taskId,
        status: newStatus as any,
      });
      toast.success('Task status updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task status');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 border-gray-300';
      case 'in_progress': return 'bg-blue-100 border-blue-300';
      case 'review': return 'bg-yellow-100 border-yellow-300';
      case 'done': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <IconTarget className="h-4 w-4" />;
      case 'in_progress': return <IconClock className="h-4 w-4" />;
      case 'review': return <IconAlertTriangle className="h-4 w-4" />;
      case 'done': return <IconCheck className="h-4 w-4" />;
      default: return <IconTarget className="h-4 w-4" />;
    }
  };

  const statusColumns = [
    { key: 'todo', label: 'To Do', color: 'bg-gray-50' },
    { key: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
    { key: 'review', label: 'Review', color: 'bg-yellow-50' },
    { key: 'done', label: 'Done', color: 'bg-green-50' },
  ];

  const groupTasksByStatus = (tasks: any[]) => {
    const grouped: { [key: string]: any[] } = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    tasks?.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  };

  const groupedTasks = groupTasksByStatus(selectedSprintData?.tasks || []);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sprint Board</h1>
              <p className="text-gray-600">Kanban-style task management for sprint execution</p>
            </div>
          </div>

          {/* Sprint Selection */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Sprint</label>
                <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a sprint to view" />
                  </SelectTrigger>
                  <SelectContent>
                    {sprints?.map((sprint) => (
                      <SelectItem key={sprint._id} value={sprint._id}>
                        {sprint.name} ({formatDate(sprint.startDate)} - {formatDate(sprint.endDate)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sprint Info */}
          {selectedSprintData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="h-5 w-5" />
                  {selectedSprintData.name}
                </CardTitle>
                <CardDescription>
                  {formatDate(selectedSprintData.startDate)} - {formatDate(selectedSprintData.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedSprintData.committedPoints}
                    </div>
                    <div className="text-sm text-blue-800">Committed Points</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSprintData.totalCapacity}
                    </div>
                    <div className="text-sm text-green-800">Total Capacity</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedSprintData.tasks?.length || 0}
                    </div>
                    <div className="text-sm text-purple-800">Total Tasks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kanban Board */}
          {selectedSprintData && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {statusColumns.map((column) => (
                <Card key={column.key} className={column.color}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {getStatusIcon(column.key)}
                      {column.label}
                      <Badge variant="secondary" className="ml-auto">
                        {groupedTasks[column.key]?.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedTasks[column.key]?.map((task) => (
                      <div 
                        key={task._id} 
                        className={`p-3 border rounded-lg bg-white shadow-sm ${getStatusColor(task.status)}`}
                      >
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityBadgeVariant(task.priority)}>
                              {task.priority}
                            </Badge>
                            {task.storyPoints && (
                              <Badge variant="outline">{task.storyPoints} pts</Badge>
                            )}
                          </div>
                          {task.assignee && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <IconUsers className="h-3 w-3" />
                              {task.assignee.name}
                            </div>
                          )}
                          <div className="pt-2">
                            <Select 
                              value={task.status} 
                              onValueChange={(value) => handleStatusChange(task._id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="review">Review</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!groupedTasks[column.key] || groupedTasks[column.key].length === 0) && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No tasks
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Instructions */}
          {!selectedSprint && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Get Started</h2>
                  <p className="text-gray-600">Select a sprint to view the kanban board and manage task status.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 