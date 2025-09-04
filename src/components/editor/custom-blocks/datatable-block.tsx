"use client";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useMemo, useState, useCallback, type ReactElement } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconSquareCheck, IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame } from "@tabler/icons-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

type DatatableProps = {
  docId?: string; // current document id for context
  textAlignment?: 'left' | 'center' | 'right' | 'justify';
};

type BlockProps = { docId?: string; textAlignment?: (typeof defaultProps.textAlignment)["default"] };
type RenderBlock = { props?: BlockProps };
type EditorAPI = { options?: { comments?: { threadStore?: { documentId?: string | null } } } };
type RenderProps = { block: RenderBlock; editor?: EditorAPI } & Record<string, unknown>;

function DatatableBlockComponent(renderProps: RenderProps): ReactElement {
  const props = (renderProps.block.props as DatatableProps) ?? {};
  const pageDocId = props.docId ?? "";
  const documentsTableId = renderProps.editor?.options?.comments?.threadStore?.documentId ?? null;

  // Fetch document context to gate rendering and find linked project/client
  const ctx = useQuery(api.documentManagement.getDocumentWithContext as any, documentsTableId ? { documentId: documentsTableId as unknown as Id<"documents"> } : "skip") as
    | { document: { documentType?: string; projectId?: Id<"projects">; clientId?: Id<"clients">; metadata?: any }; project?: { _id: Id<"projects">; title?: string } | null; client?: { _id: Id<"clients">; name?: string } | null; metadata: any }
    | null
    | undefined;

  const projectId = (ctx?.document as any)?.projectId || (ctx?.metadata as any)?.projectId || (ctx?.project?._id);
  const clientId = (ctx?.document as any)?.clientId || (ctx?.metadata as any)?.clientId || (ctx?.client?._id);
  const isProjectBrief = (ctx?.document as any)?.documentType === "project_brief";

  // Fetch tasks for the project
  const tasks = useQuery(api.tasks.getTasksByProject as any, projectId ? { projectId } : "skip") as Array<any> | undefined;
  
  // Fetch users for assignee dropdown
  const users = useQuery(api.users.getTeamWorkload as any, { includeInactive: false }) as Array<any> | undefined;

  // Task creation and editing state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done',
    estimatedHours: '',
    assigneeId: 'unassigned' as string,
    dueDate: ''
  });

  const createTask = useMutation(api.tasks.createTask as any);
  const updateTask = useMutation(api.tasks.updateTask as any);
  
  const handleAdd = useCallback(() => {
    if (!projectId || !clientId) return;
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      estimatedHours: '',
      assigneeId: 'unassigned',
      dueDate: ''
    });
    setCreateDialogOpen(true);
  }, [projectId, clientId]);

  const handleEditTask = useCallback((task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      estimatedHours: task.estimatedHours ? String(task.estimatedHours) : '',
      assigneeId: task.assigneeId || 'unassigned',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setCreateDialogOpen(true);
  }, []);

  const handleCreateTask = useCallback(async () => {
    if (!taskForm.title.trim()) return;
    
    try {
      const departmentId = (tasks?.[0]?.departmentId ?? (ctx as any)?.project?.departmentId) ?? (ctx as any)?.document?.departmentId;
      
      const taskData = {
        title: taskForm.title.trim(),
        description: taskForm.description || undefined,
        projectId, 
        clientId, 
        departmentId,
        status: taskForm.status,
        priority: taskForm.priority,
        estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : undefined,
        assigneeId: taskForm.assigneeId !== 'unassigned' ? taskForm.assigneeId as any : undefined,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).getTime() : undefined
      };

      if (editingTask) {
        await updateTask({
          id: editingTask._id,
          ...taskData
        });
        toast.success('Task updated successfully');
      } else {
        await createTask(taskData);
        toast.success('Task created successfully');
      }
      
      // Reset form and close dialog
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        estimatedHours: '',
        assigneeId: 'unassigned',
        dueDate: ''
      });
      setEditingTask(null);
      setCreateDialogOpen(false);
    } catch (error) {
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task');
      console.error('Task operation error:', error);
    }
  }, [taskForm, createTask, updateTask, projectId, clientId, tasks, ctx, editingTask]);

  const handleCancel = useCallback(() => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      estimatedHours: '',
      assigneeId: 'unassigned',
      dueDate: ''
    });
    setEditingTask(null);
    setCreateDialogOpen(false);
  }, []);

  return (
    <div className="datatable-block" style={{ border: "1px solid var(--dt-border, #e5e7eb)", borderRadius: 8, padding: 12, margin: "8px 0", background: "var(--dt-bg, #fff)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontWeight: 600 }}>Project Tasks</div>
        <div contentEditable={false}>
          <button 
            type="button" 
            onClick={handleAdd} 
            disabled={!projectId}
            style={{
              backgroundColor: '#312C85',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: projectId ? 'pointer' : 'not-allowed',
              opacity: projectId ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (projectId) e.currentTarget.style.backgroundColor = '#2a2470';
            }}
            onMouseLeave={(e) => {
              if (projectId) e.currentTarget.style.backgroundColor = '#312C85';
            }}
          >
            Add Task
          </button>
        </div>
      </div>
      {!isProjectBrief || !projectId || !clientId ? (
        <div style={{ color: "var(--dt-muted, #6b7280)" }}>This block only shows for project briefs with a project and client.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold w-[45%]">Task</TableHead>
              <TableHead className="font-bold w-[15%]">Status</TableHead>
              <TableHead className="font-bold w-[10%]">Assignee</TableHead>
              <TableHead className="font-bold text-center w-[10%]">Priority</TableHead>
              <TableHead className="font-bold w-[10%]">Size (hours)</TableHead>
              <TableHead className="font-bold text-right w-[10%]">Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!tasks || tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">
                    No tasks created yet.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleEditTask(task)}>
                  <TableCell className="w-[45%]">
                    <div className="flex items-center gap-2">
                      <IconSquareCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className={`${task.status === 'done' ? 'line-through text-slate-400' : ''} truncate`}>
                        {task.title}
                      </span>
                      <span
                        className="font-mono text-[10px] text-slate-400 px-1 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const slug = `RESP-${String(task._id).slice(-2)}`;
                          navigator.clipboard.writeText(slug);
                          toast.success('ID copied to clipboard');
                        }}
                        title="Click to copy task ID"
                      >
                        RESP-{String(task._id).slice(-2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[15%]">
                    <Badge variant="secondary" className={`text-xs ${
                      task.status === 'todo' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                      task.status === 'review' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' :
                      task.status === 'done' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                      'bg-gray-100 text-gray-800 hover:bg-gray-100'
                    }`}>
                      {task.status === 'todo' ? 'To Do' :
                       task.status === 'in_progress' ? 'In Progress' :
                       task.status === 'review' ? 'Review' :
                       task.status === 'done' ? 'Done' :
                       task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[10%]">
                    {task.assignee ? (
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={task.assignee?.image} />
                        <AvatarFallback className="text-xs">
                          {task.assignee?.name?.[0]?.toUpperCase() || 
                           task.assignee?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center w-[10%]">
                    <div className="flex items-center justify-center">
                      {task.priority === 'low' ? (
                        <IconArrowNarrowDown className="h-4 w-4 text-blue-500" aria-label="Low priority" title="Low" />
                      ) : task.priority === 'high' ? (
                        <IconArrowNarrowUp className="h-4 w-4 text-orange-500" aria-label="High priority" title="High" />
                      ) : task.priority === 'urgent' ? (
                        <IconFlame className="h-4 w-4 text-red-600" aria-label="Urgent priority" title="Urgent" />
                      ) : (
                        <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Medium priority" title="Medium" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-[10%]">
                    <span className="text-sm">
                      {task.estimatedHours || 0}h
                    </span>
                  </TableCell>
                  <TableCell className="text-right w-[10%]">
                    {task.dueDate ? (
                      <span className="text-sm">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">No due date</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      
      {/* Task Creation Dialog - Always available outside conditional rendering */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input 
                value={taskForm.title} 
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Task title" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={taskForm.description} 
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Task description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select 
                  value={taskForm.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setTaskForm(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={taskForm.status} 
                  onValueChange={(value: 'todo' | 'in_progress' | 'review' | 'done') => 
                    setTaskForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assignee</label>
                <Select 
                  value={taskForm.assigneeId} 
                  onValueChange={(value: string) => 
                    setTaskForm(prev => ({ ...prev, assigneeId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users?.filter((user: any) => ['admin', 'pm', 'task_owner', 'client'].includes(user.role) && (user.status === 'active' || !user.status)).map((user: any) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input 
                  type="date"
                  value={taskForm.dueDate} 
                  onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Hours</label>
              <Input 
                type="number" 
                min="0" 
                step="0.5"
                value={taskForm.estimatedHours} 
                onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                placeholder="e.g., 4" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask} 
              disabled={!taskForm.title.trim()}
            >
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Datatable = createReactBlockSpec(
  {
    type: "datatable",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      docId: { default: "" as const },
    },
    content: "none",
  },
  {
    render: (props): ReactElement => {
      return <DatatableBlockComponent {...(props as unknown as RenderProps)} />;
    },
    toExternalHTML: (props): ReactElement => {
      const id = ((props.block.props as DatatableProps)?.docId ?? "").toString();
      return (
        <div className="datatable-block" data-doc-id={id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <strong>Project Tasks</strong>
        </div>
      );
    },
  }
);

export type DatatableType = "datatable";
