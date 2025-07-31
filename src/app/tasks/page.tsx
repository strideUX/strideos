'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useState, useMemo } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  IconPlus, 
  IconSearch, 
  IconChecks, 
  IconClock, 
  IconAlertCircle,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUser,
  IconCalendar,
  IconFlag,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { TaskFormDialog } from '@/components/admin/TaskFormDialog';

// Types
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface Task {
  _id: Id<'tasks'>;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  size?: TaskSize;
  storyPoints?: number;
  assignee?: { _id: Id<'users'>; name?: string; email?: string };
  reporter?: { _id: Id<'users'>; name?: string; email?: string };
  client?: { _id: Id<'clients'>; name: string };
  department?: { _id: Id<'departments'>; name: string };
  project?: { _id: Id<'projects'>; title: string };
  sprint?: { _id: Id<'sprints'>; name: string };
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
}

// Helper functions
const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'todo': return 'bg-gray-100 text-gray-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'review': return 'bg-yellow-100 text-yellow-800';
    case 'done': return 'bg-green-100 text-green-800';
    case 'archived': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getSizeLabel = (size?: TaskSize): string => {
  switch (size) {
    case 'xs': return 'XS (1)';
    case 'sm': return 'SM (2)';
    case 'md': return 'MD (3)';
    case 'lg': return 'LG (5)';
    case 'xl': return 'XL (8)';
    default: return 'Not sized';
  }
};

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString();
};

const isOverdue = (dueDate?: number): boolean => {
  return dueDate ? dueDate < Date.now() : false;
};

export default function TasksPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Queries
  const tasks = useQuery(api.tasks.getTasks, {}) as Task[] | undefined;
  const taskStats = useQuery(api.tasks.getTaskStats, {});
  const clients = useQuery(api.clients.listClients, {});
  const users = useQuery(api.users.listUsers, {});

  // Mutations
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !task.title.toLowerCase().includes(searchLower) &&
          !task.description?.toLowerCase().includes(searchLower) &&
          !task.assignee?.name?.toLowerCase().includes(searchLower) &&
          !task.client?.name.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && task.assignee) {
          return false;
        }
        if (assigneeFilter !== 'unassigned' && task.assignee?._id !== assigneeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter]);

  // Handle task status update
  const handleStatusUpdate = async (taskId: Id<'tasks'>, newStatus: TaskStatus) => {
    try {
      await updateTask({ id: taskId, status: newStatus });
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update task status');
      console.error(error);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: Id<'tasks'>) => {
    try {
      await deleteTask({ id: taskId });
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
      console.error(error);
    }
  };

  // Check permissions
  const canCreateTasks = user?.role === 'admin' || user?.role === 'pm';
  const canDeleteTasks = user?.role === 'admin' || user?.role === 'pm';

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
              <p className="text-muted-foreground">
                Manage and track tasks across projects and sprints
              </p>
            </div>
            {canCreateTasks && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            )}
          </div>

          {/* Statistics Cards */}
          {taskStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <IconChecks className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{taskStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {taskStats.byStatus.done} completed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{taskStats.byStatus.in_progress}</div>
                  <p className="text-xs text-muted-foreground">
                    {taskStats.byStatus.review} in review
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Story Points</CardTitle>
                  <IconFlag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{taskStats.totalStoryPoints}</div>
                  <p className="text-xs text-muted-foreground">
                    {taskStats.completedStoryPoints} completed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{taskStats.overdueTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    Need attention
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter and search tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks, assignees, or clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks ({filteredTasks?.length ?? 0})</CardTitle>
              <CardDescription>
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'
                  ? 'Filtered results'
                  : 'All tasks in the system'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTasks && filteredTasks.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow key={task._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{task.title}</div>
                              {task.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {task.description}
                                </div>
                              )}
                              {task.project && (
                                <div className="text-xs text-muted-foreground">
                                  Project: {task.project.title}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={task.status}
                              onValueChange={(value) => handleStatusUpdate(task._id, value as TaskStatus)}
                              disabled={user.role === 'client'}
                            >
                              <SelectTrigger className="w-[120px]">
                                <Badge variant="secondary" className={getStatusColor(task.status)}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="review">Review</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <IconUser className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {task.assignee?.name || task.assignee?.email || 'Unassigned'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{getSizeLabel(task.size)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <IconCalendar className="h-4 w-4 text-muted-foreground" />
                              <span className={`text-sm ${isOverdue(task.dueDate) ? 'text-red-600' : ''}`}>
                                {formatDate(task.dueDate) || 'No due date'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{task.client?.name}</span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <IconDotsVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                  <IconEdit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {canDeleteTasks && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTask(task._id)}
                                    className="text-red-600"
                                  >
                                    <IconTrash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconChecks className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
                  <p className="mt-2 text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : canCreateTasks
                      ? 'Get started by creating your first task.'
                      : 'No tasks have been created yet.'}
                  </p>
                  {canCreateTasks && !searchTerm && statusFilter === 'all' && priorityFilter === 'all' && assigneeFilter === 'all' && (
                    <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                      <IconPlus className="mr-2 h-4 w-4" />
                      Create First Task
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task Form Dialogs */}
        <TaskFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            // Refetch tasks data
            window.location.reload();
          }}
        />
        <TaskFormDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(undefined)}
          task={editingTask}
          onSuccess={() => {
            setEditingTask(undefined);
            // Refetch tasks data
            window.location.reload();
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}