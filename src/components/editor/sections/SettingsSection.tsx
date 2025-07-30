'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, FileText, Shield, Bell, Users, Calendar } from 'lucide-react';
import { DocumentEditor } from '../DocumentEditor';
import { Id } from '../../../../convex/_generated/dataModel';

interface SettingsSectionProps {
  documentId?: Id<'documents'>;
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
}

export function SettingsSection({ 
  documentId, 
  clientId, 
  departmentId 
}: SettingsSectionProps) {
  return (
    <section id="settings" className="min-h-screen p-8 border-t">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Project Settings</h2>
            <p className="text-gray-600">Configure project preferences and permissions</p>
          </div>

          {/* Project Configuration */}
          <div className="space-y-6 mb-8">
            {/* General Settings */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  General Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-save enabled</p>
                      <p className="text-sm text-gray-500">Automatically save document changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Real-time collaboration</p>
                      <p className="text-sm text-gray-500">Enable live editing for team members</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Version history</p>
                      <p className="text-sm text-gray-500">Track document version changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Permissions & Access
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Client visibility</p>
                      <p className="text-sm text-gray-500">Allow clients to view this project</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Team edit access</p>
                      <p className="text-sm text-gray-500">Team members can edit documents</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Comment permissions</p>
                      <p className="text-sm text-gray-500">Who can add comments to documents</p>
                    </div>
                    <Badge variant="outline">All Team Members</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Document updates</p>
                      <p className="text-sm text-gray-500">Notify when documents are updated</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Task assignments</p>
                      <p className="text-sm text-gray-500">Notify when tasks are assigned</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Due date reminders</p>
                      <p className="text-sm text-gray-500">Send reminders for upcoming deadlines</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Metadata */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Project Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Project Status</p>
                    <Badge className="mt-1">Active</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created Date</p>
                    <p className="text-sm text-gray-900 mt-1">January 15, 2025</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900 mt-1">January 30, 2025</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Project Phase</p>
                    <Badge variant="outline" className="mt-1">Development</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-red-700">Danger Zone</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-700">Archive Project</p>
                      <p className="text-sm text-gray-500">Hide this project from active lists</p>
                    </div>
                    <Button variant="outline" className="text-red-700 border-red-200 hover:bg-red-50">
                      Archive
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-700">Delete Project</p>
                      <p className="text-sm text-gray-500">Permanently delete this project and all data</p>
                    </div>
                    <Button variant="outline" className="text-red-700 border-red-200 hover:bg-red-50">
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BlockNote Editor for Settings Notes */}
        <div className="mb-8">
          <div className="border-t pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Configuration Notes
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