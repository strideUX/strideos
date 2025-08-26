'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
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
import { Client, ClientStatus } from '@/types/client';
import { LogoUpload } from './logo-upload';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onSuccess: () => void;
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: ClientFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    projectKey: '',
    website: '',
    isInternal: false,
    status: 'active' as ClientStatus,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createClient = useMutation(api.clients.createClient);
  const updateClient = useMutation(api.clients.updateClient);

  // Reset form when dialog opens/closes or client changes
  useEffect(() => {
    if (open) {
      if (client) {
        // Editing existing client
        setFormData({
          name: client.name || '',
          projectKey: client.projectKey || '',
          website: client.website || '',
          isInternal: client.isInternal || false,
          status: client.status || 'active',
        });
      } else {
        // Creating new client
        setFormData({
          name: '',
          projectKey: '',
          website: '',
          isInternal: false,
          status: 'active',
        });
      }
    }
  }, [open, client]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (client) {
        // Update existing client
        await updateClient({
          clientId: client._id as Id<"clients">,
          name: formData.name,
          projectKey: formData.projectKey || undefined,
          website: formData.website || undefined,
          isInternal: formData.isInternal,
          status: formData.status,
        });
        toast.success('Client updated successfully');
      } else {
        // Create new client (status is automatically set to 'active')
        await createClient({
          name: formData.name,
          projectKey: formData.projectKey,
          website: formData.website || undefined,
          isInternal: formData.isInternal,
        });
        toast.success('Client created successfully');
      }

      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Edit Client' : 'Create New Client'}
          </DialogTitle>
          <DialogDescription>
            {client 
              ? 'Update the client information below.'
              : 'Add a new client organization to the system.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload - Only show for existing clients since new clients need to be created first */}
          {client && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Logo</h3>
              <LogoUpload 
                client={client}
                size="lg"
                showLabel={false}
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Client organization name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectKey">
                  Project Key * {client ? '(Read-only)' : ''}
                </Label>
                <Input
                  id="projectKey"
                  value={formData.projectKey}
                  onChange={(e) => handleInputChange('projectKey', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="SQRL, RESP, TASK (4-6 characters)"
                  maxLength={6}
                  className="font-mono"
                  required={!client} // Required for new clients, optional for existing
                  disabled={!!client} // Read-only for existing clients
                />
                <p className="text-sm text-muted-foreground">
                  {client 
                    ? 'Project keys cannot be changed after creation. Contact admin to modify.'
                    : 'Used for task slugs: SQRL-1, SQRL-2, etc. Must be 4-6 alphanumeric characters.'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://company.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isInternal"
                    checked={formData.isInternal}
                    onChange={(e) => handleInputChange('isInternal', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isInternal">Internal Organization</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mark this as an internal initiative (R&D, tools, etc.)
                </p>
              </div>

              {/* Status - Only show for existing clients, new clients are automatically active */}
              {client && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                !formData.name.trim() || 
                (!client && (!formData.projectKey.trim() || formData.projectKey.length < 4))
              }
            >
              {isSubmitting ? 'Saving...' : (client ? 'Update Client' : 'Create Client')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 