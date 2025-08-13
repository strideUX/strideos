'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserControls, TestUser } from './components/user-controls';
import { MultiSectionEditor } from './components/multi-section-editor';
import { VERSION_INFO } from '@/lib/version';
import { IconUsersGroup, IconRefresh } from '@tabler/icons-react';
import { NetworkDemo } from './components/network-demo';
import { PresenceList } from './components/presence-list';

const CollaborativeEditor = dynamic(
  () => import('./components/collaborative-editor').then(m => m.CollaborativeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
        Loading editor...
      </div>
    ),
  }
);

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }
  return <>{children}</>;
}

function getYSweetEndpoint(): string {
  if (process.env.NODE_ENV === 'development') {
    return 'https://demos.y-sweet.dev/api/auth';
  }
  if (process.env.NEXT_PUBLIC_Y_SWEET_ENDPOINT) {
    return process.env.NEXT_PUBLIC_Y_SWEET_ENDPOINT as string;
  }
  return 'https://demos.y-sweet.dev/api/auth';
}

function generateTestUser(): TestUser {
  const names = ['Ada', 'Alan', 'Grace', 'Edsger', 'Barbara', 'Donald', 'Linus', 'Margaret'];
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#0EA5E9'];
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: names[Math.floor(Math.random() * names.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

export default function YSweetTestPage() {
  const [docId, setDocId] = useState<string>('test-doc');
  const [user, setUser] = useState<TestUser>(() => generateTestUser());
  const [authEndpoint, setAuthEndpoint] = useState<string>(() => getYSweetEndpoint());

  const yUser = useMemo(() => ({ name: user.name, color: user.color }), [user.name, user.color]);

  useEffect(() => {
    setAuthEndpoint(getYSweetEndpoint());
  }, []);

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Y-Sweet Collaboration Test</h1>
          <p className="text-muted-foreground">Real-time BlockNote collaboration with offline-first Y.js</p>
        </div>
        <div className="text-right">
          <div className="text-sm">Version: <span className="font-mono">{VERSION_INFO.version}</span></div>
          <div className="text-xs text-muted-foreground">Branch {VERSION_INFO.branch} • {VERSION_INFO.commit}</div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Setup</CardTitle>
            <CardDescription>Switch rooms, change user, and test connectivity</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setUser(generateTestUser())}>
              <IconUsersGroup className="h-4 w-4" />
              Random User
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setDocId(`test-${Math.random().toString(36).slice(2,7)}`)}>
              <IconRefresh className="h-4 w-4" />
              New Room
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document ID</label>
              <Input value={docId} onChange={(e) => setDocId(e.target.value)} placeholder="test-doc" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <UserControls user={user} onChange={setUser} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Auth Endpoint</label>
            <Input value={authEndpoint} onChange={(e) => setAuthEndpoint(e.target.value)} placeholder="https://demos.y-sweet.dev/api/auth" />
            <p className="text-xs text-muted-foreground">Defaults to demo server in development</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Single Collaborative Editor</CardTitle>
          <CardDescription>Connect two tabs to the same Document ID to test real-time sync, cursors, and offline edits.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientOnly>
            <CollaborativeEditor
              docId={docId}
              user={yUser}
              authEndpoint={authEndpoint}
              headerSlot={(
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <NetworkDemo />
                    <PresenceList />
                  </div>
                </div>
              )}
            />
          </ClientOnly>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Section Collaboration</CardTitle>
          <CardDescription>Each section is an independent collaboration room for parallel editing and presence.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientOnly>
            <MultiSectionEditor documentId={docId} user={yUser} authEndpoint={authEndpoint} />
          </ClientOnly>
        </CardContent>
      </Card>
    </div>
  );
}
