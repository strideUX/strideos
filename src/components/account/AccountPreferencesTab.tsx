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

interface Preferences {
  theme: 'system' | 'light' | 'dark';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export function AccountPreferencesTab() {
  const [prefs, setPrefs] = useState<Preferences>({ theme: 'system', emailNotifications: true, pushNotifications: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder: fetch user prefs from a query if available in users
  const currentUser = useQuery(api.auth.getCurrentUser);
  const updateUser = useMutation(api.users.updateUserProfile);

  useEffect(() => {
    if (currentUser) {
      const theme = (currentUser as any)?.preferences?.theme || 'system';
      const emailNotifications = (currentUser as any)?.preferences?.emailNotifications ?? true;
      const pushNotifications = (currentUser as any)?.preferences?.pushNotifications ?? true;
      setPrefs({ theme, emailNotifications, pushNotifications });
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?._id) return;
    try {
      setIsSubmitting(true);
      await updateUser({ preferences: { preferredLanguage: (currentUser as any)?.preferredLanguage, timezone: (currentUser as any)?.timezone } as any });
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
            <Label>Theme</Label>
            <Select value={prefs.theme} onValueChange={(v: any) => setPrefs((p) => ({ ...p, theme: v }))}>
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
