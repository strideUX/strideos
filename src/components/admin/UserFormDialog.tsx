'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    status: 'active' as UserStatus,
    jobTitle: '',
    bio: '',
    timezone: '',
    preferredLanguage: '',
    clientId: '',
    departmentIds: [] as string[],
    sendInvitation: false,
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
          bio: user.bio || '',
          timezone: user.timezone || '',
          preferredLanguage: user.preferredLanguage || '',
          clientId: user.clientId || '',
          departmentIds: user.departmentIds || [],
          sendInvitation: false,
        });
      } else {
        // Create mode - reset form
        setFormData({
          email: '',
          name: '',
          role: 'task_owner',
          status: 'active',
          jobTitle: '',
          bio: '',
          timezone: '',
          preferredLanguage: '',
          clientId: '',
          departmentIds: [],
          sendInvitation: false,
        });
      }
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (user) {
        // Update existing user
        await updateUser({
          userId: user._id as Id<'users'>,
          name: formData.name,
          role: formData.role,
          status: formData.status,
          jobTitle: formData.jobTitle || undefined,
          bio: formData.bio || undefined,
          timezone: formData.timezone || undefined,
          preferredLanguage: formData.preferredLanguage || undefined,
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
          bio: formData.bio || undefined,
          timezone: formData.timezone || undefined,
          preferredLanguage: formData.preferredLanguage || undefined,
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
            <h3 className="text-lg font-medium">Basic Information</h3>
            
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

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Brief description about the user"
                rows={3}
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Preferences</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Preferred Language</Label>
                <Select value={formData.preferredLanguage} onValueChange={(value) => handleInputChange('preferredLanguage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Assignments</h3>
            
            <div className="space-y-2">
              <Label htmlFor="clientId">Client Assignment</Label>
              <Select value={formData.clientId || 'none'} onValueChange={(value) => handleInputChange('clientId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client (optional)" />
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
            </div>

            {formData.clientId && (
              <div className="space-y-2">
                <Label>Department Assignments</Label>
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