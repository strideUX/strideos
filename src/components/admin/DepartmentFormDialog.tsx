'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Department } from '@/types/client';

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
  clientId: Id<"clients">;
  onSuccess: () => void;
}

export function DepartmentFormDialog({ 
  open, 
  onOpenChange, 
  department, 
  clientId, 
  onSuccess 
}: DepartmentFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    primaryContactId: '',
    leadId: '',
    teamMemberIds: [] as string[],
    workstreamCount: 1,
    slackChannelId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDepartment = useMutation(api.departments.createDepartment);
  const updateDepartment = useMutation(api.departments.updateDepartment);

  // Get users for assignment dropdowns
  const usersData = useQuery(api.departments.getUsersForDepartmentAssignment, {
    clientId: clientId,
  });

  // Reset form when dialog opens/closes or department changes
  useEffect(() => {
    if (open) {
      if (department) {
        // Editing existing department
        setFormData({
          name: department.name || '',
          primaryContactId: department.primaryContactId || '',
          leadId: department.leadId || '',
          teamMemberIds: department.teamMemberIds || [],
          workstreamCount: department.workstreamCount || 1,
          slackChannelId: department.slackChannelId || '',
        });
      } else {
        // Creating new department
        setFormData({
          name: '',
          primaryContactId: '',
          leadId: '',
          teamMemberIds: [],
          workstreamCount: 1,
          slackChannelId: '',
        });
      }
    }
  }, [open, department]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (department) {
        // Update existing department
        await updateDepartment({
          departmentId: department._id as Id<"departments">,
          name: formData.name,
          primaryContactId: formData.primaryContactId as Id<"users">,
          leadId: formData.leadId as Id<"users">,
          teamMemberIds: formData.teamMemberIds as Id<"users">[],
          workstreamCount: formData.workstreamCount,
          slackChannelId: formData.slackChannelId || undefined,
        });
        toast.success('Department updated successfully');
      } else {
        // Create new department
        await createDepartment({
          name: formData.name,
          clientId: clientId,
          primaryContactId: formData.primaryContactId as Id<"users">,
          leadId: formData.leadId as Id<"users">,
          teamMemberIds: formData.teamMemberIds as Id<"users">[],
          workstreamCount: formData.workstreamCount,
          slackChannelId: formData.slackChannelId || undefined,
        });
        toast.success('Department created successfully');
      }

      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {department ? 'Edit Department' : 'Create New Department'}
          </DialogTitle>
          <DialogDescription>
            {department 
              ? 'Update the department configuration below.'
              : 'Add a new department to this client organization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Engineering, Marketing, Sales"
              required
            />
          </div>

          {usersData ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="primaryContact">Primary Contact *</Label>
                <Select value={formData.primaryContactId} onValueChange={(value) => handleInputChange('primaryContactId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersData.clientUsers.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead">Department Lead *</Label>
                <Select value={formData.leadId} onValueChange={(value) => handleInputChange('leadId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersData.internalUsers.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="space-y-1">
                  {usersData.clientUsers
                    .filter(user => user._id !== formData.primaryContactId)
                    .map((user) => (
                      <div key={user._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`member-${user._id}`}
                          checked={formData.teamMemberIds.includes(user._id)}
                          onChange={(e) => {
                            const newTeamMembers = e.target.checked
                              ? [...formData.teamMemberIds, user._id]
                              : formData.teamMemberIds.filter(id => id !== user._id);
                            handleInputChange('teamMemberIds', newTeamMembers);
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`member-${user._id}`} className="text-sm">
                          {user.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading users...</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="workstreamCount">Number of Workstreams *</Label>
            <Input
              id="workstreamCount"
              type="number"
              min="1"
              max="10"
              value={formData.workstreamCount}
              onChange={(e) => handleInputChange('workstreamCount', parseInt(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slackChannelId">Slack Channel ID</Label>
            <Input
              id="slackChannelId"
              value={formData.slackChannelId}
              onChange={(e) => handleInputChange('slackChannelId', e.target.value)}
              placeholder="e.g., C1234567890"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? 'Saving...' : (department ? 'Update Department' : 'Create Department')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
