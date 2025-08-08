"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";

type Department = { _id: string; name: string; workstreamCount: number; clientId: string };
type Client = { _id: string; name: string };
type BacklogTask = { _id: string; title: string; description?: string; priority: string; size?: string; hours: number; projectName?: string };

const SIZE_TO_HOURS: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };
const sizeHours = (size?: string) => SIZE_TO_HOURS[(size ?? "").toUpperCase()] ?? 0;

function DraggableTask({ task, from }: { task: BacklogTask; from: "backlog" | "selected" }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { source: from, taskId: task._id },
  });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="flex items-center gap-3 p-2 rounded border bg-background">
      <div className="flex-1">
        <div className="font-medium text-sm">{task.title}</div>
        {task.projectName && <div className="text-xs text-muted-foreground">{task.projectName}</div>}
        {task.description && <div className="text-xs text-muted-foreground line-clamp-1">{task.description}</div>}
      </div>
      <Badge variant="outline">{task.priority}</Badge>
      <Badge variant="outline">{Math.round(((task.hours ?? 0) / 8) * 10) / 10}d</Badge>
    </div>
  );
}

function DroppableColumn({ id, title, children, footer }: { id: "backlog" | "selected"; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`flex-1 min-h-[300px] rounded-lg border p-3 ${isOver ? "bg-muted/30" : "bg-muted/10"}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        {footer}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function SprintFormPage({ sprint }: { sprint?: any }) {
  const router = useRouter();
  const createSprint = useMutation(api.sprints.createSprint);
  const updateSprint = useMutation(api.sprints.updateSprint);

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [durationWeeks, setDurationWeeks] = useState<number>(2);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [sprintCapacityHours, setSprintCapacityHours] = useState<number>(0);
  const [committedHours, setCommittedHours] = useState<number>(0);

  const org = useQuery(api.organizations.getCurrentOrganization, {});
  const clients = useQuery(api.clients.listClients, {});
  const allDepartments = useQuery(api.departments.listAllDepartments, {});

  // Backlog
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const backlog = useQuery(api.sprints.getDepartmentBacklog, selectedDepartment ? { departmentId: selectedDepartment as any } : ("skip" as any));

  const allBacklogTasks: BacklogTask[] = useMemo(() => {
    const out: BacklogTask[] = [];
    const grouped = (backlog as any)?.groupedByProject ?? [];
    for (const proj of grouped) {
      for (const t of proj.tasks) {
        out.push({ _id: t._id, title: t.title, description: t.description, priority: t.priority, size: t.size, hours: t.hours ?? (t.size ? sizeHours(t.size) : 0), projectName: proj.name });
      }
    }
    return out;
  }, [backlog]);

  const backlogMap = useMemo(() => {
    const m = new Map<string, BacklogTask>();
    allBacklogTasks.forEach((t) => m.set(t._id, t));
    return m;
  }, [allBacklogTasks]);

  const selectedTasksDetailed: BacklogTask[] = useMemo(() => selectedTaskIds.map((id) => backlogMap.get(id)).filter(Boolean) as BacklogTask[], [selectedTaskIds, backlogMap]);

  const filteredDepartments = useMemo(() => {
    return (allDepartments ?? []).filter((d: Department) => (selectedClientId ? d.clientId === selectedClientId : true));
  }, [allDepartments, selectedClientId]);

  useEffect(() => {
    if (sprint) {
      setSelectedClientId(sprint.clientId);
      setSelectedDepartment(sprint.departmentId);
      setName(sprint.name);
      setDescription(sprint.description ?? "");
      setStartDate(new Date(sprint.startDate).toISOString().substring(0, 10));
      setEndDate(new Date(sprint.endDate).toISOString().substring(0, 10));
      setDurationWeeks(sprint.duration ?? 2);
    } else {
      setName("");
      setDescription("");
      setSelectedTaskIds([]);
    }
  }, [sprint]);

  // Business-week end date calculation
  function addBusinessDays(start: Date, businessDays: number): Date {
    const result = new Date(start);
    let added = 1;
    if (businessDays <= 1) return result;
    while (added < businessDays) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) added += 1;
    }
    return result;
  }
  useEffect(() => {
    if (!startDate) { setEndDate(""); return; }
    const start = new Date(startDate + "T00:00:00");
    const days = Math.max(1, durationWeeks * 5);
    const end = addBusinessDays(start, days);
    setEndDate(end.toISOString().substring(0, 10));
  }, [startDate, durationWeeks]);

  // Capacity
  useEffect(() => {
    if (selectedDepartment) {
      const dept = (allDepartments ?? []).find((d: Department) => d._id === selectedDepartment);
      if (dept) {
        const capacity = dept.workstreamCount * (org?.defaultWorkstreamCapacity ?? 32);
        setSprintCapacityHours(capacity);
      }
    } else {
      setSprintCapacityHours(0);
    }
  }, [selectedDepartment, allDepartments, org]);

  useEffect(() => {
    const total = selectedTaskIds.reduce((sum, id) => sum + (backlogMap.get(id)?.hours ?? 0), 0);
    setCommittedHours(total);
  }, [selectedTaskIds, backlogMap]);

  const capacityPercentage = sprintCapacityHours > 0 ? (committedHours / sprintCapacityHours) * 100 : 0;
  const isOverCapacity = capacityPercentage > 100;
  const isNearCapacity = capacityPercentage > 80 && capacityPercentage <= 100;

  const handleSubmit = async () => {
    if (!name.trim() || !selectedClientId || !selectedDepartment || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || start >= end) {
      toast.error("Invalid dates");
      return;
    }
    try {
      if (sprint) {
        await updateSprint({
          id: sprint._id,
          name: name.trim(),
          description: description.trim() || undefined,
          startDate: start,
          endDate: end,
          duration: durationWeeks,
          totalCapacity: sprintCapacityHours,
        });
        toast.success("Sprint updated");
      } else {
        await createSprint({
          name: name.trim(),
          description: description.trim() || undefined,
          clientId: selectedClientId as any,
          departmentId: selectedDepartment as any,
          startDate: start,
          endDate: end,
          duration: durationWeeks,
          totalCapacity: sprintCapacityHours,
        });
        toast.success("Sprint created");
      }
      router.push("/sprints");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save sprint");
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = (active.data?.current as any)?.taskId as string | undefined;
    const source = (active.data?.current as any)?.source as "backlog" | "selected" | undefined;
    if (!taskId || !source) return;
    if (over.id === "selected" && source === "backlog") {
      if (!selectedTaskIds.includes(taskId)) setSelectedTaskIds((prev) => [...prev, taskId]);
    } else if (over.id === "backlog" && source === "selected") {
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  const visibleBacklog = allBacklogTasks.filter((t) => !selectedTaskIds.includes(t._id));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{sprint ? "Edit Sprint" : "Create Sprint"}</h1>
          <p className="text-muted-foreground">Set up a sprint with capacity and backlog selection.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedDepartment || selectedTaskIds.length === 0}>{sprint ? "Update Sprint" : "Create Sprint"}</Button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-4">
          <h3 className="font-medium">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Sprint Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint name" />
            </div>
            <div>
              <label className="text-sm font-medium">Client</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {(clients ?? []).map((c: Client) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments.map((d: Department) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Duration (weeks)</label>
              <Input type="number" min={1} max={6} value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value) || 1)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Timeline</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Target End Date</label>
              <Input type="date" value={endDate} readOnly disabled />
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <div className="text-sm font-medium">Sprint Capacity</div>
            <div className="text-2xl font-bold">{sprintCapacityHours} hours</div>
            <div className="text-sm text-muted-foreground">
              Based on {(allDepartments ?? []).find((d: any) => d._id === selectedDepartment)?.workstreamCount ?? 0} workstreams × {org?.defaultWorkstreamCapacity ?? 32} hours
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Task Backlog</h3>
            <div className="text-sm">{selectedTaskIds.length} tasks • {committedHours} hours committed</div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Capacity Utilization</span>
              <span className={isOverCapacity ? "text-red-600" : isNearCapacity ? "text-yellow-600" : ""}>{capacityPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(capacityPercentage, 100)} className={`h-3 ${isOverCapacity ? "[&>div]:bg-red-600" : isNearCapacity ? "[&>div]:bg-yellow-600" : ""}`} />
            {isOverCapacity && (
              <p className="text-sm text-red-600">⚠️ Sprint is over capacity by {Math.max(0, committedHours - sprintCapacityHours)} hours</p>
            )}
          </div>

          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DroppableColumn id="backlog" title="Backlog">
                {visibleBacklog.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No backlog tasks available</div>
                ) : (
                  visibleBacklog.map((task) => <DraggableTask key={task._id} task={task} from="backlog" />)
                )}
              </DroppableColumn>

              <DroppableColumn id="selected" title="Selected" footer={<span className="text-xs text-muted-foreground">Drag here to add</span>}>
                {selectedTasksDetailed.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Drag tasks here to select for this sprint</div>
                ) : (
                  selectedTasksDetailed.map((task) => (
                    <div key={task._id} className="group">
                      <DraggableTask task={task} from="selected" />
                      <div className="flex justify-end mt-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTaskIds((prev) => prev.filter((id) => id !== task._id))} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </DroppableColumn>
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
}


