'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Block } from '@blocknote/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Dynamically import BlockNoteEditor to avoid SSR issues
const BlockNoteEditor = dynamic(
  () => import('@/components/editor/BlockNoteEditor').then((mod) => ({ default: mod.BlockNoteEditor })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
);

export default function BlockNoteTasksTestPage() {
  const [content, setContent] = useState<Block[]>([
    {
      id: 'initial-block',
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default',
        textAlignment: 'left'
      },
      content: [
        {
          type: 'text',
          text: 'Welcome to the BlockNote Tasks Block Test! Try typing "/tasks" to add a new tasks block, or interact with the existing one below.',
          styles: {}
        }
      ],
      children: []
    },
    {
      id: 'tasks-block', 
      type: 'tasks',
      props: {
        taskIds: "[]",
        title: "Project Tasks", 
        showCompleted: "true",
        projectId: "jn74yntfkvpvkwfzen68qbagtn7mzj44",
      },
      content: [],
      children: []
    }
  ]);

  const handleContentChange = (newContent: Block[]) => {
    setContent(newContent);
    console.log('Content changed:', newContent);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">BlockNote Tasks Block Test</h1>
              <p className="text-muted-foreground">
                Test the interactive tasks block functionality
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Document Editor with Tasks Block</CardTitle>
                              <p className="text-sm text-muted-foreground">
                  This page demonstrates the BlockNote tasks block integration. 
                  Try typing &quot;/tasks&quot; in the editor to add a new tasks block, or interact with the existing one below.
                </p>
            </CardHeader>
            <CardContent>
              <div className="min-h-[600px] border rounded-lg">
                <BlockNoteEditor
                  initialContent={content}
                  onChange={handleContentChange}
                  editable={true}
                  className="h-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Adding Tasks Blocks</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Type &quot;/tasks&quot; in the editor to trigger the slash menu</li>
                  <li>Select &quot;Tasks&quot; from the menu to insert a tasks block</li>
                  <li>Click &quot;Add Task&quot; to create new tasks within the block</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Managing Tasks</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Click the status icon to toggle task completion</li>
                  <li>Use the trash icon to delete tasks (PM/Admin only)</li>
                  <li>Tasks are automatically synced with the task management system</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Features</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Role-based permissions (PM/Admin can edit, others view-only)</li>
                  <li>Real-time task status updates</li>
                  <li>Priority and size management</li>
                  <li>Integration with existing task management system</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 