'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">View</a>
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => onDelete?.(attachment._id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AttachmentList;


