'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { IconLoader2, IconMail, IconPalette, IconSettings } from '@tabler/icons-react';
import { ColorPicker } from '@/components/ui/color-picker';

interface Organization {
  _id: string;
  emailFromAddress?: string;
  emailFromName?: string;
  primaryColor?: string;
  features?: {
    emailInvitations?: boolean;
    slackIntegration?: boolean;
    clientPortal?: boolean;
  };
}

interface SettingsEmailTabProps {
  organization: Organization;
}

export function SettingsEmailTab({ organization }: SettingsEmailTabProps) {
  const [formData, setFormData] = useState({
    emailFromAddress: '',
    emailFromName: '',
    primaryColor: '#0E1828',
    features: {
      emailInvitations: true,
      slackIntegration: false,
      clientPortal: false,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateOrganization = useMutation(api.organizations.updateOrganization);

  // Initialize form data when organization loads
  useEffect(() => {
    if (organization) {
      setFormData({
        emailFromAddress: organization.emailFromAddress || '',
        emailFromName: organization.emailFromName || '',
        primaryColor: organization.primaryColor || '#0E1828',
        features: {
          emailInvitations: organization.features?.emailInvitations ?? true,
          slackIntegration: organization.features?.slackIntegration ?? false,
          clientPortal: organization.features?.clientPortal ?? false,
        },
      });
    }
  }, [organization]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeatureToggle = (feature: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateOrganization({
        organizationId: organization._id,
        emailFromAddress: formData.emailFromAddress,
        emailFromName: formData.emailFromName,
        primaryColor: formData.primaryColor,
        features: formData.features,
      });

      toast.success('Email & feature settings updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate hex color
  const isValidHexColor = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
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
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMail className="w-5 h-5" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure email sender information and branding for system emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailFromAddress">From Email Address *</Label>
                <Input
                  id="emailFromAddress"
                  type="email"
                  value={formData.emailFromAddress}
                  onChange={(e) => handleInputChange('emailFromAddress', e.target.value)}
                  placeholder="admin@yourcompany.com"
                  required
                />
                <p className="text-xs text-slate-500">
                  This email will appear as the sender for all system emails
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailFromName">From Name *</Label>
                <Input
                  id="emailFromName"
                  value={formData.emailFromName}
                  onChange={(e) => handleInputChange('emailFromName', e.target.value)}
                  placeholder="Your Company Name"
                  required
                />
                <p className="text-xs text-slate-500">
                  This name will appear as the sender for all system emails
                </p>
              </div>
            </div>

            {/* Brand Color */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconPalette className="w-4 h-4 text-slate-500" />
                <Label className="text-base font-medium">Brand Color</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <ColorPicker
                    label="Primary Color (Hex)"
                    value={formData.primaryColor}
                    onChange={(color) => handleInputChange('primaryColor', color)}
                  />
                  <p className="text-xs text-slate-500">
                    Used in email templates and branding throughout the platform
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Brand Application Preview</Label>
                  <div className="p-3 rounded-md border" style={{ backgroundColor: isValidHexColor(formData.primaryColor) ? formData.primaryColor : '#0E1828' }}>
                    <p className="text-white text-sm font-medium">strideOS Platform</p>
                    <p className="text-white/80 text-xs">This color will be used in emails and branding</p>
                  </div>
                </div>
              </div>
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

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSettings className="w-5 h-5" />
            Feature Toggles
          </CardTitle>
          <CardDescription>
            Enable or disable specific platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email Invitations */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="emailInvitations"
                  checked={formData.features.emailInvitations}
                  onCheckedChange={(checked) => handleFeatureToggle('emailInvitations', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="emailInvitations" className="text-base font-medium">
                    Email Invitations
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Allow sending email invitations to new users. When disabled, admins must manually activate accounts.
                  </p>
                </div>
              </div>

              {/* Slack Integration */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="slackIntegration"
                  checked={formData.features.slackIntegration}
                  onCheckedChange={(checked) => handleFeatureToggle('slackIntegration', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="slackIntegration" className="text-base font-medium">
                    Slack Integration
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Enable Slack notifications and integrations. Requires additional configuration.
                  </p>
                </div>
              </div>

              {/* Client Portal */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="clientPortal"
                  checked={formData.features.clientPortal}
                  onCheckedChange={(checked) => handleFeatureToggle('clientPortal', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="clientPortal" className="text-base font-medium">
                    Client Portal
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Enable client portal access for project documents and updates.
                  </p>
                </div>
              </div>
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

      {/* Email Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
          <CardDescription>
            Preview how your emails will appear with current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: isValidHexColor(formData.primaryColor) ? formData.primaryColor : '#0E1828' }}
                  />
                  <span className="font-medium">{formData.emailFromName || 'Your Company'}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  From: {formData.emailFromAddress || 'admin@yourcompany.com'}
                </p>
                <div className="pt-2 border-t">
                  <p className="text-sm">
                    This is how your organization&apos;s emails will appear to recipients.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
