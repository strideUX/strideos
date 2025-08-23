# Cursor Implementation Prompts

## Phase 1: Schema Updates

### Task 1.1: Update Documents Table with Metadata Pattern
Update the documents table in convex/schema.ts to use a flexible metadata pattern. 

Key changes:
1. Add a metadata field with optional object containing: clientId, projectId, departmentId, sprintId, templateId, templateVersion, dynamicFields array, and customProperties
2. Keep existing fields for backwards compatibility during migration
3. Ensure all existing indexes remain functional

Reference: docs/document-architecture-plan.md section "Document Schema - Flexible Metadata Approach"

Do NOT remove existing clientId, projectId, departmentId fields yet - we'll migrate data first.

### Task 1.2: Rename Pages to DocumentPages
Rename the 'pages' table to 'documentPages' throughout the codebase:

1. Update convex/schema.ts - rename pages to documentPages
2. Update the parentPageId field to reference v.id("documentPages")
3. Search and replace all references to "pages" table in convex functions
4. Update any TypeScript types that reference pages

Files likely affected:
- convex/schema.ts
- convex/documents.ts
- convex/documentSyncApi.ts
- Any other convex files querying pages

Ensure the by_docId index remains intact for ProseMirror sync.

### Task 1.3: Extend Comments Schema
Extend the comments and commentThreads tables in convex/schema.ts to support multiple entity types.

ADD these fields to comments table (all optional):
- entityType: v.optional(v.union(v.literal("document_block"), v.literal("task"), v.literal("project"), v.literal("sprint")))
- taskId: v.optional(v.id("tasks"))
- projectId: v.optional(v.id("projects")) 
- sprintId: v.optional(v.id("sprints"))
- documentId: v.optional(v.id("documents"))
- mentions: v.optional(v.array(v.object({userId: v.string(), position: v.number(), length: v.number()})))
- resolvedBy: v.optional(v.string())
- resolvedAt: v.optional(v.number())
- editedAt: v.optional(v.number())
- deleted: v.optional(v.boolean())

ADD these fields to commentThreads table (all optional):
- entityType: same as above
- taskId, projectId, sprintId: same as above
- resolvedBy: v.optional(v.string())
- resolvedAt: v.optional(v.number())
- lastActivityAt: v.optional(v.number())
- commentCount: v.optional(v.number())
- participants: v.optional(v.array(v.string()))
- subscribers: v.optional(v.array(v.string()))

Do NOT modify existing fields - this must be backwards compatible with BlockNote integration.

### Task 1.4: Add Document Templates Table
Add a new documentTemplates table to convex/schema.ts:

```typescript
documentTemplates: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  category: v.union(
    v.literal("project_brief"),
    v.literal("meeting_notes"),
    v.literal("wiki_article"),
    v.literal("resource_doc"),
    v.literal("retrospective"),
    v.literal("general"),
    v.literal("user_created")
  ),
  snapshot: v.object({
    documentTitle: v.string(),
    documentMetadata: v.optional(v.any()),
    pages: v.array(v.object({
      title: v.string(),
      icon: v.optional(v.string()),
      order: v.number(),
      content: v.string(), // ProseMirror JSON content
      subpages: v.optional(v.array(v.object({
        title: v.string(),
        icon: v.optional(v.string()),
        order: v.number(),
        content: v.string()
      })))
    }))
  }),
  thumbnailUrl: v.optional(v.string()),
  usageCount: v.number(),
  isPublic: v.boolean(),
  isActive: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  lastUsedAt: v.optional(v.number())
})
  .index("by_category", ["category"])
  .index("by_active", ["isActive"])
  .index("by_public", ["isPublic"])
  .index("by_created_by", ["createdBy"])
```

Reference: docs/document-architecture-plan.md section "Template Schema"

## Phase 2: Core Document System

### Task 2.0: Project-Document Integration

Update project creation to automatically create linked project brief documents:

1. Update convex/projects.ts createProject mutation:
   - After creating project, create a project brief document
   - Set document.metadata with: { projectId, clientId, departmentId }
   - Set documentType: "project_brief" in the document
   - Set document title same as project title
   - Look for project brief template (category: "project_brief"), use if available
   - If no template, create document with default page structure
   - Store documentId in projects table
   - Return both projectId and documentId

