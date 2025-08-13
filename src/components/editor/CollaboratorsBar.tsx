"use client";

import { Id } from '@/convex/_generated/dataModel';
import { usePresence } from './PresenceProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function TypingIndicator({ users }: { users: { name?: string }[] }) {
  if (!users || users.length === 0) return null;
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <div className="flex animate-pulse">●●●</div>
      <span>
        {users.length === 1
          ? `${users[0]?.name || 'Someone'} is typing...`
          : `${users.length} people are typing...`}
      </span>
    </div>
  );
}

export function CollaboratorsBar({ documentId }: { documentId: Id<'documents'> }) {
  const { activeUsers } = usePresence();
  const typingUsers = activeUsers.filter(u => u.status === 'typing').map(u => ({ name: u.user?.name }));
  const visible = activeUsers.slice(0, 8);
  const extra = activeUsers.length - visible.length;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b">
      <span className="text-sm text-muted-foreground">Collaborating:</span>
      <div className="flex -space-x-2 items-center">
        {visible.map(s => (
          <Avatar key={s._id} className="h-7 w-7 ring-2 ring-background">
            {s.user?.image && <AvatarImage src={s.user.image} alt={s.user?.name || ''} />}
            <AvatarFallback>{initials(s.user?.name)}</AvatarFallback>
          </Avatar>
        ))}
        {extra > 0 && (
          <div className="h-7 w-7 rounded-full bg-muted text-xs flex items-center justify-center ring-2 ring-background">+{extra}</div>
        )}
      </div>
      <TypingIndicator users={typingUsers} />
    </div>
  );
}