'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { NetworkDemo } from './network-demo';
import { PresenceList } from './presence-list';

export interface SectionItem {
  id: string;
  title: string;
}

interface MultiSectionEditorProps {
  documentId: string;
  user: { name: string; color: string };
  sections?: SectionItem[];
  authEndpoint?: string;
}

export function MultiSectionEditor({ documentId, user, sections, authEndpoint }: MultiSectionEditorProps) {
  const CollaborativeEditor = useMemo(
    () =>
      dynamic(() => import('./collaborative-editor').then(m => m.CollaborativeEditor), {
        ssr: false,
        loading: () => (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Loading editor...
          </div>
        ),
      }),
    []
  );
  const defaultSections = useMemo<SectionItem[]>(() => sections || [
    { id: 'overview', title: 'Overview' },
    { id: 'updates', title: 'Updates' },
    { id: 'tasks', title: 'Tasks' },
  ], [sections]);

  return (
    <div className="grid grid-cols-1 gap-6">
      {defaultSections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CollaborativeEditor
              docId={`doc-${documentId}-${section.id}`}
              user={user}
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
