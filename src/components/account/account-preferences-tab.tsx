'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

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

export function AccountPreferencesTab() {
  const [prefs, setPrefs] = useState<Preferences>({ theme: 'system', emailNotifications: true, pushNotifications: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setTheme } = useTheme();
  const [isThemeSaving, setIsThemeSaving] = useState(false);

  // Placeholder: fetch user prefs from a query if available in users
  const currentUser = useQuery(api.auth.getCurrentUser);
  const updateUser = useMutation(api.users.updateUserProfile);
  const updateThemePreference = useMutation(api.users.updateThemePreference);

  useEffect(() => {
    if (currentUser) {
      const userPrefs = currentUser as { preferences?: UserPreferences; themePreference?: 'system' | 'light' | 'dark' };
      const theme = userPrefs?.themePreference || userPrefs?.preferences?.theme || 'system';
      const emailNotifications = userPrefs?.preferences?.emailNotifications ?? true;
      const pushNotifications = userPrefs?.preferences?.pushNotifications ?? true;
      setPrefs({ theme, emailNotifications, pushNotifications });

      // Apply theme immediately based on user record
      setTheme(theme);
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?._id) return;
    try {
      setIsSubmitting(true);
      // Persist theme preference first
      await updateThemePreference({ theme: prefs.theme });
      // Optimistically update UI theme
      setTheme(prefs.theme);
      // Persist other preferences if needed (currently placeholder)
      await updateUser({ preferences: { preferredLanguage: (currentUser as { preferredLanguage?: string })?.preferredLanguage, timezone: (currentUser as { timezone?: string })?.timezone } });
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {isThemeSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            <Select value={prefs.theme} onValueChange={async (v: 'system' | 'light' | 'dark') => {
              const previous = prefs.theme;
              setPrefs((p) => ({ ...p, theme: v }));
              setTheme(v);
              setIsThemeSaving(true);
              try {
                await updateThemePreference({ theme: v });
                toast.success('Theme updated');
              } catch (e) {
                setPrefs((p) => ({ ...p, theme: previous }));
                setTheme(previous);
                toast.error(e instanceof Error ? e.message : 'Failed to update theme');
              } finally {
                setIsThemeSaving(false);
              }
            }}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Email notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch checked={prefs.emailNotifications} onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailNotifications: v }))} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Push notifications</Label>
              <p className="text-sm text-muted-foreground">Receive in-app notifications</p>
            </div>
            <Switch checked={prefs.pushNotifications} onCheckedChange={(v) => setPrefs((p) => ({ ...p, pushNotifications: v }))} />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Preferences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
