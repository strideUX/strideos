'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Plus } from 'lucide-react';
import { DocumentEditor } from '../document-editor';
import { Id } from '@/../convex/_generated/dataModel';

interface UpdatesSectionProps {
  documentId?: Id<'documents'>;
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
}

const sampleUpdates = [
  {
    id: 1,
    date: "2025-01-25",
    title: "BlockNote Integration Complete",
    summary: "Successfully migrated from Novel.sh to BlockNote with enhanced features",
    status: "completed"
  },
  {
    id: 2,
    date: "2025-01-20",
    title: "Database Schema Optimization",
    summary: "Improved content storage and migration system for better performance",
    status: "completed"
  },
  {
    id: 3,
    date: "2025-01-15",
    title: "UI Polish & Enhancement Phase",
    summary: "Enhanced editor with professional styling and user experience improvements",
    status: "completed"
  }
];

export function UpdatesSection({ 
  documentId, 
  clientId, 
  departmentId 
}: UpdatesSectionProps) {
  return (
    <section id="updates" className="min-h-screen p-8 border-t">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Project Updates</h2>
              <p className="text-gray-600">Track progress and share project milestones</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Update
            </Button>
          </div>

          {/* Recent Updates */}
          <div className="space-y-4 mb-8">
            {sampleUpdates.map((update) => (
              <Card key={update.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{update.date}</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {update.status}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{update.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{update.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Update Stats */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Update Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{sampleUpdates.length}</div>
                    <div className="text-sm text-gray-500">Total Updates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">3</div>
                    <div className="text-sm text-gray-500">This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">100%</div>
                    <div className="text-sm text-gray-500">On Schedule</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BlockNote Editor for Update Notes */}
        <div className="mb-8">
          <div className="border-t pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Update Notes & Communication
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