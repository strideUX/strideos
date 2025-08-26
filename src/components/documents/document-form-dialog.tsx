'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClientOption { _id: Id<'clients'>; name: string; }
interface ProjectOption { _id: Id<'projects'>; title: string; }

export function DocumentFormDialog({ open, onOpenChange }: DocumentFormDialogProps) {
  const router = useRouter();
  const createDocument = useMutation(api.documents.create);

  const [title, setTitle] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('blank');
  const [selectedClientId, setSelectedClientId] = useState<Id<'clients'> | ''>('');
  const [selectedProjectId, setSelectedProjectId] = useState<Id<'projects'> | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const clients = (useQuery(api.clients.listClients, {}) ?? []) as ClientOption[];
  const projects = (useQuery(api.projects.listProjects, {}) ?? []) as ProjectOption[];

  const filteredProjects = useMemo(() => {
    if (!selectedClientId) return projects;
    return projects.filter((p: any) => p.clientId === selectedClientId);
  }, [projects, selectedClientId]);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDocumentType('blank');
      setSelectedClientId('');
      setSelectedProjectId('');
    }
  }, [open]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please provide a title');
      return;
    }
    setIsLoading(true);
    try {
      const result = await createDocument({
        title: title.trim(),
        documentType: documentType as any,
        metadata: {
          clientId: selectedClientId || undefined,
          projectId: selectedProjectId || undefined,
        },
      } as any);

      const { documentId } = result as any;
      toast.success('Document created successfully');
      onOpenChange(false);
      router.push(`/editor/${documentId}`);
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message ?? 'Failed to create document';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank</SelectItem>
                <SelectItem value="project_brief">Project Brief</SelectItem>
                <SelectItem value="meeting_notes">Meeting Notes</SelectItem>
                <SelectItem value="wiki_article">Wiki Article</SelectItem>
                <SelectItem value="resource_doc">Resource Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client (Optional)</label>
              <Select value={selectedClientId} onValueChange={(v) => setSelectedClientId(v as Id<'clients'>)}>
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
              <label className="text-sm font-medium">Project (Optional)</label>
              <Select value={selectedProjectId} onValueChange={(v) => setSelectedProjectId(v as Id<'projects'>)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((p) => (
                    <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Document'}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}


