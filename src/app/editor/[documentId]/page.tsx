'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/components/providers/AuthProvider';
import { SectionBasedDocumentEditor } from '@/components/editor/SectionBasedDocumentEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ChevronRight, FileText, MoreHorizontal, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CommentThread } from '@/components/comments/CommentThread';
import { PresenceProvider, usePresence } from '@/components/editor/PresenceProvider';
import { CollaboratorsBar } from '@/components/editor/CollaboratorsBar';
import { CursorOverlay } from '@/components/editor/CursorOverlay';

// ClientLogoDisplay component for displaying client logos in header
function ClientLogoDisplay({ storageId, clientName }: { storageId?: Id<"_storage"> | string; clientName: string }) {
  // Only call the hook if we have a valid storageId
  const logoUrl = useQuery(
    api.clients.getLogoUrl, 
    storageId ? { storageId: storageId as Id<"_storage"> } : "skip"
  );

  if (storageId && logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${clientName} logo`}
        width={24}
        height={24}
        className="w-7 h-7 rounded object-cover flex-shrink-0 bg-transparent"
        style={{ backgroundColor: 'transparent' }}
      />
    );
  }

  // Fallback to initial letter
  return (
    <div className="w-7 h-7 bg-orange-500 rounded-sm flex items-center justify-center">
      <span className="text-[12px] text-white font-semibold">
        {clientName.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

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
  const { user, isLoading, isAuthenticated } = useAuth();
  const documentId = params.documentId as Id<'documents'>;
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Project settings modal state
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  
  // Comments drawer state
  const [showComments, setShowComments] = useState(false);
  
  // Handle save status updates from editor
  const handleSaveStatusChange = (status: 'idle' | 'saving' | 'saved', newLastSaved?: Date) => {
    setSaveStatus(status);
    if (newLastSaved) {
      setLastSaved(newLastSaved);
    }
  };
  
  // Format last saved time
  const formatLastSaved = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch document data
  const documentData = useQuery(api.documents.getDocumentWithSections, { documentId });
  
  // Fetch project data for client information
  const projectData = useQuery(
    api.projects.getProject, 
    documentData?.document?.projectId ? { projectId: documentData.document.projectId } : 'skip'
  );

  // Handle authentication errors (when not a service outage)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Your session has expired. Please sign in again.');
      router.push('/signin?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [isLoading, isAuthenticated, router]);

  // Check for document access issues
  useEffect(() => {
    if (documentData === null && !isLoading && isAuthenticated) {
      toast.error('Unable to load document. You may not have access.');
      router.push('/projects');
    }
  }, [documentData, isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
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
  
  // Get client name from project data
  const clientName = projectData?.client?.name || 'Client Name';

  return (
    <PresenceProvider documentId={documentId}>
      <div className="flex flex-col h-screen bg-background dark:bg-sidebar">
      {/* Document Header */}
      <div className="flex flex-col border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Back to Projects */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backNavigation.url as string)}
            className="flex items-center gap-2 h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-[15px] font-medium">Back to Projects</span>
          </Button>
          
          {/* Vertical Divider */}
          <div className="w-px h-5 bg-border"></div>
          
          {/* Client with Logo */}
          <div className="flex items-center gap-2">
            <ClientLogoDisplay 
              storageId={projectData?.client?.logo} 
              clientName={clientName} 
            />
            <span className="text-[15px] font-medium text-foreground">{clientName}</span>
          </div>

          {/* Breadcrumb Arrow */}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />

          {/* Project Icon and Title */}
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-muted-foreground" />
            <span className="text-[15px] font-medium text-foreground">{document.title}</span>
            
            {/* Project Settings Button */}
            <Dialog open={showProjectSettings} onOpenChange={setShowProjectSettings}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-70 hover:opacity-100 ml-1"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Project Settings</DialogTitle>
                  <DialogDescription>
                    Configure project settings and preferences.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Project settings configuration will be implemented here. This is placeholder content for the Project Settings modal.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Spacer to push auto-save to the right */}
          <div className="flex-1" />
          
          {/* Comments Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 opacity-70 hover:opacity-100 mr-4 ${showComments ? 'text-primary' : ''}`}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          {/* Auto-save Status */}
          <div className="flex items-center gap-2 ml-4">
            {saveStatus === 'saving' && (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Saved</span>
              </>
            )}
            {saveStatus === 'idle' && lastSaved && (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Last saved {formatLastSaved(lastSaved)}</span>
              </>
            )}
            {saveStatus === 'idle' && !lastSaved && (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Not saved yet</span>
              </>
            )}
          </div>
        </div>
        {/* Collaborators Bar */}
        <CollaboratorsBar documentId={documentId} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Document Editor */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0">
            {/* Consume presence for cursors */}
            {(() => {
              const PresenceConsumer = () => {
                const { activeUsers } = usePresence();
                return <CursorOverlay users={activeUsers} />;
              };
              return <PresenceConsumer />;
            })()}
          </div>
          <SectionBasedDocumentEditor
            documentId={documentId}
            userRole={user.role}
            onBack={() => router.push(backNavigation.url)}
            onSaveStatusChange={handleSaveStatusChange}
          />
        </div>
        
        {/* Comments Drawer */}
        <div className={`
          transition-all duration-300 ease-in-out bg-primary/10 border-l border-border
          ${showComments ? 'w-96' : 'w-0'}
          ${showComments ? 'opacity-100' : 'opacity-0'}
          overflow-hidden flex flex-col
        `}>
          {showComments && (
            <div className="flex-1 p-6">
              <CommentThread documentId={documentId} />
            </div>
          )}
        </div>
      </div>
    </div>
    </PresenceProvider>
  );
}