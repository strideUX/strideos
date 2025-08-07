'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
import { ProjectStatsCards } from '@/components/projects/ProjectStatsCards';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconPlus, IconFolder } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';

interface ProjectRow {
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
  client?: { _id: Id<'clients'>; name: string };
  department?: { _id: Id<'departments'>; name: string };
  projectManager?: { _id: Id<'users'>; name: string; email: string; image?: string };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [pmFilter, setPmFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Delete dialog state
  const [deleteDialogProject, setDeleteDialogProject] = useState<ProjectRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<Id<'clients'> | ''>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<Id<'departments'> | ''>('');
  const [selectedVisibility, setSelectedVisibility] = useState<'private' | 'department' | 'client' | 'organization'>('department');

  // Fetch data
  const projectStats = useQuery(api.projects.getProjectStats, {});
  const projects = useQuery(api.projects.listProjects, {
    status: statusFilter === 'all' ? undefined : (statusFilter as any),
    limit: 100
  });
  const clients = useQuery(api.clients.listClients, {});
  const allDepartments = useQuery(api.departments.listAllDepartments, {});
  const allUsers = useQuery(api.users.listUsers, {});
  const createProject = useMutation(api.projects.createProject);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  // Filter projects by search term and other filters
  const filteredProjects: ProjectRow[] = projects?.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.department?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClient = clientFilter === 'all' || project.clientId === clientFilter;
    const matchesDepartment = departmentFilter === 'all' || project.departmentId === departmentFilter;
    const matchesPM = pmFilter === 'all' || project.projectManagerId === pmFilter;
    
    return matchesSearch && matchesClient && matchesDepartment && matchesPM;
  }) || [];

  // Filter departments by selected client
  const filteredDepartments = allDepartments?.filter((dept) => 
    selectedClientId ? dept.clientId === selectedClientId : true
  ) || [];

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId as Id<'clients'>);
    setSelectedDepartmentId('');
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() || !selectedClientId || !selectedDepartmentId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const projectId = await createProject({
        title: newProjectTitle.trim(),
        description: newProjectDescription.trim() || undefined,
        clientId: selectedClientId,
        departmentId: selectedDepartmentId,
        visibility: selectedVisibility,
        template: 'project_brief',
      });

      toast.success('Project created successfully');
      
      // Reset form
      setNewProjectTitle('');
      setNewProjectDescription('');
      setSelectedClientId('');
      setSelectedDepartmentId('');
      setSelectedVisibility('department');
      setIsCreateDialogOpen(false);
      
      // Navigate to the new project
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleProjectSelect = (projectId: Id<'projects'>) => {
    router.push(`/projects/${projectId}/details`);
  };

  const handleDeleteProject = (project: ProjectRow) => {
    setDeleteDialogProject(project);
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage document-based projects and collaboration
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <IconPlus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title *
                    </label>
                    <Input
                      placeholder="Enter project title"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Textarea
                      placeholder="Brief project description"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client *
                      </label>
                      <Select value={selectedClientId} onValueChange={handleClientChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem key={client._id} value={client._id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department *
                      </label>
                      <Select value={selectedDepartmentId} onValueChange={(value) => setSelectedDepartmentId(value as Id<'departments'>)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredDepartments.map((department) => (
                            <SelectItem key={department._id} value={department._id}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility
                    </label>
                    <Select value={selectedVisibility} onValueChange={(value) => setSelectedVisibility(value as typeof selectedVisibility)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="client">Client Visible</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject}>
                      Create Project
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        {projectStats && (
          <ProjectStatsCards stats={projectStats} />
        )}

        {/* Filters */}
        <ProjectFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          clientFilter={clientFilter}
          setClientFilter={setClientFilter}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          pmFilter={pmFilter}
          setPmFilter={setPmFilter}
          clients={clients || []}
          departments={allDepartments || []}
          users={allUsers || []}
        />

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Projects ({filteredProjects.length})
            </CardTitle>
            <CardDescription>
              Overview of all project documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <IconFolder className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No projects found
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {searchTerm || statusFilter !== 'all' || clientFilter !== 'all' || departmentFilter !== 'all' || pmFilter !== 'all'
                    ? 'No projects match your current filters.'
                    : 'Get started by creating your first project.'}
                </p>
                {!searchTerm && statusFilter === 'all' && clientFilter === 'all' && departmentFilter === 'all' && pmFilter === 'all' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                )}
              </div>
            ) : (
              <ProjectsTable
                projects={filteredProjects}
                onProjectSelect={handleProjectSelect}
                onViewDocument={(projectId) => router.push(`/projects/${projectId}`)}
                onDeleteProject={handleDeleteProject}
                userRole={user.role}
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