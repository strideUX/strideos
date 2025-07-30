'use client';

import { useState, useEffect } from 'react';
import { SectionedDocumentEditor } from '@/components/editor/SectionedDocumentEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, Database, RefreshCw, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';

export default function EditorDemoPage() {
  const [demoDocumentId, setDemoDocumentId] = useState<Id<'documents'> | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  
  // Get or create demo document
  const existingDemoId = useQuery(api.demo.getDemoDocumentId);
  const createDemoDocument = useMutation(api.demo.createDemoDocument);
  
  useEffect(() => {
    if (existingDemoId) {
      setDemoDocumentId(existingDemoId);
      setShowSetup(false);
    }
  }, [existingDemoId]);

  const handleCreateDemo = async () => {
    try {
      const newDocId = await createDemoDocument();
      setDemoDocumentId(newDocId);
      setShowSetup(false);
      toast.success('Demo document created successfully!');
    } catch (error) {
      console.error('Failed to create demo document:', error);
      toast.error('Failed to create demo document. Please ensure you have clients and departments in the database.');
    }
  };

  const handleRefresh = () => {
    setDemoDocumentId(null);
    setShowSetup(true);
    window.location.reload();
  };

  const handleBackToSetup = () => {
    setShowSetup(true);
  };

    // Show sectioned document if we have a document ID and not showing setup
  if (demoDocumentId && !showSetup) {
    return (
      <SectionedDocumentEditor
        documentId={demoDocumentId}
        onBack={handleBackToSetup}
      />
    );
  }

  // Show setup/demo selection interface
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
                  Sectioned Document Editor Demo
                  <Badge variant="secondary">Enhancement 10.2.2 ✅</Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Experience our enhanced document editor with sectioned layout, sidebar navigation, and BlockNote integration
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sectioned Layout</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Fixed Sidebar Navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Smooth Scroll Navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Multiple BlockNote Editors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Professional UI Components</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Real-time Database Integration</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-medium mb-2">📋 Document Sections</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Overview:</strong> Project goals and stats</li>
                  <li>• <strong>Tasks:</strong> Task management and progress</li>
                  <li>• <strong>Updates:</strong> Project milestones and updates</li>
                  <li>• <strong>Team:</strong> Team member management</li>
                  <li>• <strong>Settings:</strong> Project configuration</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">🎨 Features to Explore</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Fixed sidebar with section navigation</li>
                  <li>• Intersection Observer active section tracking</li>
                  <li>• Full-height sections with smooth scrolling</li>
                  <li>• Independent BlockNote editors per section</li>
                  <li>• Professional project metadata display</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Connection Status */}
        <Card className="mb-6">
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

        {/* Launch Demo */}
        {demoDocumentId && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Sectioned Document Demo</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  Ready to Launch
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Document Ready</h3>
                  <p className="text-muted-foreground mb-6">
                    Your sectioned document is connected to the database and ready for exploration.
                  </p>
                </div>
                <Button onClick={() => setShowSetup(false)} size="lg" className="gap-2">
                  <FileText className="h-5 w-5" />
                  Launch Sectioned Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>This is a comprehensive demo of the sectioned document layout with BlockNote integration and professional UI components.</p>
        </div>
      </div>
    </div>
  );
} 