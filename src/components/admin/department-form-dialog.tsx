/**
 * DepartmentFormDialog - Department creation and editing dialog component
 *
 * @remarks
 * Comprehensive dialog for creating new departments or editing existing department configurations.
 * Supports team member assignments, lead selection, and workstream configuration.
 * Integrates with Convex mutations for data persistence and user assignment management.
 *
 * @example
 * ```tsx
 * <DepartmentFormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   department={existingDepartment}
 *   clientId="client123"
 *   onSuccess={handleDepartmentCreated}
 * />
 * ```
 */

// 1. External imports
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
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
import { Department } from '@/types/client.types';

// 3. Types
interface DepartmentFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing department data for editing (undefined for new departments) */
  department?: Department;
  /** Client ID for the department */
  clientId: Id<'clients'>;
  /** Callback when department operation succeeds */
  onSuccess: () => void;
}

interface DepartmentFormData {
  name: string;
  primaryContactId: string;
  leadId: string;
  teamMemberIds: string[];
  workstreamCount: number;
  slackChannelId: string;
}

// 4. Component definition
export const DepartmentFormDialog = memo(function DepartmentFormDialog({ 
  open, 
  onOpenChange, 
  department, 
  clientId, 
  onSuccess 
}: DepartmentFormDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    primaryContactId: '',
    leadId: '',
    teamMemberIds: [],
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

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isEditMode = useMemo(() => {
    return Boolean(department);
  }, [department]);

  const dialogTitle = useMemo(() => {
    return isEditMode ? 'Edit Department' : 'Create New Department';
  }, [isEditMode]);

  const dialogDescription = useMemo(() => {
    return isEditMode 
      ? 'Update the department configuration below.'
      : 'Add a new department to this client organization.';
  }, [isEditMode]);

  const submitButtonText = useMemo(() => {
    if (isSubmitting) return 'Saving...';
    return isEditMode ? 'Update Department' : 'Create Department';
  }, [isSubmitting, isEditMode]);

  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0;
  }, [formData.name]);

  const availableTeamMembers = useMemo(() => {
    if (!usersData?.clientUsers) return [];
    return usersData.clientUsers.filter(user => user._id !== formData.primaryContactId);
  }, [usersData?.clientUsers, formData.primaryContactId]);

  const isLoadingUsers = useMemo(() => {
    return usersData === undefined;
  }, [usersData]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleInputChange = useCallback((field: keyof DepartmentFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('name', e.target.value);
  }, [handleInputChange]);

  const handlePrimaryContactChange = useCallback((value: string) => {
    handleInputChange('primaryContactId', value);
  }, [handleInputChange]);

  const handleLeadChange = useCallback((value: string) => {
    handleInputChange('leadId', value);
  }, [handleInputChange]);

  const handleWorkstreamCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('workstreamCount', parseInt(e.target.value));
  }, [handleInputChange]);

  const handleSlackChannelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('slackChannelId', e.target.value);
  }, [handleInputChange]);

  const handleTeamMemberToggle = useCallback((userId: string, checked: boolean) => {
    const newTeamMembers = checked
      ? [...formData.teamMemberIds, userId]
      : formData.teamMemberIds.filter(id => id !== userId);
    handleInputChange('teamMemberIds', newTeamMembers);
  }, [formData.teamMemberIds, handleInputChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (department) {
        // Update existing department
        await updateDepartment({
          departmentId: department._id as Id<'departments'>,
          name: formData.name,
          primaryContactId: formData.primaryContactId as Id<'users'>,
          leadId: formData.leadId as Id<'users'>,
          teamMemberIds: formData.teamMemberIds as Id<'users'>[],
          workstreamCount: formData.workstreamCount,
          slackChannelId: formData.slackChannelId || undefined,
        });
        toast.success('Department updated successfully');
      } else {
        // Create new department
        await createDepartment({
          name: formData.name,
          clientId: clientId,
          primaryContactId: formData.primaryContactId as Id<'users'>,
          leadId: formData.leadId as Id<'users'>,
          teamMemberIds: formData.teamMemberIds as Id<'users'>[],
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
  }, [department, updateDepartment, createDepartment, formData, clientId, onSuccess]);

  // === 5. EFFECTS (useEffect for side effects) ===
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

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g., Engineering, Marketing, Sales"
              required
            />
          </div>

          {!isLoadingUsers ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="primaryContact">Primary Contact *</Label>
                <Select 
                  value={formData.primaryContactId} 
                  onValueChange={handlePrimaryContactChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersData?.clientUsers.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead">Department Lead *</Label>
                <Select 
                  value={formData.leadId} 
                  onValueChange={handleLeadChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersData?.internalUsers.map((user) => (
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
                  {availableTeamMembers.map((user) => (
                    <div key={user._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`member-${user._id}`}
                        checked={formData.teamMemberIds.includes(user._id)}
                        onChange={(e) => handleTeamMemberToggle(user._id, e.target.checked)}
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
              onChange={handleWorkstreamCountChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slackChannelId">Slack Channel ID</Label>
            <Input
              id="slackChannelId"
              value={formData.slackChannelId}
              onChange={handleSlackChannelChange}
              placeholder="e.g., C1234567890"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
