import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
  // Include required Convex Auth tables
  ...authTables,
  
  // Organization table for global settings and multi-tenant architecture
  organizations: defineTable({
    // Basic Information
    name: v.string(),
    slug: v.string(), // URL-friendly identifier
    logo: v.optional(v.id("_storage")),
    website: v.optional(v.string()),
    timezone: v.string(),
    
    // Default Settings (for sprints/capacity)
    defaultWorkstreamCapacity: v.number(), // Hours per workstream per sprint
    defaultSprintDuration: v.number(), // Sprint length in weeks
    
    // Email Configuration
    emailFromAddress: v.string(),
    emailFromName: v.string(),
    primaryColor: v.string(), // Hex color for email templates/branding
    
    // Feature Flags
    features: v.object({
      emailInvitations: v.boolean(),
      slackIntegration: v.boolean(),
      clientPortal: v.boolean(),
    }),
    
    // Audit Fields
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug']),
  
  // Password reset tokens for email-based authentication
  passwordResets: defineTable({
    userId: v.id('users'),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_user', ['userId']),
  
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
    
    // Organization relationship
    organizationId: v.optional(v.id('organizations')), // Optional during migration
    
    // Assignment fields
    clientId: v.optional(v.id('clients')),
    departmentIds: v.optional(v.array(v.id('departments'))),
    
    // User profile fields
    jobTitle: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),

    // Add to users table definition
    preferences: v.optional(v.object({
      theme: v.optional(v.union(
        v.literal('system'),
        v.literal('light'),
        v.literal('dark')
      )),
      emailNotifications: v.optional(v.boolean()),
      pushNotifications: v.optional(v.boolean()),
    })),
    
    // Invitation fields
    invitedBy: v.optional(v.id('users')),
    invitedAt: v.optional(v.number()),
    invitationToken: v.optional(v.string()),
    
    // Real-time presence fields
    lastActive: v.optional(v.number()),
    currentPage: v.optional(v.string()),
    presenceStatus: v.optional(v.union(
      v.literal('active'),
      v.literal('away'),
      v.literal('busy'),
      v.literal('offline')
    )),
    
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
    .index('by_role_status', ['role', 'status'])
    .index('by_presence', ['lastActive', 'presenceStatus'])
    .index('by_page', ['currentPage']),

  // Enhanced clients table for client organizations
  clients: defineTable({
    // Basic Information
    name: v.string(),
    logo: v.optional(v.id("_storage")), // Logo file reference
    
    // Contact & Metadata
    website: v.optional(v.string()),
    
    // Internal/External Classification
    isInternal: v.optional(v.boolean()), // true for internal organizations (R&D, tools, etc.)
    
    // Status Management
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('archived')
    ),
    
    // Audit Fields
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_name', ['name'])
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy']),

  // Simplified departments table for team organization and capacity planning
  departments: defineTable({
    // Basic Information
    name: v.string(),
    clientId: v.id('clients'),
    
    // Team Assignment
    primaryContactId: v.id('users'),     // Client user (main contact)
    leadId: v.id('users'),              // Internal user (admin/pm role)
    teamMemberIds: v.array(v.id('users')), // Additional client users
    
    // Capacity Planning
    workstreamCount: v.number(),         // For capacity calculation
    
    // Future Integration
    slackChannelId: v.optional(v.string()), // Future Slack integration
    
    // Audit Fields
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_client', ['clientId'])
    .index('by_name', ['name'])
    .index('by_primary_contact', ['primaryContactId'])
    .index('by_lead', ['leadId'])
    .index('by_created_by', ['createdBy']),

  // Projects table for project management (clean schema)
  projects: defineTable({
    title: v.string(),
    clientId: v.id('clients'),
    departmentId: v.id('departments'),
    status: v.union(
      v.literal('new'),
      v.literal('planning'),
      v.literal('ready_for_work'),
      v.literal('in_progress'),
      v.literal('client_review'),
      v.literal('client_approved'),
      v.literal('complete')
    ),
    
    // Project metadata
    description: v.optional(v.string()),
    targetDueDate: v.optional(v.number()),
    actualStartDate: v.optional(v.number()),
    actualCompletionDate: v.optional(v.number()),
    
    // Document relationship - every project has exactly one document
    documentId: v.id('documents'),
    
    // Project settings
    isTemplate: v.optional(v.boolean()),
    templateSource: v.optional(v.id('projects')),
    
    // Access control
    visibility: v.union(
      v.literal('private'),
      v.literal('department'),
      v.literal('client'),
      v.literal('organization')
    ),
    
    // Team assignment
    projectManagerId: v.id('users'),
    teamMemberIds: v.optional(v.array(v.id('users'))),
    
    // Audit fields
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_client', ['clientId'])
    .index('by_department', ['departmentId'])
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy'])
    .index('by_visibility', ['visibility'])
    .index('by_project_manager', ['projectManagerId']),

  // Documents table for project content management
  documents: defineTable({
    // Document identification
    projectId: v.optional(v.id('projects')), // Project ID (optional for general documents)
    templateId: v.optional(v.id('documentTemplates')), // Link to a template if created from one
    name: v.string(), // Name of the document, editable by the user
    type: v.union(
      v.literal('template'),
      v.literal('project'),
      v.literal('client')
    ),
    status: v.union(
      v.literal('draft'),
      v.literal('in_review'),
      v.literal('approved'),
      v.literal('archived')
    ),
    
    // Editor content (BlockNote JSON)
    content: v.optional(v.string()),
    sections: v.optional(v.array(v.id('documentSections'))),
    
    // Metadata
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_template', ['templateId'])
    .index('by_created_by', ['createdBy'])
    .index('by_status', ['status']),

  // Document sections table for modular content
  documentSections: defineTable({
    documentId: v.id('documents'),
    title: v.string(),
    type: v.union(
      v.literal('overview'),
      v.literal('team'),
      v.literal('tasks'),
      v.literal('updates'),
      v.literal('settings')
    ),
    content: v.optional(v.string()), // Stored as JSON string for simplicity
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_document', ['documentId'])
    .index('by_type', ['type'])
    .index('by_created_by', ['createdBy']),

  // Document templates table
  documentTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    sections: v.optional(v.array(v.id('documentSections'))),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_name', ['name'])
    .index('by_category', ['category'])
    .index('by_created_by', ['createdBy']),

  // Comments table for document discussions
  comments: defineTable({
    documentId: v.id('documents'),
    parentId: v.optional(v.id('comments')), // For threaded conversations
    content: v.string(),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_document', ['documentId'])
    .index('by_parent', ['parentId'])
    .index('by_created_by', ['createdBy']),

  // Sprints table for sprint planning and tracking
  sprints: defineTable({
    name: v.string(),
    departmentId: v.id('departments'),
    status: v.union(
      v.literal('planned'),
      v.literal('active'),
      v.literal('completed'),
      v.literal('archived')
    ),
    startDate: v.number(),
    endDate: v.number(),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_department', ['departmentId'])
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy']),

  // Tasks table for sprint work items
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('review'),
      v.literal('done')
    ),
    size: v.optional(v.union(
      v.literal('XS'),
      v.literal('S'),
      v.literal('M'),
      v.literal('L'),
      v.literal('XL')
    )),
    storyPoints: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    assigneeId: v.optional(v.id('users')),
    projectId: v.optional(v.id('projects')),
    sprintId: v.optional(v.id('sprints')),
    priority: v.optional(v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high')
    )),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
    dueDate: v.optional(v.number()),
  })
    .index('by_assignee', ['assigneeId'])
    .index('by_project', ['projectId'])
    .index('by_sprint', ['sprintId'])
    .index('by_status', ['status'])
    .index('by_priority', ['priority'])
    .index('by_created_by', ['createdBy'])
    .index('by_due_date', ['dueDate']),
}); 