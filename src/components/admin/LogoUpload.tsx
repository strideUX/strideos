import React, { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { IconBuilding, IconUpload, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface LogoUploadProps {
  client: { _id: Id<"clients">; name: string; logo?: Id<"_storage"> };
  onLogoUpdate?: (storageId: Id<"_storage"> | null) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function LogoUpload({ 
  client, 
  onLogoUpdate, 
  size = 'md', 
  showLabel = true 
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.clients.generateLogoUploadUrl);
  const updateClientLogo = useMutation(api.clients.updateClientLogo);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPG, PNG, GIF, or SVG)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB';
    }
    return null;
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error('Failed to upload file');
      }

      const { storageId } = await result.json();

      // Update client logo
      await updateClientLogo({
        clientId: client._id,
        storageId: storageId as Id<"_storage">,
      });

      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      onLogoUpdate?.(storageId as Id<"_storage">);
      toast.success('Logo updated successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [client._id, generateUploadUrl, updateClientLogo, onLogoUpdate]);

  const handleRemoveLogo = async () => {
    setIsUploading(true);
    try {
      await updateClientLogo({
        clientId: client._id,
        storageId: undefined,
      });

      setPreviewUrl(null);
      onLogoUpdate?.(null);
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Logo removal error:', error);
      toast.error('Failed to remove logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {showLabel && (
        <Label className="text-sm font-medium text-gray-700">
          Company Logo
        </Label>
      )}
      
      <div className="flex items-center gap-4">
        {/* Logo Preview */}
        <div className={cn(
          'relative bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed transition-colors',
          sizeClasses[size],
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300',
          isUploading && 'opacity-50'
        )}>
          {client.logo || previewUrl ? (
            <>
              <img
                src={previewUrl || `/api/storage/${client.logo}`}
                alt={`${client.name} logo`}
                className={cn('object-cover', sizeClasses[size])}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="hidden absolute inset-0 bg-gray-100 rounded-lg items-center justify-center">
                <IconBuilding className={cn('text-gray-400', iconSizes[size])} />
              </div>
            </>
          ) : (
            <IconBuilding className={cn('text-gray-400', iconSizes[size])} />
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          <div
            className={cn(
              'relative cursor-pointer',
              isUploading && 'pointer-events-none opacity-50'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Input
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              onChange={handleFileInput}
              className="hidden"
              id={`logo-upload-${client._id}`}
              disabled={isUploading}
            />
            <Label
              htmlFor={`logo-upload-${client._id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <IconUpload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Logo'}
            </Label>
          </div>

          {(client.logo || previewUrl) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <IconX className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Supported formats: JPG, PNG, GIF, SVG (max 2MB)
      </p>
    </div>
  );
}
