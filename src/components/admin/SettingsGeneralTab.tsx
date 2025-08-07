'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { IconUpload, IconTrash, IconLoader2 } from '@tabler/icons-react';

interface SettingsGeneralTabProps {
  organization: any; // Will be properly typed once we have the organization type
}

// Timezone options for the select dropdown
const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'Mumbai (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

export function SettingsGeneralTab({ organization }: SettingsGeneralTabProps) {
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    timezone: 'America/New_York',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const updateOrganization = useMutation(api.organizations.updateOrganization);
  const generateLogoUploadUrl = useMutation(api.organizations.generateLogoUploadUrl);
  const updateOrganizationLogo = useMutation(api.organizations.updateOrganizationLogo);
  
  // Get logo URL if logo exists
  const logoUrl = useQuery(
    api.organizations.getOrganizationLogoUrl,
    organization?.logo ? { storageId: organization.logo } : 'skip'
  );

  // Initialize form data when organization loads
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        website: organization.website || '',
        timezone: organization.timezone || 'America/New_York',
      });
    }
  }, [organization]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateOrganization({
        organizationId: organization._id,
        name: formData.name,
        website: formData.website || undefined,
        timezone: formData.timezone,
      });

      toast.success('General settings updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    // Validate file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a PNG, JPG, GIF, WebP, or SVG file');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 2MB');
      return;
    }

    try {
      setIsUploadingLogo(true);

      // Get upload URL from Convex
      const uploadUrl = await generateLogoUploadUrl();

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

      // Update organization with new logo
      await updateOrganizationLogo({
        organizationId: organization._id,
        storageId: storageId,
      });

      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the organization logo?')) {
      return;
    }

    try {
      await updateOrganizationLogo({
        organizationId: organization._id,
        storageId: undefined,
      });
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-600">Loading organization settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Basic organization details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Logo</CardTitle>
          <CardDescription>
            Upload your organization&apos;s logo for branding across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Logo Display */}
            {organization.logo && logoUrl && (
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <img
                    src={logoUrl}
                    alt="Organization logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Current Logo</p>
                  <p className="text-xs text-slate-500">Logo is being used across the platform</p>
                </div>
              </div>
            )}

            {/* Upload Controls */}
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload"
                  disabled={isUploadingLogo}
                />
                <Label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingLogo ? (
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconUpload className="w-4 h-4" />
                  )}
                  {organization.logo ? 'Change Logo' : 'Upload Logo'}
                </Label>
              </div>

              {organization.logo && (
                <Button
                  variant="outline"
                  onClick={handleRemoveLogo}
                  disabled={isUploadingLogo}
                >
                  <IconTrash className="w-4 h-4 mr-2" />
                  Remove Logo
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Supports PNG, JPG, GIF, WebP, SVG up to 2MB. Recommended size: 200x200px or larger.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
