import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconEye, IconCalendar, IconUsers, IconBuilding } from '@tabler/icons-react';
import { ProjectOverviewTab } from './ProjectOverviewTab';
import { ProjectTasksTab } from './ProjectTasksTab';
import { ProjectTeamTab } from './ProjectTeamTab';

interface ProjectDetailsModalProps {
  projectId: Id<'projects'>;
  isOpen: boolean;
  onClose: () => void;
  onViewDocument: (projectId: Id<'projects'>) => void;
}

export function ProjectDetailsModal({
  projectId,
  isOpen,
  onClose,
  onViewDocument,
}: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const project = useQuery(api.projects.getProject, { projectId });
  const projectTasks = useQuery(api.projects.getProjectTasks, { projectId });
  const projectTeam = useQuery(api.projects.getProjectTeam, { projectId });

  if (!project) {
    return null;
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">{project.title}</DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
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
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDocument(projectId)}
              >
                <IconEye className="w-4 h-4 mr-2" />
                View Brief
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({projectTasks?.length || 0})</TabsTrigger>
              <TabsTrigger value="team">Team ({projectTeam?.length || 0})</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
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
      </DialogContent>
    </Dialog>
  );
}
