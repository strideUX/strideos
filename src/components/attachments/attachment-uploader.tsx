/**
 * AttachmentUploader - File upload component for various entity types
 *
 * @remarks
 * Handles file uploads for tasks, comments, projects, and documents with
 * drag-and-drop support, progress tracking, and Convex integration. Provides
 * comprehensive error handling and user feedback during upload operations.
 *
 * @example
 * ```tsx
 * <AttachmentUploader 
 *   entityType="task" 
 *   entityId="task_123" 
 *   onUploadComplete={refreshAttachments} 
 * />
 * ```
 */

// 1. External imports
import React, { useCallback, useRef, useMemo, memo } from 'react';
import { useMutation } from 'convex/react';
import { Upload, Loader2 } from 'lucide-react';

// 2. Internal imports
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useFileUpload } from '@/hooks/use-file-upload';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// 3. Types
export type AttachmentEntityType = 'task' | 'comment' | 'project' | 'document';

interface AttachmentUploaderProps {
  /** Type of entity to attach files to */
  entityType: AttachmentEntityType;
  /** ID of the entity to attach files to */
  entityId: string;
  /** Optional task ID for task-specific attachments */
  taskId?: Id<'tasks'>;
  /** Callback when upload completes successfully */
  onUploadComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

interface UploadResult {
  storageId: Id<'_storage'>;
}

// 4. Component definition
export const AttachmentUploader = memo(function AttachmentUploader({ 
  entityType, 
  entityId, 
  taskId, 
  onUploadComplete, 
  className 
}: AttachmentUploaderProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const inputRef = useRef<HTMLInputElement>(null);

  // Convex mutations
  const anyApi = api as any;
  const generateUploadUrl = useMutation(anyApi.attachments.generateUploadUrl);
  const createAttachment = useMutation(anyApi.attachments.createAttachment);

  // File upload hook
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
          
          const { storageId } = await result.json() as UploadResult;

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

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const uploadAreaClasses = useMemo(() => {
    return cn(
      'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
      isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
      className
    );
  }, [isUploading, className]);

  const hasError = useMemo(() => {
    return Boolean(error);
  }, [error]);

  const canUpload = useMemo(() => {
    return !isUploading;
  }, [isUploading]);

  const progressPercentage = useMemo(() => {
    return Math.round(progress);
  }, [progress]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFiles(Array.from(files));
    if (inputRef.current) inputRef.current.value = '';
  }, [uploadFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files);
  }, [handleFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    void handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className={uploadAreaClasses}>
      <input
        ref={inputRef}
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileInputChange}
        multiple
        accept="*/*"
        disabled={!canUpload}
      />
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="space-y-4"
      >
        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
            <p className="text-sm font-medium text-blue-600">Uploading...</p>
            <Progress value={progressPercentage} className="w-full" />
            <p className="text-xs text-gray-500">{progressPercentage}% complete</p>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto text-gray-400" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports up to 10 files, max 10MB each
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={!canUpload}
            >
              Choose Files
            </Button>
          </>
        )}
      </div>

      {hasError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={handleClearError}>
              Dismiss
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});


