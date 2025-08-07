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
import { IconUsers, IconCrown, IconUser, IconBuilding } from '@tabler/icons-react';

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

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members ({team.length})</CardTitle>
          <CardDescription>
            All team members with their current workload and task assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <div className="text-center py-8">
              <IconUsers className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                No team members assigned to this project yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map((member) => {
                const workload = getMemberWorkload(member._id);
                const memberTasks = getMemberTasks(member._id);
                
                return (
                  <Card key={member._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.image} />
                          <AvatarFallback>
                            {member.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{member.name || 'Unnamed User'}</h4>
                            <Badge className={getRoleColor(member.role)}>
                              {getRoleLabel(member.role)}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {member.email}
                          </p>
                          
                          {/* Workload Indicator */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Workload</span>
                              <span className={`font-medium ${getWorkloadColor(workload.workload)}`}>
                                {getWorkloadLabel(workload.workload)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs text-center">
                              <div>
                                <div className="font-medium text-green-600">{workload.completed}</div>
                                <div className="text-slate-500">Done</div>
                              </div>
                              <div>
                                <div className="font-medium text-blue-600">{workload.inProgress}</div>
                                <div className="text-slate-500">In Progress</div>
                              </div>
                              <div>
                                <div className="font-medium text-slate-600">{workload.total - workload.completed - workload.inProgress}</div>
                                <div className="text-slate-500">To Do</div>
                              </div>
                            </div>
                            
                            {workload.total > 0 && (
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span>Progress</span>
                                  <span>{workload.progress}%</span>
                                </div>
                                <Progress value={workload.progress} className="h-2" />
                              </div>
                            )}
                          </div>
                          
                          {/* Current Tasks */}
                          {memberTasks.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <h5 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Current Tasks ({memberTasks.length})
                              </h5>
                              <div className="space-y-1">
                                {memberTasks.slice(0, 2).map((task) => (
                                  <div key={task._id} className="text-xs">
                                    <div className="font-medium truncate">{task.title}</div>
                                    <Badge className="text-xs" variant="outline">
                                      {task.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                ))}
                                {memberTasks.length > 2 && (
                                  <div className="text-xs text-slate-500">
                                    +{memberTasks.length - 2} more tasks
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
