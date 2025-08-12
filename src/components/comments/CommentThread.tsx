'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Reply, Edit, Trash2, Send, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface CommentThreadProps {
  documentId?: Id<'documents'>;
  taskId?: Id<'tasks'>;
}

// Define the comment structure based on Convex schema
interface CommentUser {
  id: Id<'users'>;
  name: string;
  image?: string;
  role: 'admin' | 'pm' | 'task_owner' | 'client';
}

interface CommentData {
  _id: Id<'comments'>;
  content: string;
  documentId?: Id<'documents'>;
  taskId?: Id<'tasks'>;
  parentCommentId?: Id<'comments'>;
  createdBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
  user: CommentUser;
  replies?: CommentData[];
}

interface CommentProps {
  comment: CommentData;
  onReply: (parentId: Id<'comments'>) => void;
  onEdit: (commentId: Id<'comments'>, content: string) => void;
  onDelete: (commentId: Id<'comments'>) => void;
  replyingTo?: Id<'comments'>;
  editingId?: Id<'comments'>;
}

const Comment = ({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete, 
  replyingTo, 
  editingId 
}: CommentProps) => {
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createComment = useMutation(api.comments.createComment);
  const updateComment = useMutation(api.comments.updateComment);
  const deleteComment = useMutation(api.comments.deleteComment);

  const canEdit = user?._id === comment.createdBy || user?.role === 'admin' || user?.role === 'pm';
  const canDelete = user?._id === comment.createdBy || user?.role === 'admin' || user?.role === 'pm';

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createComment({
        content: replyContent,
        parentCommentId: comment._id,
        documentId: comment.documentId,
        taskId: comment.taskId,
      });
      setReplyContent('');
      onReply(comment._id);
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateComment({
        commentId: comment._id,
        content: editContent,
      });
      onEdit(comment._id, editContent);
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setIsSubmitting(true);
    try {
      await deleteComment({ commentId: comment._id });
      onDelete(comment._id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'pm': return 'bg-blue-100 text-blue-800';
      case 'task_owner': return 'bg-green-100 text-green-800';
      case 'client': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user?.image} />
                <AvatarFallback className="text-xs">
                  {getInitials(comment.user?.name || 'Unknown')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {comment.user?.name || 'Unknown User'}
                  </span>
                  <Badge variant="secondary" className={`text-xs ${getRoleColor(comment.user?.role)}`}>
                    {comment.user?.role}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
              </div>
            </div>
            
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(comment._id, comment.content)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {editingId === comment._id ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                className="min-h-[80px]"
              />
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={handleEdit}
                  disabled={isSubmitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onEdit(comment._id, comment.content)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">{comment.content}</p>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(comment._id)}
                  className="text-xs"
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply form */}
      {replyingTo === comment._id && (
        <div className="ml-8 space-y-3">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[80px]"
          />
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={handleReply}
              disabled={isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              Reply
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onReply(comment._id)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Nested replies */}
              {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-4">
          <Separator />
          {comment.replies.map((reply: CommentData) => (
            <Comment
              key={reply._id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              replyingTo={replyingTo}
              editingId={editingId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentThread = ({ documentId, taskId }: CommentThreadProps) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Id<'comments'> | undefined>();
  const [editingId, setEditingId] = useState<Id<'comments'> | undefined>();

  const createComment = useMutation(api.comments.createComment);
  
  const comments = useQuery(
    documentId ? api.comments.getDocumentComments : api.comments.getTaskComments,
    documentId ? { documentId } : { taskId: taskId! }
  );

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createComment({
        content: newComment,
        documentId,
        taskId,
      });
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (parentId: Id<'comments'>) => {
    setReplyingTo(replyingTo === parentId ? undefined : parentId);
  };

  const handleEdit = (commentId: Id<'comments'>) => {
    setEditingId(editingId === commentId ? undefined : commentId);
  };

  const handleDelete = () => {
    // The actual deletion is handled in the Comment component
    // This is just for UI state management
  };

  if (comments === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Comments</h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New comment form */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !newComment.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Post Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <Comment
                key={comment._id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                replyingTo={replyingTo}
                editingId={editingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 