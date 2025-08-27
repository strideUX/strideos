/**
 * ClientTeamTable - Client team member management table
 *
 * @remarks
 * Displays a comprehensive table of team members assigned to a specific client,
 * including their roles, departments, workload, and contact information.
 * Provides interactive member details modal and proper loading/empty states.
 *
 * @example
 * ```tsx
 * <ClientTeamTable 
 *   members={clientTeamMembers} 
 *   isLoading={isLoadingTeam} 
 * />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo } from 'react';
import { IconDotsVertical, IconUsers } from '@tabler/icons-react';

// 2. Internal imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { TeamMemberDetailsModal } from '@/components/team/team-member-details-modal';

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

interface ClientTeamTableProps {
  /** Array of team members assigned to the client */
  members?: TeamMember[];
  /** Loading state indicator */
  isLoading?: boolean;
}

// 4. Component definition
export const ClientTeamTable = memo(function ClientTeamTable({ 
  members, 
  isLoading 
}: ClientTeamTableProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const hasMembers = useMemo(() => {
    return Boolean(members && members.length > 0);
  }, [members]);

  const memberCount = useMemo(() => {
    return members?.length || 0;
  }, [members?.length]);

  const selectedMemberData = useMemo(() => {
    if (!selectedMember) return null;
    return members?.find(member => member._id === selectedMember);
  }, [selectedMember, members]);

  const isModalOpen = useMemo(() => {
    return Boolean(selectedMember);
  }, [selectedMember]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleMemberSelect = useCallback((memberId: string) => {
    setSelectedMember(memberId);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedMember(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, memberId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleMemberSelect(memberId);
    }
  }, [handleMemberSelect]);

  const getUserInitials = useCallback((name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getDepartmentName = useCallback((member: TeamMember): string => {
    if (member.department?.name) return member.department.name;
    if (member.departments && member.departments.length > 0) {
      return member.departments.map(d => d.name).join(', ');
    }
    return '—';
  }, []);

  const getStatusBadge = useCallback((status?: string) => {
    if (!status) return null;
    
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  }, []);

  const renderMemberRow = useCallback((member: TeamMember) => (
    <TableRow
      key={member._id}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleMemberSelect(member._id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => handleKeyDown(e, member._id)}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={member.image || member.avatarUrl} alt={member.name} />
            <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{member.name || 'Unnamed'}</div>
            <div className="text-sm text-muted-foreground">{member.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{member.role || '—'}</div>
          <div className="text-sm text-muted-foreground">{member.jobTitle}</div>
        </div>
      </TableCell>
      <TableCell>{getDepartmentName(member)}</TableCell>
      <TableCell>{getStatusBadge(member.status)}</TableCell>
      <TableCell className="text-center">{member.projects || 0}</TableCell>
      <TableCell className="text-center">{member.totalTasks || 0}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={member.workloadPercentage || 0} className="w-16" />
          <span className="text-sm text-muted-foreground">
            {Math.round(member.workloadPercentage || 0)}%
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">{member.totalHours || 0}h</TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{member.location || '—'}</div>
          <div className="text-muted-foreground">{member.phone || '—'}</div>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handleMemberSelect(member._id);
            }}>
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  ), [handleMemberSelect, handleKeyDown, getUserInitials, getDepartmentName, getStatusBadge]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading team members...</div>
        </CardContent>
      </Card>
    );
  }

  if (!hasMembers) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <IconUsers className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-medium text-muted-foreground mb-2">No team members found</h3>
            <p className="text-sm text-muted-foreground">
              This client doesn&apos;t have any team members assigned yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>All team members assigned to this client</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Workload</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(renderMemberRow)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedMemberData && (
        <TeamMemberDetailsModal
          member={selectedMemberData}
          open={isModalOpen}
          onOpenChange={handleModalClose}
        />
      )}
    </>
  );
});