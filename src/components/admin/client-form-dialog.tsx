/**
 * ClientFormDialog - Client creation and editing dialog component
 *
 * @remarks
 * Comprehensive dialog for creating new clients or editing existing client organizations.
 * Supports logo uploads, project key management, and status updates.
 * Integrates with Convex mutations for data persistence and validation.
 *
 * @example
 * ```tsx
 * <ClientFormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   client={existingClient}
 *   onSuccess={handleClientCreated}
 * />
 * ```
 */

// 1. External imports
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useMutation } from 'convex/react';
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
import { Client, ClientStatus } from '@/types/client.types';
import { LogoUpload } from './logo-upload';

// 3. Types
interface ClientFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing client data for editing (undefined for new clients) */
  client?: Client;
  /** Callback when client operation succeeds */
  onSuccess: () => void;
}

interface ClientFormData {
  name: string;
  projectKey: string;
  website: string;
  isInternal: boolean;
  status: ClientStatus;
}

// 4. Component definition
export const ClientFormDialog = memo(function ClientFormDialog({ 
  open, 
  onOpenChange, 
  client, 
  onSuccess 
}: ClientFormDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    projectKey: '',
    website: '',
    isInternal: false,
    status: 'active',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createClient = useMutation(api.clients.createClient);
  const updateClient = useMutation(api.clients.updateClient);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isEditMode = useMemo(() => {
    return Boolean(client);
  }, [client]);

  const dialogTitle = useMemo(() => {
    return isEditMode ? 'Edit Client' : 'Create New Client';
  }, [isEditMode]);

  const dialogDescription = useMemo(() => {
    return isEditMode 
      ? 'Update the client information below.'
      : 'Add a new client organization to the system.';
  }, [isEditMode]);

  const submitButtonText = useMemo(() => {
    if (isSubmitting) return 'Saving...';
    return isEditMode ? 'Update Client' : 'Create Client';
  }, [isSubmitting, isEditMode]);

  const isFormValid = useMemo(() => {
    const hasValidName = formData.name.trim().length > 0;
    const hasValidProjectKey = isEditMode || (
      formData.projectKey.trim().length >= 4 && 
      formData.projectKey.trim().length <= 6
    );
    return hasValidName && hasValidProjectKey;
  }, [formData.name, formData.projectKey, isEditMode]);

  const projectKeyHelpText = useMemo(() => {
    return isEditMode 
      ? 'Project keys cannot be changed after creation. Contact admin to modify.'
      : 'Used for task slugs: SQRL-1, SQRL-2, etc. Must be 4-6 alphanumeric characters.';
  }, [isEditMode]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleInputChange = useCallback((field: keyof ClientFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('name', e.target.value);
  }, [handleInputChange]);

  const handleProjectKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    handleInputChange('projectKey', value);
  }, [handleInputChange]);

  const handleWebsiteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('website', e.target.value);
  }, [handleInputChange]);

  const handleInternalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('isInternal', e.target.checked);
  }, [handleInputChange]);

  const handleStatusChange = useCallback((value: string) => {
    handleInputChange('status', value as ClientStatus);
  }, [handleInputChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (client) {
        // Update existing client
        await updateClient({
          clientId: client._id as Id<'clients'>,
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
  }, [client, updateClient, createClient, formData, onSuccess]);

  // === 5. EFFECTS (useEffect for side effects) ===
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

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload - Only show for existing clients since new clients need to be created first */}
          {isEditMode && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Logo</h3>
              <LogoUpload 
                client={client!}
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
                  onChange={handleNameChange}
                  placeholder="Client organization name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectKey">
                  Project Key * {isEditMode ? '(Read-only)' : ''}
                </Label>
                <Input
                  id="projectKey"
                  value={formData.projectKey}
                  onChange={handleProjectKeyChange}
                  placeholder="SQRL, RESP, TASK (4-6 characters)"
                  maxLength={6}
                  className="font-mono"
                  required={!isEditMode} // Required for new clients, optional for existing
                  disabled={isEditMode} // Read-only for existing clients
                />
                <p className="text-sm text-muted-foreground">
                  {projectKeyHelpText}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={handleWebsiteChange}
                  placeholder="https://company.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isInternal"
                    checked={formData.isInternal}
                    onChange={handleInternalChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isInternal">Internal Organization</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mark this as an internal initiative (R&D, tools, etc.)
                </p>
              </div>

              {/* Status - Only show for existing clients, new clients are automatically active */}
              {isEditMode && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={handleStatusChange}>
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
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !isFormValid}
            >
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}); 