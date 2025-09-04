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

  // Task creation state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done',
    estimatedHours: ''
  });

  const createTask = useMutation(api.tasks.createTask as any);
  
  const handleAdd = useCallback(() => {
    if (!projectId || !clientId) return;
    setCreateDialogOpen(true);
  }, [projectId, clientId]);

  const handleCreateTask = useCallback(async () => {
    if (!taskForm.title.trim()) return;
    
    try {
      const departmentId = (tasks?.[0]?.departmentId ?? (ctx as any)?.project?.departmentId) ?? (ctx as any)?.document?.departmentId;
      
      await createTask({ 
        title: taskForm.title.trim(),
        description: taskForm.description || undefined,
        projectId, 
        clientId, 
        departmentId,
        status: taskForm.status,
        priority: taskForm.priority,
        estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : undefined
      });
      
      // Reset form and close dialog
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        estimatedHours: ''
      });
      setCreateDialogOpen(false);
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Task creation error:', error);
    }
  }, [taskForm, createTask, projectId, clientId, tasks, ctx]);

  const handleCancel = useCallback(() => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      estimatedHours: ''
    });
    setCreateDialogOpen(false);
  }, []);

  return (
    <div className="datatable-block" style={{ border: "1px solid var(--dt-border, #e5e7eb)", borderRadius: 8, padding: 12, margin: "8px 0", background: "var(--dt-bg, #fff)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Project Tasks</div>
        <div contentEditable={false}>
          <Button type="button" onClick={handleAdd} size="sm" variant="default" disabled={!projectId}>Add Task</Button>
        </div>
      </div>
      {!isProjectBrief || !projectId || !clientId ? (
        <div style={{ color: "var(--dt-muted, #6b7280)" }}>This block only shows for project briefs with a project and client.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Estimated</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!tasks || tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{task.title}</span>
                      {task.description && (
                        <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={task.status === 'done' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {task.status === 'in_progress' ? 'In Progress' : task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      
      {/* Task Creation Dialog - Always available outside conditional rendering */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
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
              Create Task
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
