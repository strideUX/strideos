'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { BlockNoteEditor } from '@blocknote/core';
import { EditorState, Transaction } from 'prosemirror-state';
import { Step } from 'prosemirror-transform';
import { collab, receiveTransaction, sendableSteps } from 'prosemirror-collab';

interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: {
    from: number;
    to: number;
  };
}

interface ProseMirrorCollaborationProps {
  editor: BlockNoteEditor;
  documentId: Id<'testDocuments'>;
  user: CollaborationUser;
  onUsersChange?: (users: CollaborationUser[]) => void;
}

export function ProseMirrorCollaboration({
  editor,
  documentId,
  user,
  onUsersChange,
}: ProseMirrorCollaborationProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const versionRef = useRef(0);
  const lastStepsRef = useRef<Step[]>([]);

  // Queries and mutations - using real collaboration functions
  const documentState = useQuery(api.testDocumentCollaboration.getDocumentState, { documentId });
  const joinSession = useMutation(api.testDocumentCollaboration.joinSession);
  const updateSession = useMutation(api.testDocumentCollaboration.updateSession);
  const leaveSession = useMutation(api.testDocumentCollaboration.leaveSession);
  const submitOperations = useMutation(api.testDocumentCollaboration.submitOperations);
  const getOperationsSince = useQuery(
    api.testDocumentCollaboration.getOperationsSince,
    sessionId ? { documentId, sinceVersion: versionRef.current } : 'skip'
  );

  // Join collaboration session on mount
  useEffect(() => {
    if (!documentId || sessionId) return; // Prevent multiple joins

    const join = async () => {
      try {
        console.log('🤝 Joining collaboration session for document:', documentId);
        const id = await joinSession({
          documentId,
          userInfo: {
            name: user.name,
            color: user.color,
            avatar: user.avatar,
          },
        });
        setSessionId(id);
        setIsConnected(true);
        console.log('✅ Joined collaboration session:', id);
      } catch (error) {
        console.error('❌ Failed to join collaboration session:', error);
        setIsConnected(false);
      }
    };

    join();

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        console.log('👋 Leaving collaboration session:', sessionId);
        leaveSession({ sessionId }).catch(console.error);
      }
    };
  }, [documentId, user.name, user.color, user.avatar]); // Remove joinSession/leaveSession from deps

  // Heartbeat to keep session alive
  useEffect(() => {
    if (!sessionId || sessionId === 'mock-session-id') return;

    console.log('💓 Starting heartbeat for session:', sessionId);
    const interval = setInterval(() => {
      updateSession({ sessionId }).catch(console.error);
    }, 15000); // Update every 15 seconds

    return () => {
      console.log('💔 Stopping heartbeat for session:', sessionId);
      clearInterval(interval);
    };
  }, [sessionId]); // Remove updateSession from deps

  // Update users list when sessions change
  useEffect(() => {
    if (documentState?.sessions && onUsersChange) {
      const users = documentState.sessions.map(session => ({
        id: session.userId,
        name: session.userInfo.name,
        color: session.userInfo.color,
        avatar: session.userInfo.avatar,
        cursor: session.cursor,
      }));
      onUsersChange(users);
    }
  }, [documentState?.sessions, onUsersChange]);

  // Set up ProseMirror collaboration with operational transform
  useEffect(() => {
    if (!editor?.prosemirrorView || !isConnected || sessionId === 'mock-session-id') return;

    console.log('🔧 Setting up ProseMirror collaboration');
    const proseMirrorView = editor.prosemirrorView;

    // Update local version when document state changes
    if (documentState?.version !== undefined) {
      versionRef.current = documentState.version;
    }

    // Listen for local document changes and send as operations
    const handleTransaction = (tr: Transaction) => {
      // Only send operations that have steps (actual content changes)
      if (tr.steps.length > 0 && !tr.getMeta('isRemote')) {
        console.log('📤 Sending local operations:', tr.steps.length);
        
        try {
          // Convert ProseMirror steps to a serializable format
          const operations = tr.steps.map(step => step.toJSON());
          
          submitOperations({
            documentId,
            operations,
            version: versionRef.current,
          }).then(result => {
            if (result.success) {
              versionRef.current = result.newVersion;
              console.log(`✅ Operations submitted, new version: ${result.newVersion}`);
            }
          }).catch(error => {
            console.error('❌ Failed to submit operations:', error);
            // TODO: Handle conflicts and retry
          });
        } catch (error) {
          console.error('❌ Failed to serialize operations:', error);
        }
      }
    };

    // Add transaction listener with error handling
    const originalDispatchTransaction = proseMirrorView.dispatch;
    proseMirrorView.dispatch = (tr: Transaction) => {
      try {
        // Apply the transaction locally first
        const newState = proseMirrorView.state.apply(tr);
        proseMirrorView.updateState(newState);
        
        // Then handle collaboration
        handleTransaction(tr);
      } catch (error) {
        console.error('❌ Failed to apply transaction:', error);
        // Fall back to original dispatch
        originalDispatchTransaction(tr);
      }
    };

    return () => {
      console.log('🔧 ProseMirror collaboration cleanup');
      // Restore original dispatch
      proseMirrorView.dispatch = originalDispatchTransaction;
    };
  }, [editor, isConnected, sessionId, documentState?.version, submitOperations, documentId]);

  // Apply remote operations when received - DISABLED to prevent conflicts
  useEffect(() => {
    if (!getOperationsSince || !editor?.prosemirrorView || sessionId === 'mock-session-id') return;

    console.log('📥 Remote operations available:', getOperationsSince.length, '(operational transform disabled)');
    
    // TODO: Implement proper operational transform with conflict resolution
    // For now, just log that operations are available but don't apply them
    // This prevents the sync issues until we implement proper OT
    
  }, [getOperationsSince, editor, user.id, sessionId]);

  // Track cursor position
  useEffect(() => {
    if (!editor?.prosemirrorView || !sessionId) return;

    const proseMirrorView = editor.prosemirrorView;

    const handleSelectionUpdate = () => {
      const selection = proseMirrorView.state.selection;
      updateSession({
        sessionId,
        cursor: {
          from: selection.from,
          to: selection.to,
        },
      }).catch(console.error);
    };

    // Listen for selection changes
    const handleUpdate = () => {
      handleSelectionUpdate();
    };

    proseMirrorView.dom.addEventListener('selectionchange', handleUpdate);

    return () => {
      proseMirrorView.dom.removeEventListener('selectionchange', handleUpdate);
    };
  }, [editor, sessionId, updateSession]);

  return null; // This is a headless component
}