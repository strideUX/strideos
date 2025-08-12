'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useState } from 'react';
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
import { Department } from '@/types/client';
import { toast } from 'sonner';

interface DepartmentListProps {
  clientId: Id<"clients">;
  onEditDepartment: (department: Department) => void;
  onAddDepartment: () => void;
}

export function DepartmentList({ clientId, onEditDepartment, onAddDepartment }: DepartmentListProps) {
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);

  // Fetch departments for this client
  const departments = useQuery(api.departments.listDepartmentsByClient, {
    clientId: clientId,
  });

  const deleteDepartment = useMutation(api.departments.deleteDepartment);

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    setDeletingDepartmentId(departmentId);

    try {
      await deleteDepartment({ departmentId: departmentId as Id<"departments"> });
      toast.success('Department deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete department');
    } finally {
      setDeletingDepartmentId(null);
    }
  };



  if (!departments) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Departments</CardTitle>
            <CardDescription>
              {departments.length === 0 
                ? 'No departments configured for this client'
                : `${departments.length} departments`
              }
            </CardDescription>
          </div>
          <Button onClick={onAddDepartment} size="sm">
            <IconPlus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {departments.length === 0 ? (
          <div className="text-center py-8">
            <IconUsers className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No departments yet
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Create departments to organize workstreams and capacity planning.
            </p>
            <Button onClick={onAddDepartment}>
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
                {departments.map((department) => (
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
                                                                               <DropdownMenuItem onClick={() => onEditDepartment(department as any)}>
                            <IconEdit className="h-4 w-4 mr-2" />
                            Edit Department
                          </DropdownMenuItem>
                           <DropdownMenuItem 
                             onClick={() => handleDeleteDepartment(department._id)}
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
}
