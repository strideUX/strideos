'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { TaskComments } from '../tasks/TaskComments';

// Types
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
	open: boolean;
	onOpenChange: (open: boolean) => void;
	task?: Task;
	projectContext?: ProjectContext;
	onSuccess: () => void;
}

export function TaskFormDialog({ open, onOpenChange, task, projectContext, onSuccess }: TaskFormDialogProps) {
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		status: 'todo' as TaskStatus,
		priority: 'medium' as TaskPriority,
		size: '' as TaskSize | '',
		assigneeId: 'unassigned',
		dueDate: '',
		// Context fields when not provided by projectContext
		clientId: '',
		departmentId: '',
		projectId: '',
	});

	const [isLoading, setIsLoading] = useState(false);

	// Queries - only fetch if no project context
	const clients = useQuery(api.clients.listClients, projectContext ? 'skip' : {});
	const departments = useQuery(
		api.departments.listDepartmentsByClient,
		(!projectContext && formData.clientId) ? { clientId: formData.clientId as Id<'clients'> } : 'skip'
	);
	const projects = useQuery(
		api.projects.listProjects,
		(!projectContext && formData.departmentId) ? { departmentId: formData.departmentId as Id<'departments'> } : 'skip'
	);
	const users = useQuery(api.users.listUsers, {});

	// Mutations
	const createTask = useMutation(api.tasks.createTask);
	const updateTask = useMutation(api.tasks.updateTask);

	useEffect(() => {
		if (!open) return;
		if (task) {
			setFormData({
				title: task.title,
				description: task.description || '',
				status: task.status,
				priority: task.priority,
				size: task.size || '',
				assigneeId: task.assigneeId || 'unassigned',
				dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
				clientId: task.clientId as any,
				departmentId: task.departmentId as any,
				projectId: task.projectId || '',
			});
		} else {
			setFormData({
				title: '',
				description: '',
				status: 'todo',
				priority: 'medium',
				size: '',
				assigneeId: 'unassigned',
				dueDate: '',
				clientId: '',
				departmentId: '',
				projectId: '',
			});
		}
	}, [open, task]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			if (!formData.title.trim()) {
				toast.error('Task title is required');
				return;
			}

			const clientId = projectContext?.clientId || (formData.clientId as Id<'clients'>);
			const departmentId = projectContext?.departmentId || (formData.departmentId as Id<'departments'>);
			const projectId = projectContext?.projectId || (formData.projectId as Id<'projects'>);

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
				assigneeId: (!formData.assigneeId || formData.assigneeId === 'unassigned') ? undefined : (formData.assigneeId as Id<'users'>),
				dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
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
					assigneeId: payload.assigneeId,
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
					assigneeId: payload.assigneeId,
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
	};

	const filteredDepartments = departments || [];
	const filteredUsers = (users ?? []).filter((user: any) => {
		// Always include internal users (non-client roles)
		if (user.role !== 'client') return true;
		// For client-role users, include them conditionally
		if (projectContext) {
			// include client users for the project client or department
			if (user.clientId === projectContext.clientId) return true;
			if (user.departmentIds?.includes(projectContext.departmentId)) return true;
			return false;
		}
		// If a client is selected, include that client's users regardless of department
		if (formData.clientId && user.clientId === (formData.clientId as any)) return true;
		// If a department is chosen (without client), include users in that department
		if (formData.departmentId && user.departmentIds?.includes(formData.departmentId as Id<'departments'>)) return true;
		// No context selected: exclude client-role users by default
		return false;
	});

	const hasContext = Boolean(projectContext);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="xl" className="max-w-6xl h-[85vh] p-0">
				{/* Accessible dialog title for screen readers */}
				<DialogHeader className="sr-only">
					<DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
				</DialogHeader>
				<div className="flex h-full">
					{/* Left Column */}
					<form onSubmit={handleSubmit} className="flex-1 flex flex-col">
						{/* Scrollable content */}
						<div className="p-6 flex-1 overflow-y-auto">
							<div className="space-y-4">
								{/* Breadcrumb when context exists */}
								{projectContext ? (
									<div className="text-sm text-muted-foreground">{projectContext.clientName} &gt; {projectContext.departmentName} &gt; {projectContext.projectTitle}</div>
								) : null}
								{/* Header title (no subtitle) */}
								<h2 className="text-lg font-semibold">{task ? 'Edit Task' : 'Create New Task'}</h2>

								{/* Title input - standard Input styling */}
								<div className="space-y-2">
									<Label htmlFor="title" className="text-base font-medium">Title</Label>
									<Input
										id="title"
										value={formData.title}
										onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
											onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskPriority }))}
										>
											<SelectTrigger className="w-full">
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
										<Label htmlFor="status" className="text-base font-medium">Status</Label>
										<Select
											value={formData.status}
											onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TaskStatus }))}
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
											onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="size" className="text-base font-medium">Size</Label>
										<Select
											value={formData.size}
											onValueChange={(value) => setFormData(prev => ({ ...prev, size: value as TaskSize }))}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select size" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="XS">Extra Small (0.5d)</SelectItem>
												<SelectItem value="S">Small (2d)</SelectItem>
												<SelectItem value="M">Medium (4d)</SelectItem>
												<SelectItem value="L">Large (6d)</SelectItem>
												<SelectItem value="XL">Extra Large (8d)</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								{/* Assignee full-width row */}
								<div className="space-y-2">
									<Label htmlFor="assigneeId" className="text-base font-medium">Assignee</Label>
									<Select
										value={formData.assigneeId}
										onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
										// Always interactive; list is filtered when context/department is known
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

								{/* Description */}
								<div className="space-y-2">
									<Label htmlFor="description" className="text-base font-medium">Description</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
										placeholder="Describe the task in detail..."
										className="min-h-[120px]"
									/>
								</div>

								{/* Conditional Context Fields */}
								{!hasContext && (
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
														// keep current assignee selection
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
														// keep current assignee selection
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
													onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
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
									<div className="flex items-center justify-between">
										<Label className="text-base font-medium">Attachments</Label>
										<Button type="button" variant="outline" size="sm" disabled>
											Add
										</Button>
									</div>
									<div className="text-sm text-muted-foreground text-center py-3 bg-muted/30 rounded-lg mt-3">
										No attachments yet
									</div>
								</div>
							</div>
						</div>

						{/* Fixed Bottom Bar */}
						<div className="border-t bg-background px-6 py-4 h-16 flex justify-end gap-2">
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
					</form>

					{/* Right Column - Comments */}
					<div className="w-80 border-l">
						{task ? (
							<TaskComments taskId={task._id} />
						) : (
							<div className="h-full flex flex-col p-6">
								<div className="border-b pb-4 mb-4">
									<h3 className="text-lg font-semibold">Comments and activity</h3>
								</div>
								<div className="text-center py-8 text-muted-foreground">
									<p>Comments will appear here</p>
									<p className="text-sm">Create the task first to add comments</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}