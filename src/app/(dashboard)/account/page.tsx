'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconUserCircle, IconLock, IconAdjustments } from '@tabler/icons-react';
import { AccountProfileTab } from '@/components/account/AccountProfileTab';
import { AccountSecurityTab } from '@/components/account/AccountSecurityTab';
import { AccountPreferencesTab } from '@/components/account/AccountPreferencesTab';

export default function AccountSettingsPage() {
  const { user: currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">You must be signed in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SiteHeader user={currentUser} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
            <p className="text-slate-600 dark:text-slate-300">Manage your profile, security, and preferences</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUserCircle className="w-5 h-5" />
              {currentUser.name || currentUser.email || 'Account'}
            </CardTitle>
            <CardDescription>Update your personal information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <IconUserCircle className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <IconLock className="w-4 h-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <IconAdjustments className="w-4 h-4" />
                  Preferences
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6">
                <AccountProfileTab user={currentUser} />
              </TabsContent>

              <TabsContent value="security" className="mt-6">
                <AccountSecurityTab />
              </TabsContent>

              <TabsContent value="preferences" className="mt-6">
                <AccountPreferencesTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
