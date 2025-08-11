"use client";

import React, { useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, useDroppable, useDraggable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export interface TaskKanbanTask {
  _id: Id<"tasks">;
  title: string;
  status: TaskStatus | string;
  priority?: "low" | "medium" | "high" | "urgent" | string;
  size?: "XS" | "S" | "M" | "L" | "XL" | "xs" | "sm" | "md" | "lg" | "xl" | string;
  assignee?: { _id: Id<"users">; name?: string | null; email?: string | null; image?: string | null } | null;
  project?: { _id: Id<"projects">; title?: string | null } | null;
}

interface TaskKanbanViewProps {
  tasks: TaskKanbanTask[];
  onTaskUpdate: (taskId: Id<"tasks">, updates: Partial<TaskKanbanTask>) => Promise<void> | void;
  onTaskClick?: (task: TaskKanbanTask) => void;
  isLoading?: boolean;
  showProjectName?: boolean;
}

const COLUMN_DEFS: { key: TaskStatus; label: string; tint: string }[] = [
  { key: "todo", label: "To Do", tint: "bg-gray-50 dark:bg-gray-900/40" },
  { key: "in_progress", label: "In Progress", tint: "bg-blue-50 dark:bg-blue-950/30" },
  { key: "review", label: "Review", tint: "bg-amber-50 dark:bg-amber-950/30" },
  { key: "done", label: "Done", tint: "bg-green-50 dark:bg-green-950/30" },
];

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};

function KanbanCard({ task, onClick }: { task: TaskKanbanTask; onClick?: (t: TaskKanbanTask) => void }) {
  const priorityDot = PRIORITY_DOT[(task.priority || "").toString().toLowerCase()] || "bg-muted-foreground/40";
  const sizeLabel = (task.size ?? "").toString().toUpperCase();
  const initials = (task.assignee?.name || task.assignee?.email || "U").slice(0, 1).toUpperCase();

  const content = (
    <div
      className={cn(
        "rounded-md border bg-background p-3 shadow-xs transition-shadow hover:shadow-sm",
        "cursor-pointer"
      )}
      onClick={() => onClick?.(task)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-1 h-2 w-2 rounded-full", priorityDot)} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{task.title}</div>
          {task.project?.title && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">{task.project.title}</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.assignee?.image || undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center gap-2">
          {sizeLabel ? <Badge variant="secondary">{sizeLabel}</Badge> : null}
          {task.priority ? (
            <Badge variant="outline" className="capitalize">
              {String(task.priority)}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{task.title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DraggableKanbanCard({ task, onClick }: { task: TaskKanbanTask; onClick?: (t: TaskKanbanTask) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { sourceStatus: task.status },
  });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCard task={task} onClick={onClick} />
    </div>
  );
}

function DroppableColumn({ id, header, count, tint, children }: { id: TaskStatus; header: string; count: number; tint: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className={cn("min-w-[18rem] md:min-w-0")}> 
      <div ref={setNodeRef} className={cn("rounded-md border", tint, isOver && "ring-2 ring-blue-500/30")}> 
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">{header}</div>
          <Badge variant="secondary">{count}</Badge>
        </div>
        <div className="space-y-2 p-3" data-droppable>
          {children}
        </div>
      </div>
    </div>
  );
}

export function TaskKanbanView({ tasks, onTaskUpdate, onTaskClick, isLoading, showProjectName }: TaskKanbanViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [draggingTask, setDraggingTask] = useState<TaskKanbanTask | null>(null);

  const columns = useMemo(() => {
    const map: Record<TaskStatus, TaskKanbanTask[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    for (const t of tasks) {
      const s = (t.status as string) as TaskStatus;
      if (s in map) {
        map[s as TaskStatus].push(t);
      } else {
        map.todo.push(t);
      }
    }
    return map;
  }, [tasks]);

  const handleDragStart = (event: any) => {
    const activeId = event.active?.id as Id<"tasks"> | undefined;
    if (!activeId) return;
    const found = tasks.find((t) => t._id === activeId) || null;
    setDraggingTask(found);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeId = event.active?.id as Id<"tasks"> | undefined;
    const overId = event.over?.id as TaskStatus | undefined;
    setDraggingTask(null);
    if (!activeId || !overId) return;

    const fromTask = tasks.find((t) => t._id === activeId);
    if (!fromTask) return;

    const nextStatus = overId;
    if ((fromTask.status as string) !== nextStatus) {
      // Optimistic UI is left to parent; we call update
      try {
        await onTaskUpdate(activeId, { status: nextStatus } as any);
      } catch (e) {
        // swallow; parent should toast on error
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={cn(
        "-mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:block md:overflow-visible",
      )}>
        <div className="md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-4 md:[&>*]:min-w-0 flex gap-4">
          {COLUMN_DEFS.map((col) => {
            const tasksInColumn = columns[col.key];
            return (
              <DroppableColumn key={col.key} id={col.key} header={col.label} count={tasksInColumn.length} tint={col.tint}>
                <SortableContext items={tasksInColumn.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                  ) : tasksInColumn.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No tasks</div>
                  ) : (
                    tasksInColumn.map((task) => (
                      <DraggableKanbanCard key={task._id} task={{ ...task, project: showProjectName ? task.project : undefined }} onClick={onTaskClick} />
                    ))
                  )}
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {draggingTask ? <KanbanCard task={draggingTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}