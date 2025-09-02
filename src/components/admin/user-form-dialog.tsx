/**
 * UserFormDialog - User creation and editing dialog component
 *
 * @remarks
 * Comprehensive dialog for creating new users or editing existing user accounts.
 * Supports role-based assignments, client/department relationships, and invitation settings.
 * Integrates with user form hook for state management and validation.
 *
 * @example
 * ```tsx
 * <UserFormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   user={existingUser}
 *   onSuccess={handleUserCreated}
 * />
 * ```
 */

// 1. External imports
import React, { memo, useMemo, useCallback } from 'react';

// 2. Internal imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/types/user.types';
import { useUserForm } from '@/hooks/use-user-form';

// 3. Types
interface UserFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing user data for editing (undefined for new users) */
  user?: User;
  /** Callback when user operation succeeds */
  onSuccess: () => void;
}

// 4. Component definition
export const UserFormDialog = memo(function UserFormDialog({ 
  open, 
  onOpenChange, 
  user, 
  onSuccess 
}: UserFormDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const {
    formData,
    isSubmitting,
    isFormValid,
    clients,
    departments,
    handleSubmit,
    handleInputChange,
    handleDepartmentToggle,
    isEditMode,
    isClientRole,
    hasClientAssignment,
    hasDepartments,
  } = useUserForm({ user, open, onOpenChange, onSuccess });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const dialogTitle = useMemo(() => {
    return isEditMode ? 'Edit User' : 'Create New User';
  }, [isEditMode]);

  const dialogDescription = useMemo(() => {
    return isEditMode 
      ? 'Update user information and assignments.' 
      : 'Create a new user account and assign them to clients and departments.';
  }, [isEditMode]);

  const submitButtonText = useMemo(() => {
    if (isSubmitting) return 'Saving...';
    return isEditMode ? 'Update User' : 'Create User';
  }, [isSubmitting, isEditMode]);

  const clientAssignmentRequired = useMemo(() => {
    return isClientRole && !formData.clientId;
  }, [isClientRole, formData.clientId]);

  const hasDepartmentsData = useMemo(() => {
    return departments && departments.length > 0;
  }, [departments]);

  const isDepartmentsLoading = useMemo(() => {
    return departments === undefined;
  }, [departments]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleClientChange = useCallback((value: string) => {
    const clientId = value === 'none' ? '' : value;
    handleInputChange('clientId', clientId);
  }, [handleInputChange]);

  const handleRoleChange = useCallback((value: string) => {
    handleInputChange('role', value);
  }, [handleInputChange]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('name', e.target.value);
  }, [handleInputChange]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('email', e.target.value);
  }, [handleInputChange]);

  const handleJobTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('jobTitle', e.target.value);
  }, [handleInputChange]);

  const handleInvitationChange = useCallback((checked: boolean | 'indeterminate') => {
    handleInputChange('sendInvitation', checked as boolean);
  }, [handleInputChange]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  placeholder="user@example.com"
                  required={!isEditMode} // Email required for new users only
                  disabled={isEditMode} // Email cannot be changed for existing users
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="pm">Project Manager</SelectItem>
                    <SelectItem value="task_owner">Task Owner</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleJobTitleChange}
                  placeholder="e.g., Senior Developer, Project Manager"
                />
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Assignments</h3>
            
            <div className="space-y-2">
              <Label htmlFor="clientId">
                Client Assignment {isClientRole && <span className="text-red-500">*</span>}
              </Label>
              <Select 
                value={formData.clientId || 'none'} 
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      isClientRole 
                        ? "Select a client (required)" 
                        : "Select a client (optional)"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client assignment</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clientAssignmentRequired && (
                <p className="text-sm text-red-500">
                  Client assignment is required for client users
                </p>
              )}
            </div>

            {hasClientAssignment && (
              <div className="space-y-2">
                <Label>Department Assignments (Optional)</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {hasDepartmentsData ? (
                    departments?.map((dept) => (
                      <div key={dept._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept._id}`}
                          checked={formData.departmentIds.includes(dept._id)}
                          onCheckedChange={() => handleDepartmentToggle(dept._id)}
                        />
                        <Label 
                          htmlFor={`dept-${dept._id}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {dept.name}
                        </Label>
                      </div>
                    ))
                  ) : isDepartmentsLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading departments...
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No departments available for this client
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Invitation Settings (Create mode only) */}
          {!isEditMode && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Invitation Settings</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendInvitation"
                  checked={formData.sendInvitation}
                  onCheckedChange={handleInvitationChange}
                />
                <Label htmlFor="sendInvitation" className="text-sm font-normal">
                  Send invitation email to user
                </Label>
              </div>
              
              {formData.sendInvitation && (
                <p className="text-sm text-muted-foreground">
                  User will receive an email invitation to set up their account. 
                  They will be marked as &quot;Invited&quot; until they complete registration.
                </p>
              )}
            </div>
          )}

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