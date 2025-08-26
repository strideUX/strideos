'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth-hooks';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconBolt,
  IconPlus,
  IconCalendar,
  IconChecklist,
  IconBuilding,
  IconUser,
  IconFileText,
  IconFolder,
} from '@tabler/icons-react';

// Dialogs
import { TaskFormDialog } from '@/components/admin/task-form-dialog';
import { TodoFormDialog } from '@/components/admin/todo-form-dialog';
import { ClientFormDialog } from '@/components/admin/client-form-dialog';
import { UserFormDialog } from '@/components/admin/user-form-dialog';
import { useRouter, usePathname } from 'next/navigation';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
// Use the exact sprint dialog used on the sprints page
import { SprintFormDialog } from '@/components/sprints/sprint-form-dialog';

interface QuickCreateDropdownProps {
  className?: string;
}

export function QuickCreateDropdown({ className }: QuickCreateDropdownProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Data for dialogs
  const departmentsQuery = useQuery(api.departments.listDepartments, {});
  const departments = React.useMemo(() => departmentsQuery ?? [], [departmentsQuery]);

  // Dialog states
  const [showTaskDialog, setShowTaskDialog] = React.useState(false);
  const [showTodoDialog, setShowTodoDialog] = React.useState(false);
  const [showProjectDialog, setShowProjectDialog] = React.useState(false);
  const [showSprintDialog, setShowSprintDialog] = React.useState(false);
  const [showClientDialog, setShowClientDialog] = React.useState(false);
  const [showUserDialog, setShowUserDialog] = React.useState(false);

  // Derive default context (client/department) from current route when available
  const defaultContext = React.useMemo(() => {
    let clientId: string | undefined;
    let departmentId: string | undefined;

    if (pathname) {
      const match = pathname.match(/^\/clients\/(\w+)/);
      if (match) clientId = match[1];
    }

    if (clientId) {
      const deps = departments.filter((d) => d.clientId === clientId);
      const firstDept = deps[0];
      departmentId = firstDept?._id as string | undefined;
    }

    return { clientId, departmentId };
  }, [pathname, departments]);

  if (!user) return null;

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const getMenuItems = () => {
    // keep hidden items for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hiddenCommonItems = [
      { icon: IconChecklist, label: 'Task', description: 'Create a new task', action: () => setShowTaskDialog(true) },
      { icon: IconFileText, label: 'Todo', description: 'Add a personal todo', action: () => setShowTodoDialog(true) },
    ];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hiddenAdminItems = [
      { icon: IconBuilding, label: 'Client', description: 'Add a new client', action: () => setShowClientDialog(true) },
      { icon: IconUser, label: 'User', description: 'Invite a team member', action: () => setShowUserDialog(true) },
    ];

    const visibleItems = [
      { icon: IconChecklist, label: 'New Task', description: 'Create a new task', action: () => setShowTaskDialog(true) },
      { icon: IconFolder, label: 'New Project', description: 'Create a new project', action: () => setShowProjectDialog(true) },
      { icon: IconCalendar, label: 'New Sprint', description: 'Plan a new sprint', action: () => setShowSprintDialog(true) },
    ];

    return visibleItems;
  };

  const menuItems = getMenuItems();

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button className={`w-full justify-start ${className}`} size="sm">
            <IconBolt className="mr-2 h-4 w-4" />
            Quick Create
            <IconPlus className="ml-auto h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Create New</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {menuItems.map((item, index) => (
            <DropdownMenuItem key={index} onClick={() => handleItemClick(item.action)} className="flex items-start gap-3 p-3">
              <item.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog Components */}
      <TaskFormDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        projectContext={defaultContext.clientId && defaultContext.departmentId ? {
          clientId: defaultContext.clientId as Id<'clients'>,
          clientName: defaultContext.clientName || 'Unknown Client',
          departmentId: defaultContext.departmentId as Id<'departments'>,
          departmentName: defaultContext.departmentName || 'Unknown Department',
          projectId: defaultContext.projectId as Id<'projects'>,
          projectTitle: defaultContext.projectTitle || 'Unknown Project',
        } : undefined}
        onSuccess={() => {
          setShowTaskDialog(false);
          toast.success('Task created successfully!');
        }}
      />

      <TodoFormDialog
        open={showTodoDialog}
        onOpenChange={setShowTodoDialog}
        onSuccess={() => {
          setShowTodoDialog(false);
          toast.success('Todo created successfully!');
        }}
      />

      <ClientFormDialog
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        onSuccess={() => {
          setShowClientDialog(false);
          toast.success('Client created successfully!');
        }}
      />

      <UserFormDialog
        open={showUserDialog}
        onOpenChange={setShowUserDialog}
        onSuccess={() => {
          setShowUserDialog(false);
          toast.success('User invited successfully!');
        }}
      />

      {/* Project creation modal */}
      <ProjectFormDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        defaultValues={{ clientId: defaultContext.clientId as any, departmentId: defaultContext.departmentId as any }}
        hideDescription
        showDueDate
        onSuccess={(result) => {
          setShowProjectDialog(false);
          router.push(`/editor/${result.documentId}`);
        }}
      />

      {/* Sprint creation modal */}
      <sprint-form-dialog
        open={showSprintDialog}
        onOpenChange={setShowSprintDialog}
        initialClientId={defaultContext.clientId as any}
        initialDepartmentId={defaultContext.departmentId as any}
        hideDescription
        onSuccess={(id) => {
          setShowSprintDialog(false);
          router.push(`/sprint/${id}`);
        }}
      />
    </>
  );
}


