/**
 * ClientProjectList - Comprehensive project management interface for client projects
 *
 * @remarks
 * Displays all projects associated with a client, including project status, progress,
 * team assignments, and timeline information. Provides filtering, sorting, and
 * project management capabilities.
 *
 * @example
 * ```tsx
 * <ClientProjectList
 *   clientId="client-123"
 *   projects={clientProjects}
 *   onProjectUpdate={handleProjectUpdate}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo, useState } from 'react';
import { IconPlus, IconSearch, IconFilter, IconSortAscending } from '@tabler/icons-react';

// 2. Internal imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// 3. Types
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  progress: number;
  startDate: string;
  endDate: string;
  teamMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: string;
  }>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget: number;
  actualCost: number;
}

interface ClientProjectListProps {
  /** Unique identifier for the client */
  clientId: string;
  /** Array of projects to display */
  projects: Project[];
  /** Callback function when project data is updated */
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
  /** Callback function when new project is created */
  onNewProject?: () => void;
}

// 4. Component definition
export const ClientProjectList = memo(function ClientProjectList({ 
  clientId, 
  projects, 
  onProjectUpdate, 
  onNewProject 
}: ClientProjectListProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'progress' | 'priority'>('name');

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'progress':
          return b.progress - a.progress;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchTerm, statusFilter, sortBy]);

  const projectStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const planning = projects.filter(p => p.status === 'planning').length;
    const onHold = projects.filter(p => p.status === 'on-hold').length;

    return { total, active, completed, planning, onHold };
  }, [projects]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Statuses' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'on-hold', label: 'On Hold' }
  ], []);

  const sortOptions = useMemo(() => [
    { value: 'name', label: 'Name' },
    { value: 'status', label: 'Status' },
    { value: 'progress', label: 'Progress' },
    { value: 'priority', label: 'Priority' }
  ], []);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
  }, []);

  const handleSortChange = useCallback((sortField: 'name' | 'status' | 'progress' | 'priority') => {
    setSortBy(sortField);
  }, []);

  const handleProjectUpdate = useCallback((projectId: string, updates: Partial<Project>) => {
    onProjectUpdate?.(projectId, updates);
  }, [onProjectUpdate]);

  const handleNewProject = useCallback(() => {
    onNewProject?.();
  }, [onNewProject]);

  const getStatusColor = useCallback((status: Project['status']) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getPriorityColor = useCallback((priority: Project['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!projects.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No projects found for this client</p>
          <Button onClick={handleNewProject} className="gap-2">
            <IconPlus className="h-4 w-4" />
            Create First Project
          </Button>
        </CardContent>
      </Card>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage and track all client projects
          </p>
        </div>
        <Button onClick={handleNewProject} className="gap-2">
          <IconPlus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{projectStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{projectStats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{projectStats.planning}</div>
            <p className="text-xs text-muted-foreground">Planning</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{projectStats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{projectStats.onHold}</div>
            <p className="text-xs text-muted-foreground">On Hold</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {statusOptions.map(option => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconSortAscending className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            {sortOptions.map(option => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project List */}
      <div className="space-y-4">
        {filteredAndSortedProjects.map(project => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{project.description}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <span>Start: {project.startDate}</span>
                    <span>End: {project.endDate}</span>
                    <span>Budget: ${project.budget.toLocaleString()}</span>
                    <span>Cost: ${project.actualCost.toLocaleString()}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>
                <div className="ml-6">
                  <div className="flex -space-x-2">
                    {project.teamMembers.slice(0, 3).map(member => (
                      <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {project.teamMembers.length > 3 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs border-2 border-white">
                        +{project.teamMembers.length - 3}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {project.teamMembers.length} members
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});
