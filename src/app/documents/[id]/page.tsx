'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { SectionBasedDocumentEditor } from '@/components/editor/SectionBasedDocumentEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const documentId = params.id as Id<'documents'>;

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
  const sections = documentData.sections;

  // Check if user has permission to edit this document
  const canEdit = document.permissions?.canEdit?.includes(user.role) || 
                  document.createdBy === user._id ||
                  ['admin', 'pm'].includes(user.role); // Admin and PM can always edit

  if (!canEdit) {
    toast.error('You do not have permission to edit this document');
    router.push('/project-documents');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 overflow-hidden">
            {/* Document Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/project-documents')}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Documents
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
              </div>
            </div>

            {/* Document Editor */}
            <div className="flex-1 overflow-hidden">
              <SectionBasedDocumentEditor
                documentId={documentId}
                readOnly={!canEdit}
                className="h-full"
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 