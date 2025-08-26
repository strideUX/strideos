import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { User, UserRole, UserStatus } from '@/types/user';

interface UserFormData {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  jobTitle: string;
  clientId: string;
  departmentIds: string[];
  sendInvitation: boolean;
}

interface UseUserFormProps {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * useUserForm - Manages user form state and business logic
 * 
 * @param props - User form configuration
 * @returns User form state and methods
 */
export function useUserForm({ user, open, onOpenChange, onSuccess }: UseUserFormProps) {
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'task_owner',
    status: 'invited',
    jobTitle: '',
    clientId: '',
    departmentIds: [],
    sendInvitation: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convex mutations
  const createUser = useMutation(api.users.createUser);
  const updateUser = useMutation(api.users.updateUser);
  
  // Convex queries
  const clients = useQuery(api.clients.listClients, { status: 'active' });
  const departments = useQuery(
    api.departments.listDepartmentsByClient, 
    formData.clientId ? {
      clientId: formData.clientId as Id<'clients'>,
    } : 'skip'
  );

  // Initialize form data when dialog opens or user changes
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

  // Form validation
  const isFormValid = useMemo(() => {
    if (!formData.name.trim()) return false;
    if (!user && !formData.email.trim()) return false; // Email required for new users
    if (formData.role === 'client' && !formData.clientId) return false; // Client required for client role
    return true;
  }, [formData, user]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push('Name is required');
    if (!user && !formData.email.trim()) errors.push('Email is required for new users');
    if (formData.role === 'client' && !formData.clientId) errors.push('Client assignment is required for client users');
    return errors;
  }, [formData, user]);

  // Form submission handler
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isFormValid) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

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
  }, [
    isFormValid,
    validationErrors,
    user,
    formData,
    updateUser,
    createUser,
    onSuccess,
    onOpenChange,
  ]);

  // Form field update handlers
  const handleInputChange = useCallback((field: string, value: string | boolean | string[]) => {
    setFormData(prev => {
      // If changing client, reset department assignments
      if (field === 'clientId') {
        const clientId = value === 'none' ? '' : value as string;
        return { ...prev, clientId, departmentIds: [] };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const handleDepartmentToggle = useCallback((departmentId: string) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(departmentId)
        ? prev.departmentIds.filter(id => id !== departmentId)
        : [...prev.departmentIds, departmentId]
    }));
  }, []);

  // Computed values
  const isEditMode = useMemo(() => !!user, [user]);
  const isClientRole = useMemo(() => formData.role === 'client', [formData.role]);
  const hasClientAssignment = useMemo(() => !!formData.clientId, [formData.clientId]);
  const hasDepartments = useMemo(() => departments && departments.length > 0, [departments]);

  return useMemo(() => ({
    // Form state
    formData,
    isSubmitting,
    isFormValid,
    validationErrors,
    
    // Options
    clients,
    departments,
    
    // Actions
    handleSubmit,
    handleInputChange,
    handleDepartmentToggle,
    
    // Computed values
    isEditMode,
    isClientRole,
    hasClientAssignment,
    hasDepartments,
  }), [
    formData,
    isSubmitting,
    isFormValid,
    validationErrors,
    clients,
    departments,
    handleSubmit,
    handleInputChange,
    handleDepartmentToggle,
    isEditMode,
    isClientRole,
    hasClientAssignment,
    hasDepartments,
  ]);
}
