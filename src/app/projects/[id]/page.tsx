'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
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
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  FileText,
  Building,
  Loader2
} from 'lucide-react';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.id as Id<'projects'>;

  // Fetch project data and get/create document
  const project = useQuery(api.projects.getProject, { projectId });
  const documentData = useQuery(api.projects.getOrCreateProjectDocument, { projectId });
  const createProjectDocument = useMutation(api.projects.createProjectDocument);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <SidebarProvider>
        <div className="flex h-screen">
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="flex-1 overflow-auto">
              <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading project...</p>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // If documentData is null, we need to create a document
  if (documentData === null) {
    const handleCreateDocument = async () => {
      try {
        await createProjectDocument({ projectId });
        // The query will automatically refetch after the mutation
      } catch (error) {
        console.error('Failed to create project document:', error);
      }
    };

    return (
      <SidebarProvider>
        <div className="flex h-screen">
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="flex-1 overflow-auto">
              <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">No project brief found</p>
                    <button
                      onClick={handleCreateDocument}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Create Project Brief
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // If documentData is still loading
  if (!documentData) {
    return (
      <SidebarProvider>
        <div className="flex h-screen">
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="flex-1 overflow-auto">
              <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading project brief...</p>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const document = documentData.document;

  if (!document) {
    return (
      <SidebarProvider>
        <div className="flex h-screen">
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="flex-1 overflow-auto">
              <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-muted-foreground">Failed to load project document</p>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived': return 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 overflow-hidden">
            {/* Project Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/projects')}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Projects
                    </Button>
                    <div>
                      <h1 className="text-xl font-semibold">{project.title}</h1>
                      <p className="text-sm text-muted-foreground">
                        Project Brief • 
                        {project.client?.name} • {project.department?.name} • 
                        Last updated {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Section-Based Document Editor */}
            <div className="flex-1 overflow-hidden">
              <SectionBasedDocumentEditor
                documentId={document._id as Id<'documents'>}
                userRole={user.role}
                onBack={() => router.push('/projects')}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 