/**
 * LogoUpload - Component for uploading and managing client logos
 *
 * @remarks
 * Supports drag-and-drop file upload, file validation, and logo removal.
 * Uses Convex for file storage and real-time updates. Provides multiple size
 * variants and handles various image formats with size validation.
 *
 * @example
 * ```tsx
 * <LogoUpload
 *   client={clientData}
 *   size="md"
 *   showLabel={true}
 *   onUploadSuccess={() => toast.success('Logo uploaded!')}
 *   onRemoveSuccess={() => toast.success('Logo removed!')}
 * />
 * ```
 */

// 1. External imports
import React, { useRef, useCallback, useMemo, memo } from 'react';
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

// 3. Types (if not in separate file)
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

// 4. Component definition
export const LogoUpload = memo(function LogoUpload({
  client,
  size = 'md',
  showLabel = true,
  className = '',
  onUploadSuccess,
  onRemoveSuccess,
}: LogoUploadProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading } = useFileUpload();
  const generateUploadUrl = useMutation(api.clients.generateLogoUploadUrl as any);
  const updateClientLogo = useMutation(api.clients.updateClientLogo as any);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const SIZE_CLASSES: Record<LogoSize, string> = useMemo(() => ({
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  }), []);

  const ALLOWED_FILE_TYPES = useMemo(() => [
    'image/png', 
    'image/jpeg', 
    'image/jpg', 
    'image/gif', 
    'image/webp', 
    'image/svg+xml'
  ], []);

  const MAX_FILE_SIZE = useMemo(() => 2 * 1024 * 1024, []); // 2MB

  const sizeClasses = useMemo(() => SIZE_CLASSES[size], [SIZE_CLASSES, size]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
      return 'Please select a PNG, JPG, GIF, WebP, or SVG file';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB';
    }

    return null;
  }, [ALLOWED_FILE_TYPES, MAX_FILE_SIZE]);

  const handleFileSelect = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      // Generate upload URL and upload file
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const { storageId } = await response.json();
      
      // Update client logo
      await updateClientLogo({ clientId: client._id, storageId });
      toast.success('Logo uploaded successfully!');
      onUploadSuccess?.();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload logo. Please try again.');
    }
  }, [validateFile, generateUploadUrl, updateClientLogo, client._id, onUploadSuccess]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
      // Reset input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleRemoveLogo = useCallback(async () => {
    if (!client.logo) return;

    try {
      await updateClientLogo({ clientId: client._id, storageId: undefined });
      toast.success('Logo removed successfully!');
      onRemoveSuccess?.();
    } catch (error) {
      console.error('Remove failed:', error);
      toast.error('Failed to remove logo. Please try again.');
    }
  }, [client.logo, client._id, updateClientLogo, onRemoveSuccess]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed in this component)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className={`space-y-3 ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Client Logo
        </label>
      )}

      <div className="flex items-center gap-4">
        {/* Logo Display */}
        <div className={`${sizeClasses} flex-shrink-0`}>
          <LogoDisplay
            storageId={client.logo}
            clientName={client.name}
            isUploading={isUploading}
          />
        </div>

        {/* Upload Area */}
        <div className="flex-1">
          <div
            className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer ${
              isUploading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleUploadClick}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading...
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  PNG, JPG, GIF, WebP, SVG up to 2MB
                </div>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Remove Button */}
        {client.logo && !isUploading && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveLogo}
            className="flex-shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
});

// Sub-component: LogoDisplay
const LogoDisplay = memo(function LogoDisplay({ 
  storageId, 
  clientName, 
  isUploading 
}: LogoDisplayProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const logoUrl = useQuery(
    api.clients.getLogoUrl, 
    storageId ? { storageId } : 'skip'
  );

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!storageId || isUploading || !logoUrl) {
    return null;
  }

  // === 7. RENDER (JSX) ===
  return (
    <Image
      src={logoUrl}
      alt={`${clientName} logo`}
      width={128}
      height={128}
      className="w-full h-full object-cover rounded-lg"
    />
  );
});
