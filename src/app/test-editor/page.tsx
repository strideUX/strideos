'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

// Dynamically import the editor component to avoid SSR issues
const CollaborativeEditor = dynamic(() => import('./components/CollaborativeEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading collaborative editor...</p>
      </div>
    </div>
  ),
});

export default function TestEditorPage() {
  const { theme } = useTheme();
  const [selectedDocId, setSelectedDocId] = useState<string>('test-doc-1');
  const [newDocTitle, setNewDocTitle] = useState('');
  const currentUser = useQuery(api.users.getCurrentUser);

  // Create empty document content
  const EMPTY_DOC = { type: "doc", content: [] };

  // Create new document using sync
  const handleCreateDocument = () => {
    if (!newDocTitle.trim()) {
      toast.error('Please enter a document ID');
      return;
    }
    setSelectedDocId(newDocTitle.trim());
    setNewDocTitle('');
  };

  const getConnectionStatus = () => {
    return (
      <div className="flex items-center gap-2">
        <Wifi className="h-4 w-4 text-blue-500" />
        <span className="text-sm text-blue-600">Live Collaboration</span>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Real-time sync active
        </Badge>
      </div>
    );
  };


  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Test Editor - Real-time Collaboration</h1>
            
            {/* Document ID Input */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Document ID:</span>
              <Input
                placeholder="Enter document ID..."
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-48 h-8"
              />
            </div>

            {/* Create New Document */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="New document ID..."
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="w-48 h-8"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateDocument();
                  }
                }}
              />
              <Button size="sm" onClick={handleCreateDocument}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status Info */}
          <div className="flex items-center gap-4">
            {getConnectionStatus()}
            
            {/* Current User Info */}
            {currentUser && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">{currentUser.name || currentUser.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto p-8">
          <div className="h-full">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Document: {selectedDocId}</h2>
              <p className="text-sm text-muted-foreground">
                Real-time collaborative editing powered by Convex + ProseMirror
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden h-[calc(100%-100px)]">
              <CollaborativeEditor 
                selectedDocId={selectedDocId}
                theme={theme === 'dark' ? 'dark' : 'light'}
                emptyDoc={EMPTY_DOC}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}