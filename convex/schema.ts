import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
  // Include required Convex Auth tables
  ...authTables,
  
  // Custom users table that extends Convex Auth's base users table
  users: defineTable({
    // Convex Auth base fields (optional)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    
    // Custom application fields
    role: v.optional(v.union(
      v.literal('admin'),
      v.literal('pm'),
      v.literal('task_owner'),
      v.literal('client')
    )),
    clientId: v.optional(v.id('clients')),
    departmentIds: v.optional(v.array(v.id('departments'))),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index('email', ['email'])
    .index('by_role', ['role'])
    .index('by_client', ['clientId']),

  // Clients table for client organizations
  clients: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_name', ['name']),

  // Departments table for organizational structure
  departments: defineTable({
    name: v.string(),
    clientId: v.id('clients'),
    workstreamCount: v.number(),
    workstreamCapacity: v.number(),
    sprintDuration: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_client', ['clientId'])
    .index('by_name', ['name']),

  // Projects table for project documents
  projects: defineTable({
    title: v.string(),
    clientId: v.id('clients'),
    departmentId: v.id('departments'),
    status: v.union(
      v.literal('draft'),
      v.literal('active'),
      v.literal('review'),
      v.literal('complete')
    ),
    targetDueDate: v.optional(v.number()),
    documentType: v.union(
      v.literal('project_brief'),
      v.literal('meeting_notes'),
      v.literal('wiki_article'),
      v.literal('resource_doc'),
      v.literal('retrospective')
    ),
    documentContent: v.optional(v.any()), // Novel/Tiptap JSONContent
    sections: v.optional(v.array(v.any())),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_client', ['clientId'])
    .index('by_department', ['departmentId'])
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy']),

  // Tasks table for task management
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    projectId: v.id('projects'),
    blockId: v.string(), // Reference to document block
    status: v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('review'),
      v.literal('completed')
    ),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
    assigneeId: v.optional(v.id('users')),
    dueDate: v.optional(v.number()),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_assignee', ['assigneeId'])
    .index('by_status', ['status'])
    .index('by_priority', ['priority']),

  // Comments table for document and task comments
  comments: defineTable({
    content: v.string(),
    documentId: v.optional(v.id('projects')),
    taskId: v.optional(v.id('tasks')),
    parentCommentId: v.optional(v.id('comments')), // For nested comments
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_document', ['documentId'])
    .index('by_task', ['taskId'])
    .index('by_parent', ['parentCommentId'])
    .index('by_created_by', ['createdBy']),

  // Simple counter table for testing real-time functionality
  counters: defineTable({
    name: v.string(),
    count: v.number(),
  })
    .index('by_name', ['name']),
}); 