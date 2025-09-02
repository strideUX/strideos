'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { useState, Fragment } from 'react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/hooks/use-auth';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconPlus, IconSearch, IconBuilding, IconUsers, IconFolder, IconDots, IconEdit, IconArchive, IconSettings, IconTrash } from '@tabler/icons-react';
import { ClientFormDialog } from '@/components/admin/client-form-dialog';
import { DepartmentList } from '@/components/admin/department-list';
import { DepartmentFormDialog } from '@/components/admin/department-form-dialog';
import { toast } from 'sonner';
import { Client, ClientStatus } from '@/types/client';
import { Department } from '@/types/client';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// LogoImage helper component for displaying client logos
function LogoImage({ storageId, clientName }: { storageId: string; clientName: string }) {
  const logoUrl = useQuery(api.clients.getLogoUrl, { storageId: storageId as Id<"_storage"> });

  if (!logoUrl) {
    return <IconBuilding className="h-4 w-4 text-gray-400" />;
  }

  return (
    <Image
      src={logoUrl}
      alt={`${clientName} logo`}
      width={32}
      height={32}
      className="h-8 w-8 rounded object-cover"
    />
  );
}

export default function AdminClientsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>(undefined);
  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | undefined>(undefined);
  const [deleteAction, setDeleteAction] = useState<'archive' | 'purge'>('archive');
  const [confirmText, setConfirmText] = useState('');

  // Fetch KPI data and clients
  const kpis = useQuery(api.clients.getClientDashboardKPIs);
  const clients = useQuery(api.clients.listClients, {
    status: statusFilter === 'all' ? undefined : statusFilter as ClientStatus,
  });

  const deleteClient = useMutation(api.clients.deleteClient);
  const archiveClient = useMutation(api.clients.archiveClient);
  const deleteClientPermanently = useMutation(api.clients.deleteClientPermanently);
  const getDeletionSummary = useQuery(
    api.clients.getClientDeletionSummary,
    clientToDelete ? { clientId: clientToDelete._id as Id<'clients'> } : 'skip'
  );
  const seedDatabase = useMutation(api.seed.seedDatabase);

  // Filter clients by search term, status, and type
  const filteredClients = clients?.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.website?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'internal' && client.isInternal) ||
      (typeFilter === 'external' && !client.isInternal);
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleArchiveClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteAction('archive');
    setShowDeleteConfirm(true);
  };

  const handlePurgeClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteAction('purge');
    setShowDeleteConfirm(true);
  };

  const handleArchiveClient = async (clientId: string) => {
    try {
      await archiveClient({ clientId: clientId as Id<'clients'> });
      toast.success('Client archived successfully');
      setShowDeleteConfirm(false);
      setClientToDelete(undefined);
      setDeleteAction('archive');
      setConfirmText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to archive client');
    }
  };

  const handlePermanentlyDeleteClient = async (clientId: string) => {
    try {
      await deleteClientPermanently({ clientId: clientId as Id<'clients'> });
      toast.success('Client permanently deleted');
      setShowDeleteConfirm(false);
      setClientToDelete(undefined);
      setDeleteAction('archive');
      setConfirmText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to permanently delete client');
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

  const handleManageDepartments = (client: Client) => {
    setSelectedClientId(client._id as Id<"clients">);
    setExpandedClientId(expandedClientId === client._id ? null : client._id);
  };

  const handleAddDepartment = () => {
    setEditingDepartment(undefined);
    setIsDepartmentDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsDepartmentDialogOpen(true);
  };

  const handleDepartmentSuccess = () => {
    setIsDepartmentDialogOpen(false);
    setEditingDepartment(undefined);
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };



  if (!user) return null;

  return (
    <>
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

          {/* KPI Cards (match Insights style) */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Card className="gap-3 py-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
                <CardTitle className="text-xs font-medium">Total Clients</CardTitle>
                <IconBuilding className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <div className="text-4xl font-bold leading-none">{kpis?.totalClients || 0}</div>
                <p className="text-xs text-muted-foreground">All client organizations</p>
              </CardContent>
            </Card>
            <Card className="gap-3 py-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
                <CardTitle className="text-xs font-medium">Active Clients</CardTitle>
                <IconUsers className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <div className="text-4xl font-bold leading-none">{kpis?.activeClients || 0}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card className="gap-3 py-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
                <CardTitle className="text-xs font-medium">Total Projects</CardTitle>
                <IconFolder className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <div className="text-4xl font-bold leading-none">{kpis?.totalProjects || 0}</div>
                <p className="text-xs text-muted-foreground">Across all clients</p>
              </CardContent>
            </Card>
            <Card className="gap-3 py-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
                <CardTitle className="text-xs font-medium">New This Month</CardTitle>
                <IconPlus className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <div className="text-4xl font-bold leading-none">{kpis?.newClientsThisMonth || 0}</div>
                <p className="text-xs text-muted-foreground">Added this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="external">External</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                    {searchTerm || statusFilter !== 'all'
                      ? 'No clients match your current filters.'
                      : 'Get started by creating your first client.'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
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
                        <TableHead>Logo</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Project Key</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>Departments</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <Fragment key={client._id}>
                          <TableRow 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleManageDepartments(client)}
                          >
                          <TableCell>
                            <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                              {client.logo ? (
                                <LogoImage storageId={client.logo} clientName={client.name} />
                              ) : (
                                <IconBuilding className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{client.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {client.projectKey || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={client.isInternal ? "secondary" : "default"} className="text-xs">
                              {client.isInternal ? "Internal" : "External"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(client.status)}>
                              {client.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {client.website ? (
                              <a
                                href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {client.website}
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
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
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                  <IconDots className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingClient(client);
                                  }}
                                >
                                  <IconEdit className="h-4 w-4 mr-2" />
                                  Edit Client
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleManageDepartments(client);
                                  }}
                                >
                                  <IconSettings className="h-4 w-4 mr-2" />
                                  Manage Departments
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveClick(client);
                                  }}
                                  className="text-orange-600 focus:text-orange-600"
                                >
                                  <IconArchive className="h-4 w-4 mr-2" />
                                  Archive Client
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurgeClick(client);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <IconTrash className="h-4 w-4 mr-2" />
                                  Delete Permanently
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {/* Expandable Departments Section */}
                        {expandedClientId === client._id && selectedClientId && (
                          <TableRow>
                            <TableCell colSpan={9} className="p-0">
                              <div className="bg-slate-50 dark:bg-slate-900/50 p-6">
                                <DepartmentList
                                  clientId={selectedClientId}
                                  onEditDepartment={handleEditDepartment}
                                  onAddDepartment={handleAddDepartment}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        </Fragment>
                      ))}
                                          </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

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

      {/* Department Form Dialog */}
      {selectedClientId && (
        <DepartmentFormDialog
          open={isDepartmentDialogOpen || !!editingDepartment}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setIsDepartmentDialogOpen(false);
              setEditingDepartment(undefined);
            }
          }}
          department={editingDepartment}
          clientId={selectedClientId}
          onSuccess={handleDepartmentSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteAction === 'archive' ? 'Archive Client' : '⚠️ PERMANENTLY DELETE CLIENT'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAction === 'archive' ? (
                <>
                  Are you sure you want to archive <strong>{clientToDelete?.name}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete <strong>{clientToDelete?.name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {getDeletionSummary && (
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              This will affect:
              <ul className="list-disc ml-6 mt-1">
                <li>{getDeletionSummary.projectCount} projects</li>
                <li>{getDeletionSummary.taskCount} tasks</li>
                <li>{getDeletionSummary.teamMemberCount} team members</li>
              </ul>
            </div>
          )}

          {deleteAction === 'archive' && (
            <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
              <strong>Archive Client:</strong> This will set the client's status to archived. All data is preserved and can be restored later.
            </div>
          )}

          {deleteAction === 'purge' && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <strong>⚠️ PERMANENT DELETE:</strong> This will completely remove the client and related data from the system. This action cannot be undone.
            </div>
          )}

          {deleteAction === 'purge' && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">
                Type "{clientToDelete?.name}" to confirm permanent deletion:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter client name to confirm"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setConfirmText('');
                setDeleteAction('archive');
              }}
            >
              Cancel
            </AlertDialogCancel>
            {deleteAction === 'archive' && clientToDelete && (
              <AlertDialogAction
                onClick={() => handleArchiveClient(clientToDelete._id)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Archive Client
              </AlertDialogAction>
            )}
            {deleteAction === 'purge' && clientToDelete && (
              <AlertDialogAction
                onClick={() => handlePermanentlyDeleteClient(clientToDelete._id)}
                className="bg-red-600 hover:bg-red-700"
                disabled={confirmText !== clientToDelete.name}
              >
                Permanently Delete Client
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 