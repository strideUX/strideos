'use client';

import { createReactBlockSpec } from '@blocknote/react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, Building2, Target, Clock, CheckCircle, AlertCircle, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

// Project status configuration
const PROJECT_STATUSES = [
  { value: 'draft', label: 'Draft', icon: AlertCircle, color: 'bg-gray-100 text-gray-700' },
  { value: 'active', label: 'Active', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  { value: 'review', label: 'Review', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'complete', label: 'Complete', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  { value: 'archived', label: 'Archived', icon: Archive, color: 'bg-gray-100 text-gray-500' },
] as const;

// Project Info block schema
export const projectInfoBlockSpec = createReactBlockSpec(
  {
    type: 'projectInfo',
    propSchema: {
      // Standard BlockNote default props
      textAlignment: {
        default: "left",
        values: ["left", "center", "right", "justify"],
      },
      textColor: {
        default: "default",
      },
      backgroundColor: {
        default: "default",
      },
      // Custom props
      projectId: {
        default: "",
      },
      title: {
        default: "Project Info",
      },
      showRequestedBy: {
        default: "true",
      },
      showPriority: {
        default: "true",
      },
      showDueDate: {
        default: "true",
      },
      showStatus: {
        default: "true",
      },
      showProjectManager: {
        default: "true",
      },
      showClient: {
        default: "true",
      },
    },
    content: 'none', // This block doesn't contain editable text content
  },
  {
    render: (props) => {
      return <ProjectInfoBlock {...props} />;
    },
  }
);

// Project Info block component
export function ProjectInfoBlock({ block, editor }: { 
  block: any; 
  editor: any; 
}) {
  // Parse props from the block
  const projectId = block.props.projectId || "";
  const title = block.props.title || "Project Info";
  const showRequestedBy = block.props.showRequestedBy === "true";
  const showPriority = block.props.showPriority === "true";
  const showDueDate = block.props.showDueDate === "true";
  const showStatus = block.props.showStatus === "true";
  const showProjectManager = block.props.showProjectManager === "true";
  const showClient = block.props.showClient === "true";

  // Get project data
  const project = useQuery(api.projects.getProject, { 
    projectId: projectId as Id<'projects'> 
  }, { enabled: Boolean(projectId && projectId.trim() !== "") });

  // Get related data
  const projectManager = useQuery(api.users.getUserById, {
    userId: project?.projectManagerId as Id<'users'>
  }, { enabled: Boolean(project?.projectManagerId && project.projectManagerId.trim() !== "") });

  const client = useQuery(api.clients.getClientById, {
    clientId: project?.clientId as Id<'clients'>
  }, { enabled: Boolean(project?.clientId && project.clientId.trim() !== "") });

  const department = useQuery(api.departments.getDepartmentById, {
    departmentId: project?.departmentId as Id<'departments'>
  }, { enabled: Boolean(project?.departmentId && project.departmentId.trim() !== "") });

  // Helper function to format date
  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'Not set';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get status configuration
  const statusConfig = project ? PROJECT_STATUSES.find(s => s.value === project.status) : null;
  const StatusIcon = statusConfig?.icon || AlertCircle;

  return (
    <Card className="w-full border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {!project ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
            <p className="text-sm">Loading project info...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Project Title */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{project.title}</h3>
              {showStatus && statusConfig && (
                <Badge className={cn("text-xs", statusConfig.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              )}
            </div>

            {/* Project Description */}
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}

            {/* Project Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requested By */}
              {showRequestedBy && projectManager && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={projectManager.image} />
                      <AvatarFallback className="text-xs">
                        {getInitials(projectManager.name || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">Requested by</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{projectManager.name || 'Unknown'}</span>
                </div>
              )}

              {/* Project Manager */}
              {showProjectManager && projectManager && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={projectManager.image} />
                      <AvatarFallback className="text-xs">
                        {getInitials(projectManager.name || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">Project Manager</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{projectManager.name || 'Unknown'}</span>
                </div>
              )}

              {/* Client */}
              {showClient && client && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Client</span>
                  <span className="text-sm text-muted-foreground">{client.name}</span>
                </div>
              )}

              {/* Department */}
              {department && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Department</span>
                  <span className="text-sm text-muted-foreground">{department.name}</span>
                </div>
              )}

              {/* Target Due Date */}
              {showDueDate && (
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Target End Date</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(project.targetDueDate)}
                  </span>
                </div>
              )}

              {/* Actual Start Date */}
              {project.actualStartDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Start Date</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(project.actualStartDate)}
                  </span>
                </div>
              )}

              {/* Actual Completion Date */}
              {project.actualCompletionDate && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Completion Date</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(project.actualCompletionDate)}
                  </span>
                </div>
              )}

              {/* Priority (placeholder - could be calculated from tasks) */}
              {showPriority && (
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Priority</span>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    Normal
                  </Badge>
                </div>
              )}
            </div>

            {/* Project Metadata */}
            <div className="pt-2 border-t border-muted">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Created {formatDate(project.createdAt)}</span>
                <span>Last updated {formatDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 