"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandInput,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface TaskDependencySelectorProps {
  projectId?: Id<"projects"> | null;
  currentTaskId?: Id<"tasks"> | null;
  selectedDependencies?: Id<"tasks">[];
  onDependenciesChange: (dependencies: Id<"tasks">[]) => void;
}

export function TaskDependencySelector({ projectId, currentTaskId, selectedDependencies, onDependenciesChange }: TaskDependencySelectorProps) {
  const tasks = (useQuery(api.tasks.getTasksByProject as any, projectId ? { projectId } : "skip" as any) ?? []) as any[];

  // Ensure selectedDependencies is always an array
  const safeSelectedDependencies = selectedDependencies || [];

  const options = useMemo(() => {
    // Same project tasks, excluding current task and completed tasks
    return (tasks || [])
      .filter((t) => !currentTaskId || String(t._id) !== String(currentTaskId))
      .filter((t) => t.status !== "done" && t.status !== "archived")
      .map((t) => ({ id: t._id as Id<"tasks">, title: t.title as string, status: t.status as string }));
  }, [tasks, currentTaskId]);

  const optionById = useMemo(() => {
    const map = new Map<string, { id: Id<"tasks">; title: string; status: string }>();
    for (const opt of options) map.set(String(opt.id), opt);
    return map;
  }, [options]);

  const selectedSet = new Set<string>(safeSelectedDependencies.map((id) => String(id)));

  const toggle = (id: Id<"tasks">) => {
    const asStr = String(id);
    const next = new Set<string>(Array.from(selectedSet));
    if (next.has(asStr)) next.delete(asStr); else next.add(asStr);
    onDependenciesChange(Array.from(next) as unknown as Id<"tasks">[]);
  };

  const clearAll = () => onDependenciesChange([]);

  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="truncate">
              {safeSelectedDependencies.length > 0 ? `${safeSelectedDependencies.length} selected` : "Select dependencies"}
            </span>
            <span className="text-xs text-muted-foreground">Open</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tasks" />
            <CommandEmpty>No tasks found.</CommandEmpty>
            <CommandList>
              <CommandGroup heading="Tasks">
                {options.map((opt) => (
                  <CommandItem
                    key={String(opt.id)}
                    value={`${String(opt.id)}:${opt.title}`}
                    onSelect={() => toggle(opt.id)}
                    className="cursor-pointer"
                  >
                    <Checkbox checked={selectedSet.has(String(opt.id))} className="mr-2" />
                    <span className="truncate flex-1">{opt.title}</span>
                    <Badge variant="secondary" className={cn("ml-2 text-[10px]", opt.status === "in_progress" ? "bg-blue-100 text-blue-800" : opt.status === "review" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800")}>{opt.status.replace("_"," ")}</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="border-t p-2 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{safeSelectedDependencies.length} selected</div>
            <Button size="sm" variant="ghost" onClick={clearAll}>Clear</Button>
          </div>
        </PopoverContent>
      </Popover>

      {safeSelectedDependencies.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {safeSelectedDependencies.map((id) => {
            const key = String(id);
            const meta = optionById.get(key);
            return (
              <Badge key={key} variant="outline" className="text-xs flex items-center gap-1.5">
                <span className="truncate max-w-[200px]">{meta?.title ?? key}</span>
                {meta && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      meta.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : meta.status === "review"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                    )}
                  >
                    {meta.status.replace("_", " ")}
                  </Badge>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TaskDependencySelector;

