'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { Authenticated, Unauthenticated } from 'convex/react';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  Trash2,
  Edit,
  Eye,
  Building,
  Target,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<Id<'clients'> | ''>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<Id<'departments'> | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<'project_brief' | 'technical_spec' | 'marketing_campaign' | 'client_onboarding' | 'retrospective' | 'custom'>('project_brief');
  const [selectedVisibility, setSelectedVisibility] = useState<'private' | 'department' | 'client' | 'organization'>('department');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'review' | 'complete' | 'archived'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch data
  const projects = useQuery(api.projects.listProjects, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50
  });
  const clients = useQuery(api.clients.listClients, {});
  const allDepartments = useQuery(api.departments.listAllDepartments, {});
  
  // Mutations
  const createProject = useMutation(api.projects.createProject);

  // Filter departments by selected client
  const filteredDepartments = allDepartments?.filter((dept: any) => 
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
      await createProject({
        title: newProjectTitle.trim(),
        description: newProjectDescription.trim() || undefined,
        clientId: selectedClientId,
        departmentId: selectedDepartmentId,
        template: selectedTemplate,
        visibility: selectedVisibility,
      });

      toast.success('Project created successfully');
      setNewProjectTitle('');
      setNewProjectDescription('');
      setSelectedClientId('');
      setSelectedDepartmentId('');
      setSelectedTemplate('project_brief');
      setSelectedVisibility('department');
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'complete': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-slate-100 text-slate-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemplateIcon = (template: string) => {
    switch (template) {
      case 'project_brief': return <FileText className="h-4 w-4" />;
      case 'technical_spec': return <Target className="h-4 w-4" />;
      case 'marketing_campaign': return <Building className="h-4 w-4" />;
      case 'client_onboarding': return <Users className="h-4 w-4" />;
      case 'retrospective': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const isLoading = projects === undefined || clients === undefined || allDepartments === undefined;

  return (
    <Authenticated>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="mt-2 text-gray-600">Manage document-based projects and collaboration</p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
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
                            {filteredDepartments.map((department: any) => (
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
                        <Select value={selectedTemplate} onValueChange={(value: any) => setSelectedTemplate(value)}>
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
                        <Select value={selectedVisibility} onValueChange={(value: any) => setSelectedVisibility(value)}>
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
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateProject}>
                        Create Project
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={() => signOut()} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-48 animate-pulse">
                  <CardHeader className="bg-gray-200 h-24"></CardHeader>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTemplateIcon(project.template)}
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => router.push(`/projects/${project._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => router.push(`/projects/${project._id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{project.client?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{project.department?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>PM: {project.projectManager?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first project to get started with document-based collaboration
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </Card>
          )}
        </div>
      </div>
    </Authenticated>
  );
}

ProjectsPage.displayName = 'ProjectsPage'; 