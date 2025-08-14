'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

function getIconForSectionType(type: string): string {
  const iconMap: Record<string, string> = {
    overview: '📋',
    deliverables: '✅',
    team: '👥',
    weekly_status: '📝',
    feedback: '💬',
    custom: '📄',
    timeline: '📅',
    getting_started: '🚀',
    final_delivery: '🎯',
    original_request: '📨'
  };
  return iconMap[type] || '📄';
}

function getDescriptionForSectionType(type: string): string {
  const descriptionMap: Record<string, string> = {
    overview: 'Project overview and objectives',
    deliverables: 'Project tasks and deliverables',
    team: 'Team members and stakeholders',
    weekly_status: 'Project updates and progress',
    feedback: 'Client comments and feedback',
    custom: 'Custom content section',
    timeline: 'Project timeline and milestones',
    getting_started: 'Getting started information',
    final_delivery: 'Final delivery details',
    original_request: 'Original project request'
  };
  return descriptionMap[type] || 'Document section';
}

export interface SectionItem {
  id: string;
  title: string;
  type?: string;
  icon?: string;
  description?: string;
  required?: boolean;
  convexId?: string;
}

interface MultiSectionEditorProps {
  documentId: string;
  user: { name: string; color: string };
  sections?: SectionItem[];
  authEndpoint?: string;
  readOnly?: boolean;
  permissionsFn?: (section: SectionItem) => { canView: boolean; canEdit: boolean };
}

export function MultiSectionEditor({ documentId, user, sections, authEndpoint, readOnly, permissionsFn }: MultiSectionEditorProps) {
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

  // Fetch actual document sections from Convex (only if documentId looks like a valid Convex ID)
  const isValidDocumentId = documentId && documentId.length > 10 && !documentId.startsWith('test-');
  const documentSections = useQuery(
    api.documentSections.getDocumentSections, 
    isValidDocumentId ? { documentId: documentId as any } : 'skip'
  );
  
  const defaultSections = useMemo<SectionItem[]>(() => sections || [
    { id: 'overview', type: 'overview', title: 'Overview', icon: '📋', description: 'Project overview and objectives', required: true },
    { id: 'deliverables', type: 'deliverables', title: 'Deliverables', icon: '✅', description: 'Project tasks and deliverables', required: true },
    { id: 'team', type: 'team', title: 'Team', icon: '👥', description: 'Team members and stakeholders', required: false },
    { id: 'weekly_status', type: 'weekly_status', title: 'Updates', icon: '📝', description: 'Project updates and progress', required: false },
    { id: 'feedback', type: 'feedback', title: 'Client Feedback', icon: '💬', description: 'Client comments and feedback', required: false },
  ], [sections]);

  // Use real document sections if available, otherwise fall back to defaults
  const actualSections = useMemo(() => {
    if (documentSections && documentSections.length > 0) {
      return documentSections.map(section => ({
        id: section.type, // Use type as id for Y-sweet document naming
        convexId: section._id as unknown as string,
        title: section.title,
        type: section.type,
        icon: getIconForSectionType(section.type),
        description: getDescriptionForSectionType(section.type),
        required: section.required
      }));
    }
    return defaultSections;
  }, [documentSections, defaultSections]);

  const filteredSections = useMemo(() => {
    if (!permissionsFn) return actualSections;
    return actualSections.filter(sec => permissionsFn(sec).canView);
  }, [actualSections, permissionsFn]);

  // Show loading state while fetching document sections
  if (isValidDocumentId && documentSections === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading document sections...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {filteredSections.map((section) => {
        const perms = permissionsFn ? permissionsFn(section) : { canView: true, canEdit: !readOnly };
        return (
          <Card key={section.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">{section.icon ? <span>{section.icon}</span> : null}{section.title}</CardTitle>
                {section.description ? (
                  <CardDescription>{section.description}</CardDescription>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <CollaborativeEditor
                docId={`doc-${documentId}-${section.id}`}
                user={user}
                authEndpoint={authEndpoint}
                readOnly={readOnly !== undefined ? readOnly : !perms.canEdit}
                documentId={documentId}
                sectionId={section.id}
                convexSectionId={section.convexId}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
