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

  // Projects table for document-based project management
  projects: defineTable({
    title: v.string(),
    clientId: v.id('clients'),
    departmentId: v.id('departments'),
    status: v.union(
      v.literal('draft'),
      v.literal('active'),
      v.literal('review'),
      v.literal('complete'),
      v.literal('archived')
    ),
    
    // Project metadata
    description: v.optional(v.string()),
    targetDueDate: v.optional(v.number()),
    actualStartDate: v.optional(v.number()),
    actualCompletionDate: v.optional(v.number()),
    
    // Document content - projects ARE documents
    documentContent: v.optional(v.any()), // Novel/Tiptap JSONContent
    template: v.union(
      v.literal('project_brief'),
      v.literal('technical_spec'),
      v.literal('marketing_campaign'),
      v.literal('client_onboarding'),
      v.literal('retrospective'),
      v.literal('custom')
    ),
    
    // Document navigation and structure
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      anchor: v.string(),
      level: v.number(), // 1, 2, 3 for h1, h2, h3
      order: v.number()
    }))),
    
    // Project settings
    isTemplate: v.optional(v.boolean()),
    templateSource: v.optional(v.id('projects')), // If created from template
    
    // Access control
    visibility: v.union(
      v.literal('private'),      // Only assigned team
      v.literal('department'),   // Department members
      v.literal('client'),       // Client can view
      v.literal('organization')  // All org members
    ),
    
    // Team assignment
    projectManagerId: v.id('users'),
    teamMemberIds: v.optional(v.array(v.id('users'))),
    
    // Audit fields
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
    version: v.optional(v.number()), // For document versioning
  })
    .index('by_client', ['clientId'])
    .index('by_department', ['departmentId'])
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy'])
    .index('by_project_manager', ['projectManagerId'])
    .index('by_template', ['isTemplate'])
    .index('by_visibility', ['visibility']),

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

  // Documents table for section-based document storage
  documents: defineTable({
    title: v.string(),
    projectId: v.optional(v.id("projects")), // Optional link to project
    clientId: v.id("clients"),
    departmentId: v.id("departments"),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("review"), v.literal("complete")),
    documentType: v.union(
      v.literal("project_brief"), 
      v.literal("meeting_notes"), 
      v.literal("wiki_article"), 
      v.literal("resource_doc"), 
      v.literal("retrospective")
    ),
    // Template information for document creation
    templateId: v.optional(v.id("documentTemplates")),
    

    
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
    lastModified: v.number(),
    version: v.number(), // For version tracking
    
    // Permissions for document access
    permissions: v.object({
      canView: v.array(v.string()), // User roles
      canEdit: v.array(v.string()), // User roles  
      clientVisible: v.boolean()
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_department", ["departmentId"])
    .index("by_project", ["projectId"])
    .index("by_created_by", ["createdBy"])
    .index("by_document_type", ["documentType"])
    .index("by_template", ["templateId"])
    .index("by_status", ["status"]),

  // Sections table for section-based document architecture
  sections: defineTable({
    documentId: v.id("documents"),
    type: v.union(
      v.literal("overview"),
      v.literal("deliverables"), 
      v.literal("timeline"),
      v.literal("feedback"),
      v.literal("getting_started"),
      v.literal("final_delivery"),
      v.literal("weekly_status"),
      v.literal("original_request"),
      v.literal("team"),
      v.literal("custom")
    ),
    title: v.string(),
    icon: v.string(), // Lucide icon name
    order: v.number(),
    required: v.boolean(), // Cannot be deleted if last section
    
    // BlockNote content for this section
    content: v.any(), // BlockNote JSONContent
    
    // Section-specific permissions
    permissions: v.object({
      canView: v.array(v.string()), // User roles that can view
      canEdit: v.array(v.string()), // User roles that can edit content
      canInteract: v.array(v.string()), // Can use interactive UI components
      canReorder: v.array(v.string()), // Can change section order
      canDelete: v.array(v.string()), // Can delete section
      clientVisible: v.boolean(), // Whether clients can see this section
      fieldPermissions: v.optional(v.object({
        // Field-level permissions for interactive components
        // Example: taskStatus: { canEdit: ['admin', 'pm', 'assignee'], canView: ['all'] }
      }))
    }),
    
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_document_order", ["documentId", "order"])
    .index("by_type", ["type"])
    .index("by_created_by", ["createdBy"]),

  // Document templates for section-based document creation
  documentTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    documentType: v.union(
      v.literal("project_brief"),
      v.literal("meeting_notes"), 
      v.literal("wiki_article"),
      v.literal("resource_doc"),
      v.literal("retrospective")
    ),
    
    // Default sections for this template
    defaultSections: v.array(v.object({
      type: v.union(
        v.literal("overview"),
        v.literal("deliverables"),
        v.literal("timeline"), 
        v.literal("feedback"),
        v.literal("getting_started"),
        v.literal("final_delivery"),
        v.literal("weekly_status"),
        v.literal("original_request"),
        v.literal("team"),
        v.literal("custom")
      ),
      title: v.string(),
      icon: v.string(),
      order: v.number(),
      required: v.boolean(),
      defaultContent: v.optional(v.any()), // Default BlockNote content
      permissions: v.object({
        canView: v.array(v.string()),
        canEdit: v.array(v.string()),
        canInteract: v.array(v.string()),
        canReorder: v.array(v.string()),
        canDelete: v.array(v.string()),
        clientVisible: v.boolean(),
        fieldPermissions: v.optional(v.object({}))
      })
    })),
    
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_document_type", ["documentType"])
    .index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"]),
}); 