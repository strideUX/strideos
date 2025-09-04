/**
 * AccountPreferencesTab - User preferences management component
 *
 * @remarks
 * Provides a comprehensive interface for users to customize their experience,
 * including theme selection, notification preferences, and other personal settings.
 * Integrates with Convex mutations for persistent storage and real-time updates.
 *
 * @example
 * ```tsx
 * <AccountPreferencesTab />
 * ```
 */

// 1. External imports
import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 3. Types
interface Preferences {
  theme: 'system' | 'light' | 'dark';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface UserPreferences {
  theme?: 'system' | 'light' | 'dark';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  preferredLanguage?: string;
  timezone?: string;
}

// 4. Component definition
export const AccountPreferencesTab = memo(function AccountPreferencesTab() {
  // === 1. DESTRUCTURE PROPS ===
  // (No props for this component)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [prefs, setPrefs] = useState<Preferences>({ 
    theme: 'system', 
    emailNotifications: true, 
    pushNotifications: true 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThemeSaving, setIsThemeSaving] = useState(false);

  const { setTheme } = useTheme();

  // Convex queries and mutations
  const currentUser = useQuery(api.auth.getCurrentUser);
  const updateUser = useMutation(api.users.updateUserProfile);
  const updateThemePreference = useMutation(api.users.updateThemePreference);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const canSave = useMemo(() => {
    return Boolean(currentUser?._id) && !isSubmitting;
  }, [currentUser?._id, isSubmitting]);

  const themeOptions = useMemo(() => [
    { value: 'system' as const, label: 'System' },
    { value: 'light' as const, label: 'Light' },
    { value: 'dark' as const, label: 'Dark' },
  ], []);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleThemeChange = useCallback(async (newTheme: 'system' | 'light' | 'dark') => {
    const previousTheme = prefs.theme;
    
    // Optimistically update UI
    setPrefs((p) => ({ ...p, theme: newTheme }));
    setTheme(newTheme);
    
    setIsThemeSaving(true);
    try {
      await updateThemePreference({ theme: newTheme });
      toast.success('Theme updated');
    } catch (error) {
      // Revert on error
      setPrefs((p) => ({ ...p, theme: previousTheme }));
      setTheme(previousTheme);
      toast.error(error instanceof Error ? error.message : 'Failed to update theme');
    } finally {
      setIsThemeSaving(false);
    }
  }, [prefs.theme, setTheme, updateThemePreference]);

  const handleEmailNotificationsChange = useCallback((enabled: boolean) => {
    setPrefs((p) => ({ ...p, emailNotifications: enabled }));
  }, []);

  const handlePushNotificationsChange = useCallback((enabled: boolean) => {
    setPrefs((p) => ({ ...p, pushNotifications: enabled }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    
    try {
      setIsSubmitting(true);
      
      // Persist theme preference first
      await updateThemePreference({ theme: prefs.theme });
      
      // Persist other preferences if needed (currently placeholder)
      await updateUser({ 
        preferences: { 
          preferredLanguage: (currentUser as { preferredLanguage?: string })?.preferredLanguage, 
          timezone: (currentUser as { timezone?: string })?.timezone 
        } 
      });
      
      toast.success('Preferences saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSave, prefs.theme, currentUser, updateThemePreference, updateUser]);

  // === 5. EFFECTS (useEffect for side effects) ===
  useEffect(() => {
    if (currentUser) {
      const userPrefs = currentUser as { 
        preferences?: UserPreferences; 
        themePreference?: 'system' | 'light' | 'dark' 
      };
      
      const theme = userPrefs?.themePreference || userPrefs?.preferences?.theme || 'system';
      const emailNotifications = userPrefs?.preferences?.emailNotifications ?? true;
      const pushNotifications = userPrefs?.preferences?.pushNotifications ?? true;
      
      setPrefs({ theme, emailNotifications, pushNotifications });

      // Apply theme immediately based on user record
      setTheme(theme);
    }
  }, [currentUser, setTheme]);

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Theme</Label>
              {isThemeSaving && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <Select 
              value={prefs.theme} 
              onValueChange={handleThemeChange}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <Switch 
              checked={prefs.emailNotifications} 
              onCheckedChange={handleEmailNotificationsChange} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Push notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive in-app notifications
              </p>
            </div>
            <Switch 
              checked={prefs.pushNotifications} 
              onCheckedChange={handlePushNotificationsChange} 
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!canSave}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Save Preferences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
