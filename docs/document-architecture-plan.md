# Document Architecture Plan

## Overview
This document outlines the planned architecture for a flexible document system with page-based structure, ProseMirror collaboration, and comprehensive template support.

## 1. Document Schema - Flexible Metadata Approach

### Core Philosophy
- Type safety with flexibility
- Extensible metadata pattern
- Future-proof design
- Clear separation between document types and templates

### Proposed Schema

```typescript
documents: defineTable({
  // Core fields
  title: v.string(),
  createdAt: v.number(),
  ownerId: v.optional(v.string()),
  archivedAt: v.optional(v.number()),
  
  // Document classification
  documentType: v.union(
    v.literal("standard"),      // Basic document
    v.literal("project_brief"), // Project-linked document
    v.literal("meeting_notes"),
    v.literal("wiki_article"),
    v.literal("resource_doc"),
    v.literal("retrospective"),
    v.literal("template")        // Document template
  ),
  
  // Flexible metadata for extensibility
  metadata: v.optional(v.object({
    // Context references (all optional)
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    departmentId: v.optional(v.id("departments")),
    sprintId: v.optional(v.id("sprints")),
    
    // Template information
    templateId: v.optional(v.id("documentTemplates")),
    templateVersion: v.optional(v.number()),
    
    // Dynamic field mappings for UI elements
    dynamicFields: v.optional(v.array(v.object({
      fieldName: v.string(),      // e.g., "client_name"
      sourceType: v.string(),      // e.g., "client", "project"
      sourceId: v.string(),        // ID reference
      fieldPath: v.string()        // e.g., "name" or "settings.timezone"
    }))),
    
    // Future extensibility
    customProperties: v.optional(v.any())
  })),
  
  // Status and permissions
  status: v.optional(v.union(
    v.literal("draft"),
    v.literal("active"),
    v.literal("review"),
    v.literal("complete"),
    v.literal("archived")
  )),
  
  permissions: v.optional(v.object({
    canView: v.array(v.string()),
    canEdit: v.array(v.string()),
    canComment: v.optional(v.array(v.string())),
    clientVisible: v.boolean()
  })),
  
  // Audit fields
  createdBy: v.optional(v.string()),
  updatedBy: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
  lastModified: v.optional(v.number()),
  version: v.optional(v.number())
})
```

### Benefits of This Approach

1. **Type Safety with Flexibility**: The metadata object gives typed fields for known entities while allowing extension
2. **UI Logic Simplification**: UI can check `if (doc.metadata?.projectId)` to show project-specific features
3. **Dynamic Elements**: The `dynamicFields` array defines which fields should be replaced with live data
4. **Future-Proof**: New entity types can be added to metadata without schema migration
5. **Template System Integration**: Templates become just another document type with metadata

### Document Type vs Template Distinction

- **Document Type**: Describes the document's purpose (project_brief, meeting_notes)
- **Template**: A reusable starting point for any document type
- A project_brief can have multiple templates (startup brief, enterprise brief)
- Templates are just documents with `documentType: "template"` and content

## 2. Template System - Snapshot Pattern

### Core Concepts
- Templates as complete document snapshots
- Preserve full page hierarchy and content
- Support both system and user-created templates
- Enable partial template application (add template pages to existing doc)

### Template Schema

```typescript
documentTemplates: defineTable({
  // Template metadata
  name: v.string(),
  description: v.optional(v.string()),
  category: v.union(
    v.literal("project_brief"),
    v.literal("meeting_notes"),
    v.literal("wiki_article"),
    v.literal("resource_doc"),
    v.literal("retrospective"),
    v.literal("general"),
    v.literal("user_created")  // User-saved templates
  ),
  
  // Template snapshot data
  snapshot: v.object({
    // Document-level template data
    documentTitle: v.string(),
    documentMetadata: v.optional(v.any()), // Metadata to apply
    
    // Complete page structure with content
    pages: v.array(v.object({
      title: v.string(),
      icon: v.optional(v.string()),
      order: v.number(),
      
      // ProseMirror content snapshot for this page
      content: v.string(), // JSON string of PM content
      
      // Nested pages
      subpages: v.optional(v.array(v.object({
        title: v.string(),
        icon: v.optional(v.string()),
        order: v.number(),
        content: v.string()
      })))
    }))
  }),
  
  // Template metadata
  thumbnailUrl: v.optional(v.string()),
  usageCount: v.number(),
  isPublic: v.boolean(),
  isActive: v.boolean(),
  
  // Audit
  createdBy: v.id("users"),
  createdAt: v.number(),
  lastUsedAt: v.optional(v.number())
})
```

