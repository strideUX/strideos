/**
 * ClientList - Comprehensive client management and overview interface
 *
 * @remarks
 * Displays all clients in the system with filtering, sorting, and management capabilities.
 * Provides quick access to client information, status, and project counts. Integrates
 * with the client management system for real-time updates.
 *
 * @example
 * ```tsx
 * <ClientList
 *   clients={allClients}
 *   onClientSelect={handleClientSelect}
 *   onClientUpdate={handleClientUpdate}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo, useState } from 'react';
import { IconPlus, IconSearch, IconFilter, IconSortAscending, IconEye, IconEdit } from '@tabler/icons-react';

// 2. Internal imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// 3. Types
interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: 'active' | 'inactive' | 'prospect';
  joinedDate: string;
  totalRevenue: number;
  projectsCount: number;
  activeSprintsCount: number;
  lastContactDate?: string;
  avatar?: string;
}

interface ClientListProps {
  /** Array of clients to display */
  clients: Client[];
  /** Callback function when a client is selected */
  onClientSelect?: (client: Client) => void;
  /** Callback function when client data is updated */
  onClientUpdate?: (clientId: string, updates: Partial<Client>) => void;
  /** Callback function when new client is created */
  onNewClient?: () => void;
  /** Callback function when client is edited */
  onEditClient?: (client: Client) => void;
}

// 4. Component definition
export const ClientList = memo(function ClientList({ 
  clients, 
  onClientSelect, 
  onClientUpdate, 
  onNewClient, 
  onEditClient 
}: ClientListProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'revenue' | 'projects' | 'joinedDate'>('name');

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'projects':
          return b.projectsCount - a.projectsCount;
        case 'joinedDate':
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [clients, searchTerm, statusFilter, sortBy]);

  const clientStats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const inactive = clients.filter(c => c.status === 'inactive').length;
    const prospect = clients.filter(c => c.status === 'prospect').length;
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalProjects = clients.reduce((sum, c) => sum + c.projectsCount, 0);

    return { total, active, inactive, prospect, totalRevenue, totalProjects };
  }, [clients]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'prospect', label: 'Prospect' }
  ], []);

  const sortOptions = useMemo(() => [
    { value: 'name' as const, label: 'Name' },
    { value: 'status' as const, label: 'Status' },
    { value: 'revenue' as const, label: 'Revenue' },
    { value: 'projects' as const, label: 'Projects' },
    { value: 'joinedDate' as const, label: 'Join Date' }
  ], []);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
  }, []);

  const handleSortChange = useCallback((sortField: typeof sortOptions[number]['value']) => {
    setSortBy(sortField);
  }, []);

  const handleClientSelect = useCallback((client: Client) => {
    onClientSelect?.(client);
  }, [onClientSelect]);

  const handleClientUpdate = useCallback((clientId: string, updates: Partial<Client>) => {
    onClientUpdate?.(clientId, updates);
  }, [onClientUpdate]);

  const handleNewClient = useCallback(() => {
    onNewClient?.();
  }, [onNewClient]);

  const handleEditClient = useCallback((client: Client) => {
    onEditClient?.(client);
  }, [onEditClient]);

  const getStatusColor = useCallback((status: Client['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusLabel = useCallback((status: Client['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'prospect': return 'Prospect';
      default: return 'Unknown';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }, []);

  const formatRevenue = useCallback((revenue: number) => {
    return `$${revenue.toLocaleString()}`;
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!clients.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No clients found</p>
          <Button onClick={handleNewClient} className="gap-2">
            <IconPlus className="h-4 w-4" />
            Create First Client
          </Button>
        </CardContent>
      </Card>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage and track all client relationships
          </p>
        </div>
        <Button onClick={handleNewClient} className="gap-2">
          <IconPlus className="h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{clientStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{clientStats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{clientStats.prospect}</div>
            <p className="text-xs text-muted-foreground">Prospects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{clientStats.inactive}</div>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{clientStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatRevenue(clientStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {statusOptions.map(option => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconSortAscending className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            {sortOptions.map(option => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <div className="space-y-4">
        {filteredAndSortedClients.map(client => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={client.avatar} />
                    <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                    {client.company && (
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(client.status)}>
                        {getStatusLabel(client.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Joined {formatDate(client.joinedDate)}
                    </p>
                    <p className="text-sm font-medium">
                      {formatRevenue(client.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.projectsCount} projects
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClientSelect(client)}
                    >
                      <IconEye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClient(client)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});
