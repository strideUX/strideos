/**
 * AppSidebar - Main application sidebar with role-based navigation and client management
 *
 * @remarks
 * Provides the primary navigation sidebar with role-based access control, client navigation,
 * and user management. Integrates with the navigation system, client management, and user
 * authentication for a comprehensive sidebar experience.
 *
 * @example
 * ```tsx
 * <AppSidebar user={currentUser} />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { usePathname } from "next/navigation";
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import {
  IconBuilding,
  IconCalendar,
  IconFolder,
  IconInnerShadowTop,
  IconSettings,
  IconUsers,
  IconInbox,
  IconBriefcase,
  IconUser,
  IconTools,
  IconFileText,
} from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import { type Icon } from "@tabler/icons-react";

// 2. Internal imports
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { QuickCreateDropdown } from "@/components/quick-create-dropdown";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// 3. Types
interface User {
  _id: string;
  email?: string;
  name?: string;
  role?: 'admin' | 'pm' | 'task_owner' | 'client';
  clientId?: string;
  departmentIds?: string[];
  createdAt?: number;
  updatedAt?: number;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /** Current user information */
  user?: User;
}

interface Client {
  _id: Id<'clients'>;
  name: string;
  logo?: Id<'_storage'>;
  isInternal?: boolean;
}

interface NavigationConfig {
  navMain: Array<{
    title: string;
    url: string;
    icon: Icon;
  }>;
  navInsights: Array<{
    title: string;
    url: string;
    icon: Icon;
  }>;
  clients: Array<{
    title: string;
    url: string;
    icon: Icon;
  }>;
  adminConfig: Array<{
    title: string;
    url: string;
    icon: Icon;
  }>;
}