### Key Operations

#### 1. Save Document as Template
- Capture current state of document and all pages
- Get ProseMirror content snapshots for each page
- Preserve page hierarchy (parent-child relationships)
- Store metadata for dynamic field replacement

#### 2. Create Document from Template
- Instantiate new document with template metadata
- Create new ProseMirror documents for each page
- Maintain page hierarchy from template
- Apply any dynamic field mappings
- Track template usage statistics

#### 3. Add Template to Existing Document
- Insert template pages at specified position
- Adjust page ordering for existing pages
- Merge metadata appropriately
- Useful for adding standard sections to documents

### Implementation Flow

```typescript
// Example: Creating from template
export const createFromTemplate = mutation({
  args: {
    templateId: v.id("documentTemplates"),
    title: v.optional(v.string()),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, { templateId, title, metadata }) => {
    const template = await ctx.db.get(templateId);
    
    // 1. Create the document
    const documentId = await ctx.db.insert("documents", {
      title: title || template.snapshot.documentTitle,
      metadata: { 
        ...template.snapshot.documentMetadata,
        ...metadata,
        templateId // Track source template
      },
      createdAt: Date.now(),
      ownerId: ctx.auth.userId
    });
    
    // 2. Create pages with new ProseMirror docs
    for (const pageTemplate of template.snapshot.pages) {
      // Create new PM document from template content
      const docId = await prosemirrorSync.create(
        ctx, 
        pageTemplate.content
      );
      
      const pageId = await ctx.db.insert("documentPages", {
        documentId,
        docId,
        title: pageTemplate.title,
        icon: pageTemplate.icon,
        order: pageTemplate.order,
        createdAt: Date.now()
      });
      
      // 3. Create subpages
      if (pageTemplate.subpages) {
        for (const subTemplate of pageTemplate.subpages) {
          const subDocId = await prosemirrorSync.create(
            ctx,
            subTemplate.content
          );
          
          await ctx.db.insert("documentPages", {
            documentId,
            parentPageId: pageId,
            docId: subDocId,
            title: subTemplate.title,
            icon: subTemplate.icon,
            order: subTemplate.order,
            createdAt: Date.now()
          });
        }
      }
    }
    
    // 4. Update template usage
    await ctx.db.patch(templateId, {
      usageCount: template.usageCount + 1,
      lastUsedAt: Date.now()
    });
    
    return documentId;
  }
});
```

## 3. Dynamic Fields System

### Concept
Allow templates and documents to contain placeholders that are replaced with live data from related entities (clients, projects, etc.).

### Implementation Ideas

1. **Template Placeholders**: Use special syntax in ProseMirror content like `{{client.name}}` or `{{project.dueDate}}`

2. **Resolution at Runtime**: When rendering, resolve these placeholders using the document's metadata references

3. **Update Strategies**:
   - Static: Replace once when creating from template
   - Dynamic: Always show current value (requires custom ProseMirror node)
   - Hybrid: Cache with periodic refresh

### Example Dynamic Field Configuration

```typescript
dynamicFields: [
  {
    fieldName: "client_name",
    sourceType: "client",
    sourceId: "client_123",
    fieldPath: "name"
  },
  {
    fieldName: "sprint_capacity",
    sourceType: "sprint", 
    sourceId: "sprint_456",
    fieldPath: "totalCapacity"
  }
]
```

## 4. Comments System - Universal Entity Comments

### Core Requirements
- Support comments on multiple entity types (documents, tasks, projects, sprints)
- Block-level comments for documents (via BlockNote integration)
- Threaded replies to any comment
- @ mentions with notifications
- Comment resolution (especially for document reviews)
- Future: Attachment support

### Proposed Schema (Compatible with Current BlockNote Integration)

