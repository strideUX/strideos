'use client';

import { useState, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface AttachmentRecord {
  _id: string;
  filename: string;
  mimeType: string;
  uploadedAt: number;
  url?: string | null;
}

interface AttachmentListProps {
  attachments: AttachmentRecord[];
  onDelete?: (id: string) => void;
}

function isImage(mime: string): boolean {
  return mime.startsWith('image/');
}

function FileIcon({ type }: { type: string }) {
  // Minimal placeholder; can be enhanced to map specific MIME types
  return (
    <div className="w-10 h-10 rounded bg-muted text-muted-foreground flex items-center justify-center text-xs">
      {type.split('/')[1]?.toUpperCase() || 'FILE'}
    </div>
  );
}

export function AttachmentList({ attachments, onDelete }: AttachmentListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const openConfirm = (e: MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmId(id);
  };

  const closeConfirm = () => setConfirmId(null);

  const handleConfirmDelete = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmId && onDelete) onDelete(confirmId);
    setConfirmId(null);
  };

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div key={attachment._id} className="flex items-center gap-3 p-2 border rounded">
          <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded">
            {isImage(attachment.mimeType) && attachment.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attachment.url} className="w-full h-full object-cover" alt={attachment.filename} />
            ) : (
              <FileIcon type={attachment.mimeType} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{attachment.filename}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(attachment.uploadedAt)} ago
            </p>
          </div>

          <div className="flex gap-2">
            {attachment.url ? (
              <Button size="sm" variant="ghost" asChild>
                <a href={attachment.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>View</a>
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="ghost" onClick={(e) => openConfirm(e, attachment._id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmId} onOpenChange={(open) => !open && closeConfirm()}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => { e.stopPropagation(); closeConfirm(); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AttachmentList;


