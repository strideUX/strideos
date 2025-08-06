'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconPlus, IconSearch, IconFolder, IconBuilding, IconEdit } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<Id<'clients'> | ''>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<Id<'departments'> | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<'project_brief' | 'technical_spec' | 'marketing_campaign' | 'client_onboarding' | 'retrospective' | 'custom'>('project_brief');
  const [selectedVisibility, setSelectedVisibility] = useState<'private' | 'department' | 'client' | 'organization'>('department');

  // Fetch projects with filters
  const projects = useQuery(api.projects.listProjects, {
    status: statusFilter === 'all' ? undefined : statusFilter as 'draft' | 'active' | 'review' | 'complete' | 'archived',
    template: templateFilter === 'all' ? undefined : templateFilter as 'project_brief' | 'technical_spec' | 'marketing_campaign' | 'client_onboarding' | 'retrospective' | 'custom',
    limit: 100
  });

  const clients = useQuery(api.clients.listClients, {});
  const allDepartments = useQuery(api.departments.listAllDepartments, {});
  const createProject = useMutation(api.projects.createProject);

  // Filter projects by search term
  const filteredProjects = projects?.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
        template: selectedTemplate,
        visibility: selectedVisibility,
      });

      toast.success('Project created successfully');
      
      // Reset form
      setNewProjectTitle('');
      setNewProjectDescription('');
      setSelectedClientId('');
      setSelectedDepartmentId('');
      setSelectedTemplate('project_brief');
      setSelectedVisibility('department');
      setIsCreateDialogOpen(false);
      
      // Navigate to the new project
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived': return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTemplateLabel = (template: string) => {
    switch (template) {
      case 'project_brief': return 'Project Brief';
      case 'technical_spec': return 'Technical Spec';
      case 'marketing_campaign': return 'Marketing Campaign';
      case 'client_onboarding': return 'Client Onboarding';
      case 'retrospective': return 'Retrospective';
      case 'custom': return 'Custom';
      default: return template;
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template
                      </label>
                      <Select value={selectedTemplate} onValueChange={(value) => setSelectedTemplate(value as typeof selectedTemplate)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="project_brief">Project Brief</SelectItem>
                          <SelectItem value="technical_spec">Technical Specification</SelectItem>
                          <SelectItem value="marketing_campaign">Marketing Campaign</SelectItem>
                          <SelectItem value="client_onboarding">Client Onboarding</SelectItem>
                          <SelectItem value="retrospective">Retrospective</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Search and filter projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  <SelectItem value="project_brief">Project Brief</SelectItem>
                  <SelectItem value="technical_spec">Technical Spec</SelectItem>
                  <SelectItem value="marketing_campaign">Marketing Campaign</SelectItem>
                  <SelectItem value="client_onboarding">Client Onboarding</SelectItem>
                  <SelectItem value="retrospective">Retrospective</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
                  {searchTerm || statusFilter !== 'all' || templateFilter !== 'all'
                    ? 'No projects match your current filters.'
                    : 'Get started by creating your first project.'}
                </p>
                {!searchTerm && statusFilter === 'all' && templateFilter === 'all' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Template Type</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project._id}>
                      <TableCell>
                        <div className="font-medium">{project.title}</div>
                        {project.description && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {project.description.length > 60 
                              ? `${project.description.substring(0, 60)}...` 
                              : project.description
                            }
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconBuilding className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium">{project.client?.name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {project.department?.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconFolder className="w-4 h-4 text-slate-400" />
                          {getTemplateLabel(project.template)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/projects/${project._id}`)}
                          >
                            <IconEdit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}