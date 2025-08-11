'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { IconArrowLeft, IconEye, IconCalendar, IconUsers, IconBuilding } from '@tabler/icons-react';
import { ProjectOverviewTab } from '@/components/projects/ProjectOverviewTab';
import { ProjectTasksTab } from '@/components/projects/ProjectTasksTab';
import { ProjectTeamTab } from '@/components/projects/ProjectTeamTab';

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const projectId = params.id as Id<'projects'>;

  const project = useQuery(api.projects.getProject, { projectId });
  const projectTasks = useQuery(api.projects.getProjectTasks, { projectId });
  const projectTeam = useQuery(api.projects.getProjectTeam, { projectId });

  if (!user) return null;

  if (!project) {
    return (
      <>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Project Not Found
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                The project you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => router.push('/projects')}>
                <IconArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

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

  const getProjectProgress = () => {
    if (!projectTasks) return 0;
    const completedTasks = projectTasks.filter(task => task.status === 'done').length;
    const totalTasks = projectTasks.length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="/projects"
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.title}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {project.title}
              </h1>
              <Badge className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <IconBuilding className="w-4 h-4" />
                <span>{project.client?.name} / {project.department?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <IconUsers className="w-4 h-4" />
                <span>{projectTeam?.length || 0} team members</span>
              </div>
              {project.targetDueDate && (
                <div className="flex items-center gap-1">
                  <IconCalendar className="w-4 h-4" />
                  <span>Due {new Date(project.targetDueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              <IconEye className="w-4 h-4 mr-2" />
              View Brief
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/projects')}
            >
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({projectTasks?.length || 0})</TabsTrigger>
              <TabsTrigger value="team">Team ({projectTeam?.length || 0})</TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-6">
              <TabsContent value="overview" className="h-full">
                <ProjectOverviewTab
                  project={project}
                  projectTasks={projectTasks || []}
                  projectTeam={projectTeam || []}
                  progress={getProjectProgress()}
                />
              </TabsContent>

              <TabsContent value="tasks" className="h-full">
                <ProjectTasksTab
                  projectId={projectId}
                  clientId={project.clientId}
                  departmentId={project.departmentId}
                  tasks={projectTasks || []}
                />
              </TabsContent>

              <TabsContent value="team" className="h-full">
                <ProjectTeamTab
                  project={project}
                  team={projectTeam || []}
                  tasks={projectTasks || []}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}
