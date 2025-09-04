/**
 * DepartmentList - Department management and display component
 *
 * @remarks
 * Displays a list of departments for a specific client with management capabilities.
 * Supports viewing department details, editing, and deletion operations.
 * Integrates with Convex for real-time data synchronization and department operations.
 *
 * @example
 * ```tsx
 * <DepartmentList
 *   clientId="client123"
 *   onEditDepartment={handleEditDepartment}
 *   onAddDepartment={handleAddDepartment}
 * />
 * ```
 */

// 1. External imports
import React, { useState, memo, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconPlus, IconDots, IconEdit, IconArchive, IconUsers, IconFolder } from '@tabler/icons-react';
import { Department, DepartmentWithStats } from '@/types/client.types';
import { toast } from 'sonner';

// 3. Types
interface DepartmentListProps {
  /** Client ID for filtering departments */
  clientId: Id<'clients'>;
  /** Callback when editing a department */
  onEditDepartment: (department: Department) => void;
  /** Callback when adding a new department */
  onAddDepartment: () => void;
}

// 4. Component definition
export const DepartmentList = memo(function DepartmentList({ 
  clientId, 
  onEditDepartment, 
  onAddDepartment 
}: DepartmentListProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);

  // Fetch departments for this client
  const queryAny = useQuery as unknown as <T>(fn: any, args: any) => T;
  const departments = queryAny<DepartmentWithStats[] | undefined>(
    api.departments.listDepartmentsByClient as unknown as any,
    { clientId } as any
  );

  const deleteDepartment = useMutation(api.departments.deleteDepartment);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isLoading = useMemo(() => {
    return departments === undefined;
  }, [departments]);

  const hasDepartments = useMemo(() => {
    return departments && departments.length > 0;
  }, [departments]);

  const departmentCount = useMemo(() => {
    return departments?.length || 0;
  }, [departments]);

  const departmentCountText = useMemo(() => {
    if (departmentCount === 0) {
      return 'No departments configured for this client';
    }
    return `${departmentCount} departments`;
  }, [departmentCount]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleDeleteDepartment = useCallback(async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    setDeletingDepartmentId(departmentId);

    try {
      await deleteDepartment({ departmentId: departmentId as Id<'departments'> });
      toast.success('Department deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete department');
    } finally {
      setDeletingDepartmentId(null);
    }
  }, [deleteDepartment]);

  const handleEditClick = useCallback((department: DepartmentWithStats) => {
    // Convert API response to Department type for the callback
    const departmentForEdit: Department = {
      _id: department._id,
      _creationTime: department._creationTime,
      name: department.name,
      clientId: department.clientId,
      primaryContactId: department.primaryContactId,
      leadId: department.leadId,
      teamMemberIds: department.teamMemberIds,
      workstreamCount: department.workstreamCount,
      slackChannelId: department.slackChannelId,
      capacity: 0,
      status: 'active',
      createdBy: department.createdBy,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
    onEditDepartment(departmentForEdit);
  }, [onEditDepartment]);

  const handleAddClick = useCallback(() => {
    onAddDepartment();
  }, [onAddDepartment]);

  const handleDeleteClick = useCallback((departmentId: string) => {
    handleDeleteDepartment(departmentId);
  }, [handleDeleteDepartment]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Departments</CardTitle>
          <CardDescription>Loading departments...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Departments</CardTitle>
            <CardDescription>
              {departmentCountText}
            </CardDescription>
          </div>
          <Button onClick={handleAddClick} size="sm">
            <IconPlus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasDepartments ? (
          <div className="text-center py-8">
            <IconUsers className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No departments yet
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Create departments to organize workstreams and capacity planning.
            </p>
            <Button onClick={handleAddClick}>
              <IconPlus className="w-4 h-4 mr-2" />
              Create First Department
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Team Members</TableHead>
                  <TableHead>Workstreams</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments?.map((department) => (
                  <TableRow key={department._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{department.name}</div>
                        {department.slackChannelId && (
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Slack: {department.slackChannelId}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {department.primaryContact ? (
                          <div>
                            <div className="font-medium">{department.primaryContact.name}</div>
                            <div className="text-slate-500">{department.primaryContact.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {department.lead ? (
                          <div>
                            <div className="font-medium">{department.lead.name}</div>
                            <div className="text-slate-500">{department.lead.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {department.teamMembers && department.teamMembers.length > 0 ? (
                          <div>
                            <div className="font-medium">{department.teamMembers.length} members</div>
                            <div className="text-slate-500">
                              {department.teamMembers.slice(0, 2).map(member => member.name).join(', ')}
                              {department.teamMembers.length > 2 && ` +${department.teamMembers.length - 2} more`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">No members</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconUsers className="w-4 h-4 text-slate-400" />
                        <span>{department.workstreamCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconFolder className="w-4 h-4 text-slate-400" />
                        <span>{department.activeProjectCount}/{department.projectCount}</span>
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
                          <DropdownMenuItem onClick={() => handleEditClick(department)}>
                            <IconEdit className="h-4 w-4 mr-2" />
                            Edit Department
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(department._id)}
                            disabled={deletingDepartmentId === department._id}
                          >
                            <IconArchive className="h-4 w-4 mr-2" />
                            {deletingDepartmentId === department._id ? 'Deleting...' : 'Delete Department'}
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
  );
});
