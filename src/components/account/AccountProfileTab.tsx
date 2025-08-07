'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2 } from 'lucide-react';

interface UserShape {
  _id: string;
  name?: string;
  email?: string;
  jobTitle?: string;
  image?: string;
}

interface AccountProfileTabProps {
  user: UserShape;
}

export function AccountProfileTab({ user }: AccountProfileTabProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jobTitle: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile image URL fetcher (if using storage IDs in future)
  // Currently users.image is a string URL; if migrating to storageId, add a query like clients.getLogoUrl

  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const updateUserAvatar = useMutation(api.users.uploadUserAvatar);
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        jobTitle: user.jobTitle || '',
      });
    }
  }, [user]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        name: formData.name,
        jobTitle: formData.jobTitle,
      } as any);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateFile = (file: File): string | null => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) return 'Please select a PNG, JPG, GIF, WebP, or SVG file';
    const max = 2 * 1024 * 1024;
    if (file.size > max) return 'File size must be less than 2MB';
    return null;
  };

  const handleFileUpload = async (file: File) => {
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
      const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      if (!res.ok) throw new Error('Failed to upload file');
      const { storageId } = await res.json();
      // For now, we store the public URL via storage.getUrl server-side would be ideal. Patch `image` with storageId URL not available here.
      // Minimal path: store the storageId string in image field and resolve on display sites that query URL by storageId when needed.
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
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsRemoving(true);
      await updateUserAvatar({ storageId: undefined as any });
      toast.success('Avatar removed');
    } catch (err) {
      toast.error('Failed to remove avatar');
    } finally {
      setIsRemoving(false);
    }
  };

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
                <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} disabled />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input id="jobTitle" value={formData.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
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
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }} />
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {/* If image stores storageId, URL resolution should be done elsewhere. Show placeholder for now. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {user.image ? (
                  <img src={typeof user.image === 'string' ? user.image : ''} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xs text-muted-foreground">No Avatar</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload
                </Button>
                {user.image && (
                  <Button type="button" variant="outline" disabled={isRemoving || isUploading} onClick={handleRemoveAvatar}>
                    {isRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Remove
                  </Button>
                )}
              </div>
            </div>
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
            <p className="text-xs text-muted-foreground">Supports PNG, JPG, GIF, WebP, SVG up to 2MB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
