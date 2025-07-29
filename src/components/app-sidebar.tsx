"use client"

import * as React from "react"
import {
  IconBuilding,
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
  IconSearch,
  IconSettings,
  IconUsers,

} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
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
  // Common secondary navigation for all roles
  const commonSecondary = [
    {
      title: "Account Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
    },
  ];

  switch (role) {
    case 'admin':
      return {
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: IconDashboard,
          },
          {
            title: "Client Management",
            url: "/admin/clients",
            icon: IconBuilding,
          },
          {
            title: "User Management",
            url: "/admin/users",
            icon: IconUsers,
          },
          {
            title: "Analytics",
            url: "/admin/analytics",
            icon: IconChartBar,
          },
          {
            title: "System Settings",
            url: "/admin/settings",
            icon: IconSettings,
          },
        ],
        documents: [
          {
            name: "System Reports",
            url: "/admin/reports",
            icon: IconReport,
          },
          {
            name: "Data Export",
            url: "/admin/export",
            icon: IconDatabase,
          },
        ],
        navSecondary: [
          ...commonSecondary,
          {
            title: "Global Search",
            url: "/search",
            icon: IconSearch,
          },
        ],
      };

    case 'pm':
      return {
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: IconDashboard,
          },
          {
            title: "Projects",
            url: "/projects",
            icon: IconFolder,
          },
          {
            title: "Tasks",
            url: "/tasks",
            icon: IconListDetails,
          },
          {
            title: "Clients",
            url: "/admin/clients",
            icon: IconBuilding,
          },
          {
            title: "Team",
            url: "/team",
            icon: IconUsers,
          },
          {
            title: "Reports",
            url: "/reports",
            icon: IconChartBar,
          },
        ],
        documents: [
          {
            name: "Project Templates",
            url: "/templates",
            icon: IconFileDescription,
          },
          {
            name: "Meeting Notes",
            url: "/notes",
            icon: IconFileWord,
          },
          {
            name: "Project Reports",
            url: "/project-reports",
            icon: IconReport,
          },
        ],
        navSecondary: [
          ...commonSecondary,
          {
            title: "Project Search",
            url: "/project-search",
            icon: IconSearch,
          },
        ],
      };

    case 'task_owner':
      return {
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: IconDashboard,
          },
          {
            title: "My Tasks",
            url: "/my-tasks",
            icon: IconListDetails,
          },
          {
            title: "My Projects",
            url: "/my-projects",
            icon: IconFolder,
          },
          {
            title: "Team",
            url: "/team",
            icon: IconUsers,
          },
          {
            title: "Time Tracking",
            url: "/time-tracking",
            icon: IconChartBar,
          },
        ],
        documents: [
          {
            name: "My Documents",
            url: "/my-documents",
            icon: IconFileDescription,
          },
          {
            name: "Task Notes",
            url: "/task-notes",
            icon: IconFileWord,
          },
          {
            name: "My Reports",
            url: "/my-reports",
            icon: IconReport,
          },
        ],
        navSecondary: [
          ...commonSecondary,
          {
            title: "Task Search",
            url: "/task-search",
            icon: IconSearch,
          },
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
          ...commonSecondary,
          {
            title: "Document Search",
            url: "/document-search",
            icon: IconSearch,
          },
        ],
      };

    default:
      // Default PM navigation for unknown roles
      return {
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: IconDashboard,
          },
        ],
        documents: [],
        navSecondary: commonSecondary,
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
        <NavDocuments items={navigation.documents} />
        <NavSecondary items={navigation.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
