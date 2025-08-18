import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";

interface CollaborativeEditorProps {
  selectedDocId: string;
  theme: 'light' | 'dark';
  emptyDoc: any;
}

export default function CollaborativeEditor({ selectedDocId, theme, emptyDoc }: CollaborativeEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Use refs to avoid stale closures
  const snapshotRef = useRef<any>(null);
  const lastSavedContentRef = useRef<string>('');
  const isSavingRef = useRef<boolean>(false);
  
  console.log('🔄 CollaborativeEditor render - selectedDocId:', selectedDocId);
  
  // Use the raw ProseMirror sync API instead of the Tiptap wrapper
  const snapshot = useQuery(api.prosemirrorSync.getSnapshot, { id: selectedDocId });
  const submitSnapshot = useMutation(api.prosemirrorSync.submitSnapshot);
  const latestVersion = useQuery(api.prosemirrorSync.latestVersion, { id: selectedDocId });
  
  // Update refs when values change
  snapshotRef.current = snapshot;
  lastSavedContentRef.current = lastSavedContent;
  isSavingRef.current = isSaving;
  
  console.log('📊 Direct sync state:', {
    hasSnapshot: !!snapshot,
    snapshot: snapshot,
    snapshotType: typeof snapshot,
    latestVersion: latestVersion
  });

  // Create BlockNote editor with direct Convex sync
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: "Start typing...",
      },
    ],
  }, [theme]); // Only depend on theme to prevent recreation
  
  // Handle saves with debouncing to avoid interfering with typing
  useEffect(() => {
    if (!editor) return;
    
    let saveTimeout: NodeJS.Timeout;
    
    const handleUpdate = () => {
      console.log('📝 BlockNote editor content updated');
      
      // Clear previous timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // Debounce saves to avoid disrupting typing
      saveTimeout = setTimeout(() => {
        console.log('💾 Saving content changes...');
        const newContent = editor.document;
        console.log('📄 New content:', newContent);
        
        // Only save if content actually changed from the saved snapshot
        const currentContentString = JSON.stringify(newContent);
        const savedContentString = snapshotRef.current?.content || '';
        
        if (currentContentString !== savedContentString && currentContentString !== lastSavedContentRef.current && !isSavingRef.current) {
          setLastSavedContent(currentContentString);
          setIsSaving(true);
          
          console.log('🔗 Calling submitSnapshot with Convex');
          console.log('📊 Current content differs from saved snapshot');
          try {
            // Use the version from the current snapshot, not latestVersion
            const currentVersion = snapshotRef.current?.version || 0;
            
            console.log('📊 Saving with version:', currentVersion + 1);
            
            submitSnapshot({
              id: selectedDocId,
              content: currentContentString,
              version: currentVersion + 1,
            }).then(() => {
              console.log('✅ Content saved successfully');
              setIsSaving(false);
            }).catch((err) => {
              console.error('❌ Save error:', err);
              setError(`Save error: ${err.message}`);
              setIsSaving(false);
            });
          } catch (err) {
            console.error('❌ submitSnapshot error:', err);
            setError(`Submit error: ${err.message}`);
            setIsSaving(false);
          }
        } else {
          if (isSavingRef.current) {
            console.log('⏭️ Skipping save - already saving');
          } else {
            console.log('⏭️ Skipping save - content unchanged from snapshot');
          }
        }
      }, 500); // 500ms debounce delay
    };
    
    // Use BlockNote's onChange event
    editor.onChange(handleUpdate);
    
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [editor, selectedDocId]); // Removed snapshot to prevent race condition

  // Update editor content when snapshot changes
  useEffect(() => {
    if (editor && snapshot && snapshot.content) {
      console.log('🔄 Updating BlockNote editor content from snapshot');
      console.log('📄 Snapshot received:', snapshot);
      
      // Try to load the snapshot content
      try {
        const content = JSON.parse(snapshot.content);
        if (content && Array.isArray(content)) {
          // BlockNote expects an array of blocks
          editor.replaceBlocks(editor.document, content);
          console.log('✅ Content loaded from snapshot');
        } else {
          console.warn('⚠️ Invalid content format, expected array:', content);
        }
      } catch (err) {
        console.error('❌ Error parsing/loading snapshot:', err);
      }
    }
  }, [editor, snapshot]);

  // Document doesn't exist - show create button
  if (snapshot === null) {
    console.log('📝 No document found, showing create button');
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Document not found</p>
          <button 
            onClick={() => {
              console.log('🎯 Creating new document');
              try {
                const initialContent = [
                  {
                    type: "paragraph",
                    content: "Start typing here...",
                  },
                ];
                
                submitSnapshot({
                  id: selectedDocId,
                  content: JSON.stringify(initialContent),
                  version: 1,
                }).then(() => {
                  console.log('✅ Document created successfully');
                }).catch((err) => {
                  console.error('❌ Error creating document:', err);
                  setError(`Failed to create document: ${err.message}`);
                });
              } catch (err) {
                console.error('❌ Error creating document:', err);
                setError(`Failed to create document: ${err}`);
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create document
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-4">⚠️ Editor Error</div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Editor not ready
  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Initializing editor...</p>
        </div>
      </div>
    );
  }

  console.log('🎉 BlockNote editor ready, rendering BlockNoteView');
  return (
    <div className={`h-full ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="border rounded-lg h-full overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="bg-muted/50 border-b px-4 py-2 text-sm text-muted-foreground">
            Real-time collaborative editing • Document: {selectedDocId}
          </div>
          <div className="flex-1 overflow-auto">
            <BlockNoteView 
              editor={editor} 
              theme={theme}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}