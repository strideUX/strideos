'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconSearch, IconBuilding, IconPlus, IconUsers, IconFolder, IconChartBar } from "@tabler/icons-react"

export default function ClientsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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

  // Show loading state while user data is being fetched
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  // Mock client data - will be replaced with Convex queries
  const mockClients = [
    {
      id: "1",
      name: "Acme Corp",
      industry: "Technology",
      status: "active",
      projects: 3,
      teamMembers: 8,
      totalRevenue: 125000,
      lastContact: "2024-02-10",
      contactPerson: "John Smith",
      email: "john@acmecorp.com",
    },
    {
      id: "2",
      name: "Tech Solutions",
      industry: "Software",
      status: "active",
      projects: 2,
      teamMembers: 5,
      totalRevenue: 85000,
      lastContact: "2024-02-08",
      contactPerson: "Sarah Johnson",
      email: "sarah@techsolutions.com",
    },
    {
      id: "3",
      name: "Startup Inc",
      industry: "E-commerce",
      status: "prospect",
      projects: 1,
      teamMembers: 3,
      totalRevenue: 25000,
      lastContact: "2024-02-05",
      contactPerson: "Mike Chen",
      email: "mike@startupinc.com",
    },
    {
      id: "4",
      name: "Enterprise Co",
      industry: "Finance",
      status: "active",
      projects: 4,
      teamMembers: 12,
      totalRevenue: 200000,
      lastContact: "2024-02-12",
      contactPerson: "Lisa Wang",
      email: "lisa@enterpriseco.com",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "prospect":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getIndustryColor = (industry: string) => {
    switch (industry) {
      case "Technology":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Software":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "E-commerce":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Finance":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">
                      Client management and project overview
                    </p>
                  </div>
                  <Button>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="clients">All Clients</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                          <IconBuilding className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{mockClients.length}</div>
                          <p className="text-xs text-muted-foreground">
                            Active and prospects
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                          <IconFolder className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {mockClients.reduce((sum, client) => sum + client.projects, 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Across all clients
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                          <IconUsers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {mockClients.reduce((sum, client) => sum + client.teamMembers, 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total team size
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                          <IconChartBar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${(mockClients.reduce((sum, client) => sum + client.totalRevenue, 0) / 1000).toFixed(0)}k
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This quarter
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Client Activity</CardTitle>
                        <CardDescription>
                          Latest updates and communications with clients
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockClients.slice(0, 3).map((client) => (
                            <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                  <IconBuilding className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{client.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Last contact: {client.lastContact}
                                  </p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(client.status)} variant="secondary">
                                {client.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="clients" className="space-y-4">
                    {/* Filters and Search */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search clients..."
                          className="pl-10"
                        />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Industries</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="e-commerce">E-commerce</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clients Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {mockClients.map((client) => (
                        <Card key={client.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                  <IconBuilding className="h-4 w-4" />
                                </div>
                                <div>
                                  <h3 className="font-medium">{client.name}</h3>
                                  <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(client.status)} variant="secondary">
                                {client.status}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Badge className={getIndustryColor(client.industry)} variant="outline">
                                  {client.industry}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Projects</p>
                                  <p className="font-medium">{client.projects}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Team Size</p>
                                  <p className="font-medium">{client.teamMembers}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Revenue</p>
                                  <p className="font-medium">${(client.totalRevenue / 1000).toFixed(0)}k</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Last Contact</p>
                                  <p className="font-medium">{client.lastContact}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-4 border-t">
                                <Button variant="ghost" size="sm" className="flex-1">
                                  View Details
                                </Button>
                                <Button variant="ghost" size="sm" className="flex-1">
                                  Contact
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Client Analytics</CardTitle>
                        <CardDescription>
                          Revenue trends and client performance metrics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          <IconChartBar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Analytics dashboard coming soon...</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 