import { Id } from '@/../convex/_generated/dataModel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Card as UICard, CardContent as UICardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-hooks';
import { useState } from 'react';
import { DeleteProjectDialog } from './delete-project-dialog';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconCalendar, IconUsers, IconCircle, IconClock, IconAlertTriangle } from '@tabler/icons-react';

interface Project {
  _id: Id<'projects'>;
  title: string;
  description?: string;
  status: string;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  projectManagerId: Id<'users'>;
  targetDueDate?: number;
  actualStartDate?: number;
  actualCompletionDate?: number;
  createdAt: number;
  updatedAt: number;
  client?: { _id: Id<'clients'>; name: string };
  department?: { _id: Id<'departments'>; name: string };
  projectManager?: { _id: Id<'users'>; name: string; email: string };
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

interface ProjectOverviewTabProps {
  project: Project;
  projectTasks: Task[];
  projectTeam: TeamMember[];
  progress: number;
}

export function ProjectOverviewTab({
  project,
  projectTasks,
  projectTeam,
  progress,
}: ProjectOverviewTabProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);
  const getStatusColor = (status: string) => {
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
  };

  const getStatusLabel = (status: string) => {
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
  };

  const getProjectHealth = () => {
    if (project.status === 'complete') return { status: 'success', icon: IconCircle, label: 'On Track' };
    if (project.status === 'client_review' || 
        (project.targetDueDate && project.targetDueDate < Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return { status: 'warning', icon: IconAlertTriangle, label: 'At Risk' };
    }
    if (['ready_for_work', 'in_progress'].includes(project.status)) {
      return { status: 'success', icon: IconCircle, label: 'On Track' };
    }
    return { status: 'neutral', icon: IconClock, label: 'Planning' };
  };

  const health = getProjectHealth();
  const completedTasks = projectTasks.filter(task => task.status === 'done').length;
  const inProgressTasks = projectTasks.filter(task => task.status === 'in_progress').length;
  const todoTasks = projectTasks.filter(task => task.status === 'todo').length;

  return (
    <div className="space-y-6">
      {/* Project Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Description</label>
              <p className="text-sm mt-1">
                {project.description || 'No description provided'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Health</label>
                <div className="flex items-center gap-2 mt-1">
                  <health.icon className={`w-4 h-4 ${
                    health.status === 'success' ? 'text-green-600' :
                    health.status === 'warning' ? 'text-yellow-600' : 'text-slate-600'
                  }`} />
                  <span className="text-sm">{health.label}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Created</label>
                <p className="text-sm mt-1">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {project.actualStartDate && (
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Started</label>
                  <p className="text-sm mt-1">
                    {new Date(project.actualStartDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {project.targetDueDate && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Due Date</label>
                <div className="flex items-center gap-2 mt-1">
                  <IconCalendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    {new Date(project.targetDueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Overall Progress</label>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">{todoTasks}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">To Do</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <IconUsers className="w-4 h-4 text-slate-400" />
                <label className="text-sm font-medium">Team Size</label>
              </div>
              <div className="flex -space-x-2">
                {projectTeam.slice(0, 5).map((member) => (
                  <Avatar key={member._id} className="w-8 h-8 border-2 border-white dark:border-slate-800">
                    <AvatarImage src={member.image} />
                    <AvatarFallback className="text-xs">
                      {member.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {projectTeam.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
                    +{projectTeam.length - 5}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest updates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Project created on {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            {project.actualStartDate && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Project started on {new Date(project.actualStartDate).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Status updated to {getStatusLabel(project.status)}</span>
            </div>
            {completedTasks > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{completedTasks} tasks completed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - admin only */}
      {user?.role === 'admin' && (
        <UICard className="border-red-200 bg-red-50">
          <UICardHeader>
            <UICardTitle className="text-red-900">Danger Zone</UICardTitle>
          </UICardHeader>
          <UICardContent>
            <p className="text-sm text-red-800 mb-4">
              Once you delete a project, there is no going back. Please be certain.
            </p>
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
              Delete Project
            </Button>
          </UICardContent>
        </UICard>
      )}

      <DeleteProjectDialog
        project={{ _id: project._id, title: project.title }}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirmDelete={async (projectId) => {
          try {
            await deleteProjectMutation({ projectId });
            toast.success('Project deleted successfully');
            router.replace('/projects');
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete project');
          }
        }}
      />
    </div>
  );
}
