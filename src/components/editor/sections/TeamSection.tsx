'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, Plus, FileText } from 'lucide-react';
import { DocumentEditor } from '../DocumentEditor';
import { Id } from '@/../convex/_generated/dataModel';

interface TeamSectionProps {
  documentId?: Id<'documents'>;
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
  team?: string[];
}

const sampleTeamMembers = [
  {
    id: 1,
    name: "John Doe",
    role: "Project Manager",
    email: "john.doe@company.com",
    initials: "JD",
    status: "active"
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Lead Developer",
    email: "jane.smith@company.com",
    initials: "JS",
    status: "active"
  },
  {
    id: 3,
    name: "Mike Johnson",
    role: "UI/UX Designer",
    email: "mike.johnson@company.com",
    initials: "MJ",
    status: "active"
  },
  {
    id: 4,
    name: "Sarah Wilson",
    role: "QA Engineer",
    email: "sarah.wilson@company.com",
    initials: "SW",
    status: "active"
  },
];

export function TeamSection({ 
  documentId, 
  clientId, 
  departmentId,
  team 
}: TeamSectionProps) {
  return (
    <section id="team" className="min-h-screen p-8 border-t bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h2>
              <p className="text-gray-600">Manage project team and stakeholders</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {sampleTeamMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{member.initials}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{member.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{member.role}</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{member.email}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {member.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Team Stats */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{sampleTeamMembers.length}</div>
                    <div className="text-sm text-gray-500">Total Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">4</div>
                    <div className="text-sm text-gray-500">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-sm text-gray-500">On Leave</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">3</div>
                    <div className="text-sm text-gray-500">Roles</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Roles & Responsibilities */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Roles & Responsibilities</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">Project Manager</h4>
                    <p className="text-sm text-gray-600">Oversees project timeline, coordinates team activities, and ensures deliverable quality</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-gray-900">Lead Developer</h4>
                    <p className="text-sm text-gray-600">Handles technical architecture, code reviews, and development guidance</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-gray-900">UI/UX Designer</h4>
                    <p className="text-sm text-gray-600">Creates user interface designs, conducts user research, and ensures design consistency</p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-medium text-gray-900">QA Engineer</h4>
                    <p className="text-sm text-gray-600">Tests functionality, identifies bugs, and ensures quality standards are met</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BlockNote Editor for Team Notes */}
        <div className="mb-8">
          <div className="border-t pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Team Notes & Communication
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