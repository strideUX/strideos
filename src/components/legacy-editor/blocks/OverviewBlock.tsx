'use client';

import { createReactBlockSpec } from '@blocknote/react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Target, FileText } from 'lucide-react';
import { DocumentEditor } from '../DocumentEditor';
import { Id } from '@/../convex/_generated/dataModel';

// Define the overview block schema
export const OverviewBlock = createReactBlockSpec(
  {
    type: 'overview' as const,
    propSchema: {
      title: {
        default: 'Project Overview',
      },
      description: {
        default: 'This section provides a comprehensive overview of the project including goals, timeline, and key deliverables.',
      },
      showStats: {
        default: true,
      },
      documentId: {
        default: '',
      },
      clientId: {
        default: '',
      },
      departmentId: {
        default: '',
      },
    },
    content: 'none',
    group: 'strideOS', // ✅ Add required group property
  },
  {
    render: (props) => {
      const { block } = props;
      const { title, description, showStats, documentId, clientId, departmentId } = block.props;

      // Mock project data - in real implementation this would come from Convex
      const project = {
        name: 'strideOS Development',
        client: 'Internal',
        status: 'In Progress',
        dueDate: 'March 31, 2025',
        team: ['Alice', 'Bob', 'Charlie', 'Diana'],
        progress: 75,
        description: 'Document-centric project management platform',
      };

      return (
        <div 
          className="overview-block min-h-screen p-8"
          contentEditable={false}
          data-section-id="overview"
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              {/* Section Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
                <p className="text-gray-600 text-base leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Project Stats */}
              {showStats && project && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Due Date</span>
                      </div>
                      <p className="text-lg font-semibold mt-1">{project.dueDate}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Team Size</span>
                      </div>
                      <p className="text-lg font-semibold mt-1">{project.team.length} members</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Progress</span>
                      </div>
                      <p className="text-lg font-semibold mt-1">{project.progress}%</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Goals Section */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Goals</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                    <p className="text-gray-700 leading-relaxed">
                      Deliver a comprehensive project management solution with document-centric workflows.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                    <p className="text-gray-700 leading-relaxed">
                      Implement real-time collaboration features with BlockNote editor integration.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                    <p className="text-gray-700 leading-relaxed">
                      Ensure seamless user experience across all project management activities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BlockNote Editor for Overview Content */}
            <div className="mb-8">
              <div className="border-t pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Notes & Details
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <DocumentEditor
                    documentId={documentId as Id<'documents'>}
                    clientId={clientId as Id<'clients'>}
                    departmentId={departmentId as Id<'departments'>}
                    className="min-h-[400px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
  }
);

// Helper function to insert overview block
export const insertOverviewBlock = (editor: { insertBlocks: (blocks: unknown[]) => void }) => {
  editor.insertBlocks(
    [
      {
        type: 'overview',
        props: {
          title: 'Project Overview',
          description: 'This section provides a comprehensive overview of the project including goals, timeline, and key deliverables.',
          showStats: true,
        },
      },
    ],
    editor.getTextCursorPosition().block,
    'after'
  );
};