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
    role: v.union(
      v.literal('admin'),
      v.literal('pm'),
      v.literal('task_owner'),
      v.literal('client')
    ),
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('invited')
    ),
    
    // Assignment fields
    clientId: v.optional(v.id('clients')),
    departmentIds: v.optional(v.array(v.id('departments'))),
    
    // User profile fields
    jobTitle: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    
    // Invitation fields
    invitedBy: v.optional(v.id('users')),
    invitedAt: v.optional(v.number()),
    invitationToken: v.optional(v.string()),
    
    // Audit fields
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('email', ['email'])
    .index('by_role', ['role'])
    .index('by_status', ['status'])
    .index('by_client', ['clientId'])
    .index('by_invited_by', ['invitedBy'])
    .index('by_role_status', ['role', 'status']),

  // Enhanced clients table for client organizations
  clients: defineTable({
    // Basic Information
    name: v.string(),
    description: v.optional(v.string()),
    
    // Contact & Metadata
    industry: v.optional(v.string()),
    size: v.optional(v.union(
      v.literal('startup'),
      v.literal('small'),
      v.literal('medium'),
      v.literal('large'),
      v.literal('enterprise')
    )),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    
    // Address Information
    address: v.optional(v.object({
      street: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
      country: v.optional(v.string()),
    })),
    
    // Status Management
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('archived')
    ),
    
    // Business Settings
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
    
    // Audit Fields
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_name', ['name'])
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy'])
    .index('by_industry', ['industry']),

  // Enhanced departments table for organizational structure
  departments: defineTable({
    // Basic Information
    name: v.string(),
    clientId: v.id('clients'),
    description: v.optional(v.string()),
    
    // Workstream Configuration
    workstreamCount: v.number(), // Number of parallel workstreams
    workstreamCapacity: v.number(), // Story points per workstream per sprint
    sprintDuration: v.number(), // Sprint duration in weeks (1-4)
    
    // Custom Workstream Labels (optional)
    workstreamLabels: v.optional(v.array(v.string())), // e.g., ["Frontend", "Backend", "Design"]
    
    // Department Settings
    timezone: v.optional(v.string()),
    workingHours: v.optional(v.object({
      start: v.string(), // "09:00"
      end: v.string(),   // "17:00"
      daysOfWeek: v.array(v.number()), // [1,2,3,4,5] for Mon-Fri
    })),
    
    // Capacity Planning
    velocityHistory: v.optional(v.array(v.object({
      sprintId: v.optional(v.string()),
      sprintEndDate: v.number(),
      completedPoints: v.number(),
      plannedPoints: v.number(),
    }))),
    
    // Status Management
    status: v.union(
      v.literal('active'),
      v.literal('inactive')
    ),
    
    // Audit Fields
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_client', ['clientId'])
    .index('by_name', ['name'])
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy'])
    .index('by_client_status', ['clientId', 'status']),

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