2. Verify projects schema:
   - Ensure projects.documentId field exists (it already does)
   - Ensure proper indexing

3. Update project creation UI flow:
   - After successful project creation, redirect to `/editor/${documentId}`
   - Pass new documentId to the BlockNote editor route
   - Should seamlessly open the project brief for editing

4. Add getProjectDocument query in convex/projects.ts:
   - Takes projectId, returns linked document with pages
   - Include error handling if document missing
   - Used for "Edit Project Brief" navigation from project views

5. Update existing project navigation:
   - Find where projects link to their documents
   - Update to use new document editor route
   - Ensure smooth transition from project list to document editor

Key: The document becomes the primary interface for project management.
Reference: projects table already has documentId field in schema at line 235.


### Task 2.1: Create Document Management Functions

Create convex/documentManagement.ts with functions that use the new metadata pattern:

1. createDocument mutation that:
   - Creates a document with metadata instead of direct fields
   - Supports optional clientId, projectId, departmentId in metadata
   - Creates initial documentPages if provided
   - Integrates with ProseMirror sync for page content

2. createDocumentWithPages helper that:
   - Creates document
   - Creates documentPages with ProseMirror docs
   - Used by both template system and project creation

3. updateDocumentMetadata mutation that:
   - Updates the metadata object
   - Validates entity references exist
   - Maintains backwards compatibility

4. getDocumentWithContext query that:
   - Returns document with resolved metadata entities
   - Includes client, project, department data if referenced
   - Returns documentPages hierarchy
   - Provides data for dynamic field resolution

Reference the metadata structure in docs/document-architecture-plan.md
Ensure backwards compatibility with existing document creation flows.


### Task 2.2: Update Document Creation UI

Update the document creation flow in the UI to use the new metadata pattern:

1. Find components that create documents (likely in src/app or src/components)
2. Update to pass metadata object instead of direct clientId/projectId fields
3. Ensure the UI still reads from both patterns during migration:
   - Check doc.metadata?.clientId || doc.clientId
   - Same for projectId and departmentId

4. Update document context providers to handle metadata pattern
5. Ensure document type badges/indicators work with new documentType field

Do not break existing document creation - support both patterns.


## Phase 3: Template System

### Task 3.1: Implement Template Creation

Create convex/templates.ts with template management functions:

1. saveAsTemplate mutation:
   - Takes documentId and template metadata (name, description, category)
   - Fetches all documentPages for the document
   - Gets ProseMirror content for each page using prosemirrorSync
   - Stores complete snapshot in documentTemplates table
   - Preserves page hierarchy (parent-child relationships)

2. listTemplates query:
   - Returns templates filtered by category, isActive, isPublic
   - Includes usage statistics
   - Sorted by usage or creation date

3. getDefaultProjectBriefTemplate query:
   - Returns the most used or most recent project_brief template
   - Used by project creation flow
   - Returns null if no templates exist

Reference: docs/document-architecture-plan.md section "Save Document as Template"
Use the existing prosemirrorSync from convex/prosemirrorSync.ts to get content.


### Task 3.2: Implement Create from Template

Add to convex/templates.ts:

1. createFromTemplate mutation:
   - Takes templateId, optional title, optional metadata overrides
   - Creates new document with template's metadata merged with overrides
   - For each page in template.snapshot.pages:
     - Creates new ProseMirror doc with prosemirrorSync.create(content)
     - Creates documentPages entry with new docId
     - Preserves hierarchy and order
   - Updates template usage count and lastUsedAt
   - Returns new documentId

2. createProjectBriefFromTemplate helper function:
   - Specialized version for project creation
   - Takes projectId, clientId, departmentId, title
   - Looks for default project brief template
   - Sets metadata: { projectId, clientId, departmentId }
   - Sets documentType: "project_brief"
   - Falls back to creating blank document with standard pages if no template
   - Returns documentId
   - Used by project creation flow

Key: Each page must get a NEW ProseMirror docId, not reuse the template's.
Reference: docs/document-architecture-plan.md section "Create Document from Template"


### Task 3.3: Add Template UI Components

Create template selection UI components:

1. Create src/components/templates/TemplateSelector.tsx:
   - Grid/list view of available templates
   - Filter by category
   - Show template preview/description
   - "Use Template" action

