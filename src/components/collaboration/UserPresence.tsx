'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface UserPresenceProps {
  users: CollaborationUser[];
  currentUserId?: string;
  maxVisible?: number;
}

export function UserPresence({ users, currentUserId, maxVisible = 5 }: UserPresenceProps) {
  // Filter out current user and limit to max visible
  const otherUsers = users.filter(user => user.id !== currentUserId);
  const visibleUsers = otherUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, otherUsers.length - maxVisible);

  if (otherUsers.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Only you
        </Badge>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar 
                    className="h-8 w-8 border-2 border-background"
                    style={{ borderColor: user.color }}
                  >
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback 
                      className="text-xs font-medium"
                      style={{ 
                        backgroundColor: user.color + '20',
                        color: user.color,
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Active indicator */}
                  <div 
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background"
                    style={{ backgroundColor: user.color }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.cursor ? `Editing at position ${user.cursor.from}` : 'Active'}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                    +{hiddenCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {hiddenCount} more user{hiddenCount !== 1 ? 's' : ''} active
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        <Badge variant="secondary" className="text-xs">
          {otherUsers.length} online
        </Badge>
      </div>
    </TooltipProvider>
  );
}