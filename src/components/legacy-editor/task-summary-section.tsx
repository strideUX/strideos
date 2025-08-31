/**
 * TaskSummarySection - Task summary display component for document sections
 *
 * @remarks
 * Displays a summary of tasks linked to a specific document or document section.
 * Shows task counts by status, priority indicators, and provides quick task management.
 * Integrates with Convex for real-time task data and status updates.
 *
 * @example
 * ```tsx
 * <TaskSummarySection 
 *   documentId="doc_123"
 *   sectionId="section_456"
 *   className="mb-4"
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { useQuery } from 'convex/react';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Plus,
  ExternalLink
} from 'lucide-react';

// 2. Internal imports
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// 3. Types
interface TaskSummarySectionProps {
  /** Document identifier to fetch tasks for */
  documentId: Id<'documents'>;
  /** Optional section identifier to filter tasks */
  // sectionId removed with legacy sections
  /** Additional CSS classes for styling */
  className?: string;
}

// 4. Component definition
export const TaskSummarySection = memo(function TaskSummarySection({ 
  documentId, 
  sectionId, 
  className = '' 
}: TaskSummarySectionProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const tasks = useQuery(api.tasks.getTasksByDocument, { 
    documentId, 
    sectionId 
  });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const completedTasks = useMemo(() => {
    return tasks?.filter(task => task.status === 'done') || [];
  }, [tasks]);

  const inProgressTasks = useMemo(() => {
    return tasks?.filter(task => task.status === 'in_progress') || [];
  }, [tasks]);

  const todoTasks = useMemo(() => {
    return tasks?.filter(task => task.status === 'todo') || [];
  }, [tasks]);

  const hasTasks = useMemo(() => {
    return tasks && tasks.length > 0;
  }, [tasks]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  }, []);

  const handleAddTask = useCallback(() => {
    // TODO: Implement task creation functionality
    console.log('Add task clicked');
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!tasks) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Related Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Related Tasks
            <Badge variant="secondary" className="ml-2">
              {tasks.length}
            </Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleAddTask}
          >
            <Plus className="h-3 w-3" />
            Add Task
          </Button>
        </div>
        {hasTasks && (
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-muted-foreground">Todo: {todoTasks.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-muted-foreground">In Progress: {inProgressTasks.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-muted-foreground">Done: {completedTasks.length}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!hasTasks ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No tasks linked to this document</p>
            <p className="text-xs mt-1">Create tasks to track work progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{task.title}</h4>
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    {task.priority && (
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {task.assigneeId && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Assigned</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due {formatDate(task.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}); 