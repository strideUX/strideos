'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type AttachmentEntityType = 'task' | 'comment' | 'project' | 'document';

interface AttachmentUploaderProps {
  entityType: AttachmentEntityType;
  entityId: string;
  taskId?: Id<'tasks'>;
  onUploadComplete?: () => void;
  className?: string;
}

export function AttachmentUploader({ entityType, entityId, taskId, onUploadComplete, className }: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const anyApi = api as any;
  const generateUploadUrl = useMutation(anyApi.attachments.generateUploadUrl);
  const createAttachment = useMutation(anyApi.attachments.createAttachment);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!result.ok) throw new Error('Upload failed');
        const { storageId } = await result.json();

        await createAttachment({
          storageId: storageId as Id<'_storage'>,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          entityType,
          entityId,
          taskId,
        });
      }
      toast.success('Uploaded successfully');
      onUploadComplete?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [createAttachment, entityId, entityType, generateUploadUrl, onUploadComplete, taskId]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    void handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className={cn('border-2 border-dashed rounded-lg p-6 text-center', dragActive ? 'border-primary/60 bg-primary/5' : '', className)}>
      <input
        ref={inputRef}
        type="file"
        id="file-upload"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
        multiple
      />

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`cursor-pointer ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drop files to attach or <span className="text-primary">Browse</span>
        </p>
      </div>

      {isUploading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}
    </div>
  );
}

export default AttachmentUploader;


