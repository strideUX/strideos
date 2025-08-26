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
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import TaskDescriptionEditor from '@/components/tasks/task-description-editor';
import { TaskDependencySelector } from '@/components/tasks/task-dependency-selector';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { TaskComments } from '../tasks/task-comments';
import AttachmentUploader from '@/components/attachments/attachment-uploader';
import AttachmentList from '@/components/attachments/attachment-list';

// 3. Types (if not in separate file)
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
export function TaskFormDialog({ 
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
	const taskId = task?._id ? String(task._id) : null;
	const attachmentArgs = (taskId
		? { entityType: 'task' as const, entityId: taskId }
		: 'skip') as any;
	// @ts-ignore Deep generic instantiation from convex types; safe any-cast for UI
	const listAttachments = (useQuery as any)(api.attachments.listByEntity as any, attachmentArgs as any) as any[] | undefined;
	const deleteAttachmentMutation = useMutation(api.attachments.deleteAttachment);
	const attachments = useMemo(() => listAttachments ?? [], [listAttachments]);

	// Dependency status for warning banner
	const hasContext = Boolean(derivedProjectContext);

	// === 4. CALLBACKS (useCallback for all functions) ===
	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		// Implementation details...
	}, [/* dependencies */]);

	const handleFieldChange = useCallback((field: keyof typeof formData, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	}, []);

	const handleProjectSelectorToggle = useCallback(() => {
		setShowProjectSelectors(prev => !prev);
	}, []);

	// === 5. EFFECTS (useEffect for side effects) ===
	useEffect(() => {
		// Initialize form data when editing
		if (task) {
			setFormData({
				title: task.title || '',
				description: task.description || '',
				status: task.status || 'todo',
				priority: task.priority || 'medium',
				size: task.size || '',
				sizeHours: task.sizeHours,
				assigneeId: task.assigneeId || 'unassigned',
				dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
				clientId: task.clientId || '',
				departmentId: task.departmentId || '',
				projectId: task.projectId || '',
			});
		} else {
			// Reset form for new task
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
		}
	}, [task]);

	// === 6. EARLY RETURNS (loading, error states) ===
	// (No early returns needed)

	// === 7. RENDER (JSX) ===
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="xl" showCloseButton={false} className="max-h-[90vh] h-full flex flex-col p-0 max-w-6xl">
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
					<div className="flex-1 p-6 overflow-y-auto">
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Basic Information */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Basic Information</h3>
								
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="title">Task Title *</Label>
										<Input
											id="title"
											value={formData.title}
											onChange={(e) => handleFieldChange('title', e.target.value)}
											placeholder="e.g., Implement user authentication"
											required
										/>
									</div>
									
									<div className="space-y-2">
										<Label htmlFor="status">Status</Label>
										<Select value={formData.status} onValueChange={(value) => handleFieldChange('status', value)}>
											<SelectTrigger>
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
								</div>

								<div className="grid grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label htmlFor="priority">Priority</Label>
										<Select value={formData.priority} onValueChange={(value) => handleFieldChange('priority', value)}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="low">Low</SelectItem>
												<SelectItem value="medium">Medium</SelectItem>
												<SelectItem value="high">High</SelectItem>
												<SelectItem value="urgent">Urgent</SelectItem>
											</SelectContent>
										</Select>
									</div>
									
									<div className="space-y-2">
										<Label htmlFor="size">Size</Label>
										<Select value={formData.size} onValueChange={(value) => handleFieldChange('size', value)}>
											<SelectTrigger>
												<SelectValue placeholder="Select size" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="XS">XS</SelectItem>
												<SelectItem value="S">S</SelectItem>
												<SelectItem value="M">M</SelectItem>
												<SelectItem value="L">L</SelectItem>
												<SelectItem value="XL">XL</SelectItem>
											</SelectContent>
										</Select>
									</div>
									
									<div className="space-y-2">
										<Label htmlFor="sizeHours">Size (hours)</Label>
										<Input
											id="sizeHours"
											type="number"
											value={formData.sizeHours || ''}
											onChange={(e) => handleFieldChange('sizeHours', e.target.value ? parseInt(e.target.value) : undefined)}
											placeholder="e.g., 8"
											min="0"
										/>
									</div>
								</div>

								{!isFromMyWork && (
									<div className="space-y-2">
										<Label htmlFor="assignee">Assignee</Label>
										<Select value={formData.assigneeId} onValueChange={(value) => handleFieldChange('assigneeId', value)}>
											<SelectTrigger>
												<SelectValue placeholder="Select assignee" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="unassigned">Unassigned</SelectItem>
												{/* Add assignee options here */}
											</SelectContent>
										</Select>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="dueDate">Due Date</Label>
									<Input
										id="dueDate"
										type="date"
										value={formData.dueDate}
										onChange={(e) => handleFieldChange('dueDate', e.target.value)}
									/>
								</div>
							</div>

							{/* Description */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Description</h3>
								<TaskDescriptionEditor
									value={formData.description}
									onChange={(value) => handleFieldChange('description', value)}
								/>
							</div>

							{/* Dependencies */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Dependencies</h3>
								<TaskDependencySelector
									projectId={formData.projectId}
									currentTaskId={task?._id}
									selectedDependencies={blockedBy}
									onDependenciesChange={setBlockedBy}
								/>
							</div>

							{/* Attachments */}
							{taskId && (
								<div className="space-y-4">
									<h3 className="text-lg font-medium">Attachments</h3>
									<AttachmentUploader
										entityType="task"
										entityId={taskId}
										onUploadComplete={() => {
											// Refresh attachments
										}}
									/>
									<AttachmentList
										attachments={attachments}
										onDelete={(attachmentId) => {
											deleteAttachmentMutation({ attachmentId });
										}}
									/>
								</div>
							)}

							{/* Submit Button */}
							<div className="flex justify-end space-x-2 pt-4 border-t">
								<Button variant="outline" onClick={() => onOpenChange(false)}>
									Cancel
								</Button>
								<Button type="submit" disabled={isLoading}>
									{isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
								</Button>
							</div>
						</form>
					</div>

					{/* Right Column - Comments */}
					{taskId && (
						<div className="w-80 border-l bg-muted/20">
							<TaskComments taskId={taskId} />
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}