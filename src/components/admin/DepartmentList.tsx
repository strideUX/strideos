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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconPlus, IconDots, IconEdit, IconArchive, IconUsers, IconFolder, IconClock } from '@tabler/icons-react';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatWorkingDays = (daysOfWeek: number[]) => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysOfWeek.map(day => dayLabels[day]).join(', ');
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

  const activeDepartments = departments.filter(dept => dept.status === 'active');
  const inactiveDepartments = departments.filter(dept => dept.status === 'inactive');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Departments</CardTitle>
            <CardDescription>
              {departments.length === 0 
                ? 'No departments configured for this client'
                : `${activeDepartments.length} active, ${inactiveDepartments.length} inactive`
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
                  <TableHead>Workstreams</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Sprint Duration</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{department.name}</div>
                        {department.description && (
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {department.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconUsers className="w-4 h-4 text-slate-400" />
                        <span>{department.workstreamCount}</span>
                        {department.workstreamLabels && department.workstreamLabels.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {department.workstreamLabels.join(', ')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{department.totalCapacity}</span>
                        <span className="text-sm text-slate-500">
                          ({department.workstreamCapacity} × {department.workstreamCount})
                        </span>
                      </div>
                      {department.averageVelocity && department.averageVelocity > 0 && (
                        <div className="text-xs text-slate-500">
                          Avg: {department.averageVelocity} pts/sprint
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconClock className="w-4 h-4 text-slate-400" />
                        <span>{department.sprintDuration} week{department.sprintDuration !== 1 ? 's' : ''}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconFolder className="w-4 h-4 text-slate-400" />
                        <span>{department.activeProjectCount}/{department.projectCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(department.status)}>
                        {department.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditDepartment(department)}>
                            <IconEdit className="h-4 w-4 mr-2" />
                            Edit Department
                          </DropdownMenuItem>
                          {department.status === 'active' && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDepartment(department._id)}
                              disabled={deletingDepartmentId === department._id}
                            >
                              <IconArchive className="h-4 w-4 mr-2" />
                              {deletingDepartmentId === department._id ? 'Deleting...' : 'Archive Department'}
                            </DropdownMenuItem>
                          )}
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
