/**
 * SprintKanban - Kanban board component for managing tasks within a specific sprint
 *
 * @remarks
 * Provides a drag-and-drop interface for managing task status within a single sprint.
 * Groups tasks by status columns (To Do, In Progress, Review, Done) and allows real-time
 * status updates through drag operations. Integrates with sprint kanban hooks for data
 * fetching and state management. Includes task cards with client logos and size indicators.
 *
 * @example
 * ```tsx
 * <SprintKanban sprintId="sprint123" />
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
import { IconGripVertical } from '@tabler/icons-react';

// 2. Internal imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskEditDialog } from '@/components/tasks/task-edit-dialog';
import { useSprintKanban, type EnrichedTask } from '@/hooks/use-sprint-kanban';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// 3. Types (if not in separate file)
interface SprintKanbanProps {
  /** Sprint ID to scope the kanban board */
  sprintId: Id<'sprints'>;
}

interface ClientLogoProps {
  /** Storage ID for the client logo */
  storageId?: Id<'_storage'> | string;
  /** Client name for alt text */
  clientName: string;
}

interface KanbanTaskCardProps {
  /** Task data to display */
  task: EnrichedTask;
  /** Callback when task is opened for editing */
  onOpenTask: (task: EnrichedTask) => void;
}

interface ColumnDroppableProps {
  /** Unique identifier for the droppable column */
  id: string;
  /** Children to render inside the droppable area */
  children: React.ReactNode;
}

// 4. Component definition
export const SprintKanban = memo(function SprintKanban({ 
  sprintId 
}: SprintKanbanProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  
  const {
    grouped,
    activeTask,
    isTaskDialogOpen,
    editingTask,
    STATUS_COLUMNS,
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
    getCountBadgeClass,
  } = useSprintKanban({ sprintId });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No additional memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No additional callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_COLUMNS.map(({ key, label }) => {
          const columnTasks = grouped[key];
          return (
            <Card key={key} className="pt-2 gap-2">
              <CardHeader className="py-3">
                <CardTitle className="text-md font-semibold flex items-center justify-between">
                  <span>{label}</span>
                  <Badge className={`${getCountBadgeClass(key)} border-transparent`}>{columnTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SortableContext items={columnTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                  <ColumnDroppable id={`column:${key}`}>
                    <div className="min-h-[120px] space-y-2">
                      {columnTasks.length === 0 ? (
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">Empty</div>
                      ) : (
                        columnTasks.map((task) => (
                          <KanbanTaskCard
                            key={task._id}
                            task={task}
                            onOpenTask={openTaskDialog}
                          />
                        ))
                      )}
                    </div>
                  </ColumnDroppable>
                </SortableContext>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="bg-background border rounded-md shadow-lg p-3 w-[260px]">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="font-medium line-clamp-2">{activeTask.title}</div>
                <div className="text-xs text-muted-foreground mt-1">Drag to change status</div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <TaskEditDialog open={isTaskDialogOpen} onOpenChange={closeTaskDialog} task={editingTask as any} />
    </DndContext>
  );
});

// Sub-component: ClientLogo
const ClientLogo = memo(function ClientLogo({ 
  storageId, 
  clientName 
}: ClientLogoProps) {
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
  return <Image src={logoUrl} alt={`${clientName} logo`} width={16} height={16} className="h-4 w-4 rounded object-cover" />;
});

// Sub-component: KanbanTaskCard
const KanbanTaskCard = memo(function KanbanTaskCard({ 
  task, 
  onOpenTask 
}: KanbanTaskCardProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: task._id });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const style = useMemo(() => {
    return { transform: CSS.Transform.toString(transform), transition };
  }, [transform, transition]);

  const sizeBadgeClass = useMemo(() => {
    switch ((task.size || '').toUpperCase()) {
      case 'XS':
        return 'bg-slate-100 text-slate-800';
      case 'S':
        return 'bg-blue-100 text-blue-800';
      case 'M':
        return 'bg-purple-100 text-purple-800';
      case 'L':
        return 'bg-amber-100 text-amber-800';
      case 'XL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }, [task.size]);

  const taskHours = useMemo(() => {
    return (task as any).sizeHours ?? (task as any).estimatedHours;
  }, [task]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleTaskClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenTask(task);
  }, [onOpenTask, task]);

  const handleCopySlug = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText((task as any).slug as string);
  }, [task]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-md border bg-card p-3 shadow-sm hover:shadow transition ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Client logo top-right */}
      <div className="absolute right-2 top-2">
        <ClientLogo storageId={task.client?.logo} clientName={task.client?.name || 'Client'} />
      </div>

      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          data-drag-handle
          className="text-muted-foreground hover:text-foreground mt-0.5"
          aria-label="Drag task"
        >
          <IconGripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            title="Edit task"
            onClick={handleTaskClick}
            className="font-medium leading-tight truncate flex items-center gap-2 text-left hover:underline"
          >
            {(task as any).slug && (
              <span className="text-[10px] px-1 py-0.5 rounded border font-mono">
                {(task as any).slug}
              </span>
            )}
            <span className="truncate">{task.title}</span>
          </button>
          <div className="text-xs text-muted-foreground truncate">{task.project?.title || 'General'}</div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {taskHours && (
          <Badge variant="secondary" className="border-transparent">{taskHours}h</Badge>
        )}
        {(task as any).slug && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline ml-auto"
            onClick={handleCopySlug}
            title="Copy task slug"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
});

// Sub-component: ColumnDroppable
const ColumnDroppable = memo(function ColumnDroppable({ 
  id, 
  children 
}: ColumnDroppableProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const { setNodeRef } = useDroppable({ id });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div ref={setNodeRef} id={id}>
      {children}
    </div>
  );
});


