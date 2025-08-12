'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/components/providers/AuthProvider';
import { SectionBasedDocumentEditor } from '@/components/editor/SectionBasedDocumentEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Helper function to determine back navigation based on document type and context
function getBackNavigation(document: { documentType: string; projectId?: Id<'projects'> }): { url: string; label: string } {
  switch (document.documentType) {
    case 'project_brief':
      const url = document.projectId ? `/projects/${document.projectId}/details` : '/projects';
      return {
        url,
        label: 'Back to Project'
      };
    case 'standalone':
    case 'meeting_notes':
    case 'report':
    default:
      return {
        url: '/projects',
        label: 'Back to Projects'
      };
  }
}

export default function UnifiedDocumentEditor() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const documentId = params.documentId as Id<'documents'>;

  // Fetch document data
  const documentData = useQuery(api.documents.getDocumentWithSections, { documentId });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  const document = documentData.document;

  // Check if user has permission to edit this document
  const canEdit = document.permissions?.canEdit?.includes(user.role) || 
                  document.createdBy === user._id ||
                  ['admin', 'pm'].includes(user.role); // Admin and PM can always edit

  if (!canEdit) {
    toast.error('You do not have permission to edit this document');
    const backNav = getBackNavigation(document);
    router.push(backNav.url as string);
    return null;
  }

  // Get context-aware navigation
  const backNavigation = getBackNavigation(document);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Document Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backNavigation.url as string)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {backNavigation.label}
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{document.title}</h1>
            <p className="text-sm text-muted-foreground">
              {document.documentType.replace('_', ' ')} • 
              Last updated {new Date(document.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Document Editor */}
      <div className="flex-1">
        <SectionBasedDocumentEditor
          documentId={documentId}
          userRole={user.role}
          onBack={() => router.push(backNavigation.url)}
        />
      </div>
    </div>
  );
}