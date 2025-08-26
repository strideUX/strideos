/**
 * ClientForm - Form component for creating and editing client information
 *
 * @remarks
 * Provides a comprehensive form interface for client management including validation,
 * error handling, and form state management. Supports both create and edit modes
 * with appropriate field validation and user feedback.
 *
 * @example
 * ```tsx
 * <ClientForm
 *   client={existingClient}
 *   onSubmit={handleClientSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo, useState, useEffect } from 'react';
import { IconSave, IconX, IconUser, IconBuilding, IconMail, IconPhone, IconMapPin } from '@tabler/icons-react';

// 2. Internal imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 3. Types
interface Client {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  status: 'active' | 'inactive' | 'prospect';
  notes?: string;
  website?: string;
  industry?: string;
  joinedDate?: string;
}

interface ClientFormProps {
  /** Client data to edit (undefined for new client) */
  client?: Partial<Client> | null;
  /** Callback function when form is submitted */
  onSubmit: (clientData: Client) => void;
  /** Callback function when form is cancelled */
  onCancel: () => void;
  /** Whether the form is in loading state */
  isLoading?: boolean;
  /** Form title (defaults based on mode) */
  title?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

// 4. Component definition
export const ClientForm = memo(function ClientForm({ 
  client, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  title 
}: ClientFormProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [formData, setFormData] = useState<Client>({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    status: 'prospect',
    notes: '',
    website: '',
    industry: '',
    joinedDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isEditMode = useMemo(() => {
    return !!client?.id;
  }, [client?.id]);

  const formTitle = useMemo(() => {
    return title ?? (isEditMode ? 'Edit Client' : 'New Client');
  }, [title, isEditMode]);

  const statusOptions = useMemo(() => [
    { value: 'prospect', label: 'Prospect', color: 'bg-blue-100 text-blue-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' }
  ], []);

  const industryOptions = useMemo(() => [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Other'
  ], []);

  const canSubmit = useMemo(() => {
    return formData.name.trim() && 
           formData.email.trim() && 
           !Object.keys(errors).length && 
           isDirty;
  }, [formData.name, formData.email, errors, isDirty]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleInputChange = useCallback((field: keyof Client, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateField = useCallback((field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return undefined;
      case 'phone':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Invalid phone number format';
        }
        return undefined;
      case 'company':
        if (value && value.trim().length < 2) return 'Company name must be at least 2 characters';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate required fields
    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;
    
    // Validate optional fields if they have values
    if (formData.phone) {
      const phoneError = validateField('phone', formData.phone);
      if (phoneError) newErrors.phone = phoneError;
    }
    
    if (formData.company) {
      const companyError = validateField('company', formData.company);
      if (companyError) newErrors.company = companyError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const submitData: Client = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || undefined,
      company: formData.company?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      industry: formData.industry || undefined
    };
    
    onSubmit(submitData);
  }, [formData, validateForm, onSubmit]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      // Could add confirmation dialog here
      const confirmed = window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.');
      if (!confirmed) return;
    }
    onCancel();
  }, [isDirty, onCancel]);

  const handleBlur = useCallback((field: keyof FormErrors) => {
    const value = formData[field] as string;
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [formData, validateField]);

  // === 5. EFFECTS (useEffect for side effects) ===
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        company: client.company || '',
        status: client.status || 'prospect',
        notes: client.notes || '',
        website: client.website || '',
        industry: client.industry || '',
        joinedDate: client.joinedDate || new Date().toISOString().split('T')[0]
      });
      setIsDirty(false);
    }
  }, [client]);

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUser className="h-5 w-5" />
          {formTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Client name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="client@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  onBlur={() => handleBlur('company')}
                  placeholder="Company name"
                  className={errors.company ? 'border-red-500' : ''}
                />
                {errors.company && (
                  <p className="text-sm text-red-500">{errors.company}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Full address"
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Business Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={option.color}>{option.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => handleInputChange('industry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="joinedDate">Join Date</Label>
              <Input
                id="joinedDate"
                type="date"
                value={formData.joinedDate}
                onChange={(e) => handleInputChange('joinedDate', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the client..."
                rows={3}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <IconX className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </div>
              ) : (
                <>
                  <IconSave className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update' : 'Create'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
