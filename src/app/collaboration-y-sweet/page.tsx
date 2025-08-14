'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserControls, TestUser } from './components/user-controls';
import { UserControlsReal, YSweetUser } from './components/user-controls-real';
import { MultiSectionEditor } from './components/multi-section-editor';
import { VERSION_INFO } from '@/lib/version';
import { IconUsersGroup, IconRefresh } from '@tabler/icons-react';
import { NetworkDemo } from './components/network-demo';
import { PresenceList } from './components/presence-list';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

function toYSweetUser(user: any): { name: string; color: string } {
  const color = user?.color || `hsl(${(Math.abs(String(user?._id || 'x').split('').reduce((h: number, c: string) => c.charCodeAt(0) + ((h << 5) - h), 0)) % 360)}, 70%, 60%)`;
  return { name: user?.name || 'Anonymous', color };
}

function TestDocumentControls({ onSelect }: { onSelect: (docId: string) => void }) {
  const createTestDoc = useMutation(api.documents.createTestDocument);
  const testDocs = useQuery(api.documents.getTestDocuments, {});
  const [selectedDocId, setSelectedDocId] = useState('');

  const PRODUCTION_SECTIONS = [
    { id: 'overview', type: 'overview', title: 'Overview' },
    { id: 'deliverables', type: 'deliverables', title: 'Deliverables' },
    { id: 'team', type: 'team', title: 'Team' },
    { id: 'weekly_status', type: 'weekly_status', title: 'Updates' },
    { id: 'feedback', type: 'feedback', title: 'Client Feedback' },
  ];

  const SIMPLE_BLANK_SECTIONS = [
    { id: 'content', type: 'custom', title: 'New Page' },
  ];

  const handleCreateTestDoc = async (useSimpleTemplate = false) => {
    const sections = useSimpleTemplate ? SIMPLE_BLANK_SECTIONS : PRODUCTION_SECTIONS;
    const title = useSimpleTemplate 
      ? `Blank Document ${Date.now()}` 
      : `Y-sweet Test Document ${Date.now()}`;
    
    const newId = await createTestDoc({
      title,
      documentType: 'project_brief',
      isTestDocument: true,
      sections: sections.map((section, index) => ({
        id: section.id,
        type: section.type,
        title: section.title,
        content: { type: 'doc', content: [] },
        order: index,
      })),
    } as any);
    setSelectedDocId(String(newId));
    onSelect(String(newId));
  };

  useEffect(() => {
    if (selectedDocId) onSelect(selectedDocId);
  }, [selectedDocId, onSelect]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => handleCreateTestDoc(true)} type="button" variant="outline">
          Create Blank Page
        </Button>
        <Button onClick={() => handleCreateTestDoc(false)} type="button">
          Create Full Template
        </Button>
      </div>
      <Select value={selectedDocId} onValueChange={(v) => { setSelectedDocId(v); onSelect(v); }}>
        <SelectTrigger>
          <SelectValue placeholder="Select test document" />
        </SelectTrigger>
        <SelectContent>
          {testDocs?.map((doc: any) => (
            <SelectItem key={String(doc._id)} value={String(doc._id)}>
              {doc.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function checkSectionPermission(user: any, permission: 'canEdit' | 'canView', sectionType?: string): boolean {
  const permissions: Record<string, { canView: string[]; canEdit: string[] }> = {
    overview: { canView: ['all'], canEdit: ['admin', 'pm'] },
    deliverables: { canView: ['all'], canEdit: ['admin', 'pm', 'task_owner'] },
    team: { canView: ['all'], canEdit: ['admin', 'pm'] },
    updates: { canView: ['all'], canEdit: ['admin', 'pm'] },
    feedback: { canView: ['all'], canEdit: ['all'] },
  };
  const sectionPerms = permissions[sectionType || 'overview'] || permissions.overview;
  const userRoles = [user?.role].filter(Boolean);
  if (user?.clientId) userRoles.push('client');
  return sectionPerms[permission]?.some((role) => userRoles.includes(role) || role === 'all') ?? false;
}

export default function YSweetTestPage() {
  const [docId, setDocId] = useState<string>('');
  const [user, setUser] = useState<TestUser>({
    id: 'default-user',
    name: 'Test User',
    color: '#3B82F6'
  });
  const [authEndpoint, setAuthEndpoint] = useState<string>(() => getYSweetEndpoint());
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const currentUser = useQuery(api.users.getCurrentUser, {});

  // Initialize random user only on client side to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
    setUser(generateTestUser());
  }, []);

  const yUser = useMemo(() => ({ name: user.name, color: user.color }), [user.name, user.color]);

  useEffect(() => {
    setAuthEndpoint(getYSweetEndpoint());
  }, []);

  // If not authenticated, prompt login for real-user testing
  if (currentUser === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to test Y-sweet collaboration</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Build Y-sweet user object based on selection or current
  const selectedConvexUser = useQuery(api.users.getUserById as any, selectedUserId ? { userId: selectedUserId as any } : 'skip');
  const activeConvexUser = (selectedConvexUser || currentUser) as any;
  const activeYSweetUser = toYSweetUser(activeConvexUser);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Y-sweet Production Integration Test
            <Badge variant="outline" className="ml-auto">Phase 4A: Real Users + Test Documents</Badge>
          </CardTitle>
          <CardDescription>Testing Y-sweet collaboration with real Convex users and production section structure</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserControlsReal currentUserId={selectedUserId} onUserChange={setSelectedUserId} />
            {isClient && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Override display (optional)</div>
                <UserControls user={user} onChange={setUser} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <TestDocumentControls onSelect={(id) => setDocId(id)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaboration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Network and presence status will appear within the collaboration area below
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Section Structure</CardTitle>
          <CardDescription>Each section matches production document architecture</CardDescription>
        </CardHeader>
        <CardContent>
          {!docId ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">No document selected</div>
                <div className="text-xs text-muted-foreground">Create or select a test document above to start collaborating</div>
              </div>
            </div>
          ) : (
            <ClientOnly>
              <MultiSectionEditor
                documentId={docId}
                user={activeYSweetUser}
                authEndpoint={authEndpoint}
                permissionsFn={(section) => ({
                  canView: checkSectionPermission(activeConvexUser, 'canView', section.type),
                  canEdit: checkSectionPermission(activeConvexUser, 'canEdit', section.type),
                })}
              />
            </ClientOnly>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
