'use client';

import { createReactBlockSpec } from '@blocknote/react';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Task status configuration
const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', icon: Circle, color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  { value: 'review', label: 'Review', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'done', label: 'Done', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  { value: 'archived', label: 'Archived', icon: CheckCircle, color: 'bg-gray-100 text-gray-500' },
] as const;

// Priority configuration
const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
] as const;

// Size configuration
const SIZES = [
  { value: 'XS', label: 'XS (1pt)', color: 'bg-gray-100 text-gray-700' },
  { value: 'S', label: 'S (2pt)', color: 'bg-blue-100 text-blue-700' },
  { value: 'M', label: 'M (3pt)', color: 'bg-green-100 text-green-700' },
  { value: 'L', label: 'L (5pt)', color: 'bg-orange-100 text-orange-700' },
  { value: 'XL', label: 'XL (8pt)', color: 'bg-red-100 text-red-700' },
] as const;

// Rebuilt tasks block schema following BlockNote best practices
export const tasksBlockSpec = createReactBlockSpec(
  {
    type: 'tasks',
    propSchema: {
      // Standard BlockNote default props (manually defined)
      textAlignment: {
        default: "left",
        values: ["left", "center", "right", "justify"],
      },
      textColor: {
        default: "default",
      },
      backgroundColor: {
        default: "default",
      },
      // Custom props with proper defaults
      taskIds: {
        default: "[]",
      },
      projectId: {
        default: "",
      },
      title: {
        default: "Tasks",
      },
      showCompleted: {
        default: "true",
      },
    },
    content: 'none', // This block doesn't contain editable text content
  },
  {
    render: (props) => {
      return <TasksBlock {...props} />;
    },
  }
);

// Full Tasks block component with real functionality
export function TasksBlock({ block, editor }: { 
  block: any; 
  editor: any; 
}) {
  
  // Parse props from the block (all props are strings in BlockNote)
  const taskIds: Id<'tasks'>[] = (() => {
    try {
      return block.props.taskIds ? JSON.parse(block.props.taskIds) : [];
    } catch (e) {
      console.warn('Failed to parse taskIds:', block.props.taskIds);
      return [];
    }
  })();
  
  const projectId = block.props.projectId || "";
  const title = block.props.title || "Tasks";
  const showCompleted = block.props.showCompleted === "true";

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskSize, setNewTaskSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL'>('M');

  // Get current user and project context
  const user = useQuery(api.users.getCurrentUser, {});
  const project = useQuery(api.projects.getProject, { 
    projectId: projectId as Id<'projects'> 
  });

  // Get tasks - if we have taskIds, get those specific tasks, otherwise get all project tasks
  const specificTasks = useQuery(api.tasks.getTasksByIds, {
    taskIds: taskIds,
  });

  const allProjectTasks = useQuery(api.tasks.getTasksByProject, {
    projectId: projectId as Id<'projects'>,
  });

  const tasks = taskIds.length > 0 ? specificTasks : allProjectTasks;

  // Mutations
  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  // Filter tasks based on showCompleted setting
  const visibleTasks = tasks?.filter((task): task is NonNullable<typeof task> => 
    task !== null && task !== undefined && (showCompleted || task.status !== 'done')
  ) || [];

  // Handle creating a new task
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !user || !project) return;

    try {
      const taskId = await createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        priority: newTaskPriority,
        size: newTaskSize,
        clientId: project.clientId,
        departmentId: project.departmentId,
        projectId: project._id,
        visibility: 'team',
      });

      // Add task to block if we're managing specific task IDs
      if (taskIds.length > 0) {
        const updatedTaskIds = [...taskIds, taskId];
        editor.updateBlock(block, {
          props: {
            ...block.props,
            taskIds: JSON.stringify(updatedTaskIds),
          },
        });
      }

      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskSize('M');
      setIsCreatingTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  // Handle updating task status
  const handleUpdateTaskStatus = async (taskId: Id<'tasks'>, status: string) => {
    try {
      await updateTask({
        id: taskId,
        status: status as 'todo' | 'in_progress' | 'review' | 'done' | 'archived',
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Handle deleting task
  const handleDeleteTask = async (taskId: Id<'tasks'>) => {
    try {
      await deleteTask({ id: taskId });
      
      // Remove task from block if we're managing specific task IDs
      if (taskIds.length > 0) {
        const updatedTaskIds = taskIds.filter((id: Id<'tasks'>) => id !== taskId);
        editor.updateBlock(block, {
          props: {
            ...block.props,
            taskIds: JSON.stringify(updatedTaskIds),
          },
        });
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Check if user can edit tasks (PM or admin)
  const canEditTasks = user?.role === 'admin' || user?.role === 'pm';

  return (
    <Card className="w-full border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {canEditTasks && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingTask(true)}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!tasks ? (
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
            <p className="text-sm">Loading tasks...</p>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks yet</p>
            {canEditTasks && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingTask(true)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add your first task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((task) => {
              const statusConfig = TASK_STATUSES.find(s => s.value === task.status);
              const priorityConfig = PRIORITIES.find(p => p.value === task.priority);
              const sizeConfig = SIZES.find(s => s.value === task.size);
              const StatusIcon = statusConfig?.icon || Circle;

              return (
                <div
                  key={task._id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    task.status === 'done' ? "bg-muted/50" : "bg-background hover:bg-muted/30"
                  )}
                >
                  {/* Status */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => canEditTasks && handleUpdateTaskStatus(task._id, task.status === 'done' ? 'todo' : 'done')}
                    className={cn(
                      "h-6 w-6 p-0",
                      canEditTasks ? "cursor-pointer" : "cursor-default"
                    )}
                    disabled={!canEditTasks}
                  >
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      task.status === 'done' ? "text-green-600" : "text-muted-foreground"
                    )} />
                  </Button>

                  {/* Task content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-medium text-sm",
                          task.status === 'done' && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className={cn(
                            "text-xs text-muted-foreground mt-1",
                            task.status === 'done' && "line-through"
                          )}>
                            {task.description}
                          </p>
                        )}
                      </div>
                      
                      {canEditTasks && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task._id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Task metadata */}
                    <div className="flex items-center gap-2 mt-2">
                      {priorityConfig && (
                        <Badge variant="secondary" className={cn("text-xs", priorityConfig.color)}>
                          {priorityConfig.label}
                        </Badge>
                      )}
                      {sizeConfig && (
                        <Badge variant="outline" className="text-xs">
                          {sizeConfig.label}
                        </Badge>
                      )}
                      {task.assigneeId && (
                        <Badge variant="outline" className="text-xs">
                          Assigned
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create task dialog */}
        <Dialog open={isCreatingTask} onOpenChange={setIsCreatingTask}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="task-description">Description (optional)</Label>
                <Textarea
                  id="task-description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select value={newTaskPriority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setNewTaskPriority(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="task-size">Size</Label>
                  <Select value={newTaskSize} onValueChange={(value: 'XS' | 'S' | 'M' | 'L' | 'XL') => setNewTaskSize(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreatingTask(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}