'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { IconLoader2, IconClock, IconUsers } from '@tabler/icons-react';

interface SettingsSprintTabProps {
  organization: any; // Will be properly typed once we have the organization type
}

export function SettingsSprintTab({ organization }: SettingsSprintTabProps) {
  const [formData, setFormData] = useState({
    defaultWorkstreamCapacity: 32,
    defaultSprintDuration: 2,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateOrganization = useMutation(api.organizations.updateOrganization);

  // Initialize form data when organization loads
  useEffect(() => {
    if (organization) {
      setFormData({
        defaultWorkstreamCapacity: organization.defaultWorkstreamCapacity || 32,
        defaultSprintDuration: organization.defaultSprintDuration || 2,
      });
    }
  }, [organization]);

  const handleInputChange = (field: string, value: number) => {
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
                    onChange={(e) => handleInputChange('defaultSprintDuration', parseInt(e.target.value) || 2)}
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
                      {formData.defaultSprintDuration === 1 ? '1 week' : `${formData.defaultSprintDuration} weeks`} per sprint cycle
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
                    onChange={(e) => handleInputChange('defaultWorkstreamCapacity', parseInt(e.target.value) || 32)}
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
                      {formData.defaultWorkstreamCapacity / 8} days per workstream per sprint
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
                        <strong>Sprint Duration:</strong> {formData.defaultSprintDuration} {formData.defaultSprintDuration === 1 ? 'week' : 'weeks'}
                      </p>
                      <p className="text-blue-600 dark:text-blue-400">
                        <strong>Workstream Capacity:</strong> {formData.defaultWorkstreamCapacity} hours
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Daily Capacity:</strong> {Math.round(formData.defaultWorkstreamCapacity / formData.defaultSprintDuration / 5)} hours/day
                      </p>
                      <p className="text-blue-600 dark:text-blue-400">
                        <strong>Total Sprint Hours:</strong> {formData.defaultWorkstreamCapacity * 5} hours
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
}
