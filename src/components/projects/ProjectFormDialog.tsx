"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    clientId?: string;
    departmentId?: string;
  };
  onSuccess?: (projectId: string) => void;
}

interface ClientOption { _id: string; name: string; }
interface DepartmentOption { _id: string; name: string; clientId: string; }

export function ProjectFormDialog({ open, onOpenChange, defaultValues, onSuccess }: ProjectFormDialogProps) {
  const createProject = useMutation(api.projects.createProject);

  // State must be declared before hooks that depend on it
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const clients = (useQuery(api.clients.listClients, {}) ?? []) as ClientOption[];
  const departments = (useQuery(
    api.departments.listDepartmentsByClient,
    selectedClientId ? ({ clientId: selectedClientId } as any) : ("skip" as any)
  ) ?? []) as DepartmentOption[];

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setSelectedClientId(defaultValues?.clientId ?? "");
      setSelectedDepartmentId(defaultValues?.departmentId ?? "");
    }
  }, [open, defaultValues?.clientId, defaultValues?.departmentId]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => (selectedClientId ? d.clientId === selectedClientId : true));
  }, [departments, selectedClientId]);

  const handleCreate = async () => {
    if (!title.trim() || !selectedClientId || !selectedDepartmentId) {
      toast.error("Please provide title, client and department");
      return;
    }
    try {
      const projectId = await createProject({
        title: title.trim(),
        clientId: selectedClientId as any,
        departmentId: selectedDepartmentId as any,
        description: description.trim() || undefined,
        template: "project_brief",
        visibility: "client",
      });
      toast.success("Project created");
      onOpenChange(false);
      onSuccess?.(projectId as unknown as string);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Start a new project for this client.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments.map((d) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
