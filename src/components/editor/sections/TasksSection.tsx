'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Plus, FileText } from 'lucide-react';
import { DocumentEditor } from '../DocumentEditor';
import { TaskSummarySection } from '../TaskSummarySection';
import { Id } from '../../../../convex/_generated/dataModel';

interface TasksSectionProps {
  documentId?: Id<'documents'>;
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
}

const sampleTasks = [
  {
    id: 1,
    title: "Design system component library setup",
    status: "completed",
    assignee: { name: "John Doe", initials: "JD" },
    hasAttachment: false,
  },
  {
    id: 2,
    title: "BlockNote editor integration and testing",
    status: "in-progress",
    assignee: { name: "Jane Smith", initials: "JS" },
    hasAttachment: true,
  },
  {
    id: 3,
    title: "Database schema optimization",
    status: "pending",
    assignee: { name: "Mike Johnson", initials: "MJ" },
    hasAttachment: false,
  },
  {
    id: 4,
    title: "User authentication and permissions",
    status: "pending",
    assignee: { name: "Sarah Wilson", initials: "SW" },
    hasAttachment: true,
  },
];

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-5 h-5 text-green-500 fill-current" />;
    case "in-progress":
      return <Circle className="w-5 h-5 text-blue-500 fill-current" />;
    case "pending":
      return (
        <Circle
          className="w-5 h-5 text-gray-300 stroke-gray-400 stroke-2 fill-none"
          style={{ strokeDasharray: "3,3" }}
        />
      );
    default:
      return <Circle className="w-5 h-5 text-gray-300" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
    case "in-progress":
      return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
    case "pending":
      return <Badge variant="outline">Pending</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export function TasksSection({ 
  documentId, 
  clientId, 
  departmentId 
}: TasksSectionProps) {
  return (
    <section id="tasks" className="min-h-screen p-8 border-t bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Tasks & Deliverables</h2>
              <p className="text-gray-600">Track project progress and manage task assignments</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>

          {/* Real Task Integration */}
          {documentId && (
            <div className="mb-8">
              <TaskSummarySection 
                documentId={documentId}
                className="w-full"
              />
            </div>
          )}

          {/* Task Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Development Tasks */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Development</h3>
                <div className="space-y-3">
                  {sampleTasks.filter(task => task.id % 2 === 0).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                      <StatusIcon status={task.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{task.assignee.initials}</span>
                          </div>
                          <span className="text-xs text-gray-500">{task.assignee.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(task.status)}
                        {task.hasAttachment && <FileText className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Design Tasks */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Design</h3>
                <div className="space-y-3">
                  {sampleTasks.filter(task => task.id % 2 === 1).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                      <StatusIcon status={task.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{task.assignee.initials}</span>
                          </div>
                          <span className="text-xs text-gray-500">{task.assignee.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(task.status)}
                        {task.hasAttachment && <FileText className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Progress Summary */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Progress Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">1</div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">1</div>
                    <div className="text-sm text-gray-500">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">2</div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BlockNote Editor for Task Notes */}
        <div className="mb-8">
          <div className="border-t pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Task Notes & Planning
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <DocumentEditor
                documentId={documentId}
                clientId={clientId}
                departmentId={departmentId}
                className="min-h-[400px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 