```typescript
comments: defineTable({
  // Content
  content: v.string(), // Rich text with @ mentions
  
  // EXISTING FIELDS (Maintain compatibility with BlockNote)
  docId: v.optional(v.string()),        // ProseMirror doc ID (KEEP AS IS)
  blockId: v.optional(v.string()),      // BlockNote block ID (KEEP AS IS)
  threadId: v.optional(v.string()),     // Thread identifier (KEEP AS IS)
  authorId: v.optional(v.string()),     // User ID - change to string for compatibility
  parentCommentId: v.optional(v.id("comments")), // For replies (KEEP AS IS)
  
  // Resolution (already working in current system)
  resolved: v.optional(v.boolean()),
  
  // NEW FIELDS for expanded functionality
  // Entity Association (for non-document comments)
  entityType: v.optional(v.union(
    v.literal("document_block"),  // Default for BlockNote comments
    v.literal("task"),
    v.literal("project"), 
    v.literal("sprint")
  )),
  
  // Additional entity references (only used for non-document comments)
  taskId: v.optional(v.id("tasks")),
  projectId: v.optional(v.id("projects")),
  sprintId: v.optional(v.id("sprints")),
  documentId: v.optional(v.id("documents")), // Reference to documents table (not ProseMirror ID)
  
  // Enhanced resolution tracking
  resolvedBy: v.optional(v.string()),
  resolvedAt: v.optional(v.number()),
  
  // Mentions
  mentions: v.optional(v.array(v.object({
    userId: v.string(),
    position: v.number(),
    length: v.number()
  }))),
  
  // Future: Attachments
  attachmentIds: v.optional(v.array(v.id("_storage"))),
  
  // Metadata (keeping existing fields)
  createdAt: v.number(),
  updatedAt: v.number(),
  editedAt: v.optional(v.number()),
  deleted: v.optional(v.boolean())  // Soft delete for thread integrity
})
  .index("by_thread", ["threadId"])
  .index("by_doc_block", ["docId", "blockId"])
  .index("by_entity", ["entityType", "entityId"])
  .index("by_task", ["taskId"])
  .index("by_project", ["projectId"])
  .index("by_sprint", ["sprintId"])
  .index("by_author", ["authorId"])
  .index("by_parent", ["parentCommentId"])
  .index("by_resolved", ["resolved", "entityType"])
  .index("by_mentions", ["mentions"])
```

### Comment Threads Table (Keep Current Structure, Add Fields)

```typescript
commentThreads: defineTable({
  // EXISTING FIELDS (Keep for compatibility)
  id: v.string(),                    // Thread identifier (KEEP AS IS)
  docId: v.optional(v.string()),     // ProseMirror doc ID (KEEP AS IS)
  blockId: v.optional(v.string()),   // BlockNote block ID (KEEP AS IS)
  createdAt: v.number(),             // (KEEP AS IS)
  resolved: v.optional(v.boolean()), // (KEEP AS IS)
  creatorId: v.optional(v.string()), // (KEEP AS IS)
  
  // NEW FIELDS for expanded functionality
  // Entity Association (for non-document threads)
  entityType: v.optional(v.union(
    v.literal("document_block"),
    v.literal("task"),
    v.literal("project"),
    v.literal("sprint")
  )),
  
  // Additional entity references
  taskId: v.optional(v.id("tasks")),
  projectId: v.optional(v.id("projects")),
  sprintId: v.optional(v.id("sprints")),
  
  // Enhanced resolution tracking
  resolvedBy: v.optional(v.string()),
  resolvedAt: v.optional(v.number()),
  
  // Thread metadata
  lastActivityAt: v.optional(v.number()),
  commentCount: v.optional(v.number()),
  
  // Participants tracking
  participants: v.optional(v.array(v.string())),  // User IDs who commented
  subscribers: v.optional(v.array(v.string()))    // User IDs for notifications
})
  .index("by_entity", ["entityType", "entityId"])
  .index("by_doc_block", ["docId", "blockId"])
  .index("by_task", ["taskId"])
  .index("by_resolved", ["resolved"])
  .index("by_participants", ["participants"])
  .index("by_activity", ["lastActivityAt"])
```

### Key Features Implementation

#### 1. Creating a Comment
```typescript
export const createComment = mutation({
  args: {
    entityType: v.string(),
    content: v.string(),
    mentions: v.optional(v.array(...)),
    // Entity-specific fields
    docId: v.optional(v.string()),
    blockId: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    // Reply fields
    parentCommentId: v.optional(v.id("comments"))
  },
  handler: async (ctx, args) => {
    let threadId = generateUUID();
    let isThreadRoot = true;
    
    // If replying, use parent's thread
    if (args.parentCommentId) {
      const parent = await ctx.db.get(args.parentCommentId);
      threadId = parent.threadId;
      isThreadRoot = false;
    }
    
    // Create comment
    const commentId = await ctx.db.insert("comments", {
      ...args,
      threadId,
      isThreadRoot,
      authorId: ctx.auth.userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    // Create or update thread
    if (isThreadRoot) {
      await ctx.db.insert("commentThreads", {
        id: threadId,
        entityType: args.entityType,
        // ... entity references
        resolved: false,
        participants: [ctx.auth.userId],
        subscribers: [ctx.auth.userId, ...mentionedUsers],
        createdBy: ctx.auth.userId,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        commentCount: 1
      });
    } else {
      // Update thread activity and participants
    }
    
    // Send notifications for mentions
    if (args.mentions) {
      await createMentionNotifications(ctx, args.mentions, commentId);
    }
    
    return commentId;
  }
});
```

