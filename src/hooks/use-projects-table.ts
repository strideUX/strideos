import { useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface Project {
  _id: Id<'projects'>;
  title: string;
  description?: string;
  status: string;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  projectManagerId: Id<'users'>;
  targetDueDate?: number;
  createdAt: number;
  updatedAt: number;
  client?: { _id: Id<'clients'>; name: string; logo?: Id<'_storage'>; isInternal?: boolean };
  department?: { _id: Id<'departments'>; name: string };
  projectManager?: { _id: Id<'users'>; name: string; email: string; image?: string };
}

interface ProjectGroup {
  key: string;
  clientName: string;
  clientLogo?: Id<'_storage'>;
  departmentName: string;
  items: Project[];
}

interface UseProjectsTableProps {
  projects: Project[];
  groupByClientDepartment?: boolean;
}

/**
 * useProjectsTable - Manages projects table data, grouping, and sorting
 * 
 * @param props - Projects table configuration
 * @returns Projects table state and methods
 */
export function useProjectsTable({ projects, groupByClientDepartment = false }: UseProjectsTableProps) {
  // Fetch aggregated task counts and total hours per project
  const projectIds = useMemo(() => projects.map(p => p._id), [projects]);
  const aggregates = useQuery(
    api.tasks.getTaskAggregatesForProjects as any, 
    projectIds.length > 0 ? ({ projectIds } as any) : 'skip'
  ) as Record<string, { totalTasks: number; totalHours: number }> | undefined;

  // Status management
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'new': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ready_for_work': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'client_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'client_approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'new': return 'New';
      case 'planning': return 'Planning';
      case 'ready_for_work': return 'Ready for Work';
      case 'in_progress': return 'In Progress';
      case 'client_review': return 'Client Review';
      case 'client_approved': return 'Client Approved';
      case 'complete': return 'Complete';
      default: return status;
    }
  }, []);

  // Project grouping by client and department
  const groups = useMemo((): ProjectGroup[] => {
    if (!groupByClientDepartment) return [];
    
    const map = new Map<string, ProjectGroup>();
    
    for (const project of projects) {
      const key = `${project.clientId}|${project.departmentId}`;
      const existing = map.get(key);
      
      if (existing) {
        existing.items.push(project);
      } else {
        map.set(key, {
          key,
          clientName: project.client?.name || 'Unknown Client',
          clientLogo: project.client?.logo as Id<'_storage'> | undefined,
          departmentName: project.department?.name || 'Unknown Department',
          items: [project],
        });
      }
    }
    
    return Array.from(map.values()).sort((a, b) => 
      a.clientName.localeCompare(b.clientName) || 
      a.departmentName.localeCompare(b.departmentName)
    );
  }, [projects, groupByClientDepartment]);

  // Project sorting utilities
  const sortProjectsByStatus = useCallback((projectList: Project[]) => {
    const order = ['new', 'planning', 'ready_for_work', 'in_progress', 'client_review', 'client_approved', 'complete'];
    const orderIndex = new Map(order.map((s, i) => [s, i] as [string, number]));
    
    return [...projectList].sort((a, b) => {
      const ai = orderIndex.get(a.status) ?? 999;
      const bi = orderIndex.get(b.status) ?? 999;
      
      if (ai !== bi) return ai - bi;
      
      // Secondary sort by title
      return a.title.localeCompare(b.title);
    });
  }, []);

  const sortProjectsByDueDate = useCallback((projectList: Project[]) => {
    return [...projectList].sort((a, b) => {
      const aDue = a.targetDueDate || 0;
      const bDue = b.targetDueDate || 0;
      
      if (aDue === 0 && bDue === 0) return 0;
      if (aDue === 0) return 1;
      if (bDue === 0) return -1;
      
      return aDue - bDue;
    });
  }, []);

  const sortProjectsByTitle = useCallback((projectList: Project[]) => {
    return [...projectList].sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  const sortProjectsByClient = useCallback((projectList: Project[]) => {
    return [...projectList].sort((a, b) => {
      const aClient = a.client?.name || '';
      const bClient = b.client?.name || '';
      
      if (aClient !== bClient) return aClient.localeCompare(bClient);
      
      // Secondary sort by title
      return a.title.localeCompare(b.title);
    });
  }, []);

  // Project filtering utilities
  const filterProjectsByStatus = useCallback((status: string) => {
    return projects.filter(project => project.status === status);
  }, [projects]);

  const filterProjectsByClient = useCallback((clientId: Id<'clients'>) => {
    return projects.filter(project => project.clientId === clientId);
  }, [projects]);

  const filterProjectsByDepartment = useCallback((departmentId: Id<'departments'>) => {
    return projects.filter(project => project.departmentId === departmentId);
  }, [projects]);

  const filterProjectsByProjectManager = useCallback((projectManagerId: Id<'users'>) => {
    return projects.filter(project => project.projectManagerId === projectManagerId);
  }, [projects]);

  // Search utilities
  const searchProjects = useCallback((query: string) => {
    if (!query.trim()) return projects;
    
    const searchTerm = query.toLowerCase();
    
    return projects.filter(project => {
      return (
        (project.title || '').toLowerCase().includes(searchTerm) ||
        (project.description || '').toLowerCase().includes(searchTerm) ||
        (project.client?.name || '').toLowerCase().includes(searchTerm) ||
        (project.department?.name || '').toLowerCase().includes(searchTerm) ||
        (project.projectManager?.name || '').toLowerCase().includes(searchTerm) ||
        (project.projectManager?.email || '').toLowerCase().includes(searchTerm)
      );
    });
  }, [projects]);

  // Computed values
  const hasProjects = useMemo(() => projects.length > 0, [projects]);
  const totalProjects = useMemo(() => projects.length, [projects]);
  const totalHours = useMemo(() => {
    if (!aggregates) return 0;
    return Object.values(aggregates).reduce((sum, agg) => sum + (agg.totalHours || 0), 0);
  }, [aggregates]);
  const totalTasks = useMemo(() => {
    if (!aggregates) return 0;
    return Object.values(aggregates).reduce((sum, agg) => sum + (agg.totalTasks || 0), 0);
  }, [aggregates]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    
    for (const project of projects) {
      const status = project.status;
      distribution[status] = (distribution[status] || 0) + 1;
    }
    
    return distribution;
  }, [projects]);

  // Column configuration
  const columnCount = useMemo(() => groupByClientDepartment ? 7 : 8, [groupByClientDepartment]);

  return useMemo(() => ({
    // Data
    projects,
    groups,
    aggregates,
    
    // Computed values
    hasProjects,
    totalProjects,
    totalHours,
    totalTasks,
    statusDistribution,
    columnCount,
    
    // Status utilities
    getStatusColor,
    getStatusLabel,
    
    // Sorting utilities
    sortProjectsByStatus,
    sortProjectsByDueDate,
    sortProjectsByTitle,
    sortProjectsByClient,
    
    // Filtering utilities
    filterProjectsByStatus,
    filterProjectsByClient,
    filterProjectsByDepartment,
    filterProjectsByProjectManager,
    
    // Search utilities
    searchProjects,
  }), [
    projects,
    groups,
    aggregates,
    hasProjects,
    totalProjects,
    totalHours,
    totalTasks,
    statusDistribution,
    columnCount,
    getStatusColor,
    getStatusLabel,
    sortProjectsByStatus,
    sortProjectsByDueDate,
    sortProjectsByTitle,
    sortProjectsByClient,
    filterProjectsByStatus,
    filterProjectsByClient,
    filterProjectsByDepartment,
    filterProjectsByProjectManager,
    searchProjects,
  ]);
}
