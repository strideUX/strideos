'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  IconPlus, 
  IconSearch, 
  IconChecklist, 
  IconUser,
  IconCalendar,
  IconTag,
  IconGripVertical,
  IconEdit,
  IconTrash,
  IconCheck,
  IconClock,
  IconFlag
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { TodoFormDialog } from '@/components/admin/TodoFormDialog';
import { Todo, UnifiedTaskItem } from '@/types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function MyTasksPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'tasks' | 'todos'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);

  // Fetch unified task/todo list
  const unifiedList = useQuery(api.todos.getUnifiedTaskList, {
    status: statusFilter === 'all' ? undefined : statusFilter as any,
    filter: typeFilter,
  });

  const deleteTodo = useMutation(api.todos.deleteTodo);
  const updateTodo = useMutation(api.todos.updateTodo);
  const updateUnifiedOrder = useMutation(api.todos.updateUnifiedOrder);

  // Filter by search term
  const filteredList = unifiedList?.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('Are you sure you want to delete this todo? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTodo({ todoId: todoId as Id<'todos'> });
      toast.success('Todo deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete todo');
    }
  };

  const handleStatusChange = async (item: UnifiedTaskItem, newStatus: string) => {
    if (item.type === 'todo') {
      try {
        await updateTodo({
          todoId: item.id as Id<'todos'>,
          status: newStatus as any,
        });
        toast.success('Todo status updated');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update todo status');
      }
    }
    // For tasks, we'd need to implement task status update mutation
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !unifiedList) return;

    const items = Array.from(unifiedList);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order for all items
    const orderUpdates = items.map((item, index) => ({
      id: item.id,
      type: item.type,
      order: index,
    }));

    try {
      await updateUnifiedOrder({ items: orderUpdates });
    } catch (error) {
      toast.error('Failed to reorder items');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'archived': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done': return 'Done';
      case 'in_progress': return 'In Progress';
      case 'todo': return 'To Do';
      case 'archived': return 'Archived';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return priority;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate?: number) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access your tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={currentUser} />
      <SidebarInset>
        <SiteHeader user={currentUser} />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Tasks</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Manage your assigned tasks and personal todos
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <IconPlus className="w-4 h-4 mr-2" /> Add Todo
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Search and filter your tasks and todos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(value: 'all' | 'tasks' | 'todos') => setTypeFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="tasks">Tasks Only</SelectItem>
                    <SelectItem value="todos">Todos Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task/Todo List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Work</CardTitle>
              <CardDescription>
                {filteredList.length > 0 ? (
                  <>
                    {filteredList.length} item{filteredList.length !== 1 ? 's' : ''} found
                    {filteredList.length > 0 && (
                      <> • {filteredList.filter(item => item.status === 'done').length} completed</>
                    )}
                  </>
                ) : (
                  'No items found'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredList.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="tasks">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {filteredList.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 border rounded-lg bg-white dark:bg-slate-800 ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-1 cursor-grab active:cursor-grabbing"
                                  >
                                    <IconGripVertical className="w-4 h-4 text-slate-400" />
                                  </div>

                                  {/* Status Checkbox */}
                                  <div className="mt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStatusChange(item, item.status === 'done' ? 'todo' : 'done')}
                                      className="h-6 w-6 p-0"
                                    >
                                      {item.status === 'done' ? (
                                        <IconCheck className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <div className="w-4 h-4 border-2 border-slate-300 rounded" />
                                      )}
                                    </Button>
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h3 className={`font-medium ${item.status === 'done' ? 'line-through text-slate-500' : ''}`}>
                                          {item.title}
                                        </h3>
                                        {item.description && (
                                          <p className={`text-sm text-slate-600 dark:text-slate-300 mt-1 ${item.status === 'done' ? 'line-through' : ''}`}>
                                            {item.description}
                                          </p>
                                        )}
                                      </div>
                                      
                                      {/* Type Badge */}
                                      <Badge variant={item.type === 'task' ? 'default' : 'secondary'} className="text-xs">
                                        {item.type === 'task' ? (
                                          <>
                                            <IconChecklist className="w-3 h-3 mr-1" />
                                            Task
                                          </>
                                        ) : (
                                          <>
                                            <IconUser className="w-3 h-3 mr-1" />
                                            Todo
                                          </>
                                        )}
                                      </Badge>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className={getStatusColor(item.status)}>
                                        {getStatusLabel(item.status)}
                                      </Badge>
                                      <Badge className={getPriorityColor(item.priority)}>
                                        <IconFlag className="w-3 h-3 mr-1" />
                                        {getPriorityLabel(item.priority)}
                                      </Badge>
                                      {item.dueDate && (
                                        <div className={`flex items-center gap-1 text-xs ${
                                          isOverdue(item.dueDate) ? 'text-red-600' : 'text-slate-500'
                                        }`}>
                                          <IconCalendar className="w-3 h-3" />
                                          {formatDate(item.dueDate)}
                                          {isOverdue(item.dueDate) && <span className="text-red-600">(Overdue)</span>}
                                        </div>
                                      )}
                                    </div>

                                    {/* Tags */}
                                    {item.type === 'todo' && item.data.tags && item.data.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {item.data.tags.map((tag: string) => (
                                          <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                          >
                                            <IconTag className="w-3 h-3" />
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1">
                                    {item.type === 'todo' && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setEditingTodo(item.data)}
                                          className="h-8 w-8 p-0"
                                        >
                                          <IconEdit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteTodo(item.id)}
                                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                        >
                                          <IconTrash className="w-4 h-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="text-center py-8">
                  <IconChecklist className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No tasks or todos found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'No items match your current filters.'
                      : 'Get started by creating your first personal todo.'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <IconPlus className="w-4 h-4 mr-2" /> Add Todo
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Todo Form Dialog */}
          <TodoFormDialog
            open={isCreateDialogOpen || !!editingTodo}
            onOpenChange={(open) => {
              if (!open) {
                setIsCreateDialogOpen(false);
                setEditingTodo(undefined);
              }
            }}
            todo={editingTodo}
            onSuccess={() => {
              setIsCreateDialogOpen(false);
              setEditingTodo(undefined);
            }}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 