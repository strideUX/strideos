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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconPlus, IconSearch, IconUsers, IconBuilding } from '@tabler/icons-react';
import { toast } from 'sonner';
import { UserFormDialog } from '@/components/admin/UserFormDialog';
import { User, UserRole, UserStatus } from '@/types/user';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const users = useQuery(api.users.listUsers, {
    role: roleFilter === 'all' ? undefined : roleFilter as UserRole,
    status: statusFilter === 'all' ? undefined : statusFilter as UserStatus,
    searchTerm: searchTerm || undefined,
  });
  

  const deleteUser = useMutation(api.users.deleteUser);
  const resendInvitation = useMutation(api.users.resendInvitation);
  const seedDatabase = useMutation(api.seed.seedDatabase);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUser({ userId: userId as Id<'users'> });
      toast.success('User deactivated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate user');
    }
  };

  const handleResendInvitation = async (userId: string) => {
    try {
      await resendInvitation({ userId: userId as Id<'users'> });
      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm('This will create sample clients, departments, and users. Continue?')) {
      return;
    }

    try {
      const result = await seedDatabase();
      toast.success(`Database seeded successfully! Created ${result.clientsCreated} clients, ${result.departmentsCreated} departments, and ${result.usersCreated} users.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to seed database');
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pm': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'task_owner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'client': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'invited': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'pm': return 'PM';
      case 'task_owner': return 'Task Owner';
      case 'client': return 'Client';
      default: return role;
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'invited': return 'Invited';
      default: return status;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={currentUser} />
      <SidebarInset>
        <SiteHeader user={currentUser} />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Manage user accounts, roles, and assignments
              </p>
            </div>
            <div className="flex gap-2">
              {users && users.length === 0 && (
                <Button variant="outline" onClick={handleSeedDatabase}>
                  🌱 Seed Sample Data
                </Button>
              )}
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <IconPlus className="w-4 h-4 mr-2" /> Add User
              </Button>
            </div>
          </div>

      {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Search and filter users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, email, or job title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="pm">Project Manager</SelectItem>
                    <SelectItem value="task_owner">Task Owner</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Users</CardTitle>
              <CardDescription>
                {users ? (
                  <>
                    {users.length} user{users.length !== 1 ? 's' : ''} found
                    {users.length > 0 && (
                      <> • {users.filter(u => u.status === 'active').length} active</>
                    )}
                  </>
                ) : (
                  'Loading users...'
                )}
              </CardDescription>
            </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{user.name || 'No name'}</div>
                        {user.jobTitle && (
                          <div className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-xs">
                            {user.jobTitle}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.email ? (
                        <a
                          href={`mailto:${user.email}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {user.email}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {getStatusLabel(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.client ? (
                        <div className="flex items-center gap-1">
                          <IconBuilding className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{user.client.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          Edit
                        </Button>
                        {user.status === 'invited' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvitation(user._id)}
                          >
                            Resend
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Deactivate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <IconUsers className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No users found
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'No users match your current filters.'
                  : 'Get started by creating your first user.'}
              </p>
              {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={handleSeedDatabase}>
                    🌱 Seed Sample Data
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <IconPlus className="w-4 h-4 mr-2" /> Add User
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <UserFormDialog
        open={isCreateDialogOpen || !!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingUser(undefined);
          }
        }}
        user={editingUser}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          setEditingUser(undefined);
        }}
      />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 