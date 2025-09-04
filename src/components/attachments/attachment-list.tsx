/**
 * AttachmentList - File attachment display and management component
 *
 * @remarks
 * Renders a list of file attachments with preview capabilities, metadata display,
 * and deletion functionality. Supports image previews and provides confirmation
 * dialogs for destructive actions.
 *
 * @example
 * ```tsx
 * <AttachmentList 
 *   attachments={taskAttachments} 
 *   onDelete={handleDeleteAttachment} 
 * />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo, MouseEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// 2. Internal imports
import { Button } from '@/components/ui/button';
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

// 3. Types
export interface AttachmentRecord {
  _id: string;
  filename: string;
  mimeType: string;
  uploadedAt: number;
  url?: string | null;
}

interface AttachmentListProps {
  /** Array of attachment records to display */
  attachments: AttachmentRecord[];
  /** Optional callback for attachment deletion */
  onDelete?: (id: string) => void;
}

interface FileIconProps {
  type: string;
}

// 4. Component definition
export const AttachmentList = memo(function AttachmentList({ 
  attachments, 
  onDelete 
}: AttachmentListProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const hasAttachments = useMemo(() => {
    return attachments.length > 0;
  }, [attachments.length]);

  const isConfirmDialogOpen = useMemo(() => {
    return Boolean(confirmId);
  }, [confirmId]);

  const selectedAttachment = useMemo(() => {
    if (!confirmId) return null;
    return attachments.find(att => att._id === confirmId);
  }, [confirmId, attachments]);

  const canDelete = useMemo(() => {
    return Boolean(onDelete);
  }, [onDelete]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const openConfirm = useCallback((e: MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmId(id);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmId(null);
  }, []);

  const handleConfirmDelete = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmId && onDelete) {
      onDelete(confirmId);
    }
    setConfirmId(null);
  }, [confirmId, onDelete]);

  const isImage = useCallback((mime: string): boolean => {
    return mime.startsWith('image/');
  }, []);

  const formatUploadTime = useCallback((timestamp: number): string => {
    return formatDistanceToNow(timestamp) + ' ago';
  }, []);

  const handleViewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const renderFileIcon = useCallback(({ type }: FileIconProps) => {
    return (
      <div className="w-10 h-10 rounded bg-muted text-muted-foreground flex items-center justify-center text-xs">
        {type.split('/')[1]?.toUpperCase() || 'FILE'}
      </div>
    );
  }, []);

  const renderAttachment = useCallback((attachment: AttachmentRecord) => (
    <div key={attachment._id} className="flex items-center gap-3 p-2 border rounded">
      <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded">
        {isImage(attachment.mimeType) && attachment.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={attachment.url} 
            className="w-full h-full object-cover" 
            alt={attachment.filename} 
          />
        ) : (
          renderFileIcon({ type: attachment.mimeType })
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{attachment.filename}</p>
        <p className="text-xs text-muted-foreground">
          {formatUploadTime(attachment.uploadedAt)}
        </p>
      </div>

      <div className="flex gap-2">
        {attachment.url && (
          <Button size="sm" variant="ghost" asChild>
            <a 
              href={attachment.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={handleViewClick}
            >
              View
            </a>
          </Button>
        )}
        {canDelete && (
          <Button 
            type="button" 
            size="sm" 
            variant="ghost" 
            onClick={(e) => openConfirm(e, attachment._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  ), [isImage, renderFileIcon, formatUploadTime, handleViewClick, canDelete, openConfirm]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!hasAttachments) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No attachments found</p>
      </div>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-2">
      {attachments.map(renderAttachment)}

      {/* Confirm delete dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={(open) => !open && closeConfirm()}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedAttachment?.filename}&quot;? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});


