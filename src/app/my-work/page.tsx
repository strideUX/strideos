'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id, Doc } from '@/../convex/_generated/dataModel';
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { IconPlus, IconSearch, IconCalendar, IconUser, IconFolder, IconList, IconCheck, IconArrowUp, IconGripVertical, IconTarget } from "@tabler/icons-react"

export default function MyWorkPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  
  // State for Add Task modal
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: undefined as number | undefined,
  });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // State for drag & drop
  const [activeTask, setActiveTask] = useState<Doc<"tasks"> | null>(null);

  // Real-time Convex queries
  const currentFocusTasks = useQuery(api.tasks.getMyCurrentFocus);
  const activeTasks = useQuery(api.tasks.getMyActiveTasks);
  const completedTasks = useQuery(api.tasks.getMyCompletedTasks);

  // Mutations
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

  // Filter tasks based on search query
  const filterTasks = (tasks: Doc<"tasks">[]) => {
    if (!searchQuery) return tasks;
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredCurrentFocus = filterTasks(currentFocusTasks || []);
  const filteredActiveTasks = filterTasks(activeTasks || []);
  const filteredCompletedTasks = filterTasks(completedTasks || []);

  // Utility functions
  const formatDueDate = (timestamp?: number) => {
    if (!timestamp) return 'No due date';
    return new Date(timestamp).toLocaleDateString();
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

  const handleStatusUpdate = async (taskId: Id<"tasks">, newStatus: string) => {
    try {
      await reorderTasks({
        taskIds: [taskId],
        targetStatus: newStatus as 'todo' | 'in_progress' | 'done'
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDropToCurrentFocus = async (taskId: Id<"tasks">) => {
    try {
      await reorderTasks({
        taskIds: [taskId],
        targetStatus: 'in_progress'
      });
    } catch (error) {
      console.error('Failed to move to current focus:', error);
    }
  };

  const handleReorder = async (taskIds: Id<"tasks">[]) => {
    try {
      await reorderTasks({ taskIds });
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as Id<"tasks">;
    const task = [...(currentFocusTasks || []), ...(activeTasks || [])].find(t => t._id === taskId);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as Id<"tasks">;
    
    if (over.id === 'current-focus') {
      // Move task to current focus (change status to in-progress)
      await handleDropToCurrentFocus(taskId);
    } else if (over.id === 'active-tasks') {
      // Reorder within active tasks
      const activeTaskIds = activeTasks?.map(t => t._id) || [];
      const newOrder = [...activeTaskIds];
      const oldIndex = newOrder.indexOf(taskId);
      const newIndex = newOrder.length - 1; // Move to end
      
      if (oldIndex !== -1) {
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, taskId);
        await handleReorder(newOrder);
      }
    }
  };

  const handleCreatePersonalTodo = async () => {
    if (!newTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setIsCreatingTask(true);
    try {
      await createPersonalTodo({
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
      });
      
      // Reset form and close modal
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: undefined });
      setIsAddTaskOpen(false);
      
      // Show success feedback (could be replaced with toast)
      console.log('Task created successfully!');
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setIsCreatingTask(false);
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
                    <h1 className="text-3xl font-bold tracking-tight">My Work</h1>
                    <p className="text-muted-foreground">
                      Manage your tasks and personal todos
                    </p>
                  </div>
                  <Button onClick={() => setIsAddTaskOpen(true)}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  {/* Search */}
                  <div className="relative mb-6">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search tasks..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                {/* Current Focus Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <IconTarget className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold">Current Focus</h2>
                    <Badge variant="secondary" className="ml-2">
                      {filteredCurrentFocus.length}/4
                    </Badge>
                  </div>
                  
                  <div 
                    id="current-focus"
                    className={`min-h-[120px] border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors rounded-lg p-4 ${filteredCurrentFocus.length === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                  >
                    {filteredCurrentFocus.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <IconTarget className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Drop tasks here to start working
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Drag tasks from the backlog below
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredCurrentFocus.map((task) => (
                          <TaskRow 
                            key={task._id} 
                            task={task} 
                            onStatusUpdate={handleStatusUpdate}
                            isCurrentFocus={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active Tasks</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="active" className="mt-6">
                    <div className="space-y-2">
                      {filteredActiveTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <IconFolder className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No active tasks</h3>
                          <p className="text-sm text-muted-foreground text-center max-w-md">
                            {searchQuery ? 'Try adjusting your search.' : 'Your tasks will appear here when you have work assigned.'}
                          </p>
                        </div>
                      ) : (
                        filteredActiveTasks.map((task) => (
                          <TaskRow 
                            key={task._id} 
                            task={task} 
                            onStatusUpdate={handleStatusUpdate}
                            onDropToFocus={() => handleDropToCurrentFocus(task._id)}
                            isCurrentFocus={false}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="completed" className="mt-6">
                    <div className="space-y-2">
                      {filteredCompletedTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <IconCheck className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No completed tasks</h3>
                          <p className="text-sm text-muted-foreground text-center max-w-md">
                            Completed tasks from the last 30 days will appear here.
                          </p>
                        </div>
                      ) : (
                        filteredCompletedTasks.map((task) => (
                          <TaskRow 
                            key={task._id} 
                            task={task} 
                            onStatusUpdate={handleStatusUpdate}
                            isCurrentFocus={false}
                            isCompleted={true}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>
                                 </Tabs>
                  
                  {/* Drag Overlay */}
                  <DragOverlay>
                    {activeTask ? (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 opacity-90">
                        <div className="flex items-center gap-3">
                          <IconGripVertical className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{activeTask.title}</span>
                              <Badge size="sm" variant="secondary">{activeTask.status}</Badge>
                              <Badge size="sm" variant="secondary">{activeTask.priority}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

       {/* Add Task Modal */}
       <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>Add Personal Task</DialogTitle>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid gap-2">
               <Label htmlFor="title">Title *</Label>
               <Input
                 id="title"
                 placeholder="Enter task title..."
                 value={newTask.title}
                 onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
               />
             </div>
             <div className="grid gap-2">
               <Label htmlFor="description">Description</Label>
               <Textarea
                 id="description"
                 placeholder="Enter task description (optional)..."
                 value={newTask.description}
                 onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                 rows={3}
               />
             </div>
             <div className="grid gap-2">
               <Label htmlFor="priority">Priority</Label>
               <Select 
                 value={newTask.priority} 
                 onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' | 'urgent' }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select priority" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="low">Low</SelectItem>
                   <SelectItem value="medium">Medium</SelectItem>
                   <SelectItem value="high">High</SelectItem>
                   <SelectItem value="urgent">Urgent</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="grid gap-2">
               <Label htmlFor="dueDate">Due Date</Label>
               <Input
                 id="dueDate"
                 type="date"
                 value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                 onChange={(e) => {
                   const date = e.target.value ? new Date(e.target.value).getTime() : undefined;
                   setNewTask(prev => ({ ...prev, dueDate: date }));
                 }}
               />
             </div>
           </div>
           <DialogFooter>
             <Button 
               variant="outline" 
               onClick={() => setIsAddTaskOpen(false)}
               disabled={isCreatingTask}
             >
               Cancel
             </Button>
             <Button 
               onClick={handleCreatePersonalTodo}
               disabled={isCreatingTask || !newTask.title.trim()}
             >
               {isCreatingTask ? 'Creating...' : 'Create Task'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </SidebarProvider>
   );
 }

// Task Row Component
function TaskRow({ 
  task, 
  onStatusUpdate, 
  onDropToFocus, 
  isCurrentFocus, 
  isCompleted = false 
}: {
  task: Doc<"tasks">;
  onStatusUpdate: (taskId: Id<"tasks">, status: string) => void;
  onDropToFocus?: () => void;
  isCurrentFocus: boolean;
  isCompleted?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

  const formatDueDate = (timestamp?: number) => {
    if (!timestamp) return 'No due date';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 py-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer border-b border-border/50 ${isDragging ? 'opacity-50' : ''} ${isCurrentFocus ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="text-gray-400 group-hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors"
      >
        <IconGripVertical className="h-4 w-4" />
      </div>
          
          {/* Task Type Icon */}
          <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
            {getTaskTypeIcon(task.taskType)}
          </div>
          
          {/* Title + Badges */}
          <div className="flex-1 flex items-center gap-2">
            <span className={`font-medium truncate ${isCompleted ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </span>
            <Badge size="sm" variant="secondary" className={getStatusColor(task.status)}>
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge size="sm" variant="secondary" className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            {task.taskType === 'personal' && (
              <Badge variant="outline" size="sm" className="text-xs">
                Personal
              </Badge>
            )}
          </div>
          
          {/* Right side metadata */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatDueDate(task.dueDate)}</span>
            <span className="flex items-center gap-1">
              <IconUser className="h-3 w-3" />
              {task.taskType === 'personal' ? 'Personal' : 'Assigned'}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isCompleted && !isCurrentFocus && (
              <Button 
                size="sm" 
                variant="ghost"
                title="Move to current focus"
                onClick={onDropToFocus}
                className="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300"
              >
                <IconArrowUp className="h-4 w-4" />
              </Button>
            )}
            {!isCompleted && (
              <Button 
                size="sm" 
                variant="ghost"
                title="Mark as done"
                onClick={() => onStatusUpdate(task._id, 'done')}
                className="hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900 dark:hover:text-green-300"
              >
                <IconCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
    } 