import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define proper types based on Convex schema
interface UserData {
  _id: Id<'users'>;
  name?: string;
  email?: string;
  role: 'admin' | 'pm' | 'task_owner' | 'client';
  status?: 'active' | 'inactive' | 'invited';
  clientId?: Id<'clients'>;
  departmentIds?: Id<'departments'>[];
}

interface TaskData {
  _id: Id<'tasks'>;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: Id<'users'>;
  projectId: Id<'projects'>;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  dueDate?: number;
  estimatedHours?: number;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  createdAt: number;
  updatedAt: number;
  createdBy: Id<'users'>;
}

interface ProjectTasksTabProps {
  projectId: Id<'projects'>;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  tasks: TaskData[];
}

export function ProjectTasksTab({ projectId, clientId, departmentId, tasks }: ProjectTasksTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  
  // Form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  // Store size in DAYS (0.5, 1, 2, 4, 6, 8) via dropdown. We convert to hours on submit (1 day = 8h)
  const [newTaskSizeDays, setNewTaskSizeDays] = useState<number | undefined>(undefined);
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<Id<'users'> | undefined>(undefined);

  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  // Load eligible assignees (project team). Exclude client users; prefer active users.
  const projectTeam = (useQuery(api.projects.getProjectTeam, { projectId }) ?? []) as unknown[];
  // All active users in the org (admin can see all); we do not filter by client/department to include ALL internal users
  const allActiveUsers = (useQuery(api.users.getTeamWorkload, { includeInactive: false }) ?? []) as unknown[];
  // Department details to get client users attached to this department
  const departmentDetails = useQuery(api.departments.getDepartmentById, { departmentId });

  // Build assignee list:
  // - Any internal user (admin, pm, task_owner)
  // - Any client user that is in this department (primary contact + team members)
  const internalUsers: UserData[] = (allActiveUsers || [])
    .filter((u): u is Record<string, unknown> => Boolean(u))
    .map((u) => ({
      _id: (u as any)._id,
      name: (u as any).name,
      email: (u as any).email,
      role: (u as any).role,
      status: (u as any).status,
      clientId: (u as any).clientId,
      departmentIds: (u as any).departmentIds,
    }))
    .filter((u: UserData) => ['admin', 'pm', 'task_owner'].includes(u.role) && (u.status === 'active' || !u.status));
  const deptClientUsers = (
    departmentDetails
      ? [
          departmentDetails.primaryContact,
          ...(departmentDetails.teamMembers || []),
        ]
      : []
  )
    .filter((u): u is Record<string, unknown> => Boolean(u))
    .map((u) => ({
      _id: (u as any)._id,
      name: (u as any).name,
      email: (u as any).email,
      role: (u as any).role,
      status: (u as any).status,
      clientId: (u as any).clientId,
      departmentIds: (u as any).departmentIds,
    }))
    .filter((u: UserData) => u.role === 'client' && (u.status === 'active' || !u.status));
  const eligibleAssignees: UserData[] = ([] as UserData[])
    .concat(internalUsers)
    .concat(deptClientUsers)
    .concat((projectTeam || []).filter((u): u is Record<string, unknown> => Boolean(u)).map((u) => ({
      _id: (u as any)._id,
      name: (u as any).name,
      email: (u as any).email,
      role: (u as any).role,
      status: (u as any).status,
      clientId: (u as any).clientId,
      departmentIds: (u as any).departmentIds,
    }))) // ensure any ad-hoc members already tied to project show up
    .filter((u: UserData) => u)
    .filter((u: UserData, idx: number, arr: UserData[]) => arr.findIndex((x: UserData) => x && x._id === u._id) === idx)
    .sort((a: UserData, b: UserData) => (a.name || a.email || '').localeCompare(b.name || b.email || ''));

  // Helpers to display size in days
  const SIZE_TO_HOURS: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };
  const getTaskDays = (task: TaskData): number | undefined => {
    const h = task.estimatedHours ?? (task.size ? SIZE_TO_HOURS[(task.size as string).toUpperCase()] : undefined);
    return h !== undefined ? h / 8 : undefined;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleSlugCopy = async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(slug);
      toast.success('Slug copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy slug');
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      await createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        projectId,
        clientId,
        departmentId,
        priority: newTaskPriority,
        // Send explicit estimatedHours derived from days
        estimatedHours: newTaskSizeDays !== undefined ? newTaskSizeDays * 8 : undefined,
        assigneeId: newTaskAssigneeId,
      });

      toast.success('Task created successfully');
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskSizeDays(undefined);
      setNewTaskAssigneeId(undefined);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !newTaskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      await updateTask({
        id: editingTask._id,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        priority: newTaskPriority,
        // Prefer explicit hours from days; backend will also recompute from size if set
        estimatedHours: newTaskSizeDays !== undefined ? newTaskSizeDays * 8 : undefined,
        assigneeId: newTaskAssigneeId,
      });

      toast.success('Task updated successfully');
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskSizeDays(undefined);
      setNewTaskAssigneeId(undefined);
      setEditingTask(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: Id<'tasks'>) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await deleteTask({ id: taskId });
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const openEditDialog = (task: TaskData) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description || '');
    setNewTaskPriority(task.priority);
    // If task has estimatedHours, prefill days
    const daysFromHours = task.estimatedHours !== undefined ? task.estimatedHours / 8 : undefined;
    setNewTaskSizeDays(daysFromHours);
    setNewTaskAssigneeId(task.assigneeId || undefined);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Tasks</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage tasks and deliverables for this project
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <Input
                  placeholder="Enter task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  placeholder="Task description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <Select value={newTaskPriority} onValueChange={(value) => setNewTaskPriority(value as 'low' | 'medium' | 'high' | 'urgent')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size (days)</label>
                  <Select
                    value={newTaskSizeDays !== undefined ? String(newTaskSizeDays) : undefined}
                    onValueChange={(value) => setNewTaskSizeDays(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">XS • 0.5d (4h)</SelectItem>
                      <SelectItem value="2">S • 2d (16h)</SelectItem>
                      <SelectItem value="4">M • 4d (32h)</SelectItem>
                      <SelectItem value="6">L • 6d (48h)</SelectItem>
                      <SelectItem value="8">XL • 8d (64h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <Select
                    value={newTaskAssigneeId}
                    onValueChange={(value) =>
                      setNewTaskAssigneeId(value === 'unassigned' ? undefined : (value as Id<'users'>))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {eligibleAssignees.map((user: UserData) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No tasks created yet. Add your first task to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell>
                      <div className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{task.title}</span>
                          {(task as any).slug && (
                            <button
                              className="font-mono text-xs text-muted-foreground px-2 py-1 rounded border bg-background hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                              onClick={(e) => handleSlugCopy((task as any).slug as string, e)}
                              title="Click to copy task slug"
                            >
                              {(task as any).slug}
                            </button>
                          )}
                        </div>
                      </div>
                      {task.description && (
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {task.description.length > 60 
                            ? `${task.description.substring(0, 60)}...` 
                            : task.description
                          }
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {(() => {
                        const d = getTaskDays(task);
                        return d !== undefined ? (
                          <Badge variant="secondary">{d}d</Badge>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {task.assigneeId ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={undefined} />
                            <AvatarFallback className="text-xs">
                              U
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">Assigned</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Unassigned</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {task.dueDate ? (
                        <span className="text-sm">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">No due date</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <Input
                placeholder="Enter task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Task description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select value={newTaskPriority} onValueChange={(value) => setNewTaskPriority(value as 'low' | 'medium' | 'high' | 'urgent')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size (days)</label>
                <Select
                  value={newTaskSizeDays !== undefined ? String(newTaskSizeDays) : undefined}
                  onValueChange={(value) => setNewTaskSizeDays(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">XS • 0.5d (4h)</SelectItem>
                    <SelectItem value="2">S • 2d (16h)</SelectItem>
                    <SelectItem value="4">M • 4d (32h)</SelectItem>
                    <SelectItem value="6">L • 6d (48h)</SelectItem>
                    <SelectItem value="8">XL • 8d (64h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <Select
                  value={newTaskAssigneeId}
                  onValueChange={(value) =>
                    setNewTaskAssigneeId(value === 'unassigned' ? undefined : (value as Id<'users'>))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {eligibleAssignees.map((user: UserData) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTask}>
                Update Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
