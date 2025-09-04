/**
 * SettingsSprintTab - Sprint configuration and capacity management tab
 *
 * @remarks
 * Comprehensive settings tab for configuring default sprint duration and workstream capacity.
 * Supports real-time preview of sprint configuration and capacity calculations.
 * Integrates with Convex for organization settings persistence.
 *
 * @example
 * ```tsx
 * <SettingsSprintTab organization={orgData} />
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
import { toast } from 'sonner';
import { IconLoader2, IconClock, IconUsers } from '@tabler/icons-react';
import { Id } from '@/convex/_generated/dataModel';

// 3. Types
interface Organization {
  _id: Id<'organizations'>;
  defaultWorkstreamCapacity?: number;
  defaultSprintDuration?: number;
}

interface SettingsSprintTabProps {
  /** Organization data for settings configuration */
  organization: Organization;
}

interface SprintFormData {
  defaultWorkstreamCapacity: number;
  defaultSprintDuration: number;
}

// 4. Component definition
export const SettingsSprintTab = memo(function SettingsSprintTab({ 
  organization 
}: SettingsSprintTabProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [formData, setFormData] = useState<SprintFormData>({
    defaultWorkstreamCapacity: 32,
    defaultSprintDuration: 2,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateOrganization = useMutation(api.organizations.updateOrganization);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const sprintDurationText = useMemo(() => {
    return formData.defaultSprintDuration === 1 ? 'week' : 'weeks';
  }, [formData.defaultSprintDuration]);

  const sprintDurationExample = useMemo(() => {
    return formData.defaultSprintDuration === 1 ? '1 week' : `${formData.defaultSprintDuration} weeks`;
  }, [formData.defaultSprintDuration]);

  const dailyCapacity = useMemo(() => {
    return Math.round(formData.defaultWorkstreamCapacity / formData.defaultSprintDuration / 5);
  }, [formData.defaultWorkstreamCapacity, formData.defaultSprintDuration]);

  const totalSprintHours = useMemo(() => {
    return formData.defaultWorkstreamCapacity * 5;
  }, [formData.defaultWorkstreamCapacity]);

  const workstreamDays = useMemo(() => {
    return formData.defaultWorkstreamCapacity / 8;
  }, [formData.defaultWorkstreamCapacity]);

  const submitButtonText = useMemo(() => {
    if (isSubmitting) return 'Saving...';
    return 'Save Changes';
  }, [isSubmitting]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleInputChange = useCallback((field: keyof SprintFormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSprintDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 2;
    handleInputChange('defaultSprintDuration', value);
  }, [handleInputChange]);

  const handleWorkstreamCapacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 32;
    handleInputChange('defaultWorkstreamCapacity', value);
  }, [handleInputChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateOrganization({
        organizationId: organization._id,
        defaultWorkstreamCapacity: formData.defaultWorkstreamCapacity,
        defaultSprintDuration: formData.defaultSprintDuration,
      });

      toast.success('Sprint settings updated successfully');
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
        defaultWorkstreamCapacity: organization.defaultWorkstreamCapacity || 32,
        defaultSprintDuration: organization.defaultSprintDuration || 2,
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
      {/* Sprint & Capacity Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClock className="w-5 h-5" />
            Sprint & Capacity Settings
          </CardTitle>
          <CardDescription>
            Configure default values for sprint planning and workstream capacity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Default Sprint Duration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconClock className="w-4 h-4 text-slate-500" />
                <Label className="text-base font-medium">Default Sprint Duration</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sprintDuration">Duration (weeks)</Label>
                  <Input
                    id="sprintDuration"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.defaultSprintDuration}
                    onChange={handleSprintDurationChange}
                    placeholder="2"
                  />
                  <p className="text-xs text-slate-500">
                    Number of weeks per sprint (1-12 weeks)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Example</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <p className="text-sm font-medium">
                      {formData.defaultSprintDuration}-week sprints
                    </p>
                    <p className="text-xs text-slate-500">
                      {sprintDurationExample} per sprint cycle
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Default Workstream Capacity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconUsers className="w-4 h-4 text-slate-500" />
                <Label className="text-base font-medium">Default Workstream Capacity</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workstreamCapacity">Capacity (hours)</Label>
                  <Input
                    id="workstreamCapacity"
                    type="number"
                    min="1"
                    max="200"
                    value={formData.defaultWorkstreamCapacity}
                    onChange={handleWorkstreamCapacityChange}
                    placeholder="32"
                  />
                  <p className="text-xs text-slate-500">
                    Hours per workstream per sprint (1-200 hours)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Example</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <p className="text-sm font-medium">
                      {formData.defaultWorkstreamCapacity} hours per workstream
                    </p>
                    <p className="text-xs text-slate-500">
                      {workstreamDays} days per workstream per sprint
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Default Sprint Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Sprint Duration:</strong> {formData.defaultSprintDuration} {sprintDurationText}
                      </p>
                      <p className="text-blue-600 dark:text-blue-400">
                        <strong>Workstream Capacity:</strong> {formData.defaultWorkstreamCapacity} hours
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Daily Capacity:</strong> {dailyCapacity} hours/day
                      </p>
                      <p className="text-blue-600 dark:text-blue-400">
                        <strong>Total Sprint Hours:</strong> {totalSprintHours} hours
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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

      {/* Help Information */}
      <Card>
        <CardHeader>
          <CardTitle>How These Settings Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Sprint Duration</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                This sets the default length for new sprints. Most teams use 1-4 week sprints depending on their workflow and project complexity.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Workstream Capacity</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                This defines how many hours each workstream (team member or resource) can contribute per sprint. This helps with capacity planning and task estimation.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Usage</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                These defaults will be used when creating new sprints and projects. Individual sprints can override these values as needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
