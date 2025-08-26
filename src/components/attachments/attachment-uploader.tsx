'use client';

import { useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useFileUpload } from '@/hooks/use-file-upload';

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

  const anyApi = api as any;
  const generateUploadUrl = useMutation(anyApi.attachments.generateUploadUrl);
  const createAttachment = useMutation(anyApi.attachments.createAttachment);

  const {
    isUploading,
    progress,
    error,
    uploadFiles,
    clearError,
    reset
  } = useFileUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    onSuccess: async (files) => {
      try {
        for (const file of files) {
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
        reset();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Upload failed');
      }
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFiles(Array.from(files));
    if (inputRef.current) inputRef.current.value = '';
  }, [uploadFiles]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    void handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className={cn('border-2 border-dashed rounded-lg p-6 text-center', className)}>
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
          <span>Uploading... {progress > 0 && `${progress}%`}</span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default AttachmentUploader;


