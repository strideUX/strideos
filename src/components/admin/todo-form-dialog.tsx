'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PersonalTask {
  _id: Id<'tasks'>;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: number;
  tags?: string[];
  taskType: 'personal';
}

interface TodoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: PersonalTask;
  onSuccess?: () => void;
}

export function TodoFormDialog({ open, onOpenChange, todo, onSuccess }: TodoFormDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);

  // Reset form when dialog opens/closes or todo changes
  useEffect(() => {
    if (open) {
      if (todo) {
        setTitle(todo.title);
        setDescription(todo.description || '');
        setPriority(todo.priority);
        setDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '');
        setTags(todo.tags || []);
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setTags([]);
      }
    }
  }, [open, todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Todo title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        labels: tags.length > 0 ? tags : undefined,
        taskType: 'personal' as const,
        status: 'todo' as const,
        visibility: 'private' as const,
        category: 'improvement' as const,
        // Required fields for tasks table
        clientId: 'unassigned' as Id<'clients'>, // Will be updated by the system
        departmentId: 'unassigned' as Id<'departments'>, // Will be updated by the system
        projectId: 'unassigned' as Id<'projects'>, // Will be updated by the system
      };

      if (todo) {
        // Update existing task - only pass fields that updateTask accepts
        await updateTask({
          id: todo._id,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
        });
        toast.success('Todo updated successfully');
      } else {
        // Create new task
        await createTask(taskData);
        toast.success('Todo created successfully');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving todo:', error);
      toast.error(todo ? 'Failed to update todo' : 'Failed to create todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      e.currentTarget.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {todo ? 'Edit Todo' : 'Create New Todo'}
          </DialogTitle>
          <DialogDescription>
            {todo ? 'Update your personal todo item.' : 'Add a new personal todo to your list.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter todo title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Press Enter to add tags..."
              onKeyDown={handleAddTag}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (todo ? 'Update Todo' : 'Create Todo')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 