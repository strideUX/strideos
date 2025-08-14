'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
];

export default function CollaborationSettings() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateCollaborationProfile);

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [displayColor, setDisplayColor] = useState(currentUser?.displayColor || '#3B82F6');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName || (currentUser as any)?.name,
        displayColor,
      });
      toast.success('Collaboration settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Collaboration Settings</CardTitle>
          <CardDescription>
            Customize how you appear to others during real-time collaboration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={(currentUser as any).name || 'Your name'}
            />
            <p className="text-sm text-muted-foreground">
              This name appears to others when you're editing documents
            </p>
          </div>

          <div className="space-y-2">
            <Label>Display Color</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: color === displayColor ? color : 'transparent',
                    boxShadow: color === displayColor ? `0 0 0 2px ${color}40` : 'none'
                  }}
                  onClick={() => setDisplayColor(color)}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Your cursor and avatar border will use this color
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            {/* Preview */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Preview:
              <div
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium bg-muted"
                style={{ borderColor: displayColor }}
              >
                {(displayName || (currentUser as any).name || 'A').slice(0, 2).toUpperCase()}
              </div>
              <span>{displayName || (currentUser as any).name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
