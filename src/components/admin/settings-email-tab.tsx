/**
 * SettingsEmailTab - Email configuration and feature management tab
 *
 * @remarks
 * Comprehensive settings tab for configuring email sender information, brand colors,
 * and platform feature toggles. Supports real-time preview of email branding.
 * Integrates with Convex for organization settings persistence.
 *
 * @example
 * ```tsx
 * <SettingsEmailTab organization={orgData} />
 * ```
 */

// 1. External imports
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useMutation } from 'convex/react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { IconLoader2, IconMail, IconPalette, IconSettings } from '@tabler/icons-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { Id } from '@/convex/_generated/dataModel';

// 3. Types
interface Organization {
  _id: Id<'organizations'>;
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
  /** Organization data for settings configuration */
  organization: Organization;
}

interface EmailFormData {
  emailFromAddress: string;
  emailFromName: string;
  primaryColor: string;
  features: {
    emailInvitations: boolean;
    slackIntegration: boolean;
    clientPortal: boolean;
  };
}

// 4. Component definition
export const SettingsEmailTab = memo(function SettingsEmailTab({ 
  organization 
}: SettingsEmailTabProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [formData, setFormData] = useState<EmailFormData>({
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

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isValidColor = useMemo(() => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(formData.primaryColor);
  }, [formData.primaryColor]);

  const displayColor = useMemo(() => {
    return isValidColor ? formData.primaryColor : '#0E1828';
  }, [isValidColor, formData.primaryColor]);

  const submitButtonText = useMemo(() => {
    if (isSubmitting) return 'Saving...';
    return 'Save Changes';
  }, [isSubmitting]);

  const companyName = useMemo(() => {
    return formData.emailFromName || 'Your Company';
  }, [formData.emailFromName]);

  const companyEmail = useMemo(() => {
    return formData.emailFromAddress || 'admin@yourcompany.com';
  }, [formData.emailFromAddress]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleInputChange = useCallback((field: keyof EmailFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleFeatureToggle = useCallback((feature: keyof EmailFormData['features'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value,
      },
    }));
  }, []);

  const handleEmailAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('emailFromAddress', e.target.value);
  }, [handleInputChange]);

  const handleEmailNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('emailFromName', e.target.value);
  }, [handleInputChange]);

  const handleColorChange = useCallback((color: string) => {
    handleInputChange('primaryColor', color);
  }, [handleInputChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
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
  }, [updateOrganization, organization._id, formData]);

  // === 5. EFFECTS (useEffect for side effects) ===
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

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!organization) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-600">Loading organization settings...</span>
      </div>
    );
  }

  // === 7. RENDER (JSX) ===
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
                  onChange={handleEmailAddressChange}
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
                  onChange={handleEmailNameChange}
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
                    onChange={handleColorChange}
                  />
                  <p className="text-xs text-slate-500">
                    Used in email templates and branding throughout the platform
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Brand Application Preview</Label>
                  <div 
                    className="p-3 rounded-md border" 
                    style={{ backgroundColor: displayColor }}
                  >
                    <p className="text-white text-sm font-medium">strideOS Platform</p>
                    <p className="text-white/80 text-xs">
                      This color will be used in emails and branding
                    </p>
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
                    style={{ backgroundColor: displayColor }}
                  />
                  <span className="font-medium">{companyName}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  From: {companyEmail}
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
});
