'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
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
import { toast } from 'sonner';
import { User, UserRole, UserStatus } from '@/types/user';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onSuccess: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'task_owner' as UserRole,
    status: 'invited' as UserStatus, // Default to invited for new users
    jobTitle: '',
    clientId: '',
    departmentIds: [] as string[],
    sendInvitation: true, // Default to true for new users
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createUser = useMutation(api.users.createUser);
  const updateUser = useMutation(api.users.updateUser);
  
  // Fetch clients and departments for assignment
  const clients = useQuery(api.clients.listClients, { status: 'active' });
  const departments = useQuery(
    api.departments.listDepartmentsByClient, 
    formData.clientId ? {
      clientId: formData.clientId as Id<'clients'>,
    } : 'skip'
  );

  useEffect(() => {
    if (open) {
      if (user) {
        // Edit mode - populate form with user data
        setFormData({
          email: user.email || '',
          name: user.name || '',
          role: user.role,
          status: user.status,
          jobTitle: user.jobTitle || '',
          clientId: user.clientId || '',
          departmentIds: user.departmentIds || [],
          sendInvitation: false, // Don't send invitation for existing users
        });
      } else {
        // Create mode - reset form
        setFormData({
          email: '',
          name: '',
          role: 'task_owner',
          status: 'invited',
          jobTitle: '',
          clientId: '',
          departmentIds: [],
          sendInvitation: true,
        });
      }
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate client requirement for client role
      if (formData.role === 'client' && !formData.clientId) {
        toast.error('Client assignment is required for client users');
        setIsSubmitting(false);
        return;
      }

      if (user) {
        // Update existing user
        await updateUser({
          userId: user._id as Id<'users'>,
          name: formData.name,
          role: formData.role,
          status: formData.status,
          jobTitle: formData.jobTitle || undefined,
          clientId: formData.clientId ? (formData.clientId as Id<'clients'>) : undefined,
          departmentIds: formData.departmentIds.length > 0 ? (formData.departmentIds as Id<'departments'>[]) : undefined,
        });
        toast.success('User updated successfully');
      } else {
        // Create new user
        await createUser({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          jobTitle: formData.jobTitle || undefined,
          clientId: formData.clientId ? (formData.clientId as Id<'clients'>) : undefined,
          departmentIds: formData.departmentIds.length > 0 ? (formData.departmentIds as Id<'departments'>[]) : undefined,
          sendInvitation: formData.sendInvitation,
        });
        toast.success(formData.sendInvitation ? 'User invited successfully' : 'User created successfully');
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => {
      // If changing client, reset department assignments
      if (field === 'clientId') {
        const clientId = value === 'none' ? '' : value as string;
        return { ...prev, clientId, departmentIds: [] };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleDepartmentToggle = (departmentId: string) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(departmentId)
        ? prev.departmentIds.filter(id => id !== departmentId)
        : [...prev.departmentIds, departmentId]
    }));
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update user information and assignments.' : 'Create a new user account and assign them to clients and departments.'}
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
                  required={!user} // Email required for new users only
                  disabled={!!user} // Email cannot be changed for existing users
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as UserRole)}>
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
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as UserStatus)}>
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
                Client Assignment {formData.role === 'client' && <span className="text-red-500">*</span>}
              </Label>
              <Select 
                value={formData.clientId || 'none'} 
                onValueChange={(value) => handleInputChange('clientId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.role === 'client' ? "Select a client (required)" : "Select a client (optional)"} />
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
              {formData.role === 'client' && !formData.clientId && (
                <p className="text-sm text-red-500">Client assignment is required for client users</p>
              )}
            </div>

            {formData.clientId && (
              <div className="space-y-2">
                <Label>Department Assignments (Optional)</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {departments && departments.length > 0 ? (
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
          {!user && (
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 