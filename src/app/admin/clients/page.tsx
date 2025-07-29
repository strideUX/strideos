'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconPlus, IconSearch, IconBuilding, IconUsers, IconFolder } from '@tabler/icons-react';
import { ClientFormDialog } from '@/components/admin/ClientFormDialog';
import { toast } from 'sonner';
import { Client, ClientStatus } from '@/types/client';

export default function AdminClientsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  // Fetch clients with filters
  const clients = useQuery(api.clients.listClients, {
    status: statusFilter === 'all' ? undefined : statusFilter as ClientStatus,
    industry: industryFilter === 'all' ? undefined : industryFilter,
  });

  const deleteClient = useMutation(api.clients.deleteClient);
  const seedDatabase = useMutation(api.seed.seedDatabase);

  // Filter clients by search term
  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteClient({ clientId: clientId as Id<"clients"> });
      toast.success('Client deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete client');
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm('This will create sample clients and departments. Continue?')) {
      return;
    }

    try {
      const result = await seedDatabase();
      toast.success(`Database seeded successfully! Created ${result.clientsCreated} clients and ${result.departmentsCreated} departments.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to seed database');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSizeLabel = (size?: string) => {
    switch (size) {
      case 'startup': return 'Startup';
      case 'small': return 'Small';
      case 'medium': return 'Medium';
      case 'large': return 'Large';
      case 'enterprise': return 'Enterprise';
      default: return 'Unknown';
    }
  };

  if (!user) return null;

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
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Clients</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Manage client organizations and their departments
              </p>
            </div>
            <div className="flex gap-2">
              {filteredClients.length === 0 && (
                <Button variant="outline" onClick={handleSeedDatabase}>
                  🌱 Seed Sample Data
                </Button>
              )}
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <IconPlus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Search and filter clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="Financial Technology">FinTech</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Clients ({filteredClients.length})
              </CardTitle>
              <CardDescription>
                Overview of all client organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <IconBuilding className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No clients found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {searchTerm || statusFilter !== 'all' || industryFilter !== 'all'
                      ? 'No clients match your current filters.'
                      : 'Get started by creating your first client.'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && industryFilter === 'all' && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <IconPlus className="w-4 h-4 mr-2" />
                      Create First Client
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Departments</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client._id}>
                          <TableCell>
                            <div>
                              <div className="font-semibold">{client.name}</div>
                              {client.description && (
                                <div className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-xs">
                                  {client.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.industry || <span className="text-slate-400">—</span>}
                          </TableCell>
                          <TableCell>
                            {client.size ? getSizeLabel(client.size) : <span className="text-slate-400">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(client.status)}>
                              {client.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <IconUsers className="w-4 h-4 text-slate-400" />
                              <span>{client.activeDepartmentCount}/{client.departmentCount}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <IconFolder className="w-4 h-4 text-slate-400" />
                              <span>{client.activeProjectCount}/{client.projectCount}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.contactEmail ? (
                              <a
                                href={`mailto:${client.contactEmail}`}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {client.contactEmail}
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingClient(client)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteClient(client._id)}
                                disabled={client.activeDepartmentCount > 0 || client.activeProjectCount > 0}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      {/* Client Form Dialog */}
      <ClientFormDialog
        open={isCreateDialogOpen || !!editingClient}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingClient(undefined);
          }
        }}
        client={editingClient}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          setEditingClient(undefined);
        }}
      />
    </SidebarProvider>
  );
} 