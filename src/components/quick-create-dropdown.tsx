'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
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
} from '@tabler/icons-react';

// Import existing admin form dialogs
import { TaskFormDialog } from '@/components/admin/TaskFormDialog';
import { TodoFormDialog } from '@/components/admin/TodoFormDialog';
import { ClientFormDialog } from '@/components/admin/ClientFormDialog';
import { UserFormDialog } from '@/components/admin/UserFormDialog';
// import { SprintFormDialog } from '@/components/admin/SprintFormDialog';
import { useRouter } from 'next/navigation';

interface QuickCreateDropdownProps {
  className?: string;
}

export function QuickCreateDropdown({ className }: QuickCreateDropdownProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  
  // Fetch data needed for form dialogs
  const clients = useQuery(api.clients.listClients) || [];
  const departments = useQuery(api.departments.listDepartments) || [];
  const users = useQuery(api.users.listUsers) || [];
  
  // Dialog states
  const [showTaskDialog, setShowTaskDialog] = React.useState(false);
  const [showTodoDialog, setShowTodoDialog] = React.useState(false);
  const [showProjectDialog, setShowProjectDialog] = React.useState(false);
  // const [showSprintDialog, setShowSprintDialog] = React.useState(false);
  const [showClientDialog, setShowClientDialog] = React.useState(false);
  const [showUserDialog, setShowUserDialog] = React.useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = React.useState(false);

  if (!user) return null;

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Simplified menu items - only showing Sprints and Projects for now
  const getMenuItems = () => {
    // Hidden items (keeping for future use)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hiddenCommonItems = [
      {
        icon: IconChecklist,
        label: 'Task',
        description: 'Create a new task',
        action: () => setShowTaskDialog(true),
      },
      {
        icon: IconFileText,
        label: 'Todo',
        description: 'Add a personal todo',
        action: () => setShowTodoDialog(true),
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hiddenAdminItems = [
      {
        icon: IconBuilding,
        label: 'Client',
        description: 'Add a new client',
        action: () => setShowClientDialog(true),
      },
      {
        icon: IconUser,
        label: 'User',
        description: 'Invite a team member',
        action: () => setShowUserDialog(true),
      },
    ];

    // Visible items - only Projects and Sprints
    const visibleItems = [
      {
        icon: IconCalendar,
        label: 'Sprint',
        description: 'Plan a new sprint',
          action: () => router.push('/sprints/new'),
      },
    ];

    // For now, return only visible items regardless of role
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
            <DropdownMenuItem
              key={index}
              onClick={() => handleItemClick(item.action)}
              className="flex items-start gap-3 p-3"
            >
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
      
      {/* Replaced modal sprint creation with full-page planner */}
      
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

      {/* TODO: Implement ProjectFormDialog when needed */}
      {showProjectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Create Project</h2>
            <p className="text-muted-foreground mb-4">
              Project creation form will be implemented here.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowProjectDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowProjectDialog(false)}>
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TODO: Implement DocumentFormDialog when needed */}
      {showDocumentDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Create Document</h2>
            <p className="text-muted-foreground mb-4">
              Document creation form will be implemented here.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDocumentDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowDocumentDialog(false)}>
                Create Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}