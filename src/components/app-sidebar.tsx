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
  user: User;
}

// Role-based navigation configuration
const getRoleBasedNavigation = (role: string) => {
  switch (role) {
    case 'admin':
      return {
        navMain: [
          { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
          { title: "Clients", url: "/admin/clients", icon: IconBuilding },
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Tasks", url: "/tasks", icon: IconListDetails },
          { title: "Reports", url: "/reports", icon: IconReport },
          { title: "Users", url: "/admin/users", icon: IconUsers },
          { title: "Settings", url: "/admin/settings", icon: IconSettings },
        ],
        documents: [],
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
      };

    case 'pm':
      return {
        navMain: [
          { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
          { title: "Projects", url: "/projects", icon: IconFolder },
          { title: "Sprints", url: "/sprints", icon: IconCalendar },
          { title: "Tasks", url: "/tasks", icon: IconListDetails },
          { title: "Reports", url: "/reports", icon: IconReport },
        ],
        documents: [],
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
      };

    case 'task_owner':
      return {
        navMain: [
          { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
          { title: "My Tasks", url: "/my-tasks", icon: IconListDetails },
          { title: "My Projects", url: "/my-projects", icon: IconFolder },
          { title: "Team", url: "/team", icon: IconUsers },
        ],
        documents: [],
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
      };

    case 'client':
      return {
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: IconDashboard,
          },
          {
            title: "My Projects",
            url: "/client-projects",
            icon: IconFolder,
          },
          {
            title: "Project Status",
            url: "/project-status",
            icon: IconChartBar,
          },
          {
            title: "Communications",
            url: "/communications",
            icon: IconUsers,
          },
          {
            title: "Feedback",
            url: "/feedback",
            icon: IconFileWord,
          },
        ],
        documents: [
          {
            name: "Project Documents",
            url: "/project-documents",
            icon: IconFileDescription,
          },
          {
            name: "Progress Reports",
            url: "/progress-reports",
            icon: IconReport,
          },
          {
            name: "Requirements",
            url: "/requirements",
            icon: IconDatabase,
          },
        ],
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
      };

    default:
      // Default PM navigation for unknown roles
      return {
        navMain: [
          { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
        ],
        documents: [],
        navSecondary: [
          { title: "Support", url: "/help", icon: IconHelp },
        ],
      };
  }
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
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
          <NavSecondary items={navigation.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
