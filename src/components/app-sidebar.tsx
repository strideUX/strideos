"use client"

import * as React from "react"
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
  IconHammer,
  IconTools,
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
    storageId ? { storageId: storageId } : "skip"
  );

  if (storageId && logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${clientName} logo`}
        className="ml-2 h-4 w-4 rounded object-cover flex-shrink-0"
        onError={(e) => {
          // Fallback to default icon if image fails to load
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'block';
        }}
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
function SidebarClientLogo({ client }: { client: any }) {
  return (
    <SidebarLogoDisplay 
      storageId={client.logo} 
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
        ],
        navSecondary: [
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
        ],
        navSecondary: [
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
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
        navSecondary: [
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
        navSecondary: [
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
        ],
        navSecondary: [
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Team", url: "/team", icon: IconUsers },
        ],
        clients: clientNavItems,
        adminConfig: [],
      };
  }
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
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
    avatar: '', // We can add avatar functionality later
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
                <img src="/strideos-logo.svg" alt="strideOS" className="h-8 w-auto my-1 -ml-[5px]" />
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

        {/* Main Navigation (Inbox, My Work) */}
        <NavMain items={navigation.navMain} />
        
        {/* Subtle divider after My Work */}
        <div className="px-3">
          <Separator className="my-2" />
        </div>
        
        {/* Secondary Navigation (Projects, Sprints, Team) */}
        <NavMain items={navigation.navSecondary} />
        
        {/* External Clients Section */}
        {externalClients && externalClients.length > 0 && (
          <div className="mt-4">
            <div className="px-4 pt-2 text-xs text-muted-foreground tracking-wider">
              Clients
            </div>
            <SidebarMenu>
              {externalClients.map((client) => (
                <SidebarMenuItem key={client._id}>
                  <SidebarMenuButton asChild>
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
          <div className="mt-4">
            <div className="px-4 pt-2 text-xs text-muted-foreground tracking-wider">
              Internal
            </div>
            <SidebarMenu>
              {internalClients.map((client) => (
                <SidebarMenuItem key={client._id}>
                  <SidebarMenuButton asChild>
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
              Admin Config
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
