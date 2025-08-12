'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Plus,
  ExternalLink
} from 'lucide-react';

interface TaskSummarySectionProps {
  documentId: Id<'documents'>;
  sectionId?: Id<'documentSections'>;
  className?: string;
}

export function TaskSummarySection({ 
  documentId, 
  sectionId, 
  className = '' 
}: TaskSummarySectionProps) {
  
  // Fetch tasks linked to this document
  const tasks = useQuery(api.tasks.getTasksByDocument, { 
    documentId, 
    sectionId 
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

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

  const completedTasks = tasks.filter(task => task.status === 'done');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const todoTasks = tasks.filter(task => task.status === 'todo');

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
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Plus className="h-3 w-3" />
            Add Task
          </Button>
        </div>
        {tasks.length > 0 && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              {completedTasks.length} completed
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-600" />
              {inProgressTasks.length} in progress
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-600" />
              {todoTasks.length} todo
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              No tasks linked to this document yet
            </p>
            <Button variant="outline" size="sm" className="flex items-center gap-1 mx-auto">
              <Plus className="h-3 w-3" />
              Create First Task
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task._id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{task.title}</h4>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assignee.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.storyPoints && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{task.storyPoints} pts</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 ml-2">
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 