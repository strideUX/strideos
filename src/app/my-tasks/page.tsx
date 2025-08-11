'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconSearch, IconCalendar, IconUser, IconFolder, IconList, IconCheck, IconPlayerPlay, IconTrash } from "@tabler/icons-react"

export default function MyTasksPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State for filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'tasks' | 'personal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time Convex queries - must be called before any early returns
  const activeTasks = useQuery(api.tasks.getMyActiveTasks);
  const completedTasks = useQuery(api.tasks.getMyCompletedTasks);

  // Mutations for interacting with tasks
  const reorderTasks = useMutation(api.tasks.reorderMyTasks);
  const createPersonalTodo = useMutation(api.tasks.createPersonalTodo);

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render page if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Redirecting to sign-in...</div>
      </div>
    );
  }

  // Show loading state while user data is being fetched
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  // Filter tasks based on search query and filters
  const filterTasks = (tasks: any[]) => {
    let filtered = tasks;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'tasks') {
        filtered = filtered.filter(task => task.taskType !== 'personal');
      } else if (typeFilter === 'personal') {
        filtered = filtered.filter(task => task.taskType === 'personal');
      }
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredActiveTasks = filterTasks(activeTasks || []);
  const filteredCompletedTasks = filterTasks(completedTasks || []);

  // Utility functions
  const formatDueDate = (timestamp?: number) => {
    if (!timestamp) return 'No due date';
    return new Date(timestamp).toLocaleDateString();
  };

  const handleStatusUpdate = async (taskId: Id<"tasks">, newStatus: string) => {
    try {
      await reorderTasks({
        taskIds: [taskId],
        targetStatus: newStatus as any
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleReorder = async (taskIds: Id<"tasks">[]) => {
    try {
      await reorderTasks({ taskIds });
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "todo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "archived":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white dark:bg-red-600";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTaskTypeIcon = (taskType?: string) => {
    switch (taskType) {
      case "deliverable":
        return <IconList className="h-4 w-4" />;
      case "bug":
        return <IconCheck className="h-4 w-4" />;
      case "feedback":
        return <IconUser className="h-4 w-4" />;
      case "personal":
        return <IconFolder className="h-4 w-4" />;
      default:
        return <IconList className="h-4 w-4" />;
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
                    <p className="text-muted-foreground">
                      Manage your assigned tasks and personal todos
                    </p>
                  </div>
                  <Button>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Management</CardTitle>
                    <CardDescription>Search and filter your tasks and todos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Filters and Search */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search tasks and todos..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'todo' | 'in_progress' | 'done')}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="todo">Todo</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={typeFilter} onValueChange={(value: 'all' | 'tasks' | 'personal') => setTypeFilter(value)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="tasks">Tasks Only</SelectItem>
                          <SelectItem value="personal">Personal Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tasks Grid */}
                    <div className="grid gap-4">
                      {/* Loading State */}
                      {activeTasks === undefined && (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-muted-foreground">Loading your tasks...</div>
                        </div>
                      )}

                      {/* Empty State */}
                      {activeTasks !== undefined && filteredActiveTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                          <IconFolder className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No tasks found</h3>
                          <p className="text-sm text-muted-foreground text-center max-w-md">
                            {searchQuery ? 'Try adjusting your search or filters.' : 'Your tasks will appear here when you have work assigned.'}
                          </p>
                        </div>
                      )}

                      {/* Tasks List */}
                      {filteredActiveTasks.map((task) => (
                        <Card 
                          key={task._id} 
                          className="hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                  {getTaskTypeIcon(task.taskType)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium">{task.title}</h3>
                                    <Badge className={getStatusColor(task.status)} variant="secondary">
                                      {task.status.replace('_', ' ')}
                                    </Badge>
                                    <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                      {task.priority}
                                    </Badge>
                                    {task.taskType === 'personal' && (
                                      <Badge variant="outline" className="text-xs">
                                        Personal
                                      </Badge>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <IconCalendar className="h-3 w-3" />
                                      Due: {formatDueDate(task.dueDate)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <IconUser className="h-3 w-3" />
                                      {task.taskType === 'personal' ? 'Personal task' : 'Assigned task'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {task.status === "todo" && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Start working"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusUpdate(task._id, 'in_progress');
                                    }}
                                  >
                                    <IconPlayerPlay className="h-4 w-4" />
                                  </Button>
                                )}
                                {task.status === "in_progress" && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Mark as done"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusUpdate(task._id, 'done');
                                    }}
                                  >
                                    <IconCheck className="h-4 w-4" />
                                  </Button>
                                )}
                                {task.taskType === 'personal' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Delete personal task"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Implement delete personal task
                                      console.log('Delete task:', task._id);
                                    }}
                                  >
                                    <IconTrash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 