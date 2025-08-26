"use client";

import React, { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IconClock } from "@tabler/icons-react";
import { toast } from "sonner";

export interface sprint-task-tableTask {
  _id: string;
  title: string;
  assigneeName?: string;
  estimatedHours?: number;
  priority?: "urgent" | "high" | "medium" | "low";
  projectId: string;
  projectName: string;
}

export interface sprint-task-tableProps {
  tasks: sprint-task-tableTask[];
  selectedTaskIds: Set<string>;
  onToggleTask: (taskId: string) => void;
  collapsedProjects: Set<string>;
  onToggleProject: (projectId: string) => void;
}

function priorityBadgeVariant(priority?: string): string {
  switch (priority) {
    case "urgent":
      return "border-red-500/50 text-red-700";
    case "high":
      return "border-amber-500/50 text-amber-700";
    case "medium":
      return "border-emerald-500/50 text-emerald-700";
    case "low":
      return "border-slate-300 text-slate-600";
    default:
      return "border-slate-300 text-slate-600";
  }
}

export function SprintTaskTable({ tasks, selectedTaskIds, onToggleTask, collapsedProjects, onToggleProject }: sprint-task-tableProps) {
  const [search, setSearch] = useState<string>("");

  function formatHoursAsDays(hours?: number): string {
    const h = Math.max(0, Math.round((hours ?? 0) * 10) / 10);
    const d = h / 8;
    const roundedHalf = Math.round(d * 2) / 2;
    return `${roundedHalf}d`;
  }

  const handleSlugCopy = async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(slug);
      toast.success('ID copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy ID');
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter((t) => t.title.toLowerCase().includes(term) || t.projectName.toLowerCase().includes(term));
  }, [search, tasks]);

  // Group by project
  const grouped = useMemo(() => {
    const map = new Map<string, { projectId: string; projectName: string; tasks: sprint-task-tableTask[]; totalHours: number }>();
    for (const t of filtered) {
      const key = t.projectId;
      if (!map.has(key)) map.set(key, { projectId: key, projectName: t.projectName, tasks: [], totalHours: 0 });
      const entry = map.get(key)!;
      entry.tasks.push(t);
      entry.totalHours += t.estimatedHours ?? 0;
    }
    return Array.from(map.values()).sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [filtered]);

  return (
    <div className="space-y-3 text-[0.95rem]">
      <div className="flex items-center justify-between gap-3">
        <Input placeholder="Search tasks or projects" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
        <div className="text-sm text-muted-foreground">{Array.from(selectedTaskIds).length} selected</div>
      </div>

      <div className="divide-y rounded-md border bg-background">
        {grouped.map((group) => {
          const collapsed = collapsedProjects.has(group.projectId);
          return (
            <div key={group.projectId} className="">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50"
                onClick={() => onToggleProject(group.projectId)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{group.projectName}</span>
                  <span className="text-xs text-muted-foreground">{group.tasks.length} tasks • {formatHoursAsDays(group.totalHours)}</span>
                </div>
                <span className="text-xs text-muted-foreground">{collapsed ? "Show" : "Hide"}</span>
              </button>

              {!collapsed && (
                <div className="divide-y">
                  {group.tasks.map((t) => {
                    const selected = selectedTaskIds.has(t._id);
                    return (
                      <div
                        key={t._id}
                        className={`grid grid-cols-12 items-center px-3 py-2 hover:bg-muted/50 ${selected ? "bg-emerald-50/40" : ""}`}
                        onClick={() => onToggleTask(t._id)}
                        role="button"
                      >
                        <div className="col-span-6 flex items-center gap-2">
                          {(t as any).isBlocked && (
                            <IconClock className="h-4 w-4 text-blue-400" title="Waiting on dependencies" />
                          )}
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => onToggleTask(t._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="truncate">{t.title}</span>
                          {(t as any).slug && (
                            <button
                              type="button"
                              className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border bg-background hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                              onClick={(e) => handleSlugCopy((t as any).slug as string, e)}
                              title="Click to copy task ID"
                            >
                              {(t as any).slug}
                            </button>
                          )}
                        </div>
                        <div className="col-span-3 text-sm text-muted-foreground truncate">{t.assigneeName ?? "Unassigned"}</div>
                        <div className="col-span-2 text-sm">{formatHoursAsDays(t.estimatedHours ?? 0)}</div>
                        <div className="col-span-1 flex justify-end">
                          <Badge variant="outline" className={priorityBadgeVariant(t.priority)}>
                            {t.priority?.toUpperCase() ?? ""}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default sprint-task-table;


