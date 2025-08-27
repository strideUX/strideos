/**
 * CommentThread - Comment threading and management component
 *
 * @remarks
 * Displays a threaded comment conversation with expand/collapse functionality,
 * comment deletion, and thread resolution. Integrates with Convex for real-time
 * comment management and provides block navigation capabilities.
 *
 * @example
 * ```tsx
 * <CommentThread 
 *   threadId="thread_123" 
 *   onJumpToBlock={(blockId) => navigateToBlock(blockId)} 
 * />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo, type ReactElement } from 'react';
import { useQuery, useMutation } from 'convex/react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// 3. Types
interface CommentThreadProps {
  /** Unique identifier for the comment thread */
  threadId: string;
  /** Optional callback to navigate to the referenced block */
  onJumpToBlock?: (blockId: string) => void;
}

interface Comment {
  _id: string;
  content: string;
  createdAt: number;
}

interface Thread {
  id: string;
  blockId: string;
  createdAt: number;
  resolved: boolean;
}

interface ThreadData {
  thread: Thread;
  comments: Comment[];
}

// 4. Component definition
export const CommentThread = memo(function CommentThread({ 
  threadId, 
  onJumpToBlock 
}: CommentThreadProps): ReactElement {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [expanded, setExpanded] = useState<boolean>(true);

  // Convex queries and mutations
  const data = useQuery(api.comments.getThread, { threadId }) as ThreadData | undefined;
  const deleteComment = useMutation(api.comments.deleteComment);
  const resolveThread = useMutation(api.comments.resolveThread);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const thread = useMemo(() => data?.thread, [data?.thread]);
  const comments = useMemo(() => data?.comments || [], [data?.comments]);
  
  const firstComment = useMemo(() => comments[0], [comments]);
  const replies = useMemo(() => comments.slice(1), [comments]);
  
  const hasReplies = useMemo(() => replies.length > 0, [replies.length]);
  const isResolved = useMemo(() => thread?.resolved || false, [thread?.resolved]);

  const previewContent = useMemo(() => {
    if (!firstComment?.content) return '(No content)';
    return firstComment.content.slice(0, 80);
  }, [firstComment?.content]);

  const formattedDate = useMemo(() => {
    if (!thread?.createdAt) return '';
    return new Date(thread.createdAt).toLocaleString();
  }, [thread?.createdAt]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleToggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleJumpToBlock = useCallback(() => {
    if (thread?.blockId && onJumpToBlock) {
      onJumpToBlock(thread.blockId);
    }
  }, [thread?.blockId, onJumpToBlock]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      await deleteComment({ commentId: commentId as Id<"comments"> });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }, [deleteComment]);

  const handleResolveThread = useCallback(async (resolved: boolean) => {
    if (!thread?.id) return;
    
    try {
      await resolveThread({ threadId: thread.id, resolved });
    } catch (error) {
      console.error('Failed to resolve thread:', error);
    }
  }, [thread?.id, resolveThread]);

  const formatCommentDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!data) {
    return <div className="text-sm text-neutral-500">Loading…</div>;
  }

  // === 7. RENDER (JSX) ===
  return (
    <div className="rounded border p-2">
      <div className="flex items-center justify-between">
        <button 
          className="text-left font-medium hover:underline" 
          onClick={handleJumpToBlock}
        >
          {previewContent}
        </button>
        <div className="flex items-center gap-2">
          <button 
            className="text-xs text-neutral-500" 
            onClick={handleToggleExpanded}
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
          {isResolved && (
            <span className="text-xs text-green-600">Resolved</span>
          )}
        </div>
      </div>
      
      <div className="mt-1 text-xs text-neutral-500">
        {formattedDate}
      </div>
      
      {expanded && (
        <div className="mt-2 space-y-2">
          <div className="text-sm">{firstComment?.content}</div>
          
          {hasReplies && (
            <div className="pl-3 border-l space-y-2">
              {replies.map((comment) => (
                <div key={comment._id} className="text-sm flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-neutral-500">
                      {formatCommentDate(comment.createdAt)}
                    </div>
                    <div>{comment.content}</div>
                  </div>
                  <button 
                    className="text-xs text-red-600 hover:underline" 
                    onClick={() => handleDeleteComment(comment._id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-2 flex gap-2">
            {!isResolved ? (
              <button 
                className="text-xs rounded border px-2 py-1" 
                onClick={() => handleResolveThread(true)}
              >
                Resolve
              </button>
            ) : (
              <button 
                className="text-xs rounded border px-2 py-1" 
                onClick={() => handleResolveThread(false)}
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});


