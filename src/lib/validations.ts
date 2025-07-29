import { z } from 'zod';

/**
 * User authentication schemas
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * User profile schemas
 */
export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'pm', 'task_owner', 'client']),
});

/**
 * Project schemas
 */
export const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).default('draft'),
  clientId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

/**
 * Task schemas
 */
export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeId: z.string().optional(),
  projectId: z.string(),
  dueDate: z.date().optional(),
});

/**
 * Document schemas
 */
export const documentSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  content: z.string().optional(),
  type: z.enum(['project_brief', 'requirements', 'design', 'deliverable', 'other']),
  projectId: z.string(),
  status: z.enum(['draft', 'review', 'approved', 'archived']).default('draft'),
});

/**
 * Comment schemas
 */
export const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  documentId: z.string().optional(),
  taskId: z.string().optional(),
  parentCommentId: z.string().optional(), // For nested comments
});

/**
 * Type exports for use in components
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type TaskData = z.infer<typeof taskSchema>;
export type DocumentData = z.infer<typeof documentSchema>;
export type CommentData = z.infer<typeof commentSchema>; 