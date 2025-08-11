'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  IconBuilding, 
  IconUsers, 
  IconFolder, 
  IconChartBar, 
  IconMail, 
  IconPhone,
  IconMapPin,
  IconCalendar,
  IconFileText,
  IconActivity,
  IconArrowLeft,
  IconEdit,
  IconDots,
  IconPlus
} from "@tabler/icons-react"
import { ClientStatsCards } from "@/components/clients/ClientStatsCards"
import { ClientProjectsCard } from "@/components/clients/ClientProjectsCard"
import { ClientSprintsCard } from "@/components/clients/ClientSprintsCard"
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog"
// import { SprintFormDialog as PlanningSprintFormDialog } from "@/components/sprints/SprintFormDialog"

interface ClientDetailPageProps {
  params: {
    id: string;
  };
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Next.js 15: unwrap params Promise using React.use()
  const { id } = use(params);
  const clientId = id as Id<"clients">;

  // Real-time Convex queries
  const client = useQuery(api.clients.getClientById, { clientId });
  const clientProjects = useQuery(api.projects.listProjects, { clientId });
  const clientTeam = useQuery(api.users.listUsers, { clientId });
  const clientDocuments = useQuery(api.documents.listDocuments, { clientId });
  const clientStats = useQuery(api.clients.getClientStats, { clientId });

  // Client dashboard UI state and data (must be declared before any early returns)
  const [activeTab, setActiveTab] = useState<string>('active');
  const [showProjectDialog, setShowProjectDialog] = useState<boolean>(false);
  // const [showSprintDialog, setShowSprintDialog] = useState<boolean>(false);
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
                  <p className="text-muted-foreground">The client you're looking for doesn't exist or you don't have access to it.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {/* Client Dashboard Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                  >
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {client?.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{client?.name}</h1>
                      {/* contact email not on schema; display website if present */}
                      <p className="text-sm text-muted-foreground">{(client as any)?.website ?? ''}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowProjectDialog(true)}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                  <Button variant="outline" onClick={() => router.push(`/sprints/new?client=${clientId}`)}>
                    <IconCalendar className="mr-2 h-4 w-4" />
                    Create Sprint
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <ClientStatsCards stats={clientDashboard?.stats} client={clientDashboard?.client as any} />

              {/* Unified Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 mt-6">
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming {(clientDashboard?.stats ? `(${(clientDashboard.stats.upcomingProjectsCount ?? 0) + (clientDashboard.stats.planningSprintsCount ?? 0)})` : '')}</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                {/* Active */}
                <TabsContent value="active" className="space-y-6 mt-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ClientProjectsCard
                      title="Active Projects"
                      description="Currently running projects"
                      projects={clientDashboard?.activeProjects as any}
                      emptyMessage="No active projects"
                      onViewAll={() => router.push(`/projects?client=${clientId}`)}
                    />

                    <ClientSprintsCard
                      title="Active Sprints"
                      description="Currently running sprints"
                      sprints={clientDashboard?.activeSprints as any}
                      emptyMessage="No active sprints"
                      onViewAll={() => router.push(`/sprints?client=${clientId}`)}
                    />
                  </div>
                </TabsContent>

                {/* Upcoming */}
                <TabsContent value="upcoming" className="space-y-6 mt-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ClientProjectsCard
                      title="Upcoming Projects"
                      description="Projects in planning phase"
                      projects={clientDashboard?.upcomingProjects as any}
                      emptyMessage="No upcoming projects"
                      showStatus
                    />

                    <ClientSprintsCard
                      title="Planning Sprints"
                      description="Sprints being planned"
                      sprints={clientDashboard?.planningSprints as any}
                      emptyMessage="No sprints in planning"
                      showDepartment
                    />
                  </div>
                </TabsContent>

                {/* Team Tab */}

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
                            <p className="text-sm text-muted-foreground">This client doesn't have any team members assigned yet.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {clientTeam?.map((member) => (
                      <Card key={member._id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar>
                              <AvatarImage src={member.avatar} />
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
                            {member.department && (
                              <div className="flex items-center gap-2">
                                <IconBuilding className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{member.department}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  <div className="grid gap-4">
                    {clientDocuments === undefined && (
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center text-muted-foreground">Loading documents...</div>
                        </CardContent>
                      </Card>
                    )}

                    {clientDocuments !== undefined && clientDocuments.length === 0 && (
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center">
                            <IconFileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="font-medium text-muted-foreground mb-2">No documents found</h3>
                            <p className="text-sm text-muted-foreground">This client doesn't have any documents yet.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {clientDocuments?.map((document) => (
                      <Card key={document._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                <IconFileText className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="font-medium">{document.title}</h3>
                                <p className="text-sm text-muted-foreground">{document.type || 'Document'}</p>
                                <p className="text-xs text-muted-foreground">
                                  Updated {formatDate(document.updatedAt || document.createdAt)}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconActivity className="h-5 w-5" />
                        Recent Updates
                      </CardTitle>
                      <CardDescription>
                        Latest updates and communications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border-t pt-2">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 mt-1">
                              <IconFolder className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Activity coming soon</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                We’ll surface client-related updates here.
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                <IconCalendar className="h-3 w-3 inline mr-1" />
                                {formatDate(Date.now())}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
          clientId: clientId as unknown as string,
          departmentId: (clientDashboard?.departments?.[0]?._id as unknown as string) || "",
        }}
      />

      {/* Replaced legacy sprint planning dialog with full-page planner */}
    </>
  );
}