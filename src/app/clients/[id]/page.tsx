'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  IconBuilding, 
  IconUsers, 
  IconFolder, 
  IconMail,
  IconChartBar,
  IconCalendarEvent,
  IconArrowLeft
} from '@tabler/icons-react';

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Unwrap params Promise for Next.js 15
  const resolvedParams = React.use(params);
  const clientId = resolvedParams.id as Id<'clients'>;

  // Get individual client data
  const clientData = useQuery(api.clients.getClientDashboard, {
    status: undefined,
    industry: undefined,
  });

  // Find the specific client
  const client = clientData?.clients?.find(c => c._id === clientId);

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render page if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Redirecting to sign-in...</div>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading || !user || !clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  // Show 404 if client not found
  if (!client) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SiteHeader user={user} />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-8">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <IconBuilding className="h-16 w-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Client Not Found</h1>
                <p className="text-muted-foreground mb-6">The client you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
                <Button onClick={() => router.push('/clients')} variant="outline">
                  <IconArrowLeft className="h-4 w-4 mr-2" />
                  Back to Clients
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getIndustryColor = (industry?: string) => {
    if (!industry) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    ];
    const hash = industry.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  onClick={() => router.push('/clients')} 
                  variant="ghost" 
                  size="sm"
                >
                  <IconArrowLeft className="h-4 w-4 mr-2" />
                  Back to Clients
                </Button>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IconBuilding className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                      {client.industry && (
                        <Badge variant="outline" className={getIndustryColor(client.industry)}>
                          {client.industry}
                        </Badge>
                      )}
                      {client.size && (
                        <Badge variant="outline">
                          {client.size}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {client.contactEmail && (
                    <Button 
                      onClick={() => window.location.href = `mailto:${client.contactEmail}`}
                      variant="outline"
                    >
                      <IconMail className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <IconFolder className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Active Projects</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{client.metrics.activeProjectCount}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <IconUsers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Team Members</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{client.metrics.teamMemberCount}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <IconChartBar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Total Budget</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(client.metrics.totalBudget)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{formatDate(client.lastUpdated)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Projects & Team */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Active Projects */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Projects</CardTitle>
                    <CardDescription>Current projects for this client</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {client.projects.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No active projects</p>
                      ) : (
                        client.projects.slice(0, 5).map((project) => (
                          <div key={project._id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <div className="font-medium">{project.title}</div>
                              <div className="text-sm text-muted-foreground">
                                Status: <Badge variant="outline" className="ml-1">{project.status}</Badge>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>People working on this client&apos;s projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {client.teamMembers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No team members assigned</p>
                      ) : (
                        client.teamMembers.slice(0, 5).map((member) => (
                          <div key={member._id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.image || ''} />
                              <AvatarFallback>{getInitials(member.name || 'Unknown User')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium">{member.name || 'Unknown User'}</div>
                              <div className="text-sm text-muted-foreground">{member.jobTitle || 'No title'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              {client.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{client.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}