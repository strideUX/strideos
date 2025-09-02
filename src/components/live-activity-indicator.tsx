/**
 * LiveActivityIndicator - Real-time user presence and activity display
 *
 * @remarks
 * Displays live user presence indicators, active user avatars, and notification
 * status. Updates user presence automatically and shows real-time activity
 * across different pages with proper cleanup and event handling.
 *
 * @example
 * ```tsx
 * <LiveActivityIndicator page="dashboard" className="ml-auto" />
 * ```
 */

// 1. External imports
import React, { useEffect, useMemo, useCallback, memo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { 
  IconCircle,
  IconEye
} from '@tabler/icons-react';

// 2. Internal imports
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/../convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// 3. Types
interface LiveActivityIndicatorProps {
  /** Current page/section for presence tracking */
  page?: string;
  /** Additional CSS classes */
  className?: string;
}

interface ActiveUser {
  _id: string;
  name?: string;
  image?: string;
  status?: string;
}

// 4. Component definition
export const LiveActivityIndicator = memo(function LiveActivityIndicator({ 
  page = 'general', 
  className 
}: LiveActivityIndicatorProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const { user } = useAuth();
  
  // Convex queries and mutations
  const updatePresence = useMutation(api.users.updatePresence);
  const activeUsers = useQuery(api.users.getActiveUsers, {
    page,
    excludeCurrentUser: true,
  }) || [];
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount) || 0;

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const hasActiveUsers = useMemo(() => {
    return activeUsers.length > 0;
  }, [activeUsers.length]);

  const visibleUsers = useMemo(() => {
    return activeUsers.slice(0, 3);
  }, [activeUsers]);

  const additionalUsersCount = useMemo(() => {
    return Math.max(0, activeUsers.length - 3);
  }, [activeUsers.length]);

  const hasUnreadNotifications = useMemo(() => {
    return unreadCount > 0;
  }, [unreadCount]);

  const activeUsersText = useMemo(() => {
    return `${activeUsers.length} ${activeUsers.length === 1 ? 'person' : 'people'} active`;
  }, [activeUsers.length]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const getInitials = useCallback((name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'active': 
        return 'text-green-500';
      case 'away': 
        return 'text-yellow-500';
      case 'busy': 
        return 'text-red-500';
      default: 
        return 'text-gray-400';
    }
  }, []);

  const updateUserPresence = useCallback((status: 'active' | 'away' | 'offline') => {
    if (!user) return;
    
    updatePresence({ 
      page, 
      lastActive: Date.now(),
      status 
    });
  }, [user, page, updatePresence]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      updateUserPresence('away');
    } else {
      updateUserPresence('active');
    }
  }, [updateUserPresence]);

  const handlePageHide = useCallback(() => {
    updateUserPresence('offline');
  }, [updateUserPresence]);

  const renderActiveUser = useCallback((activeUser: ActiveUser) => (
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
  ), [getInitials, getStatusColor]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // Update presence when component mounts and page changes
  useEffect(() => {
    if (user) {
      updateUserPresence('active');
    }
  }, [user, page, updateUserPresence]);

  // Update presence periodically to show user is still active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updateUserPresence('active');
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user, updateUserPresence]);

  // Update presence when user becomes inactive
  useEffect(() => {
    if (!user) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [user, handleVisibilityChange, handlePageHide]);

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!user) return null;

  // === 7. RENDER (JSX) ===
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Active Users */}
      {hasActiveUsers && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {visibleUsers.map(renderActiveUser)}
          </div>
          
          {additionalUsersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{additionalUsersCount}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconEye className="h-3 w-3" />
            <span>{activeUsersText}</span>
          </div>
        </div>
      )}

      {/* Live Notification Indicator */}
      {hasUnreadNotifications && (
        <div className="relative">
          <IconCircle className="h-2 w-2 fill-current text-blue-500 animate-pulse" />
        </div>
      )}
    </div>
  );
});