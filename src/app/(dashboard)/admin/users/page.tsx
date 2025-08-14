'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconPlus, IconSearch, IconUsers, IconBuilding, IconDots, IconEdit, IconArchive, IconMail, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { UserFormDialog } from '@/components/admin/UserFormDialog';
import { User, UserRole, UserStatus } from '@/types/user';
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

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined);
  const [deleteAction, setDeleteAction] = useState<'deactivate' | 'purge'>('deactivate');
  const [confirmText, setConfirmText] = useState('');

  // Fetch KPI data and users
  const kpis = useQuery(api.users.getUserDashboardKPIs);
  const users = useQuery(api.users.listUsers, {
    role: roleFilter === 'all' ? undefined : roleFilter as UserRole,
    status: statusFilter === 'all' ? undefined : statusFilter as UserStatus,
    searchTerm: searchTerm || undefined,
  });

  const deleteUser = useMutation(api.users.deleteUser);
  const purgeUser = useMutation(api.users.purgeUser);
  const resendInvitation = useMutation(api.users.resendInvitation);
  const seedDatabase = useMutation(api.seed.seedDatabase);
  
  // Get assigned tasks count for delete confirmation
  const assignedTasksData = useQuery(
    api.users.getAssignedTasksCount,
    userToDelete ? { userId: userToDelete._id as Id<'users'> } : 'skip'
  );

  const handleDeactivateUser = async (userId: string) => {
    try {
      await deleteUser({ userId: userId as Id<'users'> });
      toast.success('User deactivated successfully');
      setShowDeleteConfirm(false);
      setUserToDelete(undefined);
      setDeleteAction('deactivate');
      setConfirmText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate user');
    }
  };

  const handlePurgeUser = async (userId: string) => {
    try {
      await purgeUser({ userId: userId as Id<'users'> });
      toast.success('User permanently deleted from system');
      setShowDeleteConfirm(false);
      setUserToDelete(undefined);
      setDeleteAction('deactivate');
      setConfirmText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleDeactivateClick = (user: User) => {
    setUserToDelete(user);
    setDeleteAction('deactivate');
    setShowDeleteConfirm(true);
  };

  const handlePurgeClick = (user: User) => {
    setUserToDelete(user);
    setDeleteAction('purge');
    setShowDeleteConfirm(true);
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

  // Filter users by search term, role, and status
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

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
    <>
      <SiteHeader user={currentUser} />
      <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Users</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Manage user accounts, roles, and assignments
              </p>
            </div>
            <div className="flex gap-2">
              {filteredUsers.length === 0 && (
                <Button variant="outline" onClick={handleSeedDatabase}>
                  🌱 Seed Sample Data
                </Button>
              )}
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <IconPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All user accounts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
                <IconMail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis?.invitedUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting response
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Client Users</CardTitle>
                <IconBuilding className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredUsers.filter(u => u.role === 'client').length}</div>
                <p className="text-xs text-muted-foreground">
                  Client role users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
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
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Users ({filteredUsers.length})
              </CardTitle>
              <CardDescription>
                Overview of all user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
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
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <IconPlus className="w-4 h-4 mr-2" />
                      Create First User
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                      {filteredUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name || 'No name'}</div>
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <IconDots className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                  <IconEdit className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                {user.status === 'invited' && (
                                  <DropdownMenuItem onClick={() => handleResendInvitation(user._id)}>
                                    <IconMail className="h-4 w-4 mr-2" />
                                    Resend Invitation
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleDeactivateClick(user)}
                                  className="text-orange-600 focus:text-orange-600"
                                >
                                  <IconArchive className="h-4 w-4 mr-2" />
                                  Deactivate User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handlePurgeClick(user)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <IconTrash className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteAction === 'deactivate' ? 'Deactivate User' : '⚠️ PERMANENTLY DELETE USER'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAction === 'deactivate' ? (
                <>
                  Are you sure you want to deactivate <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {assignedTasksData && assignedTasksData.count > 0 && (
            <div className="mt-2 text-red-600 text-sm">
              This user has {assignedTasksData.count} assigned tasks and cannot be {deleteAction === 'deactivate' ? 'deactivated' : 'deleted'}.
            </div>
          )}

          {assignedTasksData && assignedTasksData.count === 0 && deleteAction === 'deactivate' && (
            <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
              <strong>Deactivate User:</strong> This will set the user&apos;s status to inactive. They can be reactivated later.
            </div>
          )}

          {assignedTasksData && assignedTasksData.count === 0 && deleteAction === 'purge' && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <strong>⚠️ PERMANENT DELETE:</strong> This will completely remove the user and all related data from the system. This action cannot be undone.
            </div>
          )}

          {deleteAction === 'purge' && assignedTasksData && assignedTasksData.count === 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">
                Type &quot;{userToDelete?.email}&quot; to confirm permanent deletion:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter user email to confirm"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setConfirmText('');
                setDeleteAction('deactivate');
              }}
            >
              Cancel
            </AlertDialogCancel>
            {assignedTasksData && assignedTasksData.count === 0 && deleteAction === 'deactivate' && (
              <AlertDialogAction
                onClick={() => userToDelete && handleDeactivateUser(userToDelete._id)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Deactivate User
              </AlertDialogAction>
            )}
            {assignedTasksData && assignedTasksData.count === 0 && deleteAction === 'purge' && (
              <AlertDialogAction
                onClick={() => userToDelete && handlePurgeUser(userToDelete._id)}
                className="bg-red-600 hover:bg-red-700"
                disabled={confirmText !== userToDelete?.email}
              >
                Permanently Delete User
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 