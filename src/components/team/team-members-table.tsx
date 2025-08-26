/**
 * TeamMembersTable - Comprehensive table for team member management and workload tracking
 *
 * @remarks
 * Displays team members in a sortable, searchable table with workload indicators, capacity metrics,
 * and project/task counts. Provides interactive sorting, filtering, and detailed member information.
 * Integrates with team management workflow for resource allocation and performance monitoring.
 *
 * @example
 * ```tsx
 * <TeamMembersTable
 *   members={teamMembers}
 *   onViewDetails={handleMemberDetails}
 * />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo } from 'react';
import { IconDots, IconSearch, IconFilter } from '@tabler/icons-react';

// 2. Internal imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

// 3. Types
interface TeamMember {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  jobTitle?: string;
  status?: string;
  location?: string;
  phone?: string;
  image?: string;
  avatarUrl?: string;
  department?: { name: string };
  departments?: Array<{ name: string }>;
  projects?: number;
  totalTasks?: number;
  workloadPercentage?: number;
  totalHours?: number;
}

interface TeamMembersTableProps {
  /** List of team members to display */
  members: TeamMember[];
  /** Callback for viewing member details */
  onViewDetails: (memberId: string) => void;
}

interface SortConfig {
  key: keyof TeamMember;
  direction: 'asc' | 'desc';
}

// 4. Component definition
export const TeamMembersTable = memo(function TeamMembersTable({ 
  members, 
  onViewDetails 
}: TeamMembersTableProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    
    const searchLower = searchTerm.toLowerCase();
    return members.filter(member =>
      (member.name || '').toLowerCase().includes(searchLower) ||
      (member.email || '').toLowerCase().includes(searchLower) ||
      (member.role || '').toLowerCase().includes(searchLower) ||
      (member.jobTitle || '').toLowerCase().includes(searchLower)
    );
  }, [members, searchTerm]);

  const sortedMembers = useMemo(() => {
    if (!sortConfig) return filteredMembers;

    return [...filteredMembers].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredMembers, sortConfig]);

  const workloadStats = useMemo(() => {
    const totalMembers = members.length;
    const availableMembers = members.filter(m => (m.workloadPercentage || 0) < 80).length;
    const overloadedMembers = members.filter(m => (m.workloadPercentage || 0) >= 100).length;
    
    return {
      totalMembers,
      availableMembers,
      overloadedMembers,
    };
  }, [members]);

  const sortIndicators = useMemo(() => {
    return {
      name: sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓'),
      role: sortConfig?.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓'),
      totalHours: sortConfig?.key === 'totalHours' && (sortConfig.direction === 'asc' ? '↑' : '↓'),
      projects: sortConfig?.key === 'projects' && (sortConfig.direction === 'asc' ? '↑' : '↓'),
      totalTasks: sortConfig?.key === 'totalTasks' && (sortConfig.direction === 'asc' ? '↑' : '↓'),
      workloadPercentage: sortConfig?.key === 'workloadPercentage' && (sortConfig.direction === 'asc' ? '↑' : '↓'),
    };
  }, [sortConfig]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleSort = useCallback((key: keyof TeamMember) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleMemberClick = useCallback((memberId: string) => {
    onViewDetails(memberId);
  }, [onViewDetails]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, memberId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewDetails(memberId);
    }
  }, [onViewDetails]);

  const handleDropdownClick = useCallback((e: React.MouseEvent, memberId: string) => {
    e.stopPropagation();
    onViewDetails(memberId);
  }, [onViewDetails]);

  const getWorkloadColor = useCallback((workloadPercentage: number): string => {
    return (workloadPercentage ?? 0) >= 80 ? 'text-yellow-600' : '';
  }, []);

  const getAvatarFallback = useCallback((member: TeamMember): string => {
    const name = member.name || member.email || 'U';
    return name.split(' ').map((n: string) => n[0]).join('');
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>All team members and their current workload</CardDescription>
        
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
          {/* Workload Summary */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total: {workloadStats.totalMembers}</span>
            <span>Available: {workloadStats.availableMembers}</span>
            <span>Overloaded: {workloadStats.overloadedMembers}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                Member {sortIndicators.name}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('role')}
              >
                Role {sortIndicators.role}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('totalHours')}
              >
                Capacity {sortIndicators.totalHours}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('projects')}
              >
                Projects {sortIndicators.projects}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('totalTasks')}
              >
                Tasks {sortIndicators.totalTasks}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('workloadPercentage')}
              >
                Workload {sortIndicators.workloadPercentage}
              </TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sortedMembers || []).map((member) => (
              <TableRow
                key={member._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleMemberClick(member._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, member._id)}
                title="View details"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.image || member.avatarUrl} />
                      <AvatarFallback>
                        {getAvatarFallback(member)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name || member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{member.jobTitle || member.role}</TableCell>
                <TableCell>
                  <span className="text-sm">{member.totalHours ?? 0}h</span>
                </TableCell>
                <TableCell>{member.projects ?? 0}</TableCell>
                <TableCell>{member.totalTasks ?? 0}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={member.workloadPercentage ?? 0} className="w-20 h-2" />
                    <span className={`text-sm font-medium ${getWorkloadColor(member.workloadPercentage ?? 0)}`}>
                      {member.workloadPercentage ?? 0}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{member.email}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <IconDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleDropdownClick(e, member._id)}>
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});