// 4. Component definition
export const AppSidebar = memo(function AppSidebar({ user, ...props }: AppSidebarProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const pathname = usePathname();
  
  // Fetch internal and external client data for navigation
  const externalClients = useQuery(api.clients.listExternalClients, {
    status: 'active',
  });
  const internalClients = useQuery(api.clients.listInternalClients, {
    status: 'active',
  });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const navigation = useMemo(() => {
    return getRoleBasedNavigation(user?.role || 'pm', externalClients || []);
  }, [user?.role, externalClients]);

  const userData = useMemo(() => ({
    name: user?.name || user?.email || 'User',
    email: user?.email || '',
    avatar: (user as { image?: string })?.image || '',
  }), [user]);

  const hasExternalClients = useMemo(() => {
    return externalClients && externalClients.length > 0;
  }, [externalClients]);

  const hasInternalClients = useMemo(() => {
    return internalClients && internalClients.length > 0;
  }, [internalClients]);

  const isLoading = useMemo(() => {
    return !user;
  }, [user]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const renderClientItem = useCallback((client: Client) => (
    <SidebarMenuItem key={client._id}>
      <SidebarMenuButton asChild>
        <Link href={`/clients/${client._id}`}>
          <SidebarClientLogo client={client} />
          <span className="truncate">{client.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ), []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (isLoading) {
    return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <Link href="/inbox">
                  <IconInnerShadowTop className="!size-5" />
                  <span className="text-base font-semibold">strideOS</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex items-center justify-center p-4">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/inbox">
                <Image 
                  src="/strideos-logo.svg" 
                  alt="strideOS" 
                  width={32} 
                  height={8} 
                  className="h-8 w-auto my-1 -ml-[5px] dark:brightness-0 dark:invert dark:contrast-200 dark:[filter:brightness(0)_invert(1)_sepia(1)_saturate(0)_hue-rotate(0deg)_brightness(0.97)]" 
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        {/* Quick Create Dropdown */}
        <div className="px-3 py-2">
          <QuickCreateDropdown />
        </div>

        {/* Main Navigation (Inbox, My Work, Documents) + Insights */}
        <NavMain items={navigation.navMain} insightsItems={navigation.navInsights} />
        
        <div className="px-3">
          <Separator className="my-2" />
        </div>

        {/* External Clients Section */}
        {hasExternalClients && (
          <div className="mt-2">
            <div className="px-4 pt-2 text-xs text-muted-foreground tracking-wider">
              Clients
            </div>
            <SidebarMenu>
              {externalClients!.map(renderClientItem)}
            </SidebarMenu>
          </div>
        )}

        {/* Internal Clients Section */}
        {hasInternalClients && (
          <div className="mt-2">
            <div className="px-4 pt-2 text-xs text-muted-foreground tracking-wider">
              Internal
            </div>
            <SidebarMenu>
              {internalClients!.map(renderClientItem)}
            </SidebarMenu>
          </div>
        )}

        {/* Admin Configuration Section */}
        {user?.role === 'admin' && navigation.adminConfig.length > 0 && (
          <>
            <div className="px-3">
              <Separator className="my-2" />
            </div>
            <div className="mt-2">
              <div className="px-4 pt-2 text-xs text-muted-foreground tracking-wider">
                System Settings
              </div>
              <NavMain items={navigation.adminConfig} />
            </div>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
});

// Sub-components
const SidebarLogoDisplay = memo(function SidebarLogoDisplay({ 
  storageId, 
  clientName, 
  isInternal 
}: { 
  storageId?: Id<"_storage">; 
  clientName: string; 
  isInternal: boolean; 
}) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const logoUrl = useQuery(
    api.clients.getLogoUrl,
    storageId ? ({ storageId } as any) : 'skip'
  ) as string | undefined;

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (storageId && logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${clientName} logo`}
        width={16}
        height={16}
        className="ml-2 h-4 w-4 rounded object-cover flex-shrink-0"
      />
    );
  }

  // === 7. RENDER (JSX) ===
  // Show appropriate fallback icon
  return isInternal ? (
    <IconTools className="h-4 w-4" />
  ) : (
    <IconBuilding className="h-4 w-4" />
  );
});

const SidebarClientLogo = memo(function SidebarClientLogo({ 
  client 
}: { 
  client: Client; 
}) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <SidebarLogoDisplay 
      storageId={client.logo} 
      clientName={client.name} 
      isInternal={client.isInternal || false} 
    />
  );
});

// Utility functions
const getRoleBasedNavigation = (role: string, clients: Array<{ _id: string; name: string }> = []): NavigationConfig => {
  // Convert real client data to navigation items (limit to first 4 for sidebar)
  const clientNavItems = clients.slice(0, 4).map(client => ({
    title: client.name,
    url: `/clients/${client._id}`,
    icon: IconBuilding,
  }));

  switch (role) {
    case 'admin':
      return {
        navMain: [
          { title: "Inbox", url: "/inbox", icon: IconInbox },
          { title: "My Work", url: "/my-work", icon: IconBriefcase },
          { title: "Documents", url: "/documents", icon: IconFileText },
        ],
        navInsights: [
          { title: "New Requests", url: "/new-requests", icon: IconInbox },
          { title: "Client Projects", url: "/projects", icon: IconFolder },
          { title: "Client Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Internal Projects", url: "/internal-projects", icon: IconFolder },
          { title: "Team Capacity", url: "/team", icon: IconUsers },
        ],
        clients: clientNavItems,
        adminConfig: [
          { title: "Clients", url: "/admin/clients", icon: IconBuilding },
          { title: "Users", url: "/admin/users", icon: IconUser },
          { title: "Settings", url: "/admin/settings", icon: IconSettings },
        ],
      };
    case 'pm':
      return {
        navMain: [
          { title: "Inbox", url: "/inbox", icon: IconInbox },
          { title: "My Work", url: "/my-work", icon: IconBriefcase },
          { title: "Documents", url: "/documents", icon: IconFileText },
        ],
        navInsights: [
          { title: "New Requests", url: "/new-requests", icon: IconInbox },
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Tasks", url: "/tasks", icon: IconInnerShadowTop },
          { title: "Team", url: "/team", icon: IconUsers },
        ],
        clients: clientNavItems,
        adminConfig: [], // PMs don't have admin config access
      };
    case 'task_owner':
      return {
        navMain: [
          { title: "Inbox", url: "/inbox", icon: IconInbox },
          { title: "My Work", url: "/my-work", icon: IconBriefcase },
        ],
        navInsights: [
          { title: "New Requests", url: "/new-requests", icon: IconInbox },
          { title: "Team", url: "/team", icon: IconUsers },
        ],
        clients: [], // Task owners don't see client list
        adminConfig: [], // Task owners don't have admin config access
      };
    case 'client':
      return {
        navMain: [
          { title: "Inbox", url: "/inbox", icon: IconInbox },
          { title: "My Work", url: "/my-work", icon: IconBriefcase },
        ],
        navInsights: [
          { title: "Projects", url: "/projects", icon: IconFolder },
        ],
        clients: [], // Clients don't see client list
        adminConfig: [], // Clients don't have admin config access
      };
    default:
      // Default PM navigation for unknown roles
      return {
        navMain: [
          { title: "Inbox", url: "/inbox", icon: IconInbox },
          { title: "My Work", url: "/my-work", icon: IconBriefcase },
          { title: "Documents", url: "/documents", icon: IconFileText },
        ],
        navInsights: [
          { title: "New Requests", url: "/new-requests", icon: IconInbox },
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Tasks", url: "/tasks", icon: IconInnerShadowTop },
          { title: "Team", url: "/team", icon: IconUsers },
        ],
        clients: clientNavItems,
        adminConfig: [],
      };
  }
};
