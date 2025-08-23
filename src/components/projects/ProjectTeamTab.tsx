import { useState } from 'react';
import { Id } from '@/../convex/_generated/dataModel';
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
import { IconUsers, IconCrown, IconBuilding } from '@tabler/icons-react';
import { TeamMembersTable } from '@/components/team/TeamMembersTable';
import { TeamMemberDetailsModal } from '@/components/team/TeamMemberDetailsModal';

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
  project: Project;
  team: TeamMember[];
  tasks: Task[];
}

export function ProjectTeamTab({ project, team, tasks }: ProjectTeamTabProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'pm': return 'Project Manager';
      case 'task_owner': return 'Task Owner';
      case 'client': return 'Client';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pm': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'task_owner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'client': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getMemberTasks = (memberId: Id<'users'>) => {
    return tasks.filter(task => task.assigneeId === memberId);
  };

  const getMemberWorkload = (memberId: Id<'users'>) => {
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
  };

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  const getWorkloadLabel = (workload: string) => {
    switch (workload) {
      case 'high': return 'High Workload';
      case 'medium': return 'Medium Workload';
      case 'low': return 'Low Workload';
      default: return 'No Tasks';
    }
  };

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
        members={team.map((m) => ({
          _id: String(m._id),
          name: m.name,
          email: m.email,
          role: getRoleLabel(m.role),
          jobTitle: getRoleLabel(m.role),
          image: m.image,
          projects: undefined,
          totalTasks: getMemberTasks(m._id).length,
          workloadPercentage: getMemberWorkload(m._id).progress,
        })) as any}
        onViewDetails={(memberId: string) => setSelectedMember(memberId)}
      />

      {selectedMember && (
        <TeamMemberDetailsModal
          memberId={selectedMember}
          open={!!selectedMember}
          onOpenChange={(open: boolean) => !open && setSelectedMember(null)}
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
                {tasks.filter(task => task.status === 'done').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Completed Tasks</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {team.filter(member => getMemberWorkload(member._id).workload === 'high').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">High Workload Members</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
