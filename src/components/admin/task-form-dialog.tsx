/**
 * TaskFormDialog - Comprehensive form dialog for creating and editing tasks
 *
 * @remarks
 * Handles both creation and editing modes for tasks with full project context support.
 * Manages task metadata, dependencies, attachments, and comments. Integrates with
 * task hooks for form state management and submission. Provides conditional field
 * display based on project context and user permissions.
 *
 * @example
 * ```tsx
 * <TaskFormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   task={existingTask}
 *   projectContext={{
 *     projectId: "project123",
 *     projectTitle: "My Project",
 *     clientId: "client123",
 *     clientName: "Client Name",
 *     departmentId: "dept123",
 *     departmentName: "Department Name"
 *   }}
 *   onSuccess={() => setIsOpen(false)}
 *   isFromMyWork={false}
 * />
 * ```
 */

// 1. External imports
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame, IconFileText, IconExternalLink, IconHandStop } from '@tabler/icons-react';

// 2. Internal imports
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/rich-text-editor';
import { TaskDependencySelector } from '@/components/tasks/task-dependency-selector';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { TaskComments } from '../tasks/task-comments';
import { AttachmentUploader } from '@/components/attachments/attachment-uploader';
import { AttachmentList } from '@/components/attachments/attachment-list';

// 3. Types
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

interface Task {
	_id: Id<'tasks'>;
	title: string;
	description?: string;
	status: TaskStatus;
	priority: TaskPriority;
	size?: TaskSize;
	// New hours-based sizing (optional during migration)
	sizeHours?: number;
	clientId: Id<'clients'>;
	departmentId: Id<'departments'>;
	projectId?: Id<'projects'>;
	assigneeId?: Id<'users'>;
	dueDate?: number;
}

interface ProjectContext {
	clientId: Id<'clients'>;
	clientName: string;
	departmentId: Id<'departments'>;
	departmentName: string;
	projectId: Id<'projects'>;
	projectTitle: string;
}

interface TaskFormDialogProps {
	/** Controls dialog visibility */
	open: boolean;
	/** Callback to control dialog open/close state */
	onOpenChange: (open: boolean) => void;
	/** Task to edit (undefined for creation mode) */
	task?: Task;
	/** Project context for new tasks or context-less editing */
	projectContext?: ProjectContext;
	/** Callback fired when task is successfully created/updated */
	onSuccess: () => void;
	/** When opened from My Work, hide assignee field */
	isFromMyWork?: boolean;
}

