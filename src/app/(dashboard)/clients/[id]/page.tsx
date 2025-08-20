'use client';

import { useAuth } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import { useQuery } from 'convex/react';
import Image from 'next/image';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  IconBuilding, 
  IconUsers, 
  IconMail, 
  IconCalendar,
  IconFileText,
  IconActivity,
  IconArrowLeft,
  IconPlus,
  IconFolder
} from "@tabler/icons-react"
import { ClientStatsCards } from "@/components/clients/ClientStatsCards"
import { ClientProjectsCard } from "@/components/clients/ClientProjectsCard"
import { ClientSprintsCard } from "@/components/clients/ClientSprintsCard"
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog"
import { SprintFormDialog } from "@/components/sprints/SprintFormDialog"
import { ClientActiveSprintsKanban } from "@/components/sprints/ClientActiveSprintsKanban"
import { SprintsTable } from "@/components/sprints/SprintsTable"
import { ProjectsTable } from "@/components/projects/ProjectsTable"
// Tabs already imported above
// import { SprintFormDialog as PlanningSprintFormDialog } from "@/components/sprints/SprintFormDialog"

// Helper component to render the client's logo with fallback
function ClientLogoDisplay({ storageId, clientName }: { storageId?: Id<"_storage"> | string; clientName: string }) {
  const logoUrl = useQuery(
    api.clients.getLogoUrl,
    storageId ? { storageId: storageId as Id<"_storage"> } : "skip"
  );

  if (storageId && logoUrl) {
    return (
      <div className="h-12 w-12">
        <Image
          src={logoUrl}
          alt={`${clientName} logo`}
          width={48}
          height={48}
          className="h-12 w-12 rounded object-cover"
        />
        <div className="hidden h-12 w-12 rounded-full bg-muted items-center justify-center">
          <span className="text-lg font-semibold">{clientName?.charAt(0)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
      <span className="text-lg font-semibold">{clientName?.charAt(0)}</span>
    </div>
  );
}

interface ClientDetailPageProps {
  // Next.js 15 passes params as a Promise in Client Components
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Next.js 15: unwrap params Promise using React.use()
  const { id } = use(params);
  const clientId = id as Id<"clients">;

  // Real-time Convex queries
  const client = useQuery(api.clients.getClientById, { clientId });
  const clientTeam = useQuery(api.users.listUsers, { clientId });
  const clientDocuments = useQuery(api.documents.listDocuments, { clientId });

  // Client dashboard UI state and data (must be declared before any early returns)
  const [activeTab, setActiveTab] = useState<string>('active_sprints');
  const [showProjectDialog, setShowProjectDialog] = useState<boolean>(false);
  const [showSprintDialog, setShowSprintDialog] = useState<boolean>(false);
  const clientDashboard = useQuery(api.clients.getClientDashboardById, { clientId });

  // Auth redirect is handled in `(dashboard)/layout.tsx` to avoid duplicate redirects

  // Show loading state while data is being fetched
  if (isLoading || !user || client === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Loading client details...</div>
      </div>
    );
  }
  

  // Handle client not found
  if (client === null) {
    return (
      <>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                  >
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
                <div className="text-center py-12">
                  <IconBuilding className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Client Not Found</h1>
                  <p className="text-muted-foreground">The client you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Utility functions
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {/* Client Dashboard Header */}
              <div className="mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                >
                  <IconArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ClientLogoDisplay
                    storageId={client?.logo}
                    clientName={client?.name || ''}
                  />
                  <div>
                    <h1 className="text-2xl font-bold">{client?.name}</h1>
                    {/* contact email not on schema; display website if present */}
                    <p className="text-sm text-muted-foreground">{client?.website ?? ''}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowProjectDialog(true)}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                  <Button variant="outline" onClick={() => setShowSprintDialog(true)}>
                    <IconCalendar className="mr-2 h-4 w-4" />
                    Create Sprint
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <ClientStatsCards stats={clientDashboard?.stats} client={null} />

              {/* Tabs (client-scoped views) */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 mt-6">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="active_sprints">Active Sprints</TabsTrigger>
                  <TabsTrigger value="planning">Planning</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>

                {/* Active Sprints (Kanban) */}
                <TabsContent value="active_sprints" className="mt-0">
                  <ClientActiveSprintsKanban clientId={clientId} />
                </TabsContent>

                {/* Planning Sprints table */}
                <PlanningTabInner clientId={clientId} onNavigate={(id) => router.push(`/sprint/${id}`)} />

                {/* Completed Sprints table */}
                <CompletedTabInner clientId={clientId} onNavigate={(id) => router.push(`/sprint/${id}`)} />

                {/* Projects table */}
                <ProjectsTabInner clientId={clientId} />

                {/* Team Tab */}
                <TabsContent value="team" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {clientTeam === undefined && (
                      <Card className="col-span-full">
                        <CardContent className="p-6">
                          <div className="text-center text-muted-foreground">Loading team members...</div>
                        </CardContent>
                      </Card>
                    )}

                    {clientTeam !== undefined && clientTeam.length === 0 && (
                      <Card className="col-span-full">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <IconUsers className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="font-medium text-muted-foreground mb-2">No team members found</h3>
                            <p className="text-sm text-muted-foreground">This client doesn&apos;t have any team members assigned yet.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {clientTeam?.map((member) => (
                      <Card key={member._id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar>
                              <AvatarImage src={member.image} />
                              <AvatarFallback>
                                {member.name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{member.name}</h3>
                              <p className="text-sm text-muted-foreground">{member.role || 'Team Member'}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            {member.email && (
                              <div className="flex items-center gap-2">
                                <IconMail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{member.email}</span>
                              </div>
                            )}
                            {member?.departments?.length ? (
                              <div className="flex items-center gap-2">
                                <IconBuilding className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{member.departments?.[0]?.name}</span>
                              </div>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ProjectFormDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        defaultValues={{
          clientId: clientId,
          departmentId: clientDashboard?.departments?.[0]?._id,
        }}
      />

      {/* Sprint creation: preselect this client, then route to sprint page on success */}
      <SprintFormDialog
        open={showSprintDialog}
        onOpenChange={setShowSprintDialog}
        initialClientId={clientId}
        onSuccess={(newSprintId) => router.push(`/sprint/${newSprintId}`)}
      />
    </>
  );
}
function ProjectsTabInner({ clientId }: { clientId: Id<'clients'> }) {
  const projects = (useQuery(api.projects.listProjects, { clientId }) as any) || [];
  const router = useRouter();
  return (
    <TabsContent value="projects" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>All projects for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <ProjectsTable
              projects={projects}
              onProjectSelect={(pid) => router.push(`/projects/${pid}/details`)}
              onViewDocument={(projectId) => {
                const project = projects.find(p => p._id === projectId);
                if (project?.documentId) {
                  router.push(`/editor/${project.documentId}`);
                } else {
                  router.push(`/projects/${projectId}`);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}


function PlanningTabInner({ clientId, onNavigate }: { clientId: Id<'clients'>; onNavigate: (id: string) => void }) {
  const planning = useQuery(api.sprints.getSprintsWithDetails, { clientId, status: 'planning' }) || [];
  return (
    <TabsContent value="planning" className="mt-6">
      <SprintsTable
        sprints={planning as any}
        title="Planning Sprints"
        description="Sprints currently in planning for this client"
        statusFilter="planning"
        onEditSprint={(s) => onNavigate(s._id as any)}
        onViewDetails={(s) => onNavigate(s._id as any)}
      />
    </TabsContent>
  );
}

function CompletedTabInner({ clientId, onNavigate }: { clientId: Id<'clients'>; onNavigate: (id: string) => void }) {
  const completed = useQuery(api.sprints.getSprintsWithDetails, { clientId, status: 'complete' }) || [];
  return (
    <TabsContent value="completed" className="mt-6">
      <SprintsTable
        sprints={completed as any}
        title="Completed Sprints"
        description="Sprints completed for this client"
        statusFilter="completed"
        onEditSprint={(s) => onNavigate(s._id as any)}
        onViewDetails={(s) => onNavigate(s._id as any)}
      />
    </TabsContent>
  );
}