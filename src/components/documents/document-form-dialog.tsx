/**
 * DocumentFormDialog - Document creation and editing dialog
 *
 * @remarks
 * Provides a comprehensive form for creating new documents with type selection,
 * client and project association, and form validation. Integrates with the
 * document form hook for state management and submission handling.
 *
 * @example
 * ```tsx
 * <DocumentFormDialog 
 *   open={showDialog} 
 *   onOpenChange={setShowDialog} 
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDocumentForm } from '@/hooks/use-document-form';

// 3. Types
interface DocumentFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

interface DocumentTypeOption {
  value: string;
  label: string;
}

// 4. Component definition
export const DocumentFormDialog = memo(function DocumentFormDialog({ 
  open, 
  onOpenChange 
}: DocumentFormDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
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

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const documentTypeOptions: DocumentTypeOption[] = useMemo(() => [
    { value: 'blank', label: 'Blank' },
    { value: 'project_brief', label: 'Project Brief' },
    { value: 'meeting_notes', label: 'Meeting Notes' },
    { value: 'wiki_article', label: 'Wiki Article' },
    { value: 'resource_doc', label: 'Resource Document' },
  ], []);

  const hasClients = useMemo(() => {
    return clients.length > 0;
  }, [clients.length]);

  const hasProjects = useMemo(() => {
    return filteredProjects.length > 0;
  }, [filteredProjects.length]);

  const canSubmit = useMemo(() => {
    return Boolean(formData.title?.trim());
  }, [formData.title]);

  const isSubmitting = useMemo(() => {
    return isLoading;
  }, [isLoading]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('title', e.target.value);
  }, [updateField]);

  const handleDocumentTypeChange = useCallback((value: string) => {
    updateField('documentType', value);
  }, [updateField]);

  const handleClientChange = useCallback((value: string) => {
    setSelectedClientId(value);
  }, [setSelectedClientId]);

  const handleProjectChange = useCallback((value: string) => {
    setSelectedProjectId(value);
  }, [setSelectedProjectId]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleFormSubmit = useCallback(() => {
    if (canSubmit) {
      handleSubmit();
    }
  }, [canSubmit, handleSubmit]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
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
              onChange={handleTitleChange}
              placeholder="Document title" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <Select 
              value={formData.documentType} 
              onValueChange={handleDocumentTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client (Optional)</label>
              <Select 
                value={formData.selectedClientId} 
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {hasClients ? (
                    clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No clients available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Project (Optional)</label>
              <Select 
                value={formData.selectedProjectId} 
                onValueChange={handleProjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {hasProjects ? (
                    filteredProjects.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No projects available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleFormSubmit} 
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});


