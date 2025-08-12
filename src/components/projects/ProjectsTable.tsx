import { Id } from '@/../convex/_generated/dataModel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconBuilding, IconDots, IconEdit, IconEye, IconUsers } from '@tabler/icons-react';
import { Trash2 } from 'lucide-react';

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
  client?: { _id: Id<'clients'>; name: string };
  department?: { _id: Id<'departments'>; name: string };
  projectManager?: { _id: Id<'users'>; name: string; email: string; image?: string };
}

interface ProjectsTableProps {
  projects: Project[];
  onProjectSelect: (projectId: Id<'projects'>) => void;
  onViewDocument: (projectId: Id<'projects'>) => void;
  onDeleteProject?: (project: Project) => void; // NEW
  userRole?: string; // NEW
}

export function ProjectsTable({ projects, onProjectSelect, onViewDocument, onDeleteProject, userRole }: ProjectsTableProps) {
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

  const getProjectProgress = (project: Project) => {
    switch (project.status) {
      case 'new': return 0;
      case 'planning': return 20;
      case 'ready_for_work': return 40;
      case 'in_progress': return 60;
      case 'client_review': return 80;
      case 'client_approved': return 90;
      case 'complete': return 100;
      default: return 0;
    }
  };



  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project Name</TableHead>
          <TableHead>Client/Department</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const progress = getProjectProgress(project);
          
          return (
            <TableRow
              key={project._id}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() => onViewDocument(project._id)}
            >
              <TableCell>
                <div className="font-medium flex items-center gap-2">
                  {((project as any).slug || (project as any).projectKey) && (
                    <Badge variant="outline" className="font-mono">
                      {(project as any).slug || (project as any).projectKey}
                    </Badge>
                  )}
                  <span>{project.title}</span>
                  {((project as any).slug || (project as any).projectKey) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(((project as any).slug || (project as any).projectKey) as string); }}
                      title="Copy project slug"
                    >
                      Copy
                    </Button>
                  )}
                </div>
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
                  {getStatusLabel(project.status)}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="w-16" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {progress}%
                  </span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-1">
                  <IconUsers className="w-4 h-4 text-slate-400" />
                  <div className="flex -space-x-2">
                    {project.projectManager && (
                      <Avatar className="w-6 h-6 border-2 border-white dark:border-slate-800">
                        <AvatarImage src={project.projectManager.image} />
                        <AvatarFallback className="text-xs">
                          {project.projectManager.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                {project.targetDueDate ? (
                  <div className="text-sm">
                    {new Date(project.targetDueDate).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No due date</div>
                )}
              </TableCell>
              
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <IconDots className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onProjectSelect(project._id)}>
                      <IconEdit className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewDocument(project._id)}>
                      <IconEye className="w-4 h-4 mr-2" />
                      View Project Brief
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteProject?.(project)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
