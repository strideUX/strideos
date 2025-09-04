/**
 * ProjectTeamTab - Team management and overview interface for project collaboration
 *
 * @remarks
 * Displays project team composition, member details, workload distribution, and performance metrics.
 * Integrates with team management components for consistent user experience. Provides role-based
 * visual indicators and workload analysis for project planning and resource allocation.
 *
 * @example
 * ```tsx
 * <ProjectTeamTab
 *   project={projectData}
 *   team={teamMembers}
 *   tasks={projectTasks}
 * />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Id } from '@/../convex/_generated/dataModel';
import { IconUsers, IconCrown, IconBuilding } from '@tabler/icons-react';

// 2. Internal imports
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { TeamMembersTable } from '@/components/team/team-members-table';
import { TeamMemberDetailsModal } from '@/components/team/team-member-details-modal';

// 3. Types
interface Project {
  _id: Id<'projects'>;
  title: string;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  projectManagerId: Id<'users'>;
  client?: { _id: Id<'clients'>; name: string };
  department?: { _id: Id<'departments'>; name: string };
  projectManager?: { _id: Id<'users'>; name: string; email: string; image?: string };
}

interface Task {
  _id: Id<'tasks'>;
  title: string;
  status: string;
  assigneeId?: Id<'users'>;
  assignee?: { _id: Id<'users'>; name: string; email: string };
}

interface TeamMember {
  _id: Id<'users'>;
  name?: string;
  email?: string;
  role: string;
  image?: string;
}

interface ProjectTeamTabProps {
  /** Project data for team context */
  project: Project;
  /** Team members to display */
  team: TeamMember[];
  /** Project tasks for workload analysis */
  tasks: Task[];
}

// 4. Component definition
export const ProjectTeamTab = memo(function ProjectTeamTab({ 
  project, 
  team, 
  tasks 
}: ProjectTeamTabProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const roleLabelMap = useMemo(() => {
    return {
      'admin': 'Admin',
      'pm': 'Project Manager',
      'task_owner': 'Task Owner',
      'client': 'Client'
    } as const;
  }, []);

  const roleColorMap = useMemo(() => {
    return {
      'admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'pm': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'task_owner': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'client': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    } as const;
  }, []);

  const workloadColorMap = useMemo(() => {
    return {
      'high': 'text-red-600',
      'medium': 'text-yellow-600',
      'low': 'text-green-600'
    } as const;
  }, []);

  const workloadLabelMap = useMemo(() => {
    return {
      'high': 'High Workload',
      'medium': 'Medium Workload',
      'low': 'Low Workload'
    } as const;
  }, []);

  const completedTasksCount = useMemo(() => {
    return tasks.filter(task => task.status === 'done').length;
  }, [tasks]);

  const highWorkloadMembersCount = useMemo(() => {
    return team.filter(member => {
      const memberTasks = tasks.filter(task => task.assigneeId === member._id);
      return memberTasks.length > 5;
    }).length;
  }, [team, tasks]);

  const teamMembersForTable = useMemo(() => {
    return team.map((m) => ({
      _id: String(m._id),
      name: m.name,
      email: m.email,
      role: roleLabelMap[m.role as keyof typeof roleLabelMap] || m.role,
      jobTitle: roleLabelMap[m.role as keyof typeof roleLabelMap] || m.role,
      image: m.image,
      projects: undefined,
      totalTasks: tasks.filter(task => task.assigneeId === m._id).length,
      workloadPercentage: (() => {
        const memberTasks = tasks.filter(task => task.assigneeId === m._id);
        const completedTasks = memberTasks.filter(task => task.status === 'done').length;
        return memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0;
      })(),
    })) as any;
  }, [team, tasks, roleLabelMap]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const getRoleLabel = useCallback((role: string): string => {
    return roleLabelMap[role as keyof typeof roleLabelMap] || role;
  }, [roleLabelMap]);

  const getRoleColor = useCallback((role: string): string => {
    return roleColorMap[role as keyof typeof roleColorMap] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }, [roleColorMap]);

  const getMemberTasks = useCallback((memberId: Id<'users'>): Task[] => {
    return tasks.filter(task => task.assigneeId === memberId);
  }, [tasks]);

  const getMemberWorkload = useCallback((memberId: Id<'users'>) => {
    const memberTasks = getMemberTasks(memberId);
    const totalTasks = memberTasks.length;
    const completedTasks = memberTasks.filter(task => task.status === 'done').length;
    const inProgressTasks = memberTasks.filter(task => task.status === 'in_progress').length;
    
    return {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      workload: totalTasks > 5 ? 'high' : totalTasks > 2 ? 'medium' : 'low'
    };
  }, [getMemberTasks]);

  const getWorkloadColor = useCallback((workload: string): string => {
    return workloadColorMap[workload as keyof typeof workloadColorMap] || 'text-slate-600';
  }, [workloadColorMap]);

  const getWorkloadLabel = useCallback((workload: string): string => {
    return workloadLabelMap[workload as keyof typeof workloadLabelMap] || 'No Tasks';
  }, [workloadLabelMap]);

  const handleViewDetails = useCallback((memberId: string) => {
    setSelectedMember(memberId);
  }, []);

  const handleMemberModalChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedMember(null);
    }
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Composition</CardTitle>
          <CardDescription>
            Dynamic team assembled from department members and task assignees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Department Lead</h4>
              {project.projectManager ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={project.projectManager.image} />
                    <AvatarFallback>
                      {project.projectManager.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{project.projectManager.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {project.projectManager.email}
                    </div>
                  </div>
                  <Badge className={getRoleColor('pm')}>
                    <IconCrown className="w-3 h-3 mr-1" />
                    PM
                  </Badge>
                </div>
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  No project manager assigned
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3">Department</h4>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <IconBuilding className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="font-medium">{project.department?.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {project.client?.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members - use the shared table for consistency */}
      <TeamMembersTable
        members={teamMembersForTable}
        onViewDetails={handleViewDetails}
      />

      {selectedMember && (
        <TeamMemberDetailsModal
          memberId={selectedMember}
          open={!!selectedMember}
          onOpenChange={handleMemberModalChange}
        />
      )}

      {/* Team Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{team.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Team Members</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {completedTasksCount}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Completed Tasks</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {highWorkloadMembersCount}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">High Workload Members</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
