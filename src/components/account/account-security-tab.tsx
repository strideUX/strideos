/**
 * AccountSecurityTab - User password management component
 *
 * @remarks
 * Provides a secure interface for users to change their password with comprehensive
 * validation including strength requirements and confirmation matching. Integrates
 * with Convex mutations for secure password updates.
 *
 * @example
 * ```tsx
 * <AccountSecurityTab />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo } from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// 3. Types
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

// 4. Component definition
export const AccountSecurityTab = memo(function AccountSecurityTab() {
  // === 1. DESTRUCTURE PROPS ===
  // (No props for this component)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updatePassword = useMutation(api.users.updateUserPassword);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const validation = useMemo((): PasswordValidation => {
    const errors: string[] = [];
    
    if (formData.newPassword.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(formData.newPassword)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(formData.newPassword)) {
      errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(formData.newPassword)) {
      errors.push('One number');
    }
    if (formData.newPassword !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return { valid: errors.length === 0, errors };
  }, [formData.newPassword, formData.confirmPassword]);

  const canSubmit = useMemo(() => {
    return validation.valid && !isSubmitting;
  }, [validation.valid, isSubmitting]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handlePasswordChange = useCallback((field: keyof PasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    try {
      setIsSubmitting(true);
      await updatePassword({ 
        currentPassword: formData.currentPassword, 
        newPassword: formData.newPassword 
      });
      
      // Reset form on success
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast.success('Password updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, formData.currentPassword, formData.newPassword, updatePassword]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Use a strong password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input 
              id="currentPassword" 
              type="password" 
              value={formData.currentPassword} 
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)} 
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={formData.newPassword} 
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={formData.confirmPassword} 
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)} 
                required 
              />
            </div>
          </div>
          
          {!validation.valid && (
            <ul className="text-sm text-red-600 list-disc pl-5">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
          
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});
