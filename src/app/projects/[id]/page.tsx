'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useAuth } from '@/components/providers/AuthProvider';
import { SectionBasedDocumentEditor } from '@/components/editor/SectionBasedDocumentEditor';
import { Loader2 } from 'lucide-react';

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
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
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
      <div className="h-screen w-full flex items-center justify-center">
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
    );
  }

  // If documentData is still loading
  if (!documentData) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project brief...</p>
        </div>
      </div>
    );
  }

  const document = documentData.document;

  if (!document) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load project document</p>
        </div>
      </div>
    );
  }



  return (
    <div className="h-screen w-full overflow-hidden">
      {/* Section-Based Document Editor - Full Screen */}
      <SectionBasedDocumentEditor
        documentId={document._id as Id<'documents'>}
        userRole={user.role}
        onBack={() => router.push('/projects')}
      />
    </div>
  );
} 