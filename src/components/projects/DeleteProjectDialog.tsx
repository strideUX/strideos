import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Id } from '@/../convex/_generated/dataModel';

interface Project {
  _id: Id<'projects'>;
  title: string;
}

interface DeleteProjectDialogProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (projectId: Id<'projects'>) => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteProjectDialog({
  project,
  isOpen,
  onClose,
  onConfirmDelete,
  isDeleting = false,
}: DeleteProjectDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');

  if (!project) return null;

  const isNameMatch = confirmationText.trim() === project.title;

  const handleDelete = async () => {
    if (!isNameMatch || isDeleting) return;
    try {
      await onConfirmDelete(project._id);
      onClose();
      setConfirmationText('');
    } catch (error) {
      // Parent handles error toast
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
      setConfirmationText('');
    }
  };

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
            <p className="text-sm font-medium text-destructive mb-2">⚠️ This action cannot be undone</p>
            <p className="text-sm text-muted-foreground">This will permanently delete:</p>
            <ul className="text-sm text-muted-foreground mt-1 ml-4 list-disc">
              <li>Project: &quot;{project.title}&quot;</li>
              <li>All associated tasks</li>
              <li>Project brief document and all sections</li>
              <li>All project history and data</li>
            </ul>
          </div>

          <div>
            <label className="text-sm font-medium">Type the project name to confirm:</label>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={project.title}
              className="mt-1"
              disabled={isDeleting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isNameMatch || isDeleting}
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
}
