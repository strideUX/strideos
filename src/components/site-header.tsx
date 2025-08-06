

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/NotificationBell"

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

interface SiteHeaderProps {
  user?: User;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  // Safety check for undefined user during loading
  if (!user) {
    return (
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Loading...
            </span>
          </div>
        </div>
      </header>
    );
  }
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'pm': return 'PM';
      case 'task_owner': return 'Task Owner';
      case 'client': return 'Client';
      default: return 'User';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pm': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'task_owner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'client': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Dashboard</h1>
        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Welcome, {user.name || user.email}
          </span>
          <Badge variant="secondary" className={`text-xs ${getRoleColor(user.role)}`}>
            {getRoleLabel(user.role)}
          </Badge>
        </div>
      </div>
    </header>
  )
}
