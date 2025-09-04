/**
 * DocumentFormDialog - Document creation and editing dialog
 *
 * @remarks
 * Provides a comprehensive form for creating new documents with type selection,
 * client and project association, and form validation. Integrates with the
 * document form hook for state management and submission handling.
 *
 * @example
 * ```tsx
 * <DocumentFormDialog 
 *   open={showDialog} 
 *   onOpenChange={setShowDialog} 
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDocumentForm } from '@/hooks/use-document-form';

// 3. Types
interface DocumentFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

// 4. Component definition
export const DocumentFormDialog = memo(function DocumentFormDialog({ 
  open, 
  onOpenChange 
}: DocumentFormDialogProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const {
    formData,
    isLoading,
    handleSubmit,
    updateField,
  } = useDocumentForm({
    open,
    onOpenChange,
  });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const canSubmit = useMemo(() => {
    return Boolean(formData.title?.trim());
  }, [formData.title]);

  const isSubmitting = useMemo(() => {
    return isLoading;
  }, [isLoading]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('title', e.target.value);
  }, [updateField]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleFormSubmit = useCallback(() => {
    if (canSubmit) {
      handleSubmit();
    }
  }, [canSubmit, handleSubmit]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Name</label>
            <Input 
              value={formData.title} 
              onChange={handleTitleChange}
              placeholder="Enter document name" 
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleFormSubmit} 
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});


