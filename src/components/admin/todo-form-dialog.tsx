/**
 * TodoFormDialog - Personal todo creation and editing dialog component
 *
 * @remarks
 * Comprehensive dialog for creating new personal todo items or editing existing ones.
 * Supports priority levels, due dates, tags, and descriptions.
 * Integrates with Convex mutations for data persistence and task management.
 *
 * @example
 * ```tsx
 * <TodoFormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   todo={existingTodo}
 *   onSuccess={handleTodoCreated}
 * />
 * ```
 */

// 1. External imports
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useMutation } from 'convex/react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
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

// 3. Types
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
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing todo data for editing (undefined for new todos) */
  todo?: PersonalTask;
  /** Callback when todo operation succeeds */
  onSuccess?: () => void;
}

interface TodoFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  tags: string[];
}

// 4. Component definition
export const TodoFormDialog = memo(function TodoFormDialog({ 
  open, 
  onOpenChange, 
  todo, 
  onSuccess 
}: TodoFormDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [formData, setFormData] = useState<TodoFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    tags: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isEditMode = useMemo(() => {
    return Boolean(todo);
  }, [todo]);

  const dialogTitle = useMemo(() => {
    return isEditMode ? 'Edit Todo' : 'Create New Todo';
  }, [isEditMode]);

  const dialogDescription = useMemo(() => {
    return isEditMode 
      ? 'Update your personal todo item.' 
      : 'Add a new personal todo to your list.';
  }, [isEditMode]);

  const submitButtonText = useMemo(() => {
    if (isSubmitting) return 'Saving...';
    return isEditMode ? 'Update Todo' : 'Create Todo';
  }, [isSubmitting, isEditMode]);

  const isFormValid = useMemo(() => {
    return formData.title.trim().length > 0;
  }, [formData.title]);

  const hasTags = useMemo(() => {
    return formData.tags.length > 0;
  }, [formData.tags]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const handlePriorityChange = useCallback((value: 'low' | 'medium' | 'high') => {
    setFormData(prev => ({ ...prev, priority: value }));
  }, []);

  const handleDueDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, dueDate: e.target.value }));
  }, []);

  const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      e.currentTarget.value = '';
    }
  }, [formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  }, []);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Todo title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        labels: formData.tags.length > 0 ? formData.tags : undefined,
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
      toast.error(isEditMode ? 'Failed to update todo' : 'Failed to create todo');
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, todo, updateTask, createTask, onSuccess, onOpenChange, isEditMode]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // Reset form when dialog opens/closes or todo changes
  useEffect(() => {
    if (open) {
      if (todo) {
        setFormData({
          title: todo.title,
          description: todo.description || '',
          priority: todo.priority,
          dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
          tags: todo.tags || [],
        });
      } else {
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          tags: [],
        });
      }
    }
  }, [open, todo]);

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="Enter todo title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Enter description (optional)..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={handlePriorityChange}>
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
                value={formData.dueDate}
                onChange={handleDueDateChange}
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
            {hasTags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
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
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}); 