2. Create src/components/templates/SaveAsTemplate.tsx:
   - Modal/drawer for saving current document as template
   - Input for name, description, category
   - Preview of what will be saved

3. Integration points:
   - Add "Save as Template" to document menu
   - Add template selection to document creation flow
   - Show "Start from Template" option

Use existing UI components and patterns from the codebase.


## Phase 4: Comments Expansion

### Task 4.1: Add Task Comments Support

Update convex/comments.ts to support task comments:

1. Modify createThread to accept entityType and taskId:
   - Default entityType to "document_block" for backwards compatibility
   - When taskId provided, set entityType to "task"
   - Store taskId in both comments and commentThreads

2. Add listByTask query:
   - Similar to listByDoc but filters by taskId
   - Returns threads and comments for a task

3. Update createComment and replyToComment:
   - Pass through entityType and taskId
   - Maintain existing behavior for document comments

Ensure all existing document comment functionality remains unchanged.


### Task 4.2: Implement @ Mentions

Add mention support to convex/comments.ts:

1. Add parseMentions helper function:
   - Parse @[User Name](user:userId) format from content
   - Return array of {userId, position, length}

2. Update createComment and createThread:
   - Parse mentions from content
   - Store in mentions field
   - Create notifications for each mentioned user:
     ```typescript
     await ctx.db.insert("notifications", {
       type: "mention",
       title: `${authorName} mentioned you`,
       message: truncated comment content,
       userId: mention.userId,
       isRead: false,
       relatedCommentId: commentId,
       priority: "medium",
       createdAt: Date.now()
     })
     ```

3. Add searchUsers query for mention autocomplete:
   - Search users by name or email
   - Return format needed for UI autocomplete

The notifications table already has 'mention' type and relatedCommentId field.


### Task 4.3: Add Task Comment UI

Integrate comments into task views:

1. Find task detail component (likely in src/components/tasks or src/app)
2. Add comment section using existing comment components
3. Modify to pass entityType="task" and taskId
4. Display comment threads below task details
5. Show comment count on task cards/lists

Reuse existing comment UI components where possible.
Look for how comments are currently used with documents and follow same pattern.


## Phase 5: Dynamic Fields

### Task 5.1: Implement Dynamic Field Resolution

Create convex/dynamicFields.ts for template field replacement:

1. resolveDynamicFields function:
   - Takes document metadata and content string
   - Finds {{field}} placeholders in content
   - Looks up values from referenced entities:
     - {{client.name}} -> fetch client by metadata.clientId
     - {{project.dueDate}} -> fetch project by metadata.projectId
   - Returns content with placeholders replaced

2. getAvailableFields query:
   - Based on document's metadata references
   - Returns list of available fields for UI:
     - If clientId present: client.name, client.website, etc.
     - If projectId present: project.title, project.status, etc.

3. Integration with template creation:
   - When creating from template, resolve dynamic fields
   - Option for static (one-time) or dynamic (live) replacement


### Task 5.2: Add Dynamic Field UI
Create UI for dynamic fields in templates:

1. Template editor enhancement:
   - Add "Insert Dynamic Field" button in editor toolbar
   - Dropdown showing available fields based on context
   - Insert {{field.path}} syntax

2. Field preview in documents:
   - Show resolved values in different color/style
   - Tooltip showing field source
   - Option to refresh dynamic values

3. Template preview:
   - Show sample values for dynamic fields
   - Indicate which fields will be replaced

Look for existing editor toolbar implementation and follow same patterns.

## Testing Checklist

After each phase:
1. Verify existing functionality still works
2. Test backwards compatibility
3. Check TypeScript types compile
4. Ensure database indexes are correct
5. Test with real user workflows

## Migration Notes

- Keep old fields during migration period
- Support reading from both old and new patterns
- Only remove old fields after all data migrated and code updated
- Document any breaking changes for team

## Key Integration Points

### Project Creation Flow
1. User creates new project
2. System automatically creates project brief document from template
3. Links document to project via documentId field
4. Redirects user to document editor
5. Document metadata contains projectId for dynamic fields

### Document as Project Interface
- Project brief document is primary UI for project management
- Dynamic fields pull live data from project, client, sprint
- Comments on document are project discussions
- Templates ensure consistent project documentation