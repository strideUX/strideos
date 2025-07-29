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
  type Icon,
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
  const baseNavigation = {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: IconSettings,
      },
      {
        title: "Get Help",
        url: "#",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "#",
        icon: IconSearch,
      },
    ],
    documents: [] as { name: string; url: string; icon: Icon }[],
  };

  switch (role) {
          case 'admin':
        return {
          ...baseNavigation,
                  navMain: [
          ...baseNavigation.navMain,
                      {
              title: "Admin Panel",
              url: "/admin",
              icon: IconSettings,
            },
          {
            title: "Clients",
            url: "/admin/clients",
            icon: IconFolder,
          },
          {
            title: "Users",
            url: "#",
            icon: IconUsers,
          },
          {
            title: "Analytics",
            url: "#",
            icon: IconChartBar,
          },
        ],
        documents: [
          {
            name: "System Reports",
            url: "#",
            icon: IconReport,
          },
          {
            name: "Data Library",
            url: "#",
            icon: IconDatabase,
          },
        ],
      };

    case 'pm':
      return {
        ...baseNavigation,
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "Projects",
            url: "#",
            icon: IconFolder,
          },
          {
            title: "Tasks",
            url: "#",
            icon: IconListDetails,
          },
          {
            title: "Clients",
            url: "/admin/clients",
            icon: IconBuilding,
          },
          {
            title: "Team",
            url: "#",
            icon: IconUsers,
          },
          {
            title: "Analytics",
            url: "#",
            icon: IconChartBar,
          },
        ],
        documents: [
          {
            name: "Project Reports",
            url: "#",
            icon: IconReport,
          },
          {
            name: "Templates",
            url: "#",
            icon: IconFileDescription,
          },
        ],
      };

    case 'task_owner':
      return {
        ...baseNavigation,
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "My Tasks",
            url: "#",
            icon: IconListDetails,
          },
          {
            title: "Projects",
            url: "#",
            icon: IconFolder,
          },
          {
            title: "Team",
            url: "#",
            icon: IconUsers,
          },
        ],
        documents: [
          {
            name: "My Documents",
            url: "#",
            icon: IconFileDescription,
          },
        ],
      };

    case 'client':
      return {
        ...baseNavigation,
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "My Projects",
            url: "#",
            icon: IconFolder,
          },
          {
            title: "Deliverables",
            url: "#",
            icon: IconFileWord,
          },
        ],
        documents: [
          {
            name: "Project Documents",
            url: "#",
            icon: IconFileDescription,
          },
          {
            name: "Reports",
            url: "#",
            icon: IconReport,
          },
        ],
      };

    default:
      return baseNavigation;
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
