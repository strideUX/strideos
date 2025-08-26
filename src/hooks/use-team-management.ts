import { useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';

type UserRole = 'admin' | 'pm' | 'task_owner' | 'client';
type UserStatus = 'active' | 'inactive' | 'invited';

type EnrichedUser = Doc<'users'> & {
  client?: { _id: Id<'clients'>; name: string } | null;
  departments?: { _id: Id<'departments'>; name: string }[] | null;
  _tasks?: Doc<'tasks'>[] | null;
};

interface UseTeamManagementProps {
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
  includeInactive?: boolean;
  includeClients?: boolean;
}

/**
 * useTeamManagement - Manages team data, filtering, and workload calculations
 * 
 * @param props - Team management configuration
 * @returns Team management state and methods
 */
export function useTeamManagement({ 
  clientId, 
  departmentId, 
  includeInactive = false,
  includeClients = true 
}: UseTeamManagementProps = {}) {
  // Convex queries
  const allUsers = useQuery(api.users.getTeamWorkload, { includeInactive });
  const clientTeam = useQuery(
    clientId ? api.users.getClientTeam : 'skip',
    clientId ? { clientId } : 'skip'
  );
  const departmentDetails = useQuery(
    departmentId ? api.departments.getDepartmentById : 'skip',
    departmentId ? { departmentId } : 'skip'
  );

  // Filter and enrich users
  const filteredUsers = useMemo(() => {
    let users = (allUsers || []) as EnrichedUser[];
    
    // Filter by client if specified
    if (clientId) {
      users = users.filter(user => user.clientId === clientId);
    }
    
    // Filter by department if specified
    if (departmentId) {
      users = users.filter(user => 
        user.departmentIds && user.departmentIds.includes(departmentId)
      );
    }
    
    // Filter by status
    if (!includeInactive) {
      users = users.filter(user => user.status === 'active' || !user.status);
    }
    
    // Filter by role (exclude clients if not requested)
    if (!includeClients) {
      users = users.filter(user => user.role !== 'client');
    }
    
    return users;
  }, [allUsers, clientId, departmentId, includeInactive, includeClients]);

  // Group users by role
  const groupedByRole = useMemo(() => {
    const grouped: Record<UserRole, EnrichedUser[]> = {
      admin: [],
      pm: [],
      task_owner: [],
      client: [],
    };
    
    for (const user of filteredUsers) {
      if (grouped[user.role]) {
        grouped[user.role].push(user);
      }
    }
    
    return grouped;
  }, [filteredUsers]);

  // Group users by department
  const groupedByDepartment = useMemo(() => {
    const grouped: Record<string, EnrichedUser[]> = {};
    const noDepartment: EnrichedUser[] = [];
    
    for (const user of filteredUsers) {
      if (user.departmentIds && user.departmentIds.length > 0) {
        for (const deptId of user.departmentIds) {
          const deptIdStr = deptId as string;
          if (!grouped[deptIdStr]) {
            grouped[deptIdStr] = [];
          }
          grouped[deptIdStr].push(user);
        }
      } else {
        noDepartment.push(user);
      }
    }
    
    return { byDepartment: grouped, noDepartment };
  }, [filteredUsers]);

  // Workload calculations
  const workloadStats = useMemo(() => {
    const stats = {
      totalUsers: filteredUsers.length,
      activeUsers: filteredUsers.filter(u => u.status === 'active' || !u.status).length,
      inactiveUsers: filteredUsers.filter(u => u.status === 'inactive').length,
      invitedUsers: filteredUsers.filter(u => u.status === 'invited').length,
      byRole: {} as Record<UserRole, number>,
      totalCapacity: 0,
      averageWorkload: 0,
    };
    
    // Count by role
    for (const role of Object.keys(groupedByRole) as UserRole[]) {
      stats.byRole[role] = groupedByRole[role].length;
    }
    
    // Calculate capacity and workload
    let totalHours = 0;
    let userCount = 0;
    
    for (const user of filteredUsers) {
      if (user.role !== 'client') {
        const capacity = (user as any).workstreamCapacity || 32; // Default 32 hours/week
        totalHours += capacity;
        userCount++;
      }
    }
    
    stats.totalCapacity = totalHours;
    stats.averageWorkload = userCount > 0 ? Math.round(totalHours / userCount) : 0;
    
    return stats;
  }, [filteredUsers, groupedByRole]);

  // User search and filtering utilities
  const searchUsers = useCallback((query: string) => {
    if (!query.trim()) return filteredUsers;
    
    const searchTerm = query.toLowerCase();
    
    return filteredUsers.filter(user => {
      return (
        (user.name || '').toLowerCase().includes(searchTerm) ||
        (user.email || '').toLowerCase().includes(searchTerm) ||
        (user.jobTitle || '').toLowerCase().includes(searchTerm) ||
        (user.client?.name || '').toLowerCase().includes(searchTerm) ||
        (user.departments?.map(d => d.name).join(' ') || '').toLowerCase().includes(searchTerm)
      );
    });
  }, [filteredUsers]);

  const filterUsersByRole = useCallback((role: UserRole) => {
    return filteredUsers.filter(user => user.role === role);
  }, [filteredUsers]);

  const filterUsersByStatus = useCallback((status: UserStatus) => {
    return filteredUsers.filter(user => user.status === status);
  }, [filteredUsers]);

  const filterUsersByClient = useCallback((targetClientId: Id<'clients'>) => {
    return filteredUsers.filter(user => user.clientId === targetClientId);
  }, [filteredUsers]);

  const filterUsersByDepartment = useCallback((targetDepartmentId: Id<'departments'>) => {
    return filteredUsers.filter(user => 
      user.departmentIds && user.departmentIds.includes(targetDepartmentId)
    );
  }, [filteredUsers]);

  // User sorting utilities
  const sortUsersByName = useCallback((userList: EnrichedUser[]) => {
    return [...userList].sort((a, b) => {
      const aName = a.name || a.email || '';
      const bName = b.name || b.email || '';
      return aName.localeCompare(bName);
    });
  }, []);

  const sortUsersByRole = useCallback((userList: EnrichedUser[]) => {
    const roleOrder = { admin: 0, pm: 1, task_owner: 2, client: 3 };
    
    return [...userList].sort((a, b) => {
      const aOrder = roleOrder[a.role] ?? 3;
      const bOrder = roleOrder[b.role] ?? 3;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Secondary sort by name
      const aName = a.name || a.email || '';
      const bName = b.name || b.email || '';
      return aName.localeCompare(bName);
    });
  }, []);

  const sortUsersByWorkload = useCallback((userList: EnrichedUser[]) => {
    return [...userList].sort((a, b) => {
      const aCapacity = (a as any).workstreamCapacity || 32;
      const bCapacity = (b as any).workstreamCapacity || 32;
      
      return bCapacity - aCapacity; // Descending order
    });
  }, []);

  // Team composition analysis
  const teamComposition = useMemo(() => {
    const composition = {
      hasAdmins: groupedByRole.admin.length > 0,
      hasPMs: groupedByRole.pm.length > 0,
      hasTaskOwners: groupedByRole.task_owner.length > 0,
      hasClients: groupedByRole.client.length > 0,
      isBalanced: false,
      recommendations: [] as string[],
    };
    
    // Check if team is balanced
    const totalInternal = groupedByRole.admin.length + groupedByRole.pm.length + groupedByRole.task_owner.length;
    
    if (totalInternal === 0) {
      composition.recommendations.push('No internal team members assigned');
    } else if (groupedByRole.admin.length === 0) {
      composition.recommendations.push('Consider adding an administrator for system management');
    } else if (groupedByRole.pm.length === 0) {
      composition.recommendations.push('Consider adding a project manager for coordination');
    }
    
    composition.isBalanced = totalInternal > 0 && composition.recommendations.length === 0;
    
    return composition;
  }, [groupedByRole]);

  return useMemo(() => ({
    // Data
    users: filteredUsers,
    clientTeam,
    departmentDetails,
    
    // Grouped data
    groupedByRole,
    groupedByDepartment,
    
    // Statistics
    workloadStats,
    teamComposition,
    
    // Utilities
    searchUsers,
    filterUsersByRole,
    filterUsersByStatus,
    filterUsersByClient,
    filterUsersByDepartment,
    sortUsersByName,
    sortUsersByRole,
    sortUsersByWorkload,
    
    // Computed values
    hasUsers: filteredUsers.length > 0,
    totalUsers: filteredUsers.length,
    isTeamBalanced: teamComposition.isBalanced,
  }), [
    filteredUsers,
    clientTeam,
    departmentDetails,
    groupedByRole,
    groupedByDepartment,
    workloadStats,
    teamComposition,
    searchUsers,
    filterUsersByRole,
    filterUsersByStatus,
    filterUsersByClient,
    filterUsersByDepartment,
    sortUsersByName,
    sortUsersByRole,
    sortUsersByWorkload,
  ]);
}