#### 2. Resolving Comments
```typescript
export const resolveThread = mutation({
  args: {
    threadId: v.string(),
    resolved: v.boolean()
  },
  handler: async (ctx, { threadId, resolved }) => {
    // Update thread
    const thread = await ctx.db.query("commentThreads")
      .filter(q => q.eq(q.field("id"), threadId))
      .first();
    
    await ctx.db.patch(thread._id, {
      resolved,
      resolvedBy: resolved ? ctx.auth.userId : undefined,
      resolvedAt: resolved ? Date.now() : undefined
    });
    
    // Update all comments in thread
    const comments = await ctx.db.query("comments")
      .withIndex("by_thread", q => q.eq("threadId", threadId))
      .collect();
    
    for (const comment of comments) {
      await ctx.db.patch(comment._id, { resolved });
    }
    
    // Notify participants
    await notifyThreadResolution(ctx, thread, resolved);
  }
});
```

#### 3. @ Mentions System
```typescript
// Parse mentions from content
function parseMentions(content: string): Array<{userId: string, position: number, length: number}> {
  const mentionRegex = /@\[([^\]]+)\]\(user:([^)]+)\)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      userId: match[2],
      position: match.index,
      length: match[0].length
    });
  }
  
  return mentions;
}

// Format: @[User Name](user:userId) in content
// Display: Shows as clickable @User Name
// Storage: Full markdown stored, mentions array for indexing
```

### Integration Points

#### BlockNote Integration
- Comments attach to block IDs from BlockNote
- Thread indicators show on blocks with comments
- Click to expand comment thread in sidebar

#### Task Comments
- Comments appear in task detail view
- Resolved status independent of task status
- Mention task assignee automatically

#### Future Attachment Support
- Store attachment IDs in comment
- Display inline or as list
- Support images, documents, etc.

### Benefits of This Design

1. **Polymorphic**: Single table handles all entity types
2. **Flexible Threading**: Supports nested conversations
3. **Rich Interactions**: Mentions, resolution, subscriptions
4. **Performance**: Well-indexed for common queries
5. **Extensible**: Easy to add new entity types
6. **Audit Trail**: Soft deletes maintain thread integrity

## 5. Migration Strategy

### Phase 1: Schema Update
1. Add new metadata field to documents table
2. Add documentTemplates table
3. Rename pages table to documentPages for consistency
4. Keep comments table separate (can be used for multiple entity types)

### Phase 2: Data Migration
1. Migrate existing clientId, projectId, departmentId to metadata object
2. Convert any existing templates to new format

### Phase 3: Code Updates
1. Update document creation flows to use metadata
2. Implement template creation and usage
3. Update UI to check metadata for context

### Phase 4: Cleanup
1. Remove legacy fields once migration is complete
2. Archive old template system if applicable

## 5. Future Enhancements

### Potential Features
- **Template Versioning**: Track changes to templates over time
- **Template Marketplace**: Share templates across organizations
- **Smart Templates**: Templates that adapt based on context
- **Template Analytics**: Track which templates are most effective
- **Conditional Sections**: Pages that appear based on metadata
- **Template Inheritance**: Templates that extend other templates

### Extensibility Points
- Custom metadata validators
- Plugin system for dynamic fields
- Template transformation pipeline
- Cross-document template application

## 6. Technical Considerations

### Performance
- Template snapshots could be large - consider compression
- Lazy load template content when browsing
- Cache frequently used templates

### Security
- Validate template content before application
- Sanitize dynamic field values
- Permission checks for template creation/usage

### User Experience
- Template preview before application
- Undo support for template application
- Template customization wizard
- Bulk template operations

## Next Steps

1. Review and refine schema design
2. Implement core template operations
3. Create UI for template management
4. Build dynamic field resolution system
5. Test with real-world use cases
6. Document template best practices