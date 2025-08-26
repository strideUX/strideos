/**
 * AccountProfileTab - User profile management component
 *
 * @remarks
 * Provides a comprehensive interface for users to update their personal information,
 * including name, job title, and profile avatar. Handles file uploads with validation,
 * profile updates, and avatar management through Convex mutations.
 *
 * @example
 * ```tsx
 * <AccountProfileTab user={currentUser} />
 * ```
 */

// 1. External imports
import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { useMutation } from 'convex/react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2 } from 'lucide-react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// 3. Types
interface UserShape {
  _id: string;
  name?: string;
  email?: string;
  jobTitle?: string;
  image?: string;
}

interface AccountProfileTabProps {
  /** User data to display and edit */
  user: UserShape;
}

interface FormData {
  name: string;
  email: string;
  jobTitle: string;
}

// 4. Component definition
export const AccountProfileTab = memo(function AccountProfileTab({ 
  user 
}: AccountProfileTabProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    jobTitle: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex mutations
  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const updateUserAvatar = useMutation(api.users.uploadUserAvatar);
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const hasAvatar = useMemo(() => Boolean(user.image), [user.image]);

  const isFormValid = useMemo(() => {
    return formData.name.trim() && formData.jobTitle.trim();
  }, [formData.name, formData.jobTitle]);

  const canSubmit = useMemo(() => {
    return isFormValid && !isSubmitting;
  }, [isFormValid, isSubmitting]);

  const canUpload = useMemo(() => {
    return !isUploading && !isRemoving;
  }, [isUploading, isRemoving]);

  const canRemove = useMemo(() => {
    return hasAvatar && !isRemoving && !isUploading;
  }, [hasAvatar, isRemoving, isUploading]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id || !canSubmit) return;
    
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        name: formData.name,
        jobTitle: formData.jobTitle,
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  }, [user?._id, canSubmit, formData.name, formData.jobTitle, updateUserProfile]);

  const validateFile = useCallback((file: File): string | null => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      return 'Please select a PNG, JPG, GIF, WebP, or SVG file';
    }
    const max = 2 * 1024 * 1024; // 2MB
    if (file.size > max) {
      return 'File size must be less than 2MB';
    }
    return null;
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (validation) {
      toast.error(validation);
      setUploadError(validation);
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': file.type }, 
        body: file 
      });
      
      if (!res.ok) throw new Error('Failed to upload file');
      
      const { storageId } = await res.json();
      await updateUserAvatar({ storageId });
      
      toast.success('Avatar updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload avatar';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [validateFile, generateUploadUrl, updateUserAvatar]);

  const handleRemoveAvatar = useCallback(async () => {
    if (!canRemove) return;
    
    try {
      setIsRemoving(true);
      await updateUserAvatar({ storageId: undefined });
      toast.success('Avatar removed');
    } catch {
      toast.error('Failed to remove avatar');
    } finally {
      setIsRemoving(false);
    }
  }, [canRemove, updateUserAvatar]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        jobTitle: user.jobTitle || '',
      });
    }
  }, [user]);

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => handleChange('name', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => handleChange('email', e.target.value)} 
                  disabled 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle" 
                  value={formData.jobTitle} 
                  onChange={(e) => handleChange('jobTitle', e.target.value)} 
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Add or change your profile photo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml" 
              className="hidden" 
              onChange={handleFileInputChange} 
            />
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {hasAvatar ? (
                  <Image 
                    src={typeof user.image === 'string' ? user.image : ''} 
                    alt="avatar" 
                    width={80} 
                    height={80} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">No Avatar</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={!canUpload} 
                  onClick={handleUploadClick}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>
                {hasAvatar && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={!canRemove} 
                    onClick={handleRemoveAvatar}
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
            </div>
            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Supports PNG, JPG, GIF, WebP, SVG up to 2MB
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
