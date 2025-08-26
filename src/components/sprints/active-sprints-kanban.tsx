/**
 * ActiveSprintsKanban - Kanban board component for managing tasks across active sprints
 *
 * @remarks
 * Provides a drag-and-drop interface for managing task status across all active sprints.
 * Groups tasks by status columns (To Do, In Progress, Review, Done) and allows real-time
 * status updates through drag operations. Integrates with sprint and task management hooks
 * for data fetching and state management.
 *
 * @example
 * ```tsx
 * <ActiveSprintsKanban />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { IconGripVertical, IconLayoutKanban } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

// 2. Internal imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskFormDialog } from '@/components/admin/task-form-dialog';
import { useKanbanBoard } from '@/hooks/use-kanban-board';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// 3. Types (if not in separate file)
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

interface StatusColumn {
  key: TaskStatus;
  label: string;
}

interface ClientLogoProps {
  storageId?: Id<'_storage'> | string;
  clientName: string;
}

// 4. Component definition
export const ActiveSprintsKanban = memo(function ActiveSprintsKanban() {
  // === 1. DESTRUCTURE PROPS ===
  // (No props for this component)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const {
    activeSprints,
    grouped,
    activeTask,
    isTaskDialogOpen,
    editingTask,
    hasActiveSprints,
    activeSprintsWithNoTasks,
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
    setActiveTask,
  } = useKanbanBoard();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const router = useRouter();

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const STATUS_COLUMNS: StatusColumn[] = useMemo(() => [
    { key: 'todo', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'review', label: 'In Review' },
    { key: 'done', label: 'Done' },
  ], []);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleDragStartCallback = useCallback((event: DragStartEvent) => {
    handleDragStart(event);
  }, [handleDragStart]);

  const handleDragEndCallback = useCallback((event: DragEndEvent) => {
    handleDragEnd(event);
  }, [handleDragEnd]);

  const handleTaskClick = useCallback((taskId: string) => {
    router.push(`/tasks/${taskId}`);
  }, [router]);

  const handleSprintClick = useCallback((sprintId: string) => {
    router.push(`/sprint/${sprintId}`);
  }, [router]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed in this component)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!hasActiveSprints) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconLayoutKanban className="h-5 w-5" /> Active Sprints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <IconLayoutKanban className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Active Sprints</h3>
            <p className="text-muted-foreground mb-4">
              There are currently no active sprints. Create a new sprint to get started.
            </p>
            <Button onClick={() => router.push('/sprints')}>
              View All Sprints
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Sprints Kanban</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {activeSprints?.length || 0} active sprint{(activeSprints?.length || 0) !== 1 ? 's' : ''}
          </div>
          <Button variant="outline" onClick={() => router.push('/sprints')}>
            View All Sprints
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStartCallback}
        onDragEnd={handleDragEndCallback}
      >
        <div className="grid grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.key}
              status={column.key}
              label={column.label}
              tasks={grouped[column.key] || []}
              onTaskClick={handleTaskClick}
              onSprintClick={handleSprintClick}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="bg-background border rounded-md shadow-lg p-3 w-[260px]">
              <div className="flex-1">
                <div className="font-medium line-clamp-2">{activeTask.title}</div>
                <div className="text-xs text-muted-foreground mt-1">Drag to change status</div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Edit Dialog */}
      <TaskFormDialog
        open={isTaskDialogOpen}
        onOpenChange={closeTaskDialog}
        task={editingTask as any}
        onSuccess={() => {
          closeTaskDialog();
          // The hook will automatically refresh the tasks
        }}
        isFromMyWork={false}
      />
    </div>
  );
});

// Sub-component: KanbanColumn
interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: any[];
  onTaskClick: (taskId: string) => void;
  onSprintClick: (sprintId: string) => void;
}

const KanbanColumn = memo(function KanbanColumn({
  status,
  label,
  tasks,
  onTaskClick,
  onSprintClick
}: KanbanColumnProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const { setNodeRef } = useDroppable({ id: status });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const countBadgeClass = useMemo(() => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, [status]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No additional callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{label}</h3>
        <Badge className={countBadgeClass}>{tasks.length}</Badge>
      </div>
      
      <div
        ref={setNodeRef}
        className="min-h-[400px] bg-muted/30 rounded-lg p-4 space-y-3"
      >
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task._id}
              task={task}
              onTaskClick={onTaskClick}
              onSprintClick={onSprintClick}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
});

// Sub-component: KanbanCard
interface KanbanCardProps {
  task: any;
  onTaskClick: (taskId: string) => void;
  onSprintClick: (sprintId: string) => void;
}

const KanbanCard = memo(function KanbanCard({
  task,
  onTaskClick,
  onSprintClick
}: KanbanCardProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const style = useMemo(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
    };
  }, [transform, transition]);

  const priorityIcon = useMemo(() => {
    switch (task.priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }, [task.priority]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleTaskClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskClick(task._id);
  }, [onTaskClick, task._id]);

  const handleSprintClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.sprintId) {
      onSprintClick(task.sprintId);
    }
  }, [onSprintClick, task.sprintId]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-background border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={handleTaskClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <IconGripVertical className="h-4 w-4" />
          </div>
          <span className="text-xs text-muted-foreground">{priorityIcon}</span>
        </div>
        <div className="flex items-center gap-2">
          {task.sprint && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-primary/10"
              onClick={handleSprintClick}
            >
              {task.sprint.name}
            </Badge>
          )}
        </div>
      </div>
      
      <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.title}</h4>
      
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.client && (
            <ClientLogo
              storageId={task.client.logoStorageId}
              clientName={task.client.name}
            />
          )}
          <span>{task.client?.name}</span>
        </div>
        
        {task.sizeHours && (
          <span>{task.sizeHours}h</span>
        )}
      </div>
    </div>
  );
});

// Sub-component: ClientLogo
const ClientLogo = memo(function ClientLogo({ storageId, clientName }: ClientLogoProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const logoUrl = useQuery(api.clients.getLogoUrl, storageId ? { storageId: storageId as Id<'_storage'> } : 'skip');

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!storageId || !logoUrl) return null;

  // === 7. RENDER (JSX) ===
  return (
    <Image
      src={logoUrl}
      alt={`${clientName} logo`}
      width={16}
      height={16}
      className="h-4 w-4 rounded object-cover"
    />
  );
});


