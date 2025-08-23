'use client';

import { useAuth } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconSearch, IconBuilding, IconPlus, IconUsers, IconFolder, IconChartBar, IconMail } from "@tabler/icons-react"

export default function ClientsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Real-time Convex queries - must be called before any early returns
  const clientDashboard = useQuery(api.clients.getClientDashboard, {
    status: statusFilter === 'all' ? undefined : statusFilter as 'active' | 'inactive' | 'archived',
  });

  // Auth redirect is handled in `(dashboard)/layout.tsx` to avoid duplicate redirects

  // Show loading state while user data is being fetched
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    );
  }
  

  // Filter clients based on search query
  const filteredClients = clientDashboard?.clients?.filter(client => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        client.name?.toLowerCase().includes(searchLower) ||
        client.website?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    return true;
  }) || [];

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

  const handleClientContact = (client: { website?: string }) => {
    if (client.website) {
      window.open(client.website, '_blank');
    }
  };

  return (
    <>
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
                          <div className="text-2xl font-bold">{clientDashboard?.dashboardStats?.totalClients || 0}</div>
                          <p className="text-xs text-muted-foreground">
                            {clientDashboard?.dashboardStats?.activeClients || 0} active
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
                            {clientDashboard?.dashboardStats?.activeProjects || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {clientDashboard?.dashboardStats?.totalProjects || 0} total projects
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
                            {clientDashboard?.dashboardStats?.totalTeamMembers || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Across all clients
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
                            {formatCurrency(clientDashboard?.dashboardStats?.totalRevenue || 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total project budgets
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
                          {/* Loading State */}
                          {clientDashboard === undefined && (
                            <div className="flex items-center justify-center py-8">
                              <div className="text-muted-foreground">Loading recent activity...</div>
                            </div>
                          )}

                          {/* Empty State */}
                          {clientDashboard !== undefined && filteredClients.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8">
                              <IconBuilding className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                              <p className="text-muted-foreground">No client activity found</p>
                            </div>
                          )}

                          {/* Recent Activity List */}
                          {filteredClients.slice(0, 3).map((client) => (
                            <div key={client._id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                  <IconBuilding className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{client.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Last updated: {formatDate(client.lastUpdated)}
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
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>

                    </div>

                    {/* Clients Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Loading State */}
                      {clientDashboard === undefined && (
                        <div className="col-span-full flex items-center justify-center py-8">
                          <div className="text-muted-foreground">Loading clients...</div>
                        </div>
                      )}

                      {/* Empty State */}
                      {clientDashboard !== undefined && filteredClients.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12">
                          <IconBuilding className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No clients found</h3>
                          <p className="text-sm text-muted-foreground text-center max-w-md">
                                                          {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters.' 
                                : 'Clients will appear here when they are added to the system.'}
                          </p>
                        </div>
                      )}

                      {/* Clients List */}
                      {filteredClients.map((client) => (
                        <Card key={client._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                  <IconBuilding className="h-4 w-4" />
                                </div>
                                <div>
                                  <h3 className="font-medium">{client.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {client.website || 'No website'}
                                  </p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(client.status)} variant="secondary">
                                {client.status}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              {client.website && (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" variant="outline">
                                    Website
                                  </Badge>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Projects</p>
                                  <p className="font-medium">{client.metrics.activeProjectCount}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Team Size</p>
                                  <p className="font-medium">{client.metrics.teamMemberCount}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Budget</p>
                                  <p className="font-medium">{formatCurrency(client.metrics.totalBudget)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Last Updated</p>
                                  <p className="font-medium">{formatDate(client.lastUpdated)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-4 border-t">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => router.push(`/clients/${client._id}`)}
                                >
                                  <IconFolder className="mr-1 h-3 w-3" />
                                  View Details
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleClientContact(client)}
                                  disabled={!client.website}
                                >
                                  <IconMail className="mr-1 h-3 w-3" />
                                  Visit Website
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
    </>
  );
} 