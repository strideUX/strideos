"use client";
import { ClipboardList } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CapacityBar from "@/components/sprints/CapacityBar";
import SprintTaskTable, { SprintTaskTableTask } from "@/components/sprints/SprintTaskTable";
import CapacityDetailsModal from "@/components/sprints/CapacityDetailsModal";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function NewSprintPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createSprint = useMutation(api.sprints.createSprint);
  const clients = useQuery(api.clients.listClients, {});
  const departments = useQuery(api.departments.listAllDepartments, {});
  const org = useQuery(api.organizations.getCurrentOrganization, {});

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const initialClient = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('client') || '' : '';
  const [clientId, setClientId] = useState<string>(initialClient);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);

  const backlog = useQuery(api.sprints.getDepartmentBacklog, departmentId ? { departmentId: departmentId as any } : ("skip" as any));

  const allTasks: SprintTaskTableTask[] = useMemo(() => {
    const items: SprintTaskTableTask[] = [];
    const groups = (backlog as any)?.groupedByProject ?? [];
    for (const g of groups) {
      for (const t of g.tasks) {
        items.push({
          _id: t._id,
          title: t.title,
          assigneeName: t.assigneeName,
          estimatedHours: t.hours,
          priority: t.priority,
          projectId: g._id,
          projectName: g.name,
        });
      }
    }
    return items;
  }, [backlog]);

  const tasksById = useMemo(() => {
    const m = new Map<string, SprintTaskTableTask>();
    allTasks.forEach((t) => m.set(t._id, t));
    return m;
  }, [allTasks]);

  const workstreamCount = useMemo(() => {
    const dept = (departments ?? []).find((d: any) => d._id === departmentId);
    return dept?.workstreamCount ?? 0;
  }, [departments, departmentId]);

  const capacityHours = (workstreamCount || 0) * (org?.defaultWorkstreamCapacity ?? 32);
  const committedHours = Array.from(selectedTaskIds).reduce((sum, id) => sum + (tasksById.get(id)?.estimatedHours ?? 0), 0);
  const pct = capacityHours > 0 ? (committedHours / capacityHours) * 100 : 0;
  const ready = Boolean(clientId && departmentId);

  const toggleTaskSelection = (taskId: string) => {
    if (!ready) return;
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleProject = (projectId: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  // Auto end date = start + 14 days
  const computeEndDate = (start: string) => {
    if (!start) return "";
    const d = new Date(start + "T00:00:00");
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  };

  if (!user) return null;

  return (
    <>
      <SiteHeader user={user} />
      <main className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <header className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-emerald-600" />
          <h1 className="text-2xl font-semibold">Sprint Planner</h1>
        </header>

        {/* Sprint Details Card */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle>Sprint details</CardTitle>
              <CardDescription>Set the sprint name, goal, and timeline. End date auto-calculates to 2 weeks from start.</CardDescription>
            </div>
            <div className="flex gap-2 self-end md:self-auto">
              <Button variant="outline" onClick={() => router.push('/sprints')}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!ready || !name.trim() || !startDate || !endDate) return;
                  await createSprint({
                    name: name.trim(),
                    description: goal || undefined,
                    clientId: clientId as any,
                    departmentId: departmentId as any,
                    startDate: new Date(startDate).getTime(),
                    endDate: new Date(endDate).getTime(),
                    duration: 2,
                    totalCapacity: capacityHours,
                  });
                  router.push('/sprints');
                }}
                disabled={!ready || selectedTaskIds.size === 0}
              >
                Create Sprint
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Row 1: Client | Department */}
              <div>
                <label className="text-sm font-medium">Client</label>
                <Select value={clientId} onValueChange={(v) => { setClientId(v); setDepartmentId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {(clients ?? []).map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <Select value={departmentId} onValueChange={(v) => setDepartmentId(v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {(departments ?? []).filter((d: any) => !clientId || d.clientId === clientId).map((d: any) => (
                      <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2: Sprint name | Goal */}
              <div>
                <label className="text-sm font-medium">Sprint name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sprint 14 – Reports" disabled={!ready} />
              </div>
              <div>
                <label className="text-sm font-medium">Goal</label>
                <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What are we aiming to achieve?" disabled={!ready} />
              </div>

              {/* Row 3: Start date | Target end date */}
              <div>
                <label className="text-sm font-medium">Start date</label>
                <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setEndDate(computeEndDate(e.target.value)); }} disabled={!ready} />
              </div>
              <div>
                <label className="text-sm font-medium">Target end date</label>
                <Input type="date" value={endDate} readOnly disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Backlog Card */}
        <Card className="gap-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Selected</span>
                <span className="text-sm font-medium">{selectedTaskIds.size} tasks • {Math.round(committedHours)}h</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTaskIds(new Set())}>Clear all</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            <ScrollArea className="h-[640px]">
              <div className="p-4 pt-0">
                {/* Capacity Bar (no nested card styles) */}
                <div className="sticky top-0 z-10 mb-2 w-full rounded-md bg-background/95">
                  <CapacityBar valuePct={pct} targetPct={80} committedHours={Math.round(committedHours)} capacityHours={Math.round(capacityHours)} />
                </div>

                {/* Grouped Task Table or gating message */}
                {ready ? (
                  <SprintTaskTable
                    tasks={allTasks}
                    selectedTaskIds={selectedTaskIds}
                    onToggleTask={toggleTaskSelection}
                    collapsedProjects={collapsedProjects}
                    onToggleProject={toggleProject}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/30">
                    Select a client and department to view and select backlog tasks.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

      </main>

      <CapacityDetailsModal
        open={capacityModalOpen}
        onOpenChange={setCapacityModalOpen}
        totalPct={pct}
        committedHours={Math.round(committedHours)}
        capacityHours={Math.round(capacityHours)}
      />
    </>
  );
}


