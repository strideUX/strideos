'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, CheckSquare, Calendar, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSectionNavigation, Section } from '../../hooks/useSectionNavigation';
import { OverviewSection } from './sections/OverviewSection';
import { TasksSection } from './sections/TasksSection';
import { UpdatesSection } from './sections/UpdatesSection';
import { TeamSection } from './sections/TeamSection';
import { SettingsSection } from './sections/SettingsSection';
import { Id } from '../../../convex/_generated/dataModel';

interface SectionedDocumentEditorProps {
  documentId?: Id<'documents'>;
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
  project?: {
    name: string;
    client: string;
    status: string;
    dueDate: string;
    team: string[];
    progress: number;
    description: string;
  };
  onBack?: () => void;
}

const sections: Section[] = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "updates", label: "Updates", icon: Calendar },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const defaultProject = {
  name: "Enhanced BlockNote Editor Demo",
  client: "Internal Project",
  status: "active",
  dueDate: "February 15, 2025",
  team: ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson"],
  progress: 75,
  description: "A comprehensive demonstration of the sectioned document layout with BlockNote integration"
};

const defaultTeam = ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson"];

export function SectionedDocumentEditor({
  documentId,
  clientId,
  departmentId,
  project = defaultProject,
  onBack
}: SectionedDocumentEditorProps) {
  const { activeSection, scrollToSection, contentRef } = useSectionNavigation(sections);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6">
          {/* Back Button */}
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Active Project</span>
          </div>

          {/* Project Title */}
          <h1 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
            {project.name}
          </h1>

          {/* Client */}
          <p className="text-sm text-gray-500 mb-8">
            Client: <span className="text-purple-600 font-medium">{project.client}</span>
          </p>

          {/* Section Navigation */}
          <div className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Sections
            </h3>
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                      activeSection === section.id
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Project Stats */}
          <div className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Project Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Progress</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {project.progress}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Due Date</span>
                <span className="text-sm font-medium text-gray-900">{project.dueDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Team Size</span>
                <span className="text-sm font-medium text-gray-900">{project.team.length} members</span>
              </div>
            </div>
          </div>

          {/* Stakeholders */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Stakeholders
            </h3>
            <div className="space-y-3">
              {project.team.map((member, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {member
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{member}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Document Content */}
      <div className="flex-1 overflow-auto" ref={contentRef}>
        <OverviewSection 
          documentId={documentId}
          clientId={clientId}
          departmentId={departmentId}
          project={project}
        />
        
        <TasksSection 
          documentId={documentId}
          clientId={clientId}
          departmentId={departmentId}
        />
        
        <UpdatesSection 
          documentId={documentId}
          clientId={clientId}
          departmentId={departmentId}
        />
        
        <TeamSection 
          documentId={documentId}
          clientId={clientId}
          departmentId={departmentId}
          team={project.team}
        />
        
        <SettingsSection 
          documentId={documentId}
          clientId={clientId}
          departmentId={departmentId}
        />
      </div>
    </div>
  );
} 