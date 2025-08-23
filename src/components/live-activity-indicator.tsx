'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth-hooks';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  IconCircle,
  IconEye
} from '@tabler/icons-react';

interface LiveActivityIndicatorProps {
  page?: string; // Current page/section for presence tracking
  className?: string;
}

export function LiveActivityIndicator({ page = 'general', className }: LiveActivityIndicatorProps) {
  const { user } = useAuth();
  
  // Update user presence
  const updatePresence = useMutation(api.users.updatePresence);
  
  // Get active users
  const activeUsers = useQuery(api.users.getActiveUsers, {
    page,
    excludeCurrentUser: true,
  }) || [];
  
  // Get unread notifications count for live updates
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount) || 0;

  // Update presence when component mounts and page changes
  React.useEffect(() => {
    if (user) {
      updatePresence({ 
        page, 
        lastActive: Date.now(),
        status: 'active' 
      });
    }
  }, [user, page, updatePresence]);

  // Update presence periodically to show user is still active
  React.useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updatePresence({ 
        page, 
        lastActive: Date.now(),
        status: 'active' 
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user, page, updatePresence]);

  // Update presence when user becomes inactive
  React.useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence({ 
          page, 
          lastActive: Date.now(),
          status: 'away' 
        });
      } else {
        updatePresence({ 
          page, 
          lastActive: Date.now(),
          status: 'active' 
        });
      }
    };

    // Use pagehide instead of beforeunload to avoid the browser warning
    const handlePageHide = () => {
      updatePresence({ 
        page, 
        lastActive: Date.now(),
        status: 'offline' 
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [user, page, updatePresence]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'away': return 'text-yellow-500';
      case 'busy': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  if (!user) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Active Users */}
      {activeUsers.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map((activeUser) => (
              <div key={activeUser._id} className="relative">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={activeUser.image || ''} />
                  <AvatarFallback className="text-xs">
                    {getInitials(activeUser.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <IconCircle 
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-current ${getStatusColor(activeUser.status || 'active')}`}
                />
              </div>
            ))}
          </div>
          
          {activeUsers.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{activeUsers.length - 3}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconEye className="h-3 w-3" />
            <span>
              {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} active
            </span>
          </div>
        </div>
      )}

      {/* Live Notification Indicator */}
      {unreadCount > 0 && (
        <div className="relative">
          <IconCircle className="h-2 w-2 fill-current text-blue-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}