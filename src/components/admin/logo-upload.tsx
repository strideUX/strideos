/**
 * LogoUpload - Component for uploading and managing client logos
 * 
 * @remarks
 * Supports drag-and-drop file upload, file validation, and logo removal.
 * Uses Convex for file storage and real-time updates.
 */

'use client';

// 1. External imports
import React, { useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import Image from 'next/image';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// 2. Internal imports
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import type { Client } from '@/types/client';
import type { Id } from '@/convex/_generated/dataModel';
import { useFileUpload } from '@/hooks/use-file-upload';

// 3. Types
type LogoSize = 'sm' | 'md' | 'lg';

interface LogoUploadProps {
  /** Client object containing logo information */
  client: Client;
  /** Size variant for the upload component */
  size?: LogoSize;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback fired when upload completes successfully */
  onUploadSuccess?: () => void;
  /** Callback fired when logo is removed */
  onRemoveSuccess?: () => void;
}

interface LogoDisplayProps {
  /** Storage ID for the logo */
  storageId?: Id<'_storage'>;
  /** Client name for alt text */
  clientName: string;
  /** Whether upload is in progress */
  isUploading: boolean;
}

// 4. Constants
const SIZE_CLASSES: Record<LogoSize, string> = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32'
} as const;

const ALLOWED_FILE_TYPES = [
  'image/png', 
  'image/jpeg', 
  'image/jpg', 
  'image/gif', 
  'image/webp', 
  'image/svg+xml'
] as const;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// 5. Helper functions
function validateFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
    return 'Please select a PNG, JPG, GIF, WebP, or SVG file';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 2MB';
  }

  return null;
}

// 6. Sub-components
/**
 * LogoDisplay - Displays the client logo or null if not available
 */
function LogoDisplay({ storageId, clientName, isUploading }: LogoDisplayProps) {
  const logoUrl = useQuery(
    api.clients.getLogoUrl, 
    storageId ? { storageId } : 'skip'
  );

  if (!storageId || isUploading || !logoUrl) {
    return null;
  }

  return (
    <Image
      src={logoUrl}
      alt={`${clientName} logo`}
      width={80}
      height={80}
      className="w-full h-full object-cover rounded-lg"
    />
  );
}

/**
 * Custom hook for logo upload functionality using existing useFileUpload
 */
function useLogoUpload(clientId: Id<'clients'>) {
  const updateClientLogo = useMutation(api.clients.updateClientLogo);
  const generateUploadUrl = useMutation(api.clients.generateLogoUploadUrl);

  const {
    isUploading,
    progress,
    error: uploadError,
    uploadFiles,
    removeFile,
    clearError,
    reset
  } = useFileUpload({
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_FILE_TYPES,
    maxFiles: 1,
    onSuccess: async (files) => {
      try {
        // Get upload URL and upload file
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': files[0].type },
          body: files[0],
        });

        if (!result.ok) {
          throw new Error('Failed to upload file to storage');
        }

        const { storageId } = await result.json();
        await updateClientLogo({
          clientId,
          storageId: storageId as Id<'_storage'>,
        });

        toast.success('Logo uploaded successfully');
        reset();
      } catch (error) {
        toast.error('Failed to upload logo');
      }
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const removeLogo = async (): Promise<boolean> => {
    try {
      await updateClientLogo({
        clientId,
        storageId: undefined,
      });
      toast.success('Logo removed successfully');
      return true;
    } catch (error) {
      toast.error('Failed to remove logo');
      return false;
    }
  };

  return {
    isUploading,
    isRemoving: false, // Not needed with useFileUpload
    uploadError,
    uploadLogo: (file: File) => uploadFiles([file]),
    removeLogo,
    clearError,
  };
}

// 7. Main component
export function LogoUpload({ 
  client, 
  size = 'md', 
  showLabel = true, 
  className = '',
  onUploadSuccess,
  onRemoveSuccess
}: LogoUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom hook for logo operations
  const { 
    isUploading, 
    uploadError, 
    uploadLogo, 
    removeLogo,
    clearError
  } = useLogoUpload(client._id as Id<'clients'>);

  // Memoized callbacks
  const handleFileUpload = useCallback(async (file: File) => {
    const success = await uploadLogo(file);
    if (success) {
      onUploadSuccess?.();
    }
  }, [uploadLogo, onUploadSuccess]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const handleRemoveLogo = useCallback(async () => {
    if (!confirm('Are you sure you want to remove the logo?')) {
      return;
    }

    const success = await removeLogo();
    if (success) {
      onRemoveSuccess?.();
    }
  }, [removeLogo, onRemoveSuccess]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleClick = useCallback(() => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isUploading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Company Logo
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload logo file"
      />

      {/* Drop zone with current logo or placeholder */}
      <div
        className={`
          border-2 border-dashed rounded-lg transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
          ${SIZE_CLASSES[size]}
          flex items-center justify-center cursor-pointer
          hover:border-gray-400 dark:hover:border-gray-500
          ${isUploading ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Click or drag to upload logo"
        onKeyDown={handleKeyDown}
      >
        <LogoDisplay storageId={client.logo} clientName={client.name} isUploading={isUploading} />
        
        {/* Fallback/placeholder content */}
        <div className={`text-center ${client.logo && !isUploading ? 'hidden' : 'flex flex-col items-center justify-center'}`}>
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {size === 'lg' ? 'Drop logo here or click to upload' : 'Upload'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-red-600 dark:text-red-400">
            {uploadError}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="h-6 px-2"
          >
            ×
          </Button>
        </div>
      )}

      {/* Remove button (when logo exists) */}
      {client.logo && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveLogo}
          disabled={isUploading}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Logo
        </Button>
      )}

      {/* Help text */}
      {showLabel && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Supports PNG, JPG, GIF, WebP, SVG up to 2MB
        </p>
      )}
    </div>
  );
}
