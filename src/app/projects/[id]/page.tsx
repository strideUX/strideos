'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.id as Id<'projects'>;

  // Fetch project data to get documentId for redirect
  const project = useQuery(api.projects.getProject, { projectId });

  // Redirect to editor route
  useEffect(() => {
    if (project?.documentId) {
      router.replace(`/editor/${project.documentId}`);
    }
  }, [project?.documentId, router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to editor...</p>
      </div>
    </div>
  );
}