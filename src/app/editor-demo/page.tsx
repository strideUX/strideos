'use client';

import { useState, useEffect } from 'react';
import { DocumentEditor } from '@/components/editor/DocumentEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, Database, RefreshCw } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';

export default function EditorDemoPage() {
  const [demoDocumentId, setDemoDocumentId] = useState<Id<'documents'> | null>(null);
  
  // Get or create demo document
  const existingDemoId = useQuery(api.demo.getDemoDocumentId);
  const createDemoDocument = useMutation(api.demo.createDemoDocument);
  
  useEffect(() => {
    if (existingDemoId) {
      setDemoDocumentId(existingDemoId);
    }
  }, [existingDemoId]);

  const handleCreateDemo = async () => {
    try {
      const newDocId = await createDemoDocument();
      setDemoDocumentId(newDocId);
      toast.success('Demo document created successfully!');
    } catch (error) {
      console.error('Failed to create demo document:', error);
      toast.error('Failed to create demo document. Please ensure you have clients and departments in the database.');
    }
  };

  const handleRefresh = () => {
    setDemoDocumentId(null);
    window.location.reload();
  };

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

        {/* Database Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database Connection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${demoDocumentId ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm">
                  {demoDocumentId ? 'Connected to real document' : 'No demo document found'}
                </span>
              </div>
              <div className="flex gap-2">
                {!demoDocumentId && (
                  <Button onClick={handleCreateDemo} size="sm" className="gap-2">
                    <Database className="h-4 w-4" />
                    Create Demo Document
                  </Button>
                )}
                <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
            {demoDocumentId && (
              <p className="text-xs text-muted-foreground mt-2">
                Document ID: {demoDocumentId}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Editor Demo */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Document Editor</CardTitle>
              {demoDocumentId && (
                <Badge variant="secondary" className="ml-auto">
                  Live Document
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px]">
                             {demoDocumentId ? (
                 <DocumentEditor
                   documentId={demoDocumentId}
                   className="h-full"
                 />
               ) : (
                <div className="flex items-center justify-center h-full bg-muted/20">
                  <div className="text-center">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No demo document connected</p>
                    <p className="text-sm text-muted-foreground">
                      Click &quot;Create Demo Document&quot; above to start testing with real data
                    </p>
                  </div>
                </div>
              )}
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