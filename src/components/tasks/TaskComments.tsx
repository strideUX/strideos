'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface TaskCommentsProps {
  taskId: Id<'tasks'>;
}

type SimpleComment = {
  _id: string;
  content: string;
  authorId: string;
  createdAt: number;
  author?: {
    name?: string;
    email?: string;
    image?: string;
  };
};

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionMap, setMentionMap] = useState<Record<string, string>>({});

  // Fetch comments for this task
  const commentsDataRaw = (useQuery as any)(api.comments.listByTask as any, { taskId } as any) as unknown;
  const commentsData = commentsDataRaw as Array<{ thread: any; comments: Array<SimpleComment> }> | undefined;
  const createThread = useMutation(api.comments.createThread);
  const createComment = useMutation(api.comments.createComment);

  // Check if we have existing comments to determine if we need to create a thread
  const hasExistingComments = commentsData && commentsData.length > 0;

  const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const expandMentionsForSubmit = (content: string): string => {
    let out = content;
    for (const [name, id] of Object.entries(mentionMap)) {
      const pattern = new RegExp(`@${escapeRegExp(name)}`, 'g');
      out = out.replace(pattern, `@[${name}](user:${id})`);
    }
    return out;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const contentForSubmit = expandMentionsForSubmit(newComment.trim());
      if (!hasExistingComments) {
        // First comment - create a new thread
        await createThread({
          content: contentForSubmit,
          taskId,
          entityType: 'task',
        });
      } else {
        // Subsequent comments - add to existing thread
        const firstThread = commentsData[0];
        await createComment({
          threadId: firstThread.thread.id,
          content: contentForSubmit,
          taskId,
          entityType: 'task',
        });
      }
      
      setNewComment('');
      setMentionMap({});
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
  const userIds = [...new Set(allComments.map((c) => String(c.authorId)))];
  const users = (useQuery as any)(api.users.listUsers, {});
  const userMap = new Map<string, any>((users || []).map((u: any) => [String(u._id), u]));

  // Mentionable users (non-client)
  const mentionableUsers = (useQuery as any)(api.users.getMentionableUsers) ?? [] as Array<{ _id: string; name?: string; email?: string; image?: string }>;
  const filteredUsers = useMemo(() => {
    const search = (mentionSearch || '').toLowerCase();
    if (!search) return mentionableUsers.slice(0, 8);
    return mentionableUsers
      .filter((u) => (u.name || '').toLowerCase().includes(search) || (u.email || '').toLowerCase().includes(search))
      .slice(0, 8);
  }, [mentionableUsers, mentionSearch]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Detect newly typed '@'
    const lastChar = value[cursorPos - 1];
    if (lastChar === '@') {
      setShowMentions(true);
      setMentionSearch('');
      setCursorPosition(cursorPos);
    }

    // If popover open, update search based on text after last '@'
    const beforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1 && showMentions) {
      const searchText = beforeCursor.slice(lastAtIndex + 1);
      // Stop if we hit whitespace or a punctuation that ends mentions
      if (/[^\w.\-+]/.test(searchText)) {
        setShowMentions(false);
        setMentionSearch('');
      } else {
        setMentionSearch(searchText);
        setCursorPosition(lastAtIndex + 1);
      }
    }

    setNewComment(value);
  };

  const insertMention = (user: { _id: string; name?: string; email?: string }) => {
    const name = user.name || user.email || 'User';
    const beforeCursorText = newComment.slice(0, cursorPosition - 1);
    const afterCursorText = newComment.slice(cursorPosition + mentionSearch.length);
    const mentionText = `@${name}`;
    const newValue = (beforeCursorText + mentionText + afterCursorText).replace(/\s+$/, '') + ' ';
    setNewComment(newValue);
    setShowMentions(false);
    setMentionMap((prev) => ({ ...prev, [name]: user._id }));

    // Move caret after inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = (beforeCursorText + mentionText + ' ').length;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const formatCommentContent = (content: string): string => {
    return (content || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/@\[([^\]]+)\]\(user:[^)]+\)/g, '<strong>@$1<\/strong>');
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
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
            {sortedComments.map((comment: SimpleComment) => {
              const user = userMap.get(String(comment.authorId));
              return (
                <div key={String(comment._id)} className="flex gap-3">
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
                    <div className="text-sm text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatCommentContent(comment.content) }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed input at bottom */}
      <div className="border-t p-4">
        <Popover open={showMentions} onOpenChange={(open) => { if (!open) setShowMentions(false); }}>
          <PopoverTrigger asChild>
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={handleCommentChange}
              onKeyDown={handleKeyPress}
              ref={textareaRef}
              className="min-h-[80px] resize-none mb-2"
            />
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start" side="top" sideOffset={5}>
            <Command>
              <CommandInput placeholder="Search users..." value={mentionSearch} onValueChange={setMentionSearch} />
              <CommandList>
                <CommandEmpty>No users found</CommandEmpty>
                <CommandGroup>
                  {filteredUsers.map((u: { _id: string; name?: string; email?: string; image?: string }) => (
                    <CommandItem key={(u._id as unknown) as string} onSelect={() => insertMention(u)}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{u.name?.[0] || u.email?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{u.name || u.email}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
