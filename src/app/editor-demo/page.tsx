'use client';

import { DocumentEditor } from '@/components/editor/DocumentEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles } from 'lucide-react';

export default function EditorDemoPage() {
  // Mock client and department IDs (you can replace with real ones)
  const mockClientId = 'demo_client' as string as Parameters<typeof DocumentEditor>[0]['clientId'];
  const mockDepartmentId = 'demo_department' as string as Parameters<typeof DocumentEditor>[0]['departmentId'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Demo Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Enhanced BlockNote Editor Demo
                  <Badge variant="secondary">Enhancement 10.2 ✅</Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Experience our polished, professional document editor with shadcn/ui integration
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Smart Auto-Save (3s)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Keyboard Shortcuts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Word Count & Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Professional Theming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Mobile Optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Real-time Status</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-medium mb-2">✨ Features to Try</h3>
                <ul className="space-y-1 text-muted-foreground">
                                     <li>• Type &quot;/&quot; to open the block menu</li>
                  <li>• Use Ctrl/Cmd + S to save</li>
                  <li>• Watch the auto-save indicator</li>
                  <li>• Hover over icons for tooltips</li>
                  <li>• Try different block types</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">🎨 Design Features</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Smooth transitions and animations</li>
                  <li>• Professional shadcn/ui theming</li>
                  <li>• Word count and reading time</li>
                  <li>• Responsive mobile design</li>
                  <li>• Status feedback system</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editor Demo */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Document Editor</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px]">
              <DocumentEditor
                clientId={mockClientId}
                departmentId={mockDepartmentId}
                className="h-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>This is a demo of the enhanced BlockNote editor. Ready for integration into project workflows!</p>
        </div>
      </div>
    </div>
  );
} 