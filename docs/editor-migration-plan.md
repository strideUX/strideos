# Document Editor Migration Plan

## Overview
Replace the current section-based document editor with a new page-based editor (like Coda), while preserving existing data as legacy reference. Documents become standalone entities that can exist independently of projects, with "Project Brief" being a special document type that maintains the tight coupling with projects.

**Core Architecture Changes:**
- **From:** Documents with sections (flat structure)  
- **To:** Documents with pages and subpages (hierarchical structure)  
- **Collaboration:** Full ProseMirror-based real-time editing with presence and comments
- **Custom Blocks:** Will be added AFTER core functionality is verified working

---

## PHASE 1: Schema Migration

### 1.1 Rename Current Tables to Legacy
```typescript
// Rename in convex/schema.ts:
documents           →  legacyDocuments
documentSections    →  legacyDocumentSections  
documentTemplates   →  legacyDocumentTemplates
comments            →  legacyComments
```

### 1.2 Add New Schema Tables
```typescript
// New core tables
documents: defineTable({
  title: v.string(),
  createdAt: v.number(),
  ownerId: v.optional(v.string()),
  archivedAt: v.optional(v.number()),
  
  // Project integration (optional - only for project briefs)
  projectId: v.optional(v.id("projects")),
  
  // Required context fields
  clientId: v.id("clients"),
  departmentId: v.id("departments"),
  
  // Document metadata
  documentType: v.optional(v.union(
    v.literal("project_brief"),
    v.literal("meeting_notes"),
    v.literal("wiki_article"),
    v.literal("resource_doc"),
    v.literal("retrospective"),
    v.literal("blank")
  )),
  status: v.optional(v.union(
    v.literal("draft"),
    v.literal("active"),
    v.literal("review"),
    v.literal("complete")
  )),
  
  // Permissions
  permissions: v.optional(v.object({
    canView: v.array(v.string()),
    canEdit: v.array(v.string()),
    canComment: v.array(v.string()),
    clientVisible: v.boolean()
  }))
})
  .index("by_project", ["projectId"])
  .index("by_client", ["clientId"])
  .index("by_department", ["departmentId"])
  .index("by_type", ["documentType"]),

pages: defineTable({
  documentId: v.id("documents"),
  parentPageId: v.optional(v.id("pages")),
  docId: v.string(), // ProseMirror document ID
  title: v.string(),
  icon: v.optional(v.string()),
  order: v.number(),
  createdAt: v.number()
})
  .index("by_document", ["documentId"])
  .index("by_parent", ["parentPageId"]),

// Comments system (expandable to other entities later)
comments: defineTable({
  // Document comments
  docId: v.optional(v.string()),
  blockId: v.optional(v.string()),
  
  // Future: task comments, etc
  taskId: v.optional(v.id("tasks")),
  entityType: v.optional(v.union(
    v.literal("document"),
    v.literal("task"),
    v.literal("project")
  )),
  
  threadId: v.string(),
  content: v.string(),
  authorId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  resolved: v.optional(v.boolean()),
  parentCommentId: v.optional(v.id("comments"))
})
  .index("by_doc", ["docId"])
  .index("by_thread", ["threadId"])
  .index("by_task", ["taskId"]),

commentThreads: defineTable({
  id: v.string(),
  docId: v.optional(v.string()),
  blockId: v.optional(v.string()),
  taskId: v.optional(v.id("tasks")), // For future expansion
  createdAt: v.number(),
  resolved: v.optional(v.boolean()),
  creatorId: v.optional(v.string())
})
  .index("by_doc", ["docId"]),

presence: defineTable({
  docId: v.string(),
  userId: v.string(),
  name: v.string(),
  color: v.string(),
  cursor: v.string(),
  updatedAt: v.number()
})
  .index("by_doc", ["docId"])
  .index("by_user", ["userId"]),

// Templates for documents
documentTemplates: defineTable({
  name: v.string(),
  documentType: v.union(
    v.literal("project_brief"),
    v.literal("blank")
    // Add more template types later
  ),
  description: v.optional(v.string()),
  defaultPages: v.array(v.object({
    title: v.string(),
    icon: v.optional(v.string()),
    order: v.number(),
    defaultContent: v.optional(v.any()),
    subpages: v.optional(v.array(v.object({
      title: v.string(),
      icon: v.optional(v.string()),
      order: v.number(),
      defaultContent: v.optional(v.any())
    })))
  })),
  isActive: v.boolean(),
  createdAt: v.number(),
  createdBy: v.id("users")
})
  .index("by_type", ["documentType"])
  .index("by_active", ["isActive"])
```

---

## PHASE 2: File Structure & Dependencies

### 2.1 Dependencies to Add
```json
{
  "@convex-dev/prosemirror-sync": "^0.1.27",
  "@blocknote/core": "^0.35.0",
  "@blocknote/react": "^0.35.0",
  "@blocknote/shadcn": "^0.35.0",
  "emoji-picker-react": "^4.13.2"
}
```

### 2.2 File Structure
```
/src/
├── app/
│   ├── documents/                    # New documents section
│   │   ├── page.tsx                 # Documents list/table
│   │   └── [documentId]/
│   │       └── page.tsx             # Document editor view
│   │
│   └── clients/[clientId]/projects/[projectId]/
│       └── document/                # Existing project document route
│           └── page.tsx             # Will use new editor for project briefs
│
├── components/
│   ├── editor/                      # NEW editor (from prototype)
│   │   ├── EditorShell.tsx
│   │   ├── EditorBody.tsx
│   │   ├── PageSidebar.tsx
│   │   ├── BlockNoteEditor.tsx
│   │   ├── CommentsSidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── blocks/
│   │   │   └── AlertBlock.tsx      # Only the Alert block initially
│   │   └── stores/
│   │       └── ConvexThreadStore.tsx
│   │
│   └── legacy-editor/               # Current editor (for reference)
│       └── [all current files]

/convex/
├── convex.config.ts                 # Add ProseMirror sync component
├── documents.ts                     # New document functions
├── pages.ts                        # Page management
├── comments.ts                     # New comments system
├── presence.ts                     # Collaboration presence
├── documentTemplates.ts            # New template system
│
└── legacy/                         # Legacy functions (reference)
    ├── legacyDocuments.ts
    ├── legacyDocumentSections.ts
    └── legacyComments.ts
```

---

## PHASE 3: Implementation Approach

### 3.1 Convex Configuration
```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config";

const app = defineApp();
app.use(prosemirrorSync);
export default app;
```

### 3.2 Document Creation Flow

**Blank Document:**
```typescript
// Creates document with single "Untitled" page
createDocument({
  title: "Untitled",
  documentType: "blank",
  clientId: currentUser.clientId,
  departmentId: currentUser.departmentId
})
```

**Project Brief:**
```typescript
// Creates document with template pages, linked to project
createProjectDocument({
  projectId: project._id,
  title: project.title,
  documentType: "project_brief",
  clientId: project.clientId,
  departmentId: project.departmentId,
  templateId: projectBriefTemplate._id
})
```

### 3.3 Template Definitions

**Blank Template:**
- Single page titled "Untitled"
- No default content

**Project Brief Template:**
```typescript
{
  name: "Project Brief",
  documentType: "project_brief",
  defaultPages: [
    {
      title: "Overview",
      icon: "📋",
      subpages: [
        { title: "Goals & Objectives", icon: "🎯" },
        { title: "Scope & Requirements", icon: "📊" }
      ]
    },
    {
      title: "Deliverables",
      icon: "📦",
      subpages: [
        { title: "Milestones", icon: "🏁" },
        { title: "Assets", icon: "🎨" }
      ]
    },
    {
      title: "Timeline",
      icon: "📅"
    },
    {
      title: "Team & Resources",
      icon: "👥"
    },
    {
      title: "Feedback & Approvals",
      icon: "💬"
    }
  ]
}
```

---

## PHASE 4: Integration Points

### 4.1 Project Integration
- Projects table keeps `documentId` field pointing to new documents
- Project creation automatically creates a project brief document
- Document permissions inherit from project permissions
- **Custom blocks (Tasks, ProjectInfo) will be added AFTER core editor is working**

### 4.2 Navigation Integration
- Add "Documents" to main navigation
- Documents list shows all documents (filterable by type)
- Project documents accessible from both Documents nav and Project page
- Client-visible documents appear in client portal

### 4.3 Comments Enhancement Path
- Start with document/block comments from prototype
- Add `taskId` and `entityType` fields for future expansion
- Comments UI can be reused for tasks, projects, etc.
- Unified notification system for all comment types

---

## PHASE 5: Implementation Sequence

### Step 1: Schema & Infrastructure
1. Rename existing tables to legacy
2. Add new schema tables
3. Add ProseMirror sync to convex.config.ts
4. Copy Convex functions from prototype

### Step 2: Editor Components
1. Copy all editor components from prototype
2. Move current editor to legacy-editor folder
3. Install new dependencies
4. Verify ProseMirror sync works

### Step 3: Documents Navigation
1. Create /documents route with data table
2. Implement "New Document" with blank template
3. Test creating and editing standalone documents
4. Verify real-time collaboration works

### Step 4: Project Integration
1. Create project brief template
2. Update project creation to use new documents
3. Test project document creation and editing
4. Ensure permissions work correctly

### Step 5: Custom Blocks (AFTER EVERYTHING WORKS)
1. Port TasksBlock from legacy editor
2. Port ProjectInfoBlock from legacy editor
3. Adapt blocks to work with new editor structure
4. Test blocks work with project context

---

## Success Criteria

### Core Functionality (Must Have Before Custom Blocks)
1. ✅ Can create blank documents from Documents navigation
2. ✅ Documents have hierarchical page structure (pages and subpages)
3. ✅ Real-time collaboration works (cursors, presence)
4. ✅ Comments system works on document blocks
5. ✅ Project briefs automatically created with projects
6. ✅ Alert block works (from prototype)
7. ✅ Legacy data preserved and accessible if needed
8. ✅ No data loss or breaking changes to existing functionality

### Enhanced Functionality (After Core Works)
9. ⏳ TasksBlock integrated and working with project context
10. ⏳ ProjectInfoBlock integrated and working
11. ⏳ All custom blocks from legacy editor ported

---

## Notes

- Custom blocks are intentionally left for the end due to complexity
- Legacy editor preserved for reference when implementing custom blocks
- Focus is on getting core document functionality working first
- Once stable, custom blocks can be carefully ported one at a time