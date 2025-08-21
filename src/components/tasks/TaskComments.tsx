'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface TaskCommentsProps {
  taskId: Id<'tasks'>;
}

interface Comment {
  _id: Id<'comments'>;
  content: string;
  authorId: Id<'users'>;
  createdAt: number;
  author?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments for this task
  const commentsData = useQuery(api.comments.listByTask, { taskId });
  const createThread = useMutation(api.comments.createThread);
  const createComment = useMutation(api.comments.createComment);

  // Check if we have existing comments to determine if we need to create a thread
  const hasExistingComments = commentsData && commentsData.length > 0;

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      if (!hasExistingComments) {
        // First comment - create a new thread
        await createThread({
          content: newComment.trim(),
          taskId,
          entityType: 'task',
        });
      } else {
        // Subsequent comments - add to existing thread
        const firstThread = commentsData[0];
        await createComment({
          threadId: firstThread.thread.id,
          content: newComment.trim(),
          taskId,
          entityType: 'task',
        });
      }
      
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmitComment();
    }
  };

  // Flatten comments from all threads into a single list
  const allComments = commentsData?.flatMap(thread => thread.comments) || [];
  const sortedComments = allComments.sort((a, b) => a.createdAt - b.createdAt);

  // Get user information for comments
  const userIds = [...new Set(allComments.map(c => c.authorId))];
  const users = useQuery(api.users.listUsers, {});
  const userMap = new Map(users?.map(u => [u._id, u]) || []);

  return (
    <div className="h-full flex flex-col w-80 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-medium">Activity</h3>
      </div>

      {/* Scrollable comments area */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedComments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {sortedComments.map((comment) => {
              const user = userMap.get(comment.authorId);
              return (
                <div key={comment._id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.image} />
                    <AvatarFallback>
                      {user?.name?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{user?.name || user?.email || 'Unknown User'}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed input at bottom */}
      <div className="border-t p-4">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyPress}
          className="min-h-[80px] resize-none mb-2"
        />
        <Button
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || isSubmitting}
          size="sm"
          className="w-full"
        >
          {isSubmitting ? 'Posting...' : 'Add Comment'}
        </Button>
      </div>
    </div>
  );
}
