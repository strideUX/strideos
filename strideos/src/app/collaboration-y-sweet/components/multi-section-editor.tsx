'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollaborativeEditor } from './collaborative-editor';
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
            <div className="flex items-center gap-3">
              <NetworkDemo />
              <PresenceList />
            </div>
          </CardHeader>
          <CardContent>
            <CollaborativeEditor
              docId={`doc-${documentId}-${section.id}`}
              user={user}
              authEndpoint={authEndpoint}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
