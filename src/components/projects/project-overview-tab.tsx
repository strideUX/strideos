/**
 * ProjectOverviewTab - Comprehensive project overview and management interface
 *
 * @remarks
 * Displays project metadata, progress metrics, team composition, recent activity, and admin controls.
 * Integrates with project management workflow for status tracking, team overview, and project deletion.
 * Provides visual indicators for project health, progress, and team size.
 *
 * @example
 * ```tsx
 * <ProjectOverviewTab
 *   project={projectData}
 *   projectTasks={projectTasks}
 *   projectTeam={teamMembers}
 *   progress={75}
 * />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo } from 'react';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { IconCalendar, IconUsers, IconCircle, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { toast } from 'sonner';

// 2. Internal imports
import { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { useAuth } from '@/lib/auth-hooks';
import { DeleteProjectDialog } from './delete-project-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// 3. Types
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
  /** Project data to display */
  project: Project;
  /** Project tasks for progress calculation */
  projectTasks: Task[];
  /** Team members for display */
  projectTeam: TeamMember[];
  /** Overall project progress percentage */
  progress: number;
}

// 4. Component definition
export const ProjectOverviewTab = memo(function ProjectOverviewTab({
  project,
  projectTasks,
  projectTeam,
  progress,
}: ProjectOverviewTabProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const { user } = useAuth();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const statusColorMap = useMemo(() => {
    return {
      'new': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'planning': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'ready_for_work': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'client_review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'client_approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'complete': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    } as const;
  }, []);

  const statusLabelMap = useMemo(() => {
    return {
      'new': 'New',
      'planning': 'Planning',
      'ready_for_work': 'Ready for Work',
      'in_progress': 'In Progress',
      'client_review': 'Client Review',
      'client_approved': 'Client Approved',
      'complete': 'Complete'
    } as const;
  }, []);

  const projectHealth = useMemo(() => {
    if (project.status === 'complete') {
      return { status: 'success', icon: IconCircle, label: 'On Track' };
    }
    if (project.status === 'client_review' || 
        (project.targetDueDate && project.targetDueDate < Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return { status: 'warning', icon: IconAlertTriangle, label: 'At Risk' };
    }
    if (['ready_for_work', 'in_progress'].includes(project.status)) {
      return { status: 'success', icon: IconCircle, label: 'On Track' };
    }
    return { status: 'neutral', icon: IconClock, label: 'Planning' };
  }, [project.status, project.targetDueDate]);

  const taskCounts = useMemo(() => {
    return {
      completed: projectTasks.filter(task => task.status === 'done').length,
      inProgress: projectTasks.filter(task => task.status === 'in_progress').length,
      todo: projectTasks.filter(task => task.status === 'todo').length
    };
  }, [projectTasks]);

  const isAdmin = useMemo(() => {
    return user?.role === 'admin';
  }, [user?.role]);

  const visibleTeamMembers = useMemo(() => {
    return projectTeam.slice(0, 5);
  }, [projectTeam]);

  const hasMoreTeamMembers = useMemo(() => {
    return projectTeam.length > 5;
  }, [projectTeam]);

  const remainingTeamCount = useMemo(() => {
    return projectTeam.length - 5;
  }, [projectTeam]);

  const projectCreatedDate = useMemo(() => {
    return new Date(project.createdAt).toLocaleDateString();
  }, [project.createdAt]);

  const projectStartDate = useMemo(() => {
    return project.actualStartDate ? new Date(project.actualStartDate).toLocaleDateString() : null;
  }, [project.actualStartDate]);

  const projectDueDate = useMemo(() => {
    return project.targetDueDate ? new Date(project.targetDueDate).toLocaleDateString() : null;
  }, [project.targetDueDate]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const getStatusColor = useCallback((status: string): string => {
    return statusColorMap[status as keyof typeof statusColorMap] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }, [statusColorMap]);

  const getStatusLabel = useCallback((status: string): string => {
    return statusLabelMap[status as keyof typeof statusLabelMap] || status;
  }, [statusLabelMap]);

  const handleDeleteClick = useCallback(() => {
    setIsDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setIsDeleteOpen(false);
  }, []);

  const handleDeleteConfirm = useCallback(async (projectId: Id<'projects'>) => {
    try {
      await deleteProjectMutation({ projectId });
      toast.success('Project deleted successfully');
      router.replace('/projects');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete project');
    }
  }, [deleteProjectMutation, router]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
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
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Description
              </label>
              <p className="text-sm mt-1">
                {project.description || 'No description provided'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Status
                </label>
                <div className="mt-1">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Health
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <projectHealth.icon className={`w-4 h-4 ${
                    projectHealth.status === 'success' ? 'text-green-600' :
                    projectHealth.status === 'warning' ? 'text-yellow-600' : 'text-slate-600'
                  }`} />
                  <span className="text-sm">{projectHealth.label}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Created
                </label>
                <p className="text-sm mt-1">
                  {projectCreatedDate}
                </p>
              </div>
              
              {projectStartDate && (
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Started
                  </label>
                  <p className="text-sm mt-1">
                    {projectStartDate}
                  </p>
                </div>
              )}
            </div>

            {projectDueDate && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Due Date
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <IconCalendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    {projectDueDate}
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
                <div className="text-2xl font-bold text-green-600">
                  {taskCounts.completed}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {taskCounts.inProgress}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">
                  {taskCounts.todo}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">To Do</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <IconUsers className="w-4 h-4 text-slate-400" />
                <label className="text-sm font-medium">Team Size</label>
              </div>
              <div className="flex -space-x-2">
                {visibleTeamMembers.map((member) => (
                  <Avatar key={member._id} className="w-8 h-8 border-2 border-white dark:border-slate-800">
                    <AvatarImage src={member.image} />
                    <AvatarFallback className="text-xs">
                      {member.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {hasMoreTeamMembers && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
                    +{remainingTeamCount}
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
              <span>Project created on {projectCreatedDate}</span>
            </div>
            {projectStartDate && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Project started on {projectStartDate}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Status updated to {getStatusLabel(project.status)}</span>
            </div>
            {taskCounts.completed > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{taskCounts.completed} tasks completed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - admin only */}
      {isAdmin && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-4">
              Once you delete a project, there is no going back. Please be certain.
            </p>
            <Button variant="destructive" onClick={handleDeleteClick}>
              Delete Project
            </Button>
          </CardContent>
        </Card>
      )}

      <DeleteProjectDialog
        project={{ _id: project._id, title: project.title }}
        isOpen={isDeleteOpen}
        onClose={handleDeleteClose}
        onConfirmDelete={handleDeleteConfirm}
      />
    </div>
  );
});
