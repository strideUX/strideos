'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/hooks/use-auth';
import { ProjectsTable } from '@/components/projects/projects-table';
import { ProjectFilters } from '@/components/projects/project-filters';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IconFolder, IconInbox, IconCalendar, IconListCheck } from '@tabler/icons-react';
import { toast } from 'sonner';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';

type ProjectStatus = 'new' | 'planning' | 'ready_for_work' | 'in_progress' | 'client_review' | 'client_approved' | 'complete';

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
  documentId: Id<'documents'>;
  client?: { _id: Id<'clients'>; name: string; logo?: Id<'_storage'>; isInternal?: boolean };
  department?: { _id: Id<'departments'>; name: string };
  projectManager?: { _id: Id<'users'>; name: string; email: string; image?: string };
}

type DeleteDialogProject = { _id: Id<'projects'>; title: string };

export default function NewRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Delete dialog state
  const [deleteDialogProject, setDeleteDialogProject] = useState<DeleteDialogProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch data (same query; filter in component)
  const projects = useQuery(api.projects.listProjects, { limit: 500 });
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  // Transform projects to match the expected interface
  const transformedProjects: Project[] = projects?.map(project => ({
    _id: project._id,
    title: project.title,
    description: project.description,
    status: project.status,
    clientId: project.clientId,
    departmentId: project.departmentId,
    projectManagerId: project.projectManagerId,
    targetDueDate: project.targetDueDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    documentId: project.documentId,
    client: project.client ? { _id: project.client._id, name: project.client.name, logo: project.client.logo, isInternal: project.client.isInternal } : undefined,
    department: project.department ? { _id: project.department._id, name: project.department.name } : undefined,
    projectManager: project.projectManager ? { 
      _id: project.projectManager._id, 
      name: project.projectManager.name || '', 
      email: project.projectManager.email || '', 
      image: project.projectManager.image 
    } : undefined,
  })) || [];

  // Filter to only new & planning, and by search
  const filteredProjects = transformedProjects.filter(project => {
    const isNewOrPlanning = project.status === 'new' || project.status === 'planning';
    const isExternalClient = project.client?.isInternal !== true;
    if (!isNewOrPlanning || !isExternalClient) return false;

    const matchesSearch = searchTerm === '' || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.department?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // KPI metrics (external clients only)
  const externalProjects = transformedProjects.filter(p => p.client?.isInternal !== true);
  const totalProjectsExternal = externalProjects.length;
  const totalNew = externalProjects.filter(p => p.status === 'new').length;
  const totalPlanning = externalProjects.filter(p => p.status === 'planning').length;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = externalProjects.filter(p => p.status === 'new' && p.createdAt >= oneWeekAgo).length;

  const handleProjectSelect = (projectId: Id<'projects'>) => {
    router.push(`/projects/${projectId}/details`);
  };

  const handleDeleteProject = (project: unknown) => {
    const p = project as { _id: Id<'projects'>; title: string };
    setDeleteDialogProject({ _id: p._id, title: p.title });
  };

  const handleConfirmDelete = async (projectId: Id<'projects'>) => {
    setIsDeleting(true);
    try {
      await deleteProjectMutation({ projectId });
      toast.success('Project deleted successfully');
      setDeleteDialogProject(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialogProject(null);
    }
  };

  if (!user) return null;

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">New Requests</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Review and triage incoming project requests
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card className="gap-3 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
              <CardTitle className="text-xs font-medium">New Requests This Week</CardTitle>
              <IconCalendar className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-4xl font-bold leading-none">{newThisWeek}</div>
            </CardContent>
          </Card>
          <Card className="gap-3 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
              <CardTitle className="text-xs font-medium">Total New Requests</CardTitle>
              <IconInbox className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-4xl font-bold leading-none">{totalNew}</div>
            </CardContent>
          </Card>
          <Card className="gap-3 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
              <CardTitle className="text-xs font-medium">Total In Planning</CardTitle>
              <IconListCheck className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-4xl font-bold leading-none">{totalPlanning}</div>
            </CardContent>
          </Card>
          <Card className="gap-3 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
              <CardTitle className="text-xs font-medium">Total Projects</CardTitle>
              <IconFolder className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-4xl font-bold leading-none">{totalProjectsExternal}</div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <ProjectFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <IconFolder className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No new requests found
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {searchTerm
                    ? 'No projects match your search.'
                    : 'No new or planning projects found.'}
                </p>
              </div>
            ) : (
              <ProjectsTable
                projects={filteredProjects}
                onProjectSelect={handleProjectSelect}
                onViewDocument={(projectId) => {
                  const project = filteredProjects.find(p => p._id === projectId);
                  if (project?.documentId) {
                    router.push(`/editor/${project.documentId}`);
                  } else {
                    router.push(`/projects/${projectId}`);
                  }
                }}
                onDeleteProject={handleDeleteProject}
                userRole={user.role}
                groupByClientDepartment
                hideDescription
              />
            )}
          </CardContent>
        </Card>

        {/* Delete Project Dialog */}
        <DeleteProjectDialog
          project={deleteDialogProject}
          isOpen={deleteDialogProject !== null}
          onClose={handleCloseDeleteDialog}
          onConfirmDelete={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      </div>
    </>
  );
}

