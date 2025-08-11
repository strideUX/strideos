'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { Client } from '@/types/client';

interface LogoUploadProps {
  client: Client;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// LogoDisplay component to handle conditional hook calls
function LogoDisplay({ storageId, clientName, isUploading }: { storageId?: string; clientName: string; isUploading: boolean }) {
  // Only call the hook if we have a valid storageId
  const logoUrl = useQuery(
    api.clients.getLogoUrl, 
    storageId ? { storageId: storageId } : "skip"
  );

  if (!storageId || isUploading || !logoUrl) {
    return null;
  }

  return (
    <img
      src={logoUrl}
      alt={`${clientName} logo`}
      className="w-full h-full object-cover rounded-lg"
      onError={(e) => {
        // Fallback to placeholder if image fails to load
        e.currentTarget.style.display = 'none';
        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
        if (fallback) fallback.style.display = 'flex';
      }}
    />
  );
}

export function LogoUpload({ 
  client, 
  size = 'md', 
  showLabel = true, 
  className = '' 
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.clients.generateLogoUploadUrl);
  const updateClientLogo = useMutation(api.clients.updateClientLogo);

  // Size configurations
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  // File validation
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a PNG, JPG, GIF, WebP, or SVG file';
    }

    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 2MB';
    }

    return null;
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      setUploadError(validationError);
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error('Failed to upload file to storage');
      }

      const { storageId } = await result.json();

              // Update client with new logo
        await updateClientLogo({
          clientId: client._id,
          storageId: storageId,
        });

      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload logo';
      toast.error(errorMessage);
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // File selection handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove logo handler
  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) {
      return;
    }

    try {
      setIsRemoving(true);
              await updateClientLogo({
          clientId: client._id,
          storageId: undefined, // null removes logo
        });
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove logo');
    } finally {
      setIsRemoving(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

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
          ${sizeClasses[size]}
          flex items-center justify-center cursor-pointer
          hover:border-gray-400 dark:hover:border-gray-500
          ${isUploading ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Click or drag to upload logo"
                 onKeyDown={(e) => {
           if (e.key === 'Enter' || e.key === ' ') {
             e.preventDefault();
             if (!isUploading && fileInputRef.current) {
               fileInputRef.current.click();
             }
           }
         }}
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
        <p className="text-sm text-red-600 dark:text-red-400">
          {uploadError}
        </p>
      )}

      {/* Remove button (when logo exists) */}
      {client.logo && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveLogo}
          disabled={isRemoving || isUploading}
          className="w-full"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
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
