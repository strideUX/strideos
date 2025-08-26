'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDocumentForm } from '@/hooks/use-document-form';

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}



export function DocumentFormDialog({ open, onOpenChange }: DocumentFormDialogProps) {
  const {
    formData,
    isLoading,
    clients,
    filteredProjects,
    handleSubmit,
    updateField,
    setSelectedClientId,
    setSelectedProjectId,
  } = useDocumentForm({
    open,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input 
              value={formData.title} 
              onChange={(e) => updateField('title', e.target.value)} 
              placeholder="Document title" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <Select value={formData.documentType} onValueChange={(value) => updateField('documentType', value)}>
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
              <Select value={formData.selectedClientId} onValueChange={setSelectedClientId}>
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
              <Select value={formData.selectedProjectId} onValueChange={setSelectedProjectId}>
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
            <Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Document'}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}


