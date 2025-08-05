"use client"

import * as React from "react"
import {
  IconBuilding,
  IconCalendar,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSettings,
  IconUsers,
  IconBell,
  IconInbox,
  IconBriefcase,
  IconUser,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Team", url: "/team", icon: IconUsers },
          { title: "Clients", url: "/clients", icon: IconBuilding },
        ],
        adminConfig: [
          { title: "Clients", url: "/admin/clients", icon: IconBuilding },
          { title: "Users", url: "/admin/users", icon: IconUser },
          { title: "Settings", url: "/admin/settings", icon: IconSettings },
        ],
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
      };

    case 'pm':
      return {
        navMain: [
          { title: "Inbox", url: "/inbox", icon: IconInbox },
          { title: "My Work", url: "/my-work", icon: IconBriefcase },
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Team", url: "/team", icon: IconUsers },
          { title: "Clients", url: "/clients", icon: IconBuilding },
        ],
        adminConfig: [], // PMs don't have admin config access
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
      };

    case 'task_owner':
      return {
        navMain: [
          { title: "Inbox", url: "/inbox", icon: IconInbox },
          { title: "My Work", url: "/my-work", icon: IconBriefcase },
          { title: "Team", url: "/team", icon: IconUsers },
        ],
        adminConfig: [], // Task owners don't have admin config access
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
      };

    case 'client':
      return {
        navMain: [
          { title: "Inbox", url: "/inbox", icon: IconInbox },
          { title: "My Work", url: "/my-work", icon: IconBriefcase },
          { title: "Projects", url: "/client-projects", icon: IconFolder },
          { title: "Team", url: "/team", icon: IconUsers },
        ],
        adminConfig: [], // Clients don't have admin config access
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
      };

    default:
      // Default PM navigation for unknown roles
      return {
        navMain: [
          { title: "Inbox", url: "/inbox", icon: IconInbox },
          { title: "My Work", url: "/my-work", icon: IconBriefcase },
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Team", url: "/team", icon: IconUsers },
          { title: "Clients", url: "/clients", icon: IconBuilding },
        ],
        adminConfig: [],
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
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
                <a href="/dashboard">
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
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">strideOS</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation.navMain} />
        
        {/* Admin Config section for admin users */}
        {navigation.adminConfig.length > 0 && (
          <div className="mt-6">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin Config
            </div>
            <NavMain items={navigation.adminConfig} />
          </div>
        )}
        
        <NavSecondary items={navigation.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
