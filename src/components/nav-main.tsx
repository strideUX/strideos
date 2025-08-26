/**
 * NavMain - Main navigation component for the application sidebar
 *
 * @remarks
 * Renders the primary navigation menu with support for insights items and unread notifications.
 * Provides active state tracking and visual indicators for unread messages.
 * Integrates with the sidebar UI components for consistent navigation experience.
 *
 * @example
 * ```tsx
 * <NavMain
 *   items={mainNavItems}
 *   insightsItems={insightsNavItems}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { type Icon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from 'convex/react';

// 2. Internal imports
import { api } from '@/../convex/_generated/api';
import { NavInsights } from "@/components/nav-insights";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// 3. Types
interface NavItem {
  title: string;
  url: string;
  icon?: Icon;
}

interface NavMainProps {
  /** Main navigation items to display */
  items: NavItem[];
  /** Optional insights navigation items */
  insightsItems?: NavItem[];
}

// 4. Component definition
export const NavMain = memo(function NavMain({ 
  items, 
  insightsItems 
}: NavMainProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const pathname = usePathname();
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const hasUnread = useMemo(() => {
    return unreadCount !== undefined && unreadCount > 0;
  }, [unreadCount]);

  const shouldShowInsights = useMemo(() => {
    return insightsItems && insightsItems.length > 0;
  }, [insightsItems]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const isActive = useCallback((url: string): boolean => {
    // Special case for inbox which should only be active on exact match
    if (url === '/inbox') {
      return pathname === url;
    }
    // For other routes, check if current path starts with the item's URL
    return pathname.startsWith(url);
  }, [pathname]);

  const renderNavItem = useCallback((item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton 
        tooltip={item.title} 
        asChild
        isActive={isActive(item.url)}
      >
        <Link href={item.url} className="relative">
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {/* Add unread indicator dot for Inbox */}
          {item.url === '/inbox' && hasUnread && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ), [isActive, hasUnread]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(renderNavItem)}
          {/* Include Insights as part of the main menu */}
          {shouldShowInsights && (
            <NavInsights items={insightsItems!} />
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});
