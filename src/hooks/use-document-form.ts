import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { useDialogState } from './use-dialog-state';
import { useFormValidation } from './use-form-validation';

interface DocumentFormData {
  title: string;
  documentType: string;
  selectedClientId: Id<'clients'> | '';
  selectedProjectId: Id<'projects'> | '';
}

interface UseDocumentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClientOption { 
  _id: Id<'clients'>; 
  name: string; 
}

interface ProjectOption { 
  _id: Id<'projects'>; 
  title: string; 
  clientId: Id<'clients'>;
}

/**
 * useDocumentForm - Manages document form state and business logic
 *
 * @param props - Document form configuration
 * @returns Document form state and methods
 */
export function useDocumentForm({
  open,
  onOpenChange,
}: UseDocumentFormProps) {
  const router = useRouter();
  const { close } = useDialogState();

  // Form state
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    documentType: 'blank',
    selectedClientId: '',
    selectedProjectId: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Convex mutations and queries
  const createDocument = useMutation(api.documents.create);
  const clients = (useQuery(api.clients.listClients, {}) ?? []) as ClientOption[];
  const projects = (useQuery(api.projects.listProjects, {}) ?? []) as ProjectOption[];

  // Form validation
  const validationRules = [
    { field: 'title', validator: (value: string) => value.trim() ? null : 'Title is required', required: true },
  ];

  const {
    errors,
    isValid,
    validateForm,
    clearErrors,
    setFieldError,
    clearFieldError,
  } = useFormValidation(validationRules);

  // Computed values
  const filteredProjects = useMemo(() => {
    if (!formData.selectedClientId) return projects;
    return projects.filter((p) => p.clientId === formData.selectedClientId);
  }, [projects, formData.selectedClientId]);

  const isFormValid = useMemo(() => {
    return formData.title.trim() && !isLoading;
  }, [formData.title, isLoading]);

  // Actions
  const updateField = useCallback((field: keyof DocumentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field as any);
  }, [clearFieldError]);

  const setSelectedClientId = useCallback((clientId: Id<'clients'> | '') => {
    updateField('selectedClientId', clientId);
    // Reset project when client changes
    updateField('selectedProjectId', '');
  }, [updateField]);

  const setSelectedProjectId = useCallback((projectId: Id<'projects'> | '') => {
    updateField('selectedProjectId', projectId);
  }, [updateField]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      toast.error('Please provide a title');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createDocument({
        title: formData.title.trim(),
        documentType: formData.documentType as any,
        // Do not pass metadata here; server no longer accepts it.
        // Pass direct fields supported by the validator instead.
        projectId: (formData.selectedProjectId || undefined) as any,
      } as any);

      const { documentId } = result as any;
      toast.success('Document created successfully');
      onOpenChange(false);
      router.push(`/editor/${documentId}`);
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message ?? 'Failed to create document';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    isFormValid,
    formData,
    createDocument,
    onOpenChange,
    router,
  ]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        documentType: 'blank',
        selectedClientId: '',
        selectedProjectId: '',
      });
      setIsLoading(false);
      clearErrors();
    }
  }, [open, clearErrors]);

  return useMemo(() => ({
    // Form data
    formData,
    
    // State
    isLoading,
    
    // Validation
    errors,
    isValid: isFormValid,
    
    // Options
    clients,
    filteredProjects,
    
    // Actions
    handleSubmit,
    updateField,
    setSelectedClientId,
    setSelectedProjectId,
    
    // Computed
    isFormValid,
  }), [
    formData,
    isLoading,
    errors,
    isFormValid,
    clients,
    filteredProjects,
    handleSubmit,
    updateField,
    setSelectedClientId,
    setSelectedProjectId,
  ]);
}
