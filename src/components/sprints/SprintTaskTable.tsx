"use client";

import React, { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface SprintTaskTableTask {
  _id: string;
  title: string;
  assigneeName?: string;
  estimatedHours?: number;
  priority?: "urgent" | "high" | "medium" | "low";
  projectId: string;
  projectName: string;
}

export interface SprintTaskTableProps {
  tasks: SprintTaskTableTask[];
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

export function SprintTaskTable({ tasks, selectedTaskIds, onToggleTask, collapsedProjects, onToggleProject }: SprintTaskTableProps) {
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter((t) => t.title.toLowerCase().includes(term) || t.projectName.toLowerCase().includes(term));
  }, [search, tasks]);

  // Group by project
  const grouped = useMemo(() => {
    const map = new Map<string, { projectId: string; projectName: string; tasks: SprintTaskTableTask[]; totalHours: number }>();
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
                  <span className="text-xs text-muted-foreground">{group.tasks.length} tasks • {Math.round(group.totalHours)}h</span>
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
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => onToggleTask(t._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="truncate">{t.title}</span>
                        </div>
                        <div className="col-span-3 text-sm text-muted-foreground truncate">{t.assigneeName ?? "Unassigned"}</div>
                        <div className="col-span-2 text-sm">{Math.round(t.estimatedHours ?? 0)}h</div>
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

export default SprintTaskTable;