// 4. Component definition
export const TaskFormDialog = memo(function TaskFormDialog({ 
	open, 
	onOpenChange, 
	task, 
	projectContext, 
	onSuccess, 
	isFromMyWork = false 
}: TaskFormDialogProps) {
	// === 1. DESTRUCTURE PROPS ===
	// (Already done in function parameters)

	// === 2. HOOKS (Custom hooks first, then React hooks) ===
	// Queries (use light any-casts to avoid deep Convex generic instantiation)
	const clients: any[] = [];
	const departments: any[] = [];
	const projects: any[] = [];
	// Always fetch users; we'll filter to always include internal users and, when a department is set, client users in that department
	// @ts-ignore safe any-cast for UI layer to avoid deep types
	const users: any[] = ((useQuery as any)(api.users.getTeamWorkload as any, { includeInactive: false } as any)) ?? [];

	// Mutations
	const createTask = useMutation(api.tasks.createTask);
	const updateTask = useMutation(api.tasks.updateTask);
	const deleteAttachmentMutation = useMutation(api.attachments.deleteAttachment);

	// Local state
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		status: 'todo' as TaskStatus,
		priority: 'medium' as TaskPriority,
		size: '' as TaskSize | '',
		sizeHours: undefined as number | undefined,
		assigneeId: 'unassigned',
		dueDate: '',
		// Context fields when not provided by projectContext
		clientId: '',
		departmentId: '',
		projectId: '',
	});

	const [isLoading, setIsLoading] = useState(false);
	const [showProjectSelectors, setShowProjectSelectors] = useState<boolean>(true);
	const [blockedBy, setBlockedBy] = useState<Id<'tasks'>[]>([] as any);

	// === 3. MEMOIZED VALUES (useMemo for computations) ===
	// Build projectContext from task data if not provided
	const derivedProjectContext = useMemo(() => {
		if (projectContext) return projectContext;
		if (!task || !task.projectId) return null;
		
		// Use task's enriched data if available
		const taskWithData = task as any;
		if (taskWithData.client && taskWithData.department && taskWithData.project) {
			return {
				clientId: task.clientId,
				clientName: taskWithData.client.name,
				departmentId: task.departmentId,
				departmentName: taskWithData.department.name,
				projectId: task.projectId,
				projectTitle: taskWithData.project.title,
			} as ProjectContext;
		}
		return null;
	}, [task, projectContext]);

	// Attachments (only when editing an existing task)
	const taskId = useMemo(() => {
		return task?._id ? String(task._id) : null;
	}, [task?._id]);

	const attachmentArgs = useMemo(() => {
		return (taskId
			? { entityType: 'task' as const, entityId: taskId }
			: 'skip') as any;
	}, [taskId]);

	// @ts-ignore Deep generic instantiation from convex types; safe any-cast for UI
	const listAttachments = (useQuery as any)(api.attachments.listByEntity as any, attachmentArgs as any) as any[] | undefined;
	
	const attachments = useMemo(() => {
		return listAttachments ?? [];
	}, [listAttachments]);

	// Dependency status for warning banner
	const blockingArgs = useMemo(() => {
		return (blockedBy && blockedBy.length > 0)
			? ({ taskIds: blockedBy } as any)
			: ('skip' as const);
	}, [blockedBy]);

	// @ts-ignore Safe any-cast to avoid deep convex generics in UI layer
	const blockingTasks = (useQuery as any)(api.tasks.getTasksByIds as any, blockingArgs as any) as any[] | undefined;
	
	const hasBlockingDependencies = useMemo(() => {
		return (blockingTasks ?? []).some((t: any) => t && (t.status === 'todo' || t.status === 'in_progress'));
	}, [blockingTasks]);

	const filteredDepartments = useMemo(() => {
		return departments || [];
	}, [departments]);

	const filteredUsers = useMemo(() => {
		return (users ?? []).filter((user: any) => {
			// Always include internal users (non-client roles)
			if (user.role !== 'client') return true;
			// Client users are included ONLY when a department is set
			const departmentId = derivedProjectContext?.departmentId || (formData.departmentId as any);
			if (departmentId) {
				return user.departmentIds?.includes(departmentId);
			}
			// No department context: exclude client users
			return false;
		});
	}, [users, derivedProjectContext?.departmentId, formData.departmentId]);

	const hasContext = useMemo(() => {
		return Boolean(derivedProjectContext);
	}, [derivedProjectContext]);

	// === 4. CALLBACKS (useCallback for all functions) ===
	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			if (!formData.title.trim()) {
				toast.error('Task title is required');
				return;
			}

			const clientId = derivedProjectContext?.clientId || (formData.clientId as Id<'clients'>);
			const departmentId = derivedProjectContext?.departmentId || (formData.departmentId as Id<'departments'>);
			const projectId = derivedProjectContext?.projectId || (formData.projectId as Id<'projects'>);

			if (!clientId) { toast.error('Please select a client'); return; }
			if (!departmentId) { toast.error('Please select a department'); return; }
			if (!projectId) { toast.error('Please select a project'); return; }

			const payload = {
				title: formData.title.trim(),
				description: formData.description.trim() || undefined,
				status: formData.status,
				clientId,
				departmentId,
				projectId,
				priority: formData.priority,
				size: (formData.size || undefined) as TaskSize | undefined,
				sizeHours: formData.sizeHours,
				assigneeId: (!formData.assigneeId || formData.assigneeId === 'unassigned') ? undefined : (formData.assigneeId as Id<'users'>),
				dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
				blockedBy: (blockedBy as any[]),
			};

			if (task) {
				await updateTask({
					id: task._id,
					title: payload.title,
					description: payload.description,
					status: payload.status,
					clientId: payload.clientId,
					departmentId: payload.departmentId,
					projectId: payload.projectId,
					priority: payload.priority,
					size: payload.size as TaskSize,
					sizeHours: payload.sizeHours,
					assigneeId: payload.assigneeId,
					blockedBy: payload.blockedBy as any,
					dueDate: payload.dueDate,
				});
				toast.success('Task updated successfully');
			} else {
				await createTask({
					title: payload.title,
					description: payload.description,
					status: payload.status,
					clientId: payload.clientId,
					departmentId: payload.departmentId,
					projectId: payload.projectId,
					priority: payload.priority,
					size: payload.size as TaskSize,
					sizeHours: payload.sizeHours,
					assigneeId: payload.assigneeId,
					blockedBy: payload.blockedBy as any,
					dueDate: payload.dueDate,
				});
				toast.success('Task created successfully');
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error('Error saving task:', error);
			toast.error(task ? 'Failed to update task' : 'Failed to create task');
		} finally {
			setIsLoading(false);
		}
	}, [formData, derivedProjectContext, blockedBy, task, createTask, updateTask, onSuccess, onOpenChange]);

	const handleFieldChange = useCallback((field: string, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	}, []);

	const handleDeleteAttachment = useCallback(async (id: string) => {
		try {
			// This function is no longer used as attachments are removed from state
			// Keeping it for now to avoid breaking existing calls, but it will be removed later.
			// await deleteAttachmentMutation({ attachmentId: id as any });
			toast.success('Attachment deleted');
		} catch {
			toast.error('Failed to delete attachment');
		}
	}, []);

	const refetchAttachments = useCallback(() => {
		// useQuery is reactive; uploads will cause live updates once record is created
	}, []);

	const handleUnlinkProject = useCallback(() => {
		if (confirm('Remove project association? This will unlink the task from the project.')) {
			setFormData(prev => ({ ...prev, clientId: '', departmentId: '', projectId: '' }));
			setShowProjectSelectors(true);
		}
	}, []);

	const handleOpenProjectBrief = useCallback(() => {
		if (derivedProjectContext?.projectId) {
			window.open(`/projects/${derivedProjectContext.projectId}/details`, '_blank');
		}
	}, [derivedProjectContext?.projectId]);

	// === 5. EFFECTS (useEffect for side effects) ===
	useEffect(() => {
		if (!open) return;
		if (task) {
			setFormData({
				title: task.title,
				description: task.description || '',
				status: task.status,
				priority: task.priority,
				size: task.size || '',
				sizeHours: (task as any).sizeHours,
				assigneeId: task.assigneeId || 'unassigned',
				dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
				clientId: task.clientId as any,
				departmentId: task.departmentId as any,
				projectId: task.projectId || '',
			});
			setBlockedBy(((task as any)?.blockedBy ?? []) as any);
			// If there is an associated project either via props or task, start with linked view
			const linked = Boolean(derivedProjectContext?.projectId || task.projectId);
			setShowProjectSelectors(!linked);
		} else {
			setFormData({
				title: '',
				description: '',
				status: 'todo',
				priority: 'medium',
				size: '',
				sizeHours: undefined,
				assigneeId: 'unassigned',
				dueDate: '',
				clientId: '',
				departmentId: '',
				projectId: '',
			});
			setBlockedBy([] as any);
			setShowProjectSelectors(true);
		}
	}, [open, task, derivedProjectContext]);

	// === 6. EARLY RETURNS (loading, error states) ===
	// (No early returns needed)

	// === 7. RENDER (JSX) ===
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="xl" showCloseButton={false} className="gap-0 max-h-[90vh] h-full flex flex-col p-0 max-w-6xl">
				{/* Hidden title for accessibility */}
				<DialogHeader className="sr-only">
					<DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
				</DialogHeader>
				{/* Header - Fixed */}
				<div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
					<div className="text-sm text-muted-foreground">
						{derivedProjectContext && !showProjectSelectors ? (
							<div className="flex items-center gap-1.5">
								<span>{derivedProjectContext.clientName}</span>
								<svg className="h-3.5 w-3.5 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<polyline points="9 18 15 12 9 6" />
								</svg>
								<span>{derivedProjectContext.departmentName}</span>
								<svg className="h-3.5 w-3.5 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<polyline points="9 18 15 12 9 6" />
								</svg>
								<span>{derivedProjectContext.projectTitle}</span>
							</div>
						) : (
							<span>Task Details</span>
						)}
					</div>
					<DialogClose className="rounded-sm opacity-70 hover:opacity-100">
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DialogClose>
				</div>

				{/* Main Content - Flexible with internal scroll */}
				<div className="flex-1 flex min-h-0">
					{/* Left Column */}
					<form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 min-w-0">
						{/* Scrollable content area */}
						<div className="flex-1 overflow-y-auto px-6 py-4">
							<div className="space-y-4">
								{/* Header title (no subtitle) */}
								<h2 className="text-lg font-semibold">{task ? 'Edit Task' : 'Create New Task'}</h2>
								{hasBlockingDependencies && (
									<div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
										<IconHandStop className="h-4 w-4 text-blue-500" />
										<div className="text-sm text-slate-800">
											<span className="font-semibold">Task is blocked</span>
											<span className="ml-2">This task cannot start until blocking dependencies are completed.</span>
										</div>
									</div>
								)}

								{/* Title input - standard Input styling */}
								<div className="space-y-2">
									<Label htmlFor="title" className="text-base font-medium">Title</Label>
									<Input
										id="title"
										value={formData.title}
										onChange={(e) => handleFieldChange('title', e.target.value)}
										placeholder="Enter task title"
										required
									/>
								</div>

								{/* Metadata Row - 4 evenly spaced fields (Assignee moved below) */}
								<div className="grid grid-cols-4 gap-3">
									<div className="space-y-2">
										<Label htmlFor="priority" className="text-base font-medium">Priority</Label>
										<Select
											value={formData.priority}
											onValueChange={(value) => handleFieldChange('priority', value as TaskPriority)}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="low"><div className="flex items-center gap-2"><IconArrowNarrowDown className="h-4 w-4 text-blue-500" /><span>Low</span></div></SelectItem>
												<SelectItem value="medium"><div className="flex items-center gap-2"><IconArrowsDiff className="h-4 w-4 text-gray-500" /><span>Medium</span></div></SelectItem>
												<SelectItem value="high"><div className="flex items-center gap-2"><IconArrowNarrowUp className="h-4 w-4 text-orange-500" /><span>High</span></div></SelectItem>
												<SelectItem value="urgent"><div className="flex items-center gap-2"><IconFlame className="h-4 w-4 text-red-600" /><span>Urgent</span></div></SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="status" className="text-base font-medium">Status</Label>
										<Select
											value={formData.status}
											onValueChange={(value) => handleFieldChange('status', value as TaskStatus)}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="todo">To Do</SelectItem>
												<SelectItem value="in_progress">In Progress</SelectItem>
												<SelectItem value="review">Review</SelectItem>
												<SelectItem value="done">Done</SelectItem>
												<SelectItem value="archived">Archived</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="dueDate" className="text-base font-medium">Due Date</Label>
										<Input
											id="dueDate"
											type="date"
											value={formData.dueDate}
											onChange={(e) => handleFieldChange('dueDate', e.target.value)}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="sizeHours" className="text-base font-medium">Size (hours)</Label>
										<Input
											id="sizeHours"
											type="number"
											min="1"
											step="1"
											placeholder="Enter hours (optional)"
											value={(formData as any).sizeHours ?? ''}
											onChange={(e) => handleFieldChange('sizeHours', e.target.value ? parseInt(e.target.value) : undefined)}
										/>
									</div>
								</div>

								{/* Assignee full-width row (hidden when opened from My Work) */}
								{!isFromMyWork ? (
									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-2">
											<Label htmlFor="assigneeId" className="text-base font-medium">Assignee</Label>
											<Select
												value={formData.assigneeId}
												onValueChange={(value) => handleFieldChange('assigneeId', value)}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Unassigned" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="unassigned">Unassigned</SelectItem>
													{filteredUsers?.map((user) => (
														<SelectItem key={(user._id as any) ?? `user-${user.email ?? 'unknown'}`} value={(user._id as any) ?? `user-${user.email ?? 'unknown'}`}>
															{user.name || user.email}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="blockedBy" className="text-base font-medium">Blocked By</Label>
											<div className="space-y-2">
												<TaskDependencySelector
													projectId={derivedProjectContext?.projectId as any}
													currentTaskId={task?._id as any}
													selectedDependencies={(blockedBy as any) ?? []}
													onDependenciesChange={(dependencies) => {
														setBlockedBy(dependencies as any);
													}}
												/>
												{/* Warning moved to below header title */}
											</div>
										</div>
									</div>
								) : (
									<div className="space-y-2">
										<Label htmlFor="blockedBy" className="text-base font-medium">Blocked By</Label>
										<div className="space-y-2">
											<TaskDependencySelector
												projectId={derivedProjectContext?.projectId as any}
												currentTaskId={task?._id as any}
												selectedDependencies={(blockedBy as any) ?? []}
												onDependenciesChange={(dependencies) => {
													setBlockedBy(dependencies as any);
												}}
											/>
											{/* Warning moved to below header title */}
										</div>
									</div>
								)}

								{/* Description */}
								<div className="space-y-2">
									<Label htmlFor="description" className="text-base font-medium">Description</Label>
									<div id="description">
										<RichTextEditor
											value={formData.description}
											onChange={(html) => handleFieldChange('description', html)}
										/>
									</div>
								</div>

								{/* Project Details when linked */}
								{derivedProjectContext && !showProjectSelectors && (
									<div className="space-y-2">
										<Label className="text-base font-medium">Project Details</Label>
										<div className="rounded-md border bg-muted/30 p-3">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="p-2 rounded-md bg-background border">
														<IconFileText className="h-5 w-5 text-muted-foreground" />
													</div>
													<div className="space-y-1">
														<div className="font-semibold text-base">{derivedProjectContext.projectTitle}</div>
														<div className="text-sm text-muted-foreground">
															{derivedProjectContext.clientName} / {derivedProjectContext.departmentName}
														</div>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<Button 
														type="button" 
														variant="ghost" 
														size="sm"
														className="text-red-600 hover:text-red-700 text-sm" 
														onClick={handleUnlinkProject}
													>
														Unlink
													</Button>
													<Button type="button" variant="outline" size="sm" onClick={handleOpenProjectBrief} className="gap-1.5">
														Project Brief
														<IconExternalLink className="h-3 w-3" />
													</Button>
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Conditional Context Fields */}
								{!hasContext && showProjectSelectors && (
									<div className="border-t border-border pt-4">
										<div className="grid grid-cols-3 gap-3">
											<div className="space-y-2">
												<Label htmlFor="clientId" className="text-base font-medium">Client *</Label>
												<Select
													value={formData.clientId}
													onValueChange={(value) => setFormData(prev => ({
														...prev,
														clientId: value,
														departmentId: '',
														projectId: '',
													}))}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select client" />
													</SelectTrigger>
													<SelectContent>
														{clients?.map((client) => (
															<SelectItem key={client._id} value={client._id}>
																{client.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="departmentId" className="text-base font-medium">Department *</Label>
												<Select
													value={formData.departmentId}
													onValueChange={(value) => setFormData(prev => ({
														...prev,
														departmentId: value,
														projectId: '',
													}))}
													disabled={!formData.clientId}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select department" />
													</SelectTrigger>
													<SelectContent>
														{filteredDepartments?.map((department) => (
															<SelectItem key={department._id} value={department._id}>
																{department.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="projectId" className="text-base font-medium">Project *</Label>
												<Select
													value={formData.projectId}
													onValueChange={(value) => handleFieldChange('projectId', value)}
													disabled={!formData.departmentId}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select project" />
													</SelectTrigger>
													<SelectContent>
														{projects?.map((project) => (
															<SelectItem key={project._id} value={project._id}>
																{project.title}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
									</div>
								)}

								{/* Attachments */}
								<div className="border-t border-border pt-4">
									<div className="space-y-3">
										<h3 className="font-medium">Attachments</h3>
										{task ? (
											<>
												<AttachmentUploader
													entityType="task"
													entityId={task._id}
													taskId={task._id}
													className="p-4"
													onUploadComplete={refetchAttachments}
												/>
												{attachments && attachments.length > 0 && (
													<div className="max-h-[160px] overflow-y-auto space-y-2 pr-2">
														<AttachmentList attachments={attachments} onDelete={handleDeleteAttachment} />
													</div>
												)}
											</>
										) : (
											<div className="text-sm text-muted-foreground text-center py-3 bg-muted/30 rounded-lg mt-3">
												Create the task to add attachments
											</div>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Bottom action bar - Fixed at bottom */}
						<div className="border-t px-6 py-3 bg-background">
							<div className="flex justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
									disabled={isLoading}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isLoading}>
									{isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
								</Button>
							</div>
						</div>
					</form>

					{/* Right Column - Comments */}
					<div className="w-96 border-l flex flex-col min-h-0">
						{task ? (
							<TaskComments taskId={task._id} />
						) : (
							<div className="h-full flex flex-col min-h-0">
								<div className="p-4 border-b">
									<h2 className="text-lg font-bold">Activity</h2>
								</div>
								<div className="flex-1 overflow-y-auto p-4 text-center text-sm text-muted-foreground">
									No activity yet
								</div>
								<div className="border-t p-4 bg-background">
									<p className="text-xs text-muted-foreground">Create the task to add comments</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
});