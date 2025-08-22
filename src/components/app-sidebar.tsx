"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
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
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { QuickCreateDropdown } from "@/components/quick-create-dropdown"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"

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
  user?: User;
}

// SidebarLogoDisplay component to handle conditional hook calls
function SidebarLogoDisplay({ storageId, clientName, isInternal }: { storageId?: Id<"_storage">; clientName: string; isInternal: boolean }) {
  // Only call the hook if we have a valid storageId
  const logoUrl = useQuery(
    api.clients.getLogoUrl,
    storageId ? ({ storageId } as any) : 'skip'
  ) as string | undefined;

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

  // Show appropriate fallback icon
  return isInternal ? (
    <IconTools className="h-4 w-4" />
  ) : (
    <IconBuilding className="h-4 w-4" />
  );
}

// SidebarClientLogo component to display client logos in navigation
function SidebarClientLogo({ client }: { client: { logo?: string; name: string; isInternal: boolean } }) {
  return (
    <SidebarLogoDisplay 
      storageId={client.logo as unknown as Id<'_storage'>} 
      clientName={client.name} 
      isInternal={client.isInternal} 
    />
  );
}

// Role-based navigation configuration
const getRoleBasedNavigation = (role: string, clients: Array<{ _id: string; name: string }> = []) => {
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
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Team", url: "/team", icon: IconUsers },
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

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  
  // Fetch internal and external client data for navigation
  const externalClients = useQuery(api.clients.listExternalClients, {
    status: 'active',
  });
  const internalClients = useQuery(api.clients.listInternalClients, {
    status: 'active',
  });

  // Safety check for undefined user during loading
  if (!user) {
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

  const navigation = getRoleBasedNavigation(user.role || 'pm', externalClients || []);
  
  const userData = {
    name: user.name || user.email || 'User',
    email: user.email || '',
    avatar: (user as { image?: string }).image || '',
  };

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
        {externalClients && externalClients.length > 0 && (
          <div className="mt-2">
            <div className="px-4 pt-2 text-xs text-muted-foreground tracking-wider">
              Clients
            </div>
            <SidebarMenu>
              {externalClients.map((client) => (
                <SidebarMenuItem key={client._id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={pathname.startsWith(`/clients/${client._id}`)}
                  >
                    <Link href={`/clients/${client._id}`}>
                      <SidebarClientLogo client={client} />
                      <span>{client.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        )}

        {/* Internal Section */}
        {internalClients && internalClients.length > 0 && (
          <div className="mt-1 mb-2">
            <div className="px-4 pt-2 text-xs text-muted-foreground tracking-wider">
              Internal
            </div>
            <SidebarMenu>
              {internalClients.map((client) => (
                <SidebarMenuItem key={client._id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={pathname.startsWith(`/clients/${client._id}`)}
                  >
                    <Link href={`/clients/${client._id}`}>
                      <SidebarClientLogo client={client} />
                      <span>{client.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        )}
        
        {/* Subtle divider before Admin Config */}
        {navigation.adminConfig.length > 0 && (
          <div className="px-3">
            <Separator className="my-2" />
          </div>
        )}
        
        {/* Admin Config section for admin users */}
        {navigation.adminConfig.length > 0 && (
          <div className="mt-2">
            <div className="px-4 pt-2 text-xs text-muted-foreground tracking-wider">
              System Settings
            </div>
            <NavMain items={navigation.adminConfig} />
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
