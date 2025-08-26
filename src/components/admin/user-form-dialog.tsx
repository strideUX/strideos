'use client';

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
import { User } from '@/types/user';
import { useUserForm } from '@/hooks/use-user-form';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onSuccess: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
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



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update user information and assignments.' : 'Create a new user account and assign them to clients and departments.'}
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
                  onChange={(e) => handleInputChange('name', e.target.value)}
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
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                  required={!isEditMode} // Email required for new users only
                  disabled={isEditMode} // Email cannot be changed for existing users
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
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
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="e.g., Senior Developer, Project Manager"
              />
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
                onValueChange={(value) => handleInputChange('clientId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isClientRole ? "Select a client (required)" : "Select a client (optional)"} />
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
              {isClientRole && !formData.clientId && (
                <p className="text-sm text-red-500">Client assignment is required for client users</p>
              )}
            </div>

            {hasClientAssignment && (
              <div className="space-y-2">
                <Label>Department Assignments (Optional)</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {hasDepartments ? (
                    departments.map((dept) => (
                      <div key={dept._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept._id}`}
                          checked={formData.departmentIds.includes(dept._id)}
                          onCheckedChange={() => handleDepartmentToggle(dept._id)}
                        />
                        <Label htmlFor={`dept-${dept._id}`} className="text-sm font-normal cursor-pointer">
                          {dept.name}
                        </Label>
                      </div>
                    ))
                  ) : departments === undefined ? (
                    <p className="text-sm text-muted-foreground">Loading departments...</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No departments available for this client</p>
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
                  onCheckedChange={(checked) => handleInputChange('sendInvitation', checked as boolean)}
                />
                <Label htmlFor="sendInvitation" className="text-sm font-normal">
                  Send invitation email to user
                </Label>
              </div>
              
              {formData.sendInvitation && (
                <p className="text-sm text-muted-foreground">
                  User will receive an email invitation to set up their account. They will be marked as &quot;Invited&quot; until they complete registration.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 