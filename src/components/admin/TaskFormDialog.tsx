'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Types
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type TaskCategory = 'feature' | 'bug' | 'improvement' | 'research' | 'documentation' | 'maintenance';
type TaskVisibility = 'private' | 'team' | 'department' | 'client';

interface Task {
  _id: Id<'tasks'>;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  size?: TaskSize;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  assigneeId?: Id<'users'>;
  dueDate?: number;
  labels?: string[];
  category?: TaskCategory;
  visibility: TaskVisibility;
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSuccess: () => void;
}

export function TaskFormDialog({ open, onOpenChange, task, onSuccess }: TaskFormDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    departmentId: '',
    priority: 'medium' as TaskPriority,
    size: '' as TaskSize | '',
    assigneeId: '',
    dueDate: '',
    labels: '',
    category: '' as TaskCategory | '',
    visibility: 'department' as TaskVisibility,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const clients = useQuery(api.clients.listClients, {});
  const departments = useQuery(api.departments.listAllDepartments, {});
  const users = useQuery(api.users.listUsers, {});

  // Mutations
  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        // Edit mode
        setFormData({
          title: task.title,
          description: task.description || '',
          clientId: task.clientId,
          departmentId: task.departmentId,
          priority: task.priority,
          size: task.size || '',
          assigneeId: task.assigneeId || '',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          labels: task.labels?.join(', ') || '',
          category: task.category || '',
          visibility: task.visibility,
        });
      } else {
        // Create mode
        setFormData({
          title: '',
          description: '',
          clientId: '',
          departmentId: '',
          priority: 'medium',
          size: '',
          assigneeId: '',
          dueDate: '',
          labels: '',
          category: '',
          visibility: 'department',
        });
      }
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error('Task title is required');
        return;
      }
      if (!formData.clientId) {
        toast.error('Please select a client');
        return;
      }
      if (!formData.departmentId) {
        toast.error('Please select a department');
        return;
      }

      // Prepare data
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        clientId: formData.clientId as Id<'clients'>,
        departmentId: formData.departmentId as Id<'departments'>,
        priority: formData.priority,
        size: formData.size || undefined,
        assigneeId: formData.assigneeId || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        labels: formData.labels ? formData.labels.split(',').map(l => l.trim()).filter(Boolean) : undefined,
        category: formData.category || undefined,
        visibility: formData.visibility,
      };

      if (task) {
        // Update existing task
        await updateTask({
          id: task._id,
          ...taskData,
        });
        toast.success('Task updated successfully');
      } else {
        // Create new task
        await createTask(taskData);
        toast.success('Task created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(task ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter departments based on selected client
  const filteredDepartments = departments?.filter(dept => 
    formData.clientId ? dept.clientId === formData.clientId : true
  );

  // Filter users based on selected department
  const filteredUsers = users?.filter(user => 
    formData.departmentId && user.departmentIds?.includes(formData.departmentId as Id<'departments'>)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            {/* Client and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    clientId: value,
                    departmentId: '', // Reset department when client changes
                    assigneeId: '' // Reset assignee when client changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    departmentId: value,
                    assigneeId: '' // Reset assignee when department changes
                  }))}
                  disabled={!formData.clientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments?.map((department) => (
                      <SelectItem key={department._id} value={department._id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority and Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskPriority }))}
                >
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

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, size: value as TaskSize }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xs">XS (1 point)</SelectItem>
                    <SelectItem value="sm">SM (2 points)</SelectItem>
                    <SelectItem value="md">MD (3 points)</SelectItem>
                    <SelectItem value="lg">LG (5 points)</SelectItem>
                    <SelectItem value="xl">XL (8 points)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigneeId">Assignee</Label>
                <Select
                  value={formData.assigneeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
                  disabled={!formData.departmentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {filteredUsers?.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Category and Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as TaskCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value as TaskVisibility }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Labels */}
            <div className="space-y-2">
              <Label htmlFor="labels">Labels</Label>
              <Input
                id="labels"
                value={formData.labels}
                onChange={(e) => setFormData(prev => ({ ...prev, labels: e.target.value }))}
                placeholder="Enter labels separated by commas (e.g., urgent, feature, security)"
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple labels with commas
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}