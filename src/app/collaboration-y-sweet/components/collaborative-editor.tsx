'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/shadcn/style.css';
import '@/styles/blocknote-theme.css';
import { useTheme } from 'next-themes';
import { YDocProvider, useYDoc, useYjsProvider } from '@y-sweet/react';
import { useHybridSync } from '@/hooks/useHybridSync';
import { NetworkDemo } from './network-demo';
import { PresenceList } from './presence-list';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { ConnectionStatusIndicator } from '@/components/collaboration/ConnectionStatusIndicator';
import { ErrorBoundary } from '@/components/collaboration/ErrorBoundary';

export interface CollaborativeEditorProps {
  docId: string;
  user: { name: string; color: string };
  className?: string;
  authEndpoint?: string;
  headerSlot?: React.ReactNode;
  readOnly?: boolean;
  documentId?: string;
  sectionId?: string;
  convexSectionId?: string;
}

export function CollaborativeEditorInner({ user, headerSlot, readOnly, documentId, sectionId, convexSectionId }: { user: { name: string; color: string }; headerSlot?: React.ReactNode; readOnly?: boolean; documentId?: string; sectionId?: string; convexSectionId?: string }) {
  const provider = useYjsProvider();
  const doc = useYDoc();
  const { theme } = useTheme();

  // Load existing content from Convex immediately (section content query)
  const existingContent = useQuery(api.documentSections.getDocumentSection, convexSectionId ? { sectionId: convexSectionId as any } : 'skip');
  
  // Use existing content if available, otherwise default
  const initialBlocks = useMemo(() => {
    if (Array.isArray(existingContent?.content) && existingContent?.content.length > 0) {
      return existingContent.content;
    }
    return [{ type: 'paragraph', content: [] }];
  }, [existingContent?.content]);

  // Manage connection status (ysweet/convex/local)
  const [connectionStatus, actions] = useConnectionStatus({ provider });
  
  // Track Y-sweet connection state directly from provider for debug info
  const [providerConnected, setProviderConnected] = useState(false);
  
  useEffect(() => {
    if (!provider || typeof provider.on !== 'function') return;
    
    const onStatus = (event: { status: string }) => {
      setProviderConnected(event.status === 'connected');
    };
    
    provider.on('status', onStatus);
    return () => {
      if (typeof provider.off === 'function') {
        provider.off('status', onStatus);
      }
    };
  }, [provider]);

  // Update convex connection state heuristically from query state
  useEffect(() => {
    if (existingContent === undefined) {
      actions.setConvexState('connecting');
    } else if (existingContent === null) {
      actions.setConvexState('connected');
    } else {
      actions.setConvexState('connected');
    }
  }, [existingContent, actions]);

  // Always enable collaboration if provider exists - let Y-sweet handle the connection state
  const editor = useCreateBlockNote({
    initialContent: initialBlocks as any,
    collaboration: provider ? {
      provider,
      fragment: doc.getXmlFragment('blocknote'),
      user,
    } : undefined,
  });

  // Update editor content when Convex content loads (only once when editor is first created)
  const hasLoadedContent = useRef(false);
  
  useEffect(() => {
    if (!editor || !existingContent?.content || hasLoadedContent.current) return;
    
    try {
      const currentBlocks = editor.document;
      const newBlocks = Array.isArray(existingContent.content) ? existingContent.content : [{ type: 'paragraph', content: [] }];
      
      // Only update if current content is empty/default and we have real content to load
      const isCurrentEmpty = currentBlocks.length === 1 && 
        currentBlocks[0].type === 'paragraph' && 
        (!currentBlocks[0].content || currentBlocks[0].content.length === 0);
      
      const hasRealContent = newBlocks.length > 1 || 
        (newBlocks.length === 1 && newBlocks[0].content && newBlocks[0].content.length > 0);
      
      if (isCurrentEmpty && hasRealContent) {
        console.log('Loading content from Convex:', newBlocks.length, 'blocks');
        editor.replaceBlocks(editor.document, newBlocks as any);
        hasLoadedContent.current = true;
      }
    } catch (error) {
      console.warn('Error updating editor content:', error);
    }
  }, [editor, existingContent?.content]);

  // Keep a ref to read current content for sync layers
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Debug: Log editor changes to see if they're happening
  useEffect(() => {
    if (!editor) return;
    
    const onChange = () => {
      console.log('Editor changed:', editor.document?.length || 0, 'blocks');
    };
    
    editor.onChange(onChange);
    
    return () => {
      // BlockNote doesn't have an off method, but the effect cleanup handles it
    };
  }, [editor]);

  // Hybrid sync across layers
  useHybridSync({
    yDoc: doc,
    documentId,
    sectionId: convexSectionId || sectionId,
    connectionStatus,
    getCurrentContent: () => {
      try {
        return editorRef.current?.document ?? initialBlocks;
      } catch {
        return initialBlocks;
      }
    },
    enableConvexBackup: true,
    enableLocalBuffer: true,
    onConvexSynced: () => {
      actions.markConvexSynced();
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NetworkDemo />
          <PresenceList />
        </div>
        {headerSlot}
      </div>
      <ConnectionStatusIndicator status={connectionStatus} />
      {/* Temporary debug info */}
      <div className="text-xs text-muted-foreground mb-2 p-2 bg-gray-50 rounded">
        Debug: Y-sweet: {connectionStatus.ysweet} | Provider: {providerConnected ? 'connected' : 'disconnected'} | Collaboration: {provider ? 'enabled' : 'disabled'} | Active Sync: {connectionStatus.activeSync} | Content: {existingContent?.content ? 'loaded' : 'loading'} | Section: {convexSectionId || sectionId}
      </div>
      <BlockNoteView
        editor={editor}
        editable={readOnly ? false : true}
        className="bn-editor"
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
}

export function CollaborativeEditor({ docId, user, className, authEndpoint, headerSlot, readOnly, documentId, sectionId, convexSectionId }: CollaborativeEditorProps) {
  const endpoint = useMemo(() => {
    if (authEndpoint) return authEndpoint;
    if (process.env.NODE_ENV === 'development') {
      return 'https://demos.y-sweet.dev/api/auth';
    }
    if (process.env.NEXT_PUBLIC_Y_SWEET_ENDPOINT) {
      return process.env.NEXT_PUBLIC_Y_SWEET_ENDPOINT as string;
    }
    return 'https://demos.y-sweet.dev/api/auth';
  }, [authEndpoint]);

  return (
    <div className={className}>
      <YDocProvider docId={docId} authEndpoint={endpoint}>
        <ErrorBoundary fallback={({ error, reset }) => (
          <div className="p-3 border rounded text-sm space-y-2">
            <div className="text-red-600">Collaboration error: {error.message}</div>
            <div className="text-muted-foreground">Falling back to autosave. You can retry connecting.</div>
            <button className="px-2 py-1 border rounded" onClick={reset}>Retry</button>
          </div>
        )}>
          <CollaborativeEditorInner user={user} headerSlot={headerSlot} readOnly={readOnly} documentId={documentId} sectionId={sectionId} convexSectionId={convexSectionId} />
        </ErrorBoundary>
      </YDocProvider>
    </div>
  );
}
