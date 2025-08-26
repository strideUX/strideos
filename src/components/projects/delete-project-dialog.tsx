/**
 * DeleteProjectDialog - Confirmation dialog for project deletion with safety checks
 *
 * @remarks
 * Provides a comprehensive confirmation interface for project deletion with name verification,
 * deletion summary display, and safety warnings. Integrates with project management workflow
 * for secure project removal.
 *
 * @example
 * ```tsx
 * <DeleteProjectDialog
 *   project={selectedProject}
 *   isOpen={showDeleteDialog}
 *   onClose={() => setShowDeleteDialog(false)}
 *   onConfirmDelete={handleProjectDelete}
 *   isDeleting={isDeleting}
 * />
 * ```
 */

// 1. External imports
import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useQuery } from 'convex/react';
import { AlertTriangle, Loader2 } from 'lucide-react';

// 2. Internal imports
import { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 3. Types
interface Project {
  _id: Id<'projects'>;
  title: string;
}

interface DeleteProjectDialogProps {
  /** Project to be deleted */
  project: Project | null;
  /** Controls dialog visibility */
  isOpen: boolean;
  /** Callback for closing the dialog */
  onClose: () => void;
  /** Callback for confirming deletion */
  onConfirmDelete: (projectId: Id<'projects'>) => Promise<void>;
  /** Whether deletion is in progress */
  isDeleting?: boolean;
}

// 4. Component definition
export const DeleteProjectDialog = memo(function DeleteProjectDialog({
  project,
  isOpen,
  onClose,
  onConfirmDelete,
  isDeleting = false,
}: DeleteProjectDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [confirmationText, setConfirmationText] = useState('');

  const deletionSummary = useQuery(
    api.projects.getProjectDeletionSummary,
    project ? { projectId: project._id } : 'skip'
  );

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isNameMatch = useMemo(() => {
    return confirmationText.trim() === project?.title;
  }, [confirmationText, project?.title]);

  const canDelete = useMemo(() => {
    return isNameMatch && !isDeleting;
  }, [isNameMatch, isDeleting]);

  const deletionItems = useMemo(() => {
    if (!deletionSummary) return null;
    
    return [
      { label: 'Tasks', count: deletionSummary.taskCount },
      { 
        label: 'Document and pages', 
        count: `${deletionSummary.documentCount} document and ${deletionSummary.pageCount} pages` 
      },
      { label: 'Comments', count: deletionSummary.commentCount }
    ];
  }, [deletionSummary]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleDelete = useCallback(async () => {
    if (!canDelete || !project) return;
    
    try {
      await onConfirmDelete(project._id);
      onClose();
      setConfirmationText('');
    } catch {
      // Parent handles error toast
    }
  }, [canDelete, project, onConfirmDelete, onClose]);

  const handleClose = useCallback(() => {
    if (!isDeleting) {
      onClose();
      setConfirmationText('');
    }
  }, [isDeleting, onClose]);

  const handleConfirmationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationText(e.target.value);
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  useEffect(() => {
    if (!isOpen) setConfirmationText('');
  }, [isOpen]);

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!project) return null;

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 p-3 rounded-md">
            <p className="text-sm font-medium text-destructive mb-2">
              ⚠️ This action cannot be undone
            </p>
            <p className="text-sm text-muted-foreground">
              This will permanently delete:
            </p>
            <ul className="text-sm text-muted-foreground mt-1 ml-4 list-disc">
              <li>Project: &quot;{project.title}&quot;</li>
              {deletionItems ? (
                deletionItems.map((item, index) => (
                  <li key={index}>
                    {typeof item.count === 'number' ? `${item.count} ${item.label}` : item.count}
                  </li>
                ))
              ) : (
                <>
                  <li>Tasks</li>
                  <li>Project brief document and pages</li>
                  <li>Comments linked to the document</li>
                </>
              )}
            </ul>
          </div>

          <div>
            <label className="text-sm font-medium">
              Type the project name to confirm:
            </label>
            <Input
              value={confirmationText}
              onChange={handleConfirmationChange}
              placeholder={project.title}
              className="mt-1"
              disabled={isDeleting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
