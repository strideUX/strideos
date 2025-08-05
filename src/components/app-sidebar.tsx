"use client"

import * as React from "react"
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
  IconBolt,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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

// Role-based navigation configuration
const getRoleBasedNavigation = (role: string) => {
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
        clients: [
          { title: "Acme Corp", url: "/clients/acme", icon: IconBuilding },
          { title: "Tech Solutions", url: "/clients/tech-solutions", icon: IconBuilding },
          { title: "Startup Inc", url: "/clients/startup", icon: IconBuilding },
          { title: "Enterprise Co", url: "/clients/enterprise", icon: IconBuilding },
        ],
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
        clients: [
          { title: "Acme Corp", url: "/clients/acme", icon: IconBuilding },
          { title: "Tech Solutions", url: "/clients/tech-solutions", icon: IconBuilding },
          { title: "Startup Inc", url: "/clients/startup", icon: IconBuilding },
          { title: "Enterprise Co", url: "/clients/enterprise", icon: IconBuilding },
        ],
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
        clients: [
          { title: "Acme Corp", url: "/clients/acme", icon: IconBuilding },
          { title: "Tech Solutions", url: "/clients/tech-solutions", icon: IconBuilding },
          { title: "Startup Inc", url: "/clients/startup", icon: IconBuilding },
          { title: "Enterprise Co", url: "/clients/enterprise", icon: IconBuilding },
        ],
        adminConfig: [],
      };
  }
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
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
                <a href="/inbox">
                  <IconInnerShadowTop className="!size-5" />
                  <span className="text-base font-semibold">strideOS</span>
                </a>
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

  const navigation = getRoleBasedNavigation(user.role || 'pm');
  
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
              <a href="/inbox">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">strideOS</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        {/* Single Quick Create Button */}
        <div className="px-3 py-2">
          <Button className="w-full justify-start" size="sm">
            <IconBolt className="mr-2 h-4 w-4" />
            Quick Create
          </Button>
        </div>

        {/* Main Navigation (Inbox, My Work) */}
        <NavMain items={navigation.navMain} />
        
        {/* Subtle divider after My Work */}
        <div className="px-3">
          <Separator className="my-2" />
        </div>
        
        {/* Secondary Navigation (Projects, Sprints, Team) */}
        <NavMain items={navigation.navSecondary} />
        
        {/* Clients Section */}
        {navigation.clients.length > 0 && (
          <div className="mt-4">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Clients
            </div>
            <NavMain items={navigation.clients} />
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
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
