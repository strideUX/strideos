'use client';

import { useAuth } from '@/lib/auth-hooks';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id, Doc } from '@/../convex/_generated/dataModel';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SiteHeader } from "@/components/site-header"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { IconPlus, IconSearch, IconUser, IconFolder, IconList, IconCheck, IconArrowUp, IconGripVertical, IconTarget, IconX, IconDots, IconEye, IconPlayerPause, IconArrowDown, IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame } from "@tabler/icons-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import PersonalTaskDialog from "@/components/tasks/PersonalTaskDialog"
import { TaskFormDialog } from "@/components/admin/TaskFormDialog"

// Create a droppable wrapper component
function DroppableArea({ id, children, className }: {
  id: string;
  children: React.ReactNode;
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={className}
      data-is-over={isOver}
    >
      {children}
    </div>
  );
}

export default function MyWorkPage() {
  const { user, isLoading } = useAuth();
  const isClientUser = (user as any)?.role === 'client';

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  
  // Modal states (conditional by task type)
  const [isPersonalDialogOpen, setIsPersonalDialogOpen] = useState(false);
  const [personalDialogTask, setPersonalDialogTask] = useState<Doc<"tasks"> | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskFormTask, setTaskFormTask] = useState<Doc<"tasks"> | null>(null);
  
  // State for drag & drop
  const [activeTask, setActiveTask] = useState<Doc<"tasks"> | null>(null);
  const [recentlyDroppedId, setRecentlyDroppedId] = useState<Id<"tasks"> | null>(null);
  
  // Legacy edit modal state removed in favor of conditional dialogs
  
  // Sensors for better drag handling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Real-time Convex queries
  const currentFocusTasks = useQuery(api.tasks.getMyCurrentFocus);
  const activeTasks = useQuery(api.tasks.getMyActiveTasks);
  const completedTasks = useQuery(api.tasks.getMyCompletedTasks);

  // Mutations
  const reorderTasks = useMutation(api.tasks.reorderMyTasks);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTaskMutation = useMutation(api.tasks.deleteTask);

  // Auth redirect is handled in `(dashboard)/layout.tsx` to avoid duplicate redirects

  

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

  const sortForDisplay = (tasks: Doc<"tasks">[]) => {
    return [...tasks].sort((a, b) => {
      const ao = (a as any).personalOrderIndex ?? 1e9;
      const bo = (b as any).personalOrderIndex ?? 1e9;
      if (ao !== bo) return ao - bo;
      return (a.updatedAt ?? a._creationTime ?? 0) - (b.updatedAt ?? b._creationTime ?? 0);
    });
  };

  const filteredCurrentFocus = sortForDisplay(filterTasks((currentFocusTasks || []).filter(t => t.status === 'in_progress')));
  const filteredActiveTasks = sortForDisplay(filterTasks((activeTasks || []).filter(t => t.status === 'todo' || t.status === 'review' || (t as any).status === 'on_hold')));
  const filteredCompletedTasks = filterTasks((completedTasks || []).filter(t => t.status === 'done' || (t as any).status === 'completed'));



  const handleStatusUpdate = async (taskId: Id<"tasks">, newStatus: string) => {
    try {
      console.log('[MyWork] handleStatusUpdate →', { taskId, newStatus });
      const result = await reorderTasks({
        taskIds: [taskId],
        targetStatus: newStatus as 'todo' | 'in_progress' | 'review' | 'done'
      });
      console.log('[MyWork] handleStatusUpdate success', result);
      setRecentlyDroppedId(taskId);
      setTimeout(() => setRecentlyDroppedId(null), 900);
      toast.success(`Status set to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('[MyWork] handleStatusUpdate error', error);
      toast.error('Failed to update task status');
    }
  };

  const handleDropToCurrentFocus = async (taskId: Id<"tasks">) => {
    try {
      await reorderTasks({
        taskIds: [taskId],
        targetStatus: 'in_progress'
      });
      setRecentlyDroppedId(taskId);
      setTimeout(() => setRecentlyDroppedId(null), 900);
      toast.success('Moved to Current Focus');
    } catch (error) {
      console.error('Failed to move to current focus:', error);
    }
  };



  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as Id<"tasks">;
    const task = [...(currentFocusTasks || []), ...(activeTasks || [])].find(t => t._id === taskId);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as Id<"tasks">;
    const overId = over.id;

    // Check if dropped on current focus area
    if (overId === 'current-focus-drop') {
      // Change status to in_progress - this will automatically move it to current focus
      await handleStatusUpdate(activeId, 'in_progress');
      return;
    }

    // Handle reordering within the same list
    const activeTaskInFocus = currentFocusTasks?.some(t => t._id === activeId);
    const overTaskInFocus = currentFocusTasks?.some(t => t._id === overId);

    if (activeTaskInFocus && overTaskInFocus && currentFocusTasks) {
      // Reorder within current focus
      const oldIndex = currentFocusTasks.findIndex(t => t._id === activeId);
      const newIndex = currentFocusTasks.findIndex(t => t._id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(currentFocusTasks, oldIndex, newIndex);
        await reorderTasks({ taskIds: newOrder.map(t => t._id) });
        setRecentlyDroppedId(activeId);
        setTimeout(() => setRecentlyDroppedId(null), 900);
        toast.success('Order updated');
      }
    } else if (!activeTaskInFocus && !overTaskInFocus) {
      // Reorder within active tasks
      const oldIndex = activeTasks?.findIndex(t => t._id === activeId) ?? -1;
      const newIndex = activeTasks?.findIndex(t => t._id === overId) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1 && activeTasks) {
        const newOrder = arrayMove(activeTasks, oldIndex, newIndex);
        await reorderTasks({ taskIds: newOrder.map(t => t._id) });
        setRecentlyDroppedId(activeId);
        setTimeout(() => setRecentlyDroppedId(null), 900);
        toast.success('Order updated');
      }
    }
  };

  // Handle row click to open edit modal (not on drag handle or buttons)
  const handleTaskClick = (task: Doc<"tasks">, event?: React.MouseEvent | null) => {
    // Don't open modal if clicking on buttons or drag handle
    const target = (event?.target as HTMLElement | null) ?? null;
    if (target && (target.closest('button') || target.closest('[data-drag-handle]'))) {
      return;
    }

    if ((task as any).taskType === 'personal') {
      setPersonalDialogTask(task);
      setIsPersonalDialogOpen(true);
    } else {
      setTaskFormTask(task);
      setIsTaskFormOpen(true);
    }
  };

  // Legacy edit handler removed; handled by dialogs

  const handleDeleteTask = async (task: Doc<"tasks">) => {
    if ((task as any).taskType !== 'personal') return;
    if (!confirm('Delete this personal task?')) return;
    try {
      await deleteTaskMutation({ id: task._id });
      toast.success('Task deleted');
    } catch (e) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Work</h1>
                    <p className="text-muted-foreground">
                      Manage your tasks and personal todos
                    </p>
                  </div>
                  <Button onClick={() => { setPersonalDialogTask(null); setIsPersonalDialogOpen(true); }}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >

                {/* Current Focus Section */}
                <Card className="py-1">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-4 py-3 border-b">
                      <IconTarget className="h-5 w-5 text-blue-600" />
                      <h2 className="text-base font-semibold">Current Focus</h2>
                      <Badge variant="secondary" className="ml-2">
                        {filteredCurrentFocus.length}/4
                      </Badge>
                    </div>
                    <DroppableArea id="current-focus-drop" className={`min-h-[120px] transition-all p-4`}>
                      {filteredCurrentFocus.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border-2 border-dashed border-muted-foreground/40">
                          <IconTarget className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Drop tasks here to start working</p>
                          <p className="text-xs text-muted-foreground mt-1">Drag tasks from the list below</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8 font-semibold"></TableHead>
                              <TableHead className="font-semibold">Task</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                              <TableHead className="font-semibold">Due</TableHead>
                              <TableHead className="font-semibold">Priority</TableHead>
                              <TableHead className="font-semibold">Size</TableHead>
                              <TableHead className="font-semibold">Project</TableHead>
                              <TableHead className="font-semibold">Client</TableHead>
                              <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <SortableContext items={filteredCurrentFocus.map(t => t._id)} strategy={verticalListSortingStrategy}>
                              {filteredCurrentFocus.map((task) => (
                                <MyWorkTableRow
                                  key={task._id}
                                  task={task}
                                  onView={() => handleTaskClick(task, null)}
                                  onMarkDone={() => handleStatusUpdate(task._id, 'done')}
                                  onSetReview={() => handleStatusUpdate(task._id, 'review')}
                                  onDelete={() => handleDeleteTask(task)}
                                  isCompleted={false}
                                  isInFocus
                                  recentlyDroppedId={recentlyDroppedId}
                                  isClientUser={isClientUser}
                                />
                              ))}
                            </SortableContext>
                          </TableBody>
                        </Table>
                      )}
                    </DroppableArea>
                  </CardContent>
                </Card>


                  

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <div className="mt-4 mb-2 pt-3">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="active">Active Tasks</TabsTrigger>
                          <TabsTrigger value="completed">Completed</TabsTrigger>
                        </TabsList>
                      </div>
                <Card className='py-2'>
                  <CardContent className="p-0">
                    {/* Search */}
                    <div className="relative m-4">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search tasks..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                      <TabsContent value="active" className="mt-0 px-4">
                        {filteredActiveTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <IconFolder className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">No active tasks</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-md">
                              {searchQuery ? 'Try adjusting your search.' : 'Your tasks will appear here when you have work assigned.'}
                            </p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-8 font-semibold"></TableHead>
                                <TableHead className="font-semibold">Task</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Due</TableHead>
                                <TableHead className="font-semibold">Priority</TableHead>
                                <TableHead className="font-semibold">Size</TableHead>
                                <TableHead className="font-semibold">Project</TableHead>
                                <TableHead className="font-semibold">Client</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <SortableContext items={filteredActiveTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                                {filteredActiveTasks.map((task) => (
                                  <MyWorkTableRow
                                    key={task._id}
                                    task={task}
                                    onView={() => handleTaskClick(task, null)}
                                    onMarkDone={() => handleStatusUpdate(task._id, 'done')}
                                    onDelete={() => handleDeleteTask(task)}
                                    isCompleted={false}
                                    includeType
                                    onMoveToFocus={() => handleDropToCurrentFocus(task._id)}
                                    recentlyDroppedId={recentlyDroppedId}
                                    onSetReview={() => handleStatusUpdate(task._id as any, 'review')}
                                    onSetTodo={() => handleStatusUpdate(task._id as any, 'todo')}
                                    isClientUser={isClientUser}
                                  />
                                ))}
                              </SortableContext>
                            </TableBody>
                          </Table>
                        )}
                      </TabsContent>
                      <TabsContent value="completed" className="mt-0 px-4">
                        {filteredCompletedTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <IconCheck className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">No completed tasks</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-md">
                              Completed tasks from the last 30 days will appear here.
                            </p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-8 font-semibold"></TableHead>
                                <TableHead className="font-semibold">Task</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Due</TableHead>
                                <TableHead className="font-semibold">Priority</TableHead>
                                <TableHead className="font-semibold">Size</TableHead>
                                <TableHead className="font-semibold">Project</TableHead>
                                <TableHead className="font-semibold">Client</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCompletedTasks.map((task) => (
                                <MyWorkTableRow
                                  key={task._id}
                                  task={task}
                                  onView={() => handleTaskClick(task, null)}
                                  onMarkDone={() => handleStatusUpdate(task._id, 'todo')}
                                  onDelete={() => handleDeleteTask(task)}
                                  isCompleted={true}
                                  recentlyDroppedId={recentlyDroppedId}
                                  isClientUser={isClientUser}
                                />
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </TabsContent>
                  </CardContent>
                  </Card>
                </Tabs>
                  
                  {/* Drag Overlay */}
                  <DragOverlay>
                    {activeTask ? (
                      <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-xl p-3 opacity-90">
                        <div className="flex items-center gap-3">
                          <IconGripVertical className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{activeTask.title}</span>
                              <Badge variant="secondary">{activeTask.status}</Badge>
                              <Badge variant="secondary">{activeTask.priority}</Badge>
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

      {/* Personal Task Dialog */}
      <PersonalTaskDialog
        open={isPersonalDialogOpen}
        onOpenChange={(open) => {
          setIsPersonalDialogOpen(open);
          if (!open) setPersonalDialogTask(null);
        }}
        task={personalDialogTask as any}
        onSuccess={() => {}}
      />

      {/* Assigned Task Full Dialog */}
      <TaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={(open) => {
          setIsTaskFormOpen(open);
          if (!open) setTaskFormTask(null);
        }}
        task={taskFormTask as any}
        isFromMyWork
        onSuccess={() => {}}
      />
    </>
   );
 }

// Task Row Component
function TaskRow({
  task,
  onStatusUpdate,
  onDropToFocus,
  onTaskClick, // New prop
  isCurrentFocus,
  isCompleted = false
}: {
  task: Doc<"tasks">;
  onStatusUpdate: (taskId: Id<"tasks">, status: string) => void;
  onDropToFocus?: () => void;
  onTaskClick: (task: Doc<"tasks">, event: React.MouseEvent) => void; // New prop
  isCurrentFocus: boolean;
  isCompleted?: boolean;
}) {
  // Only use sortable for non-completed tasks
  const sortable = useSortable({
    id: task._id,
    disabled: isCompleted // Disable dragging for completed tasks
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

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
      onClick={(e) => onTaskClick(task, e)}
      className={`group flex items-center gap-3 py-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer border-b border-border/50 ${isDragging ? 'opacity-50' : ''} ${isCurrentFocus ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
    >
            {/* Drag Handle - disabled for completed tasks */}
      <div
        data-drag-handle
        {...(isCompleted ? {} : attributes)}
        {...(isCompleted ? {} : listeners)}
        className={`transition-colors ${
          isCompleted
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 group-hover:text-gray-600 cursor-grab active:cursor-grabbing'
        }`}
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
                        <Badge variant="secondary" className={getStatusColor(task.status)}>
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge variant="secondary" className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            {task.taskType === 'personal' && (
              <Badge variant="outline" className="text-xs">
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
            {isCompleted ? (
              // Only show X button for completed tasks
              <Button
                size="sm"
                variant="ghost"
                title="Mark as incomplete (reset to todo)"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusUpdate(task._id, 'todo');
                }}
                className="hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900 dark:hover:text-red-300"
              >
                <IconX className="h-4 w-4" />
              </Button>
            ) : (
              // Show normal buttons for active tasks
              <>
                {!isCurrentFocus && (
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Move to current focus"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDropToFocus?.();
                    }}
                    className="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300"
                  >
                    <IconArrowUp className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  title="Mark as done"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(task._id, 'done');
                  }}
                  className="hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900 dark:hover:text-green-300"
                >
                  <IconCheck className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
                        </div>
  );
} 

// Table Row used in My Work data-table sections
function MyWorkTableRow({
  task,
  onView,
  onMarkDone,
  onSetReview,
  onSetTodo,
  onDelete,
  isCompleted,
  includeType,
  isInFocus,
  onMoveToFocus,
  recentlyDroppedId,
  isClientUser,
}: {
  task: Doc<'tasks'>;
  onView: () => void;
  onMarkDone: () => void;
  onSetReview?: () => void;
  onSetTodo?: () => void;
  onDelete: () => void;
  isCompleted: boolean;
  includeType?: boolean;
  isInFocus?: boolean;
  onMoveToFocus?: () => void;
  recentlyDroppedId?: Id<'tasks'> | null;
  isClientUser?: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useSortable({ id: task._id, disabled: isCompleted });

  const statusLabel = (s: string): string => {
    switch (s) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'review': return 'Review';
      case 'on_hold': return 'On Hold';
      case 'done':
      case 'completed': return 'Completed';
      default: return String(s);
    }
  };

  const statusBadgeClass = (s: string): string => {
    switch (s) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'review': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'done':
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default: return 'bg-muted text-foreground';
    }
  };

  const priorityLabel = (p: string): string => {
    switch (p) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      case 'urgent': return 'Urgent';
      default: return String(p);
    }
  };

  const getPriorityIcon = (p: string) => {
    switch (p) {
      case 'low':
        return <IconArrowNarrowDown className="h-4 w-4 text-blue-500" aria-label="Low priority" title="Low" />;
      case 'medium':
        return <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Medium priority" title="Medium" />;
      case 'high':
        return <IconArrowNarrowUp className="h-4 w-4 text-orange-500" aria-label="High priority" title="High" />;
      case 'urgent':
        return <IconFlame className="h-4 w-4 text-red-600" aria-label="Urgent priority" title="Urgent" />;
      default:
        return <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Priority" title={priorityLabel(p)} />;
    }
  };
  return (
    <TableRow
      ref={setNodeRef}
      className={
        (isCompleted ? 'opacity-70 ' : '') +
        'cursor-pointer hover:bg-muted/50 ' +
        ((task as any).status === 'in_progress' ? 'bg-muted/30 ' : '') +
        (recentlyDroppedId && (task as any)._id === (recentlyDroppedId as any) ? 'ring-2 ring-primary/50' : '')
      }
      onClick={() => onView()}
    >
      <TableCell className="w-8">
        <button
          {...(isCompleted ? {} : attributes)}
          {...(isCompleted ? {} : listeners)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
        >
          <IconGripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
          {(task as any).taskType === 'personal' && (
            <IconUser className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {(task as any).slug && (
            <span className="font-mono text-xs text-muted-foreground px-2 py-0.5 rounded border bg-background">
              {(task as any).slug}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={statusBadgeClass(String(task.status))}>{statusLabel(String(task.status))}</Badge>
      </TableCell>
      <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</TableCell>
      <TableCell>
        <div className="flex items-center justify-center">
          {getPriorityIcon(String(task.priority))}
        </div>
      </TableCell>
      <TableCell>
        {(() => {
          const hours = ((task as any).sizeHours ?? (task as any).estimatedHours);
          return hours ? <Badge variant="outline">{hours}h</Badge> : <span className="text-muted-foreground text-xs">—</span>;
        })()}
      </TableCell>
      <TableCell>
        {(task as any).project?.title ? (task as any).project.title : <span className="text-muted-foreground text-xs">—</span>}
      </TableCell>
      <TableCell>
        {(task as any).taskType === 'personal' ? (
          <span className="text-muted-foreground text-xs">—</span>
        ) : (
          (task as any).client?.name ? (
            <span>
              {(task as any).client.name}
              {(task as any).department?.name ? ` / ${(task as any).department.name}` : ''}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {/* Trash: leftmost for personal tasks in all lists */}
          {(task as any).taskType === 'personal' && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">
              <Trash2 className="h-4 w-4 text-gray-400" />
            </Button>
          )}

          {/* Active list, status = review: Back to To Do, Move to Focus (in progress), then Done (check last) */}
          {!isCompleted && !isInFocus && String((task as any).status) === 'review' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onSetTodo?.(); }}
                title="Back to To Do"
              >
                <IconArrowDown className="h-4 w-4" />
              </Button>
              {onMoveToFocus && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onMoveToFocus(); }}
                  title="Move to In Progress"
                >
                  <IconArrowUp className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
                title="Mark as Done"
              >
                <IconCheck className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Active list (non-review): Move to Focus then Done */}
          {!isCompleted && !isInFocus && String((task as any).status) !== 'review' && (
            <>
              {onMoveToFocus && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onMoveToFocus(); }}
                  title="Move to Focus"
                >
                  <IconArrowUp className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
                title="Mark as Done"
              >
                <IconCheck className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Current Focus: Review then Complete (check last) */}
          {!isCompleted && isInFocus && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); console.log('[MyWork] Review clicked', { id: (task as any)._id }); onSetReview?.(); }}
                title="Review"
              >
                <IconPlayerPause className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
                title="Complete"
              >
                <IconCheck className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}