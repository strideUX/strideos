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
    themePreference: v.optional(v.union(
      v.literal('system'),
      v.literal('light'),
      v.literal('dark')
    )),
    
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
    
    // Project Key for slug generation (e.g., "SQRL", "RESP", "TASK")
    projectKey: v.optional(v.string()), // Will be required going forward, optional for migration
    
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
    .index('by_created_by', ['createdBy'])
    .index('by_project_key', ['projectKey']),

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

  // Project keys table for slug generation and scoping
  projectKeys: defineTable({
    // Key Information
    key: v.string(), // e.g., "STRIDE", "ACME", "INT"
    description: v.optional(v.string()), // "Stride UX Projects"

    // Context (for scoping and generation)
    clientId: v.id('clients'),
    departmentId: v.optional(v.id('departments')), // Optional for client-wide keys
    projectId: v.optional(v.id('projects')), // Optional for project-specific sequences

    // Counter Management
    lastTaskNumber: v.number(), // Last used task number for this key
    lastSprintNumber: v.number(), // Last used sprint number for this key
    lastProjectNumber: v.number(), // Last used project number for this key

    // Configuration
    isDefault: v.boolean(), // Is this the default key for the client/dept?
    isActive: v.boolean(), // Can new items use this key?

    // Audit
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_client', ['clientId'])
    .index('by_department', ['departmentId'])
    .index('by_project', ['projectId'])
    .index('by_default', ['clientId', 'departmentId', 'isDefault']),

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

    // Slug & Key
    slug: v.optional(v.string()), // e.g., "STRIDE-P-2024-Q1"
    projectKey: v.optional(v.string()), // e.g., "STRIDE"
    
    // Audit fields
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_client', ['clientId'])
    .index('by_department', ['departmentId'])
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy'])
    .index('by_project_manager', ['projectManagerId'])
    .index('by_template', ['isTemplate'])
    .index('by_visibility', ['visibility'])
    .index('by_slug', ['slug'])
    .index('by_project_key', ['projectKey']),

  // Enhanced Tasks table for comprehensive task management
  tasks: defineTable({
    // Basic Information
    title: v.string(),
    description: v.optional(v.string()),
    
    // Project Context
    projectId: v.optional(v.id('projects')), // Optional - tasks can exist without projects (will be required in future)
    clientId: v.id('clients'),
    departmentId: v.id('departments'),
    
    // Document integration (page-based)
    docId: v.optional(v.string()), // ProseMirror document ID for page-based editor
    blockId: v.optional(v.string()), // Reference to document block (for future BlockNote integration)
    
    // Task Status & Workflow
    status: v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('review'),
      v.literal('done'),
      v.literal('archived')
    ),
    
    // Priority & Sizing
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
    // New hours-based sizing (temporary alongside legacy size for migration)
    // Keep legacy string-based size for back-compat while code references are migrated
    size: v.optional(v.union(
      v.literal('XS'),
      v.literal('S'),
      v.literal('M'),
      v.literal('L'),
      v.literal('XL')
    )),
    sizeHours: v.optional(v.number()),
    storyPoints: v.optional(v.number()), // Calculated from size or custom
    
    // Task Type & Personal Organization
    taskType: v.optional(v.union(
      v.literal('deliverable'),     // Project deliverable
      v.literal('bug'),            // Bug fix
      v.literal('feedback'),       // Client feedback item
      v.literal('personal')        // Personal todo
    )),
    skillCategory: v.optional(v.union(
      v.literal('design'),
      v.literal('engineering'),
      v.literal('pm'),
      v.literal('stakeholder')
    )),
    personalOrderIndex: v.optional(v.number()), // Users personal task ordering

    // Enhanced ordering contexts
    projectOrder: v.optional(v.number()),

    // Parent-child relationships for subtasks
    parentTaskId: v.optional(v.id('tasks')),
    childTaskIds: v.optional(v.array(v.id('tasks'))), // Denormalized for performance
    taskLevel: v.optional(v.number()),            // 0=parent, 1=child, 2=grandchild, etc.

    // Swimlane support for sprint organization
    sprintSwimLane: v.optional(v.string()),       // "Frontend", "Backend", "Design", "Review"
    swimLaneOrder: v.optional(v.number()),        // Order within the swimlane

    // Enhanced task categorization (future capacity planning)
    workCategory: v.optional(v.union(
      v.literal('design'),
      v.literal('frontend'),
      v.literal('backend'),
      v.literal('qa'),
      v.literal('pm'),
      v.literal('stakeholder'),
      v.literal('research'),
      v.literal('documentation')
    )),
    complexityLevel: v.optional(v.union(
      v.literal('routine'),    // Known patterns
      v.literal('standard'),   // Some complexity
      v.literal('complex'),    // Significant unknowns
      v.literal('research')    // High uncertainty
    )),
    
    // Assignment & Team
    assigneeId: v.optional(v.id('users')),
    reporterId: v.id('users'), // Who created the task
    reviewerId: v.optional(v.id('users')), // Who reviews when status is 'review'
    
    // Sprint Planning
    sprintId: v.optional(v.id('sprints')),
    backlogOrder: v.optional(v.number()), // Order in backlog when not assigned to sprint
    sprintOrder: v.optional(v.number()), // Order within sprint
    
    // Dates & Timing
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    completedDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    
    // Labels & Categories
    labels: v.optional(v.array(v.string())), // e.g., ["bug", "feature", "urgent"]
    category: v.optional(v.union(
      v.literal('feature'),
      v.literal('bug'),
      v.literal('improvement'),
      v.literal('research'),
      v.literal('documentation'),
      v.literal('maintenance')
    )),
    
    // Dependencies
    blockedBy: v.optional(v.array(v.id('tasks'))), // Tasks that block this one
    blocks: v.optional(v.array(v.id('tasks'))), // Tasks this one blocks
    
    // Permissions & Visibility
    visibility: v.union(
      v.literal('private'),      // Only assignee and PM
      v.literal('team'),         // Team members
      v.literal('department'),   // Department members
      v.literal('client')        // Client can view
    ),

    // Slug & Key
    slug: v.optional(v.string()), // e.g., "STRIDE-42"
    slugKey: v.optional(v.string()), // e.g., "STRIDE"
    slugNumber: v.optional(v.number()), // e.g., 42
    
    // Audit Fields
    createdBy: v.id('users'),
    updatedBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
    version: v.optional(v.number()), // For optimistic updates
  })
    .index('by_project', ['projectId'])
    .index('by_client', ['clientId'])
    .index('by_department', ['departmentId'])
    .index('by_assignee', ['assigneeId'])
    .index('by_reporter', ['reporterId'])
    .index('by_status', ['status'])
    .index('by_priority', ['priority'])
    .index('by_sprint', ['sprintId'])
    .index('by_doc', ['docId'])
    .index('by_created_by', ['createdBy'])
    .index('by_due_date', ['dueDate'])
    .index('by_status_assignee', ['status', 'assigneeId'])
    .index('by_task_type', ['taskType'])
    .index('by_personal_order', ['assigneeId', 'personalOrderIndex'])
    .index('by_assignee_status', ['assigneeId', 'status'])
    .index('by_department_status', ['departmentId', 'status'])
    .index('by_sprint_order', ['sprintId', 'sprintOrder'])
    .index('by_backlog_order', ['departmentId', 'backlogOrder'])
    .index('by_slug', ['slug'])
    .index('by_slug_key', ['slugKey', 'slugNumber'])
    .index('by_parent_task', ['parentTaskId'])
    .index('by_project_order', ['projectId', 'projectOrder'])
    .index('by_swimlane', ['sprintId', 'sprintSwimLane', 'swimLaneOrder'])
    .index('by_work_category', ['workCategory']),

  // Sprints table for sprint planning and capacity management
  sprints: defineTable({
    // Basic Information
    name: v.string(),
    description: v.optional(v.string()),
    
    // Sprint Context
    departmentId: v.id('departments'),
    clientId: v.id('clients'), // Derived from department for easier queries
    
    // Sprint Timeline
    startDate: v.number(),
    endDate: v.number(),
    duration: v.number(), // Duration in weeks (typically 1-4)
    
    // Sprint Status
    status: v.union(
      v.literal('planning'),    // Sprint is being planned
      v.literal('active'),      // Sprint is in progress
      v.literal('review'),      // Sprint is in review/retrospective
      v.literal('complete'),    // Sprint is completed
      v.literal('cancelled')    // Sprint was cancelled
    ),
    
    // Capacity Planning
    totalCapacity: v.number(), // Total story points capacity for this sprint
    committedPoints: v.number(), // Story points committed (sum of assigned tasks)
    completedPoints: v.number(), // Story points completed
    
    // Sprint Goals & Objectives
    goals: v.optional(v.array(v.string())), // Sprint goals/objectives
    
    // Sprint Metrics
    velocityTarget: v.optional(v.number()), // Target velocity for this sprint
    actualVelocity: v.optional(v.number()), // Actual velocity achieved
    
    // Sprint Team
    sprintMasterId: v.optional(v.id('users')), // Sprint master/lead
    teamMemberIds: v.optional(v.array(v.id('users'))), // Team members in this sprint
    
    // Sprint Events
    sprintReviewDate: v.optional(v.number()),
    sprintRetrospectiveDate: v.optional(v.number()),

    // Slug & Key
    slug: v.optional(v.string()), // e.g., "STRIDE-S-15"
    slugKey: v.optional(v.string()), // e.g., "STRIDE"
    slugNumber: v.optional(v.number()), // e.g., 15
    
    // Audit Fields
    createdBy: v.id('users'),
    updatedBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_department', ['departmentId'])
    .index('by_client', ['clientId'])
    .index('by_status', ['status'])
    .index('by_start_date', ['startDate'])
    .index('by_end_date', ['endDate'])
    .index('by_sprint_master', ['sprintMasterId'])
    .index('by_created_by', ['createdBy'])
    .index('by_department_status', ['departmentId', 'status'])
    .index('by_department_dates', ['departmentId', 'startDate', 'endDate'])
    .index('by_slug', ['slug'])
    .index('by_slug_key', ['slugKey', 'slugNumber']),

  // Notifications table for user notifications
  notifications: defineTable({
    // Notification type
    type: v.union(
      v.literal('comment_created'),
      v.literal('task_assigned'),
      v.literal('task_status_changed'),
      v.literal('document_updated'),
      v.literal('sprint_started'),
      v.literal('sprint_completed'),
      v.literal('mention'),
      v.literal('general'),
      // New task-specific types
      v.literal('task_comment_mention'),
      v.literal('task_comment_activity'),
      // New project type
      v.literal('project_created')
    ),
    title: v.string(),
    message: v.string(),
    userId: v.id('users'), // The user who should receive the notification
    isRead: v.boolean(),
    
    // Related content references (existing)
    relatedDocumentId: v.optional(v.id('documents')),
    relatedTaskId: v.optional(v.id('tasks')),
    relatedCommentId: v.optional(v.id('comments')),
    relatedSprintId: v.optional(v.id('sprints')),
    
    // Compatibility fields for requirements (optional taskId/entity fields)
    taskId: v.optional(v.id('tasks')),
    entityId: v.optional(v.string()),
    entityType: v.optional(v.union(
      v.literal('task'),
      v.literal('comment'),
      v.literal('project'),
      v.literal('document'),
      v.literal('sprint')
    )),
    
    // Notification metadata
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
    
    // Action data for deep linking
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
    
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_unread', ['userId', 'isRead'])
    .index('by_type', ['type'])
    .index('by_created_at', ['createdAt'])
    .index('by_related_document', ['relatedDocumentId'])
    .index('by_related_task', ['relatedTaskId'])
    .index('by_task', ['taskId']),


  // DOCUMENTS (ensure fields + indexes)
	documents: defineTable({
		title: v.string(),
		createdAt: v.number(),
		ownerId: v.optional(v.string()),
		archivedAt: v.optional(v.number()),
		shareId: v.optional(v.string()),
		publishedAt: v.optional(v.number()),
		// Legacy template references for back-compat during migration
		templateId: v.optional(v.id("documentTemplates")),
		templateKey: v.optional(v.string()),
		projectId: v.optional(v.id("projects")),
		clientId: v.optional(v.id("clients")),
		departmentId: v.optional(v.id("departments")),
		documentType: v.optional(v.union(
			v.literal("project_brief"),
			v.literal("meeting_notes"),
			v.literal("wiki_article"),
			v.literal("resource_doc"),
			v.literal("retrospective"),
			v.literal("blank")
		)),
		status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
		metadata: v.optional(v.any()),
		createdBy: v.optional(v.id("users")),
    modifiedAt: v.optional(v.number()),
    modifiedBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
	})
	.index("by_owner", ["ownerId"]) 
	.index("by_created", ["createdAt"]) 
	.index("by_shareId", ["shareId"]) 
	.index("by_status", ["status"]) 
	.index("by_type", ["documentType"]) 
	.index("by_project", ["projectId"]),

  // DOCUMENT TEMPLATES (align with main app; keep key for 'blank')
  documentTemplates: defineTable({
    key: v.optional(v.string()), // back-compat (e.g., "blank")
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("project_brief"),
      v.literal("meeting_notes"),
      v.literal("wiki_article"),
      v.literal("resource_doc"),
      v.literal("retrospective"),
      v.literal("general"),
      v.literal("user_created")
    )),
    snapshot: v.optional(v.object({
      documentTitle: v.string(),
      documentMetadata: v.optional(v.any()),
      pages: v.array(v.object({
        title: v.string(),
        icon: v.optional(v.string()),
        order: v.number(),
        content: v.string(), // PM JSON string
        subpages: v.optional(v.array(v.object({
          title: v.string(),
          icon: v.optional(v.string()),
          order: v.number(),
          content: v.string(),
        }))),
      })),
    })),
    // Legacy fields to allow migration to run
    initialSnapshot: v.optional(v.string()),
    structure: v.optional(v.any()),
    thumbnailUrl: v.optional(v.string()),
    usageCount: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
  })
  .index("by_key", ["key"]) 
  .index("by_category", ["category"]) 
  .index("by_active", ["isActive"]) 
  .index("by_public", ["isPublic"]) 
  .index("by_created_by", ["createdBy"]),

  // Table for document page hierarchy (replaces legacy `pages`)
	documentPages: defineTable({
		documentId: v.id("documents"),
		parentPageId: v.optional(v.id("documentPages")),
		docId: v.string(),
		title: v.string(),
		icon: v.optional(v.string()),
		order: v.number(),
		createdAt: v.number(),
	})
		.index("by_document", ["documentId"]) 
		.index("by_document_parent", ["documentId", "parentPageId"]) 
		.index("by_document_order", ["documentId", "order"]) 
		.index("by_docId", ["docId"]),

	// Presence tracking
	presence: defineTable({
		docId: v.string(),
		userId: v.string(),
		name: v.string(),
		color: v.string(),
		cursor: v.string(),
		updatedAt: v.number(),
	})
		.index("by_doc", ["docId"]) 
		.index("by_doc_user", ["docId", "userId"]),

  // COMMENTS (merge doc + task flows)
	comments: defineTable({
		// Document-block context
		docId: v.optional(v.string()),
		blockId: v.optional(v.string()),
		// Cross-entity
		taskId: v.optional(v.id("tasks")),
		projectId: v.optional(v.id("projects")),
		sprintId: v.optional(v.id("sprints")),
		entityType: v.optional(v.union(
			v.literal("document_block"),
			v.literal("task"),
			v.literal("project"),
			v.literal("sprint")
		)),
		// Threading
		threadId: v.optional(v.string()),
		parentCommentId: v.optional(v.id("comments")),
		// Legacy fields for back-compat (will be migrated away)
		targetType: v.optional(v.string()),
		targetId: v.optional(v.string()),
		// Content + mentions
		content: v.string(),
		authorId: v.optional(v.id("users")),
		mentions: v.optional(v.array(v.object({
			userId: v.string(),
			position: v.number(),
			length: v.number(),
		}))),
		// Status
		resolved: v.optional(v.boolean()),
		resolvedBy: v.optional(v.string()),
		resolvedAt: v.optional(v.number()),
		editedAt: v.optional(v.number()),
		deleted: v.optional(v.boolean()),
		// Audit
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_doc", ["docId"]) 
		.index("by_thread", ["threadId"]) 
		.index("by_block", ["blockId"]) 
		.index("by_task", ["taskId"]) 
		.index("by_doc_resolved", ["docId", "resolved"])
    .index("by_author", ["authorId"]),

	// COMMENT THREADS (doc + task)
	commentThreads: defineTable({
		id: v.string(), // public thread id
		docId: v.optional(v.string()),
		blockId: v.optional(v.string()),
		taskId: v.optional(v.id("tasks")),
		projectId: v.optional(v.id("projects")),
		sprintId: v.optional(v.id("sprints")),
		entityType: v.optional(v.union(
			v.literal("document_block"),
			v.literal("task"),
			v.literal("project"),
			v.literal("sprint")
		)),
		createdAt: v.number(),
		resolved: v.optional(v.boolean()),
		creatorId: v.optional(v.string()),
		// Legacy fields for back-compat (will be migrated away)
		targetType: v.optional(v.string()),
		targetId: v.optional(v.string()),
	})
		.index("by_doc", ["docId"]) 
		.index("by_block", ["blockId"]) 
		.index("by_task", ["taskId"]) 
		.index("by_public_id", ["id"]),


  // Audit log for document status changes
  documentStatusAudits: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    oldStatus: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
    newStatus: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    timestamp: v.number(),
  })
    .index("by_document", ["documentId"]) 
    .index("by_document_time", ["documentId", "timestamp"]),

  // Audit log for client archive/delete actions
  clientDeletionAudits: defineTable({
    clientId: v.id("clients"),
    adminUserId: v.id("users"),
    action: v.union(
      v.literal("archive"),
      v.literal("delete")
    ),
    summary: v.optional(v.object({
      projectCount: v.number(),
      taskCount: v.number(),
      teamMemberCount: v.number(),
    })),
    timestamp: v.number(),
  })
    .index("by_client", ["clientId"]),

  // Audit log for project delete actions
  projectDeletionAudits: defineTable({
    projectId: v.id("projects"),
    adminUserId: v.id("users"),
    action: v.literal("delete"),
    summary: v.optional(v.object({
      documentCount: v.number(),
      pageCount: v.number(),
      taskCount: v.number(),
      commentCount: v.number(),
    })),
    timestamp: v.number(),
  })
    .index("by_project", ["projectId"]),

  // Universal attachments table
  attachments: defineTable({
    // File information
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),

    // Polymorphic entity relationship
    entityType: v.union(
      v.literal("task"),
      v.literal("comment"),
      v.literal("project"),
      v.literal("document")
    ),
    entityId: v.string(),

    // Type-safe IDs
    taskId: v.optional(v.id("tasks")),

    // Metadata
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
  })
    .index("by_task", ["taskId"]) 
    .index("by_entity", ["entityType", "entityId"]),

  // Weekly Updates table for document-based weekly status tracking
  weeklyUpdates: defineTable({
		docId: v.string(),
		accomplished: v.string(),
		focus: v.string(),
		blockers: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		authorId: v.optional(v.string()),
	})
		.index("by_doc", ["docId"]),
}); 