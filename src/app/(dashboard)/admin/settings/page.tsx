'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/auth-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconSettings, IconBuilding, IconClock, IconMail } from '@tabler/icons-react';
import { SettingsGeneralTab } from '@/components/admin/settings-general-tab';
import { SettingsSprintTab } from '@/components/admin/settings-sprint-tab';
import { SettingsEmailTab } from '@/components/admin/settings-email-tab';
import ProjectKeysTab from '@/components/admin/project-keys-tab';

export default function AdminSettingsPage() {
  const { user: currentUser } = useAuth();
  
  // Fetch current organization settings
  const organization = useQuery(api.organizations.getCurrentOrganization);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Organization Settings</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage your organization&apos;s configuration and branding
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <IconSettings className="w-5 h-5" />
            <span className="text-sm font-medium">Admin Settings</span>
          </div>
        </div>

        {/* Organization Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBuilding className="w-5 h-5" />
              {organization?.name || 'Organization'}
            </CardTitle>
            <CardDescription>
              Configure your organization&apos;s settings, branding, and default values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <IconBuilding className="w-4 h-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="sprints" className="flex items-center gap-2">
                  <IconClock className="w-4 h-4" />
                  Sprints & Capacity
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <IconMail className="w-4 h-4" />
                  Email & Features
                </TabsTrigger>
                <TabsTrigger value="keys" className="flex items-center gap-2">
                  {/* reusing IconSettings for keys */}
                  <IconSettings className="w-4 h-4" />
                  Project Keys
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-6">
                {organization && <SettingsGeneralTab organization={organization} />}
              </TabsContent>

              <TabsContent value="sprints" className="mt-6">
                {organization && <SettingsSprintTab organization={organization} />}
              </TabsContent>

              <TabsContent value="email" className="mt-6">
                {organization && <SettingsEmailTab organization={organization} />}
              </TabsContent>

              <TabsContent value="keys" className="mt-6">
                <ProjectKeysTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 