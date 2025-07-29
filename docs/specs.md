# strideOS - Core Specification

**strideOS** is the operating system for strideUX - a revolutionary project management solution where **projects ARE living documents**. Built with Novel.sh editor and custom functional blocks, this tool eliminates the traditional separation between project management and documentation by making every project a collaborative, block-based document containing both content and interactive PM functionality.

## Core Philosophy
- **Projects as Living Documents**: Every project is a rich document with embedded functional blocks
- **Progressive Documentation**: Documentation happens naturally as projects progress
- **Task vs Todo Distinction**: Tasks are project-owned and PM-controlled; Todos are personal and user-controlled
- **Unified Personal Workspace**: Users see assigned tasks and personal todos in one organized, reorderable list
- **Client Collaboration**: Clients interact within the project context, not separate tools
- **Single Source of Truth**: No duplication between PM tools and final documentation

## Tech Stack

### Frontend
- **Next.js 15** (upgrade to 16 when stable)
- **TypeScript** for type safety
- **Novel.sh** for document editing with custom blocks
- **Tiptap/ProseMirror** (via Novel) for editor framework
- **shadcn/ui** (latest version) for components and dashboard layouts
- **Tailwind CSS** for styling

### Backend
- **Convex** (primary choice)
  - Real-time database with TypeScript
  - Built-in authentication
  - Serverless functions
  - Document storage integration
- **Supabase** (alternative if Convex limitations arise)

### Authentication
- **Email/Password** authentication (initial)
- **Google OAuth** and **Slack OAuth** (future)

## Data Model

### Core Entities

#### Users
```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'task_owner' | 'client'
  clientId?: string // Only for client users
  departmentIds?: string[] // Departments they have access to
  createdAt: Date
  updatedAt: Date
}
```

#### Clients
```typescript
interface Client {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}
```

#### Departments
```typescript
interface Department {
  id: string
  name: string
  clientId: string
  workstreamCount: number
  workstreamCapacity: number // Default: 4 ideal days, configurable by admin
  sprintDuration: number // Default: 14 days, configurable
  createdAt: Date
  updatedAt: Date
}
```

#### Projects (Document-Based)
```typescript
interface Project {
  id: string
  title: string
  clientId: string
  departmentId: string
  status: 'draft' | 'active' | 'review' | 'complete'
  targetDueDate?: Date
  
  // Document type system (Phase 2 foundation)
  documentType: 'project_brief' | 'meeting_notes' | 'wiki_article' | 'resource_doc' | 'retrospective'
  
  // Novel document structure
  documentContent: JSONContent // Novel/Tiptap document structure
  sections: ProjectSection[]
  
  createdAt: Date
  updatedAt: Date
}

interface ProjectSection {
  id: string
  title: string
  order: number
  anchor: string // For navigation
}
```

#### Document Blocks (Custom Novel Extensions)
```typescript
interface DocumentBlock {
  id: string
  type: 'tasks' | 'comments' | 'stakeholders' | 'timeline' | 'capacity' | 'deliverables'
  projectId: string
  sectionId?: string
  data: any // Block-specific data
  permissions: {
    canEdit: string[] // user roles
    canView: string[]
    clientVisible: boolean
  }
  order: number
  createdAt: Date
  updatedAt: Date
}
```

#### Sprints
```typescript
interface Sprint {
  id: string
  name: string
  departmentId: string
  startDate: Date
  endDate: Date
  status: 'planning' | 'active' | 'review' | 'complete'
  maxCapacity: number // Calculated from department workstreams
  currentCapacity: number // Sum of assigned task sizes
  createdAt: Date
  updatedAt: Date
}
```

#### Tasks (Project-Owned, PM-Controlled)
```typescript
interface Task {
  id: string
  title: string
  description: string
  projectId: string
  blockId: string // Reference to document block
  
  // PM-controlled fields (immutable by assignees)
  assignedTo?: string // User ID
  dueDate?: Date
  size: 0.5 | 1 | 2 | 3 | 4 // Ideal days
  type: 'design' | 'dev' | 'client_review' | 'pm' | 'content' | 'strategy' | 'other'
  priority: 'low' | 'medium' | 'high'
  sprintId?: string
  
  // User-controlled fields (assignee can modify)
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'complete'
  
  createdAt: Date
  updatedAt: Date
}
```

#### Personal Todos (User-Owned, Fully Controllable)
```typescript
interface Todo {
  id: string
  userId: string
  title: string
  description?: string
  dueDate?: Date
  status: 'todo' | 'in_progress' | 'complete'
  priority: 'low' | 'medium' | 'high'
  order: number // for personal reordering
  createdAt: Date
  updatedAt: Date
}
```

#### User Task/Todo Ordering (Personal Organization)
```typescript
interface UserTaskOrder {
  userId: string
  orderedItems: Array<{
    id: string
    type: 'task' | 'todo'
    order: number
  }>
  updatedAt: Date
}
```

#### Comments (Embedded in Document Blocks)
```typescript
interface Comment {
  id: string
  content: string
  authorId: string
  projectId: string
  blockId?: string // Reference to document block
  parentId?: string // For threading
  type: 'internal' | 'client_feedback' | 'approval'
  createdAt: Date
  updatedAt: Date
}
```

## User Roles & Permissions

### Admin (Super PM + System Management)
- **System Administration:** Full user, client, and department management
- **Global Configuration:** Workstream capacity, sprint durations, system settings
- **Complete PM Access:** Can create, edit, and manage any project document across all clients
- **Cross-Client Visibility:** See and manage projects, sprints, and tasks across all clients
- **Global Sprint Planning:** Plan and manage sprints for any department

### PM (Project Manager)
- **Project Document Management:** Create and manage project documents (client-scoped)
- **Task Control:** Full control over task details, assignment, and sprint allocation
- **Sprint Planning:** Assign tasks to sprints and manage department capacity
- **Team Coordination:** Assign work and manage project timelines within their scope

### Task Owner
- **Limited Task Interaction:** Update status and add comments on assigned tasks only
- **Personal Todo Management:** Full CRUD control over personal todos
- **Unified Workspace:** View and reorder assigned tasks with personal todos
- **Sprint Visibility:** Read-only access to sprints containing their tasks
- **Project Context:** Read-only access to projects where they have assigned tasks

### Client
- **Department-Scoped Access:** Can switch between their assigned departments
- **Read-Only Project Access:** View project documents with filtered content
- **Limited Interaction:** Comment in designated areas and complete assigned review tasks
- **Progress Visibility:** Monitor project and sprint progress for their departments

## Novel.sh Custom Blocks

### Tasks Block (`/tasks`)
**Purpose:** Interactive task management within documents with PM control and assignee interaction
**Features:**
- Add/edit/delete tasks (PM only)
- Task assignment to team members (PM only)
- Task sizing, type, and due date setting (PM only)
- Task status updates (assignee can modify)
- Task commenting (assignee can add)
- Sprint assignment (PM only)
- Priority indicators and progress visualization
- Clear visual distinction between PM-controlled and user-controlled fields
- Read-only view for assignees with limited interaction controls

### Stakeholders Block (`/stakeholders`)
**Purpose:** Team and client contact management
**Features:**
- User cards with roles and avatars
- Add/remove team members
- Client vs internal team separation
- Contact information display
- Role assignment
- Notification preferences

### Timeline Block (`/timeline`)
**Purpose:** Visual project progression
**Features:**
- Interactive timeline visualization
- Milestone markers
- Sprint period overlays
- Deadline tracking
- Progress indicators
- Gantt-style task dependencies

### Comments Block (`/comments`)
**Purpose:** Structured discussions and feedback
**Features:**
- Threaded comment discussions
- @mentions with notifications
- Client vs internal comment separation
- Approval workflows
- Comment resolution tracking
- Rich text formatting

### Capacity Block (`/capacity`)
**Purpose:** Sprint and workstream planning
**Features:**
- Sprint allocation visualization
- Workstream usage charts
- Capacity planning tools
- Resource utilization metrics
- Overallocation warnings

### Deliverables Block (`/deliverables`)
**Purpose:** Project output tracking
**Features:**
- File upload and attachment
- Deliverable checklists
- Approval workflows
- Version control
- Client download access
- Completion tracking

## Implementation Approach

This project will be built in phases, with each phase building upon the previous foundation. The implementation plan is detailed in a separate document with specific user stories and tasks for Cursor development.

### Foundation-First Strategy
1. **Core Infrastructure** - Next.js, Convex, Authentication
2. **Role-Based Access** - Ensure security and permissions work correctly
3. **Dashboard Shell** - Basic navigation and layouts with shadcn/ui
4. **Data Models** - All backend schemas and relationships
5. **Document Editor** - Novel.sh integration and custom blocks
6. **Advanced Features** - Sprint planning, collaboration, client access

### Critical Success Factors
- **Authentication & Permissions** must be rock-solid before building features
- **Real-time collaboration** infrastructure needs early establishment
- **Block-level permissions** are essential for client/internal separation
- **Document-centric approach** requires careful UX design
- **Sprint capacity logic** is the core differentiator

### Development Philosophy
- Start simple with text-only views to validate core functionality
- Build complexity incrementally with proper testing
- Focus on role-based permissions throughout development
- Prioritize real-time features for collaborative editing
- Maintain mobile responsiveness from the beginning

## Security & Performance

### Security Considerations
- **Role-based access control** enforcement at API level
- **Data isolation** between clients
- **Input validation** and sanitization
- **Secure authentication** implementation
- **Block-level permissions** for document content
- **Audit logging** for all document changes

### Performance Considerations
- **Progressive loading** for large documents
- **Block lazy loading** for complex functional blocks
- **Real-time optimization** for collaborative editing
- **Efficient queries** with proper indexing
- **Mobile-first** responsive design
- **Offline capability** for document editing

## Future Enhancements

### Phase 2: Document Type System
- **Document mode switcher** between Projects and Documentation workspaces
- **Multiple document types** (meeting notes, wiki articles, resources, retrospectives)
- **Type-specific templates** and block availability
- **Auto-linking capabilities** (meeting action items → project tasks)
- **Cross-references** between different document types
- **Advanced search scoping** by document type and content

### Advanced Document Features
- **AI-powered content suggestions** for project briefs
- **Template marketplace** for different project types
- **Advanced block types** (charts, forms, integrations)
- **Version branching** for major project iterations

### Integration Ecosystem
- **Slack integration** for document notifications
- **Google Drive/Workspace** sync for deliverables
- **Calendar integration** for timeline blocks
- **Third-party tool embeds** (Figma, Miro, etc.)

### Analytics & Insights
- **Document engagement metrics** for client collaboration
- **Project completion patterns** across document types
- **Resource utilization** analysis from capacity blocks
- **Client satisfaction** tracking through feedback blocks
- **Capacity calculation** based on task sizing in documents
- **Real-time updates** when tasks assigned to sprints
- **Sprint board** shows tasks in document context

### Real-Time Collaboration
- **Live cursor tracking** in document editing
- **Block-level locking** to prevent conflicts
- **Instant notifications** for @mentions and updates
- **Collaborative commenting** with threading

### Search & Discovery
- **Full-text search** across all project documents
- **Document type filtering** for focused search results (Phase 2)
- **Block-type filtering** (find all tasks, comments, etc.)
- **Client-scoped search** for organized results
- **Cross-document references** and auto-linking capabilities
- **Search scoping** by document type and content blocks

## Performance Considerations

### Document Loading
- **Progressive loading** of large documents
- **Block lazy loading** for complex functional blocks
- **Optimistic updates** for real-time collaboration
- **Efficient caching** of document content

### Real-Time Features
- **Selective synchronization** based on user permissions
- **Bandwidth optimization** for document updates
- **Offline capability** for document editing
- **Conflict resolution** for concurrent edits

## Future Enhancements

### Advanced Document Features
- **AI-powered content suggestions** for project briefs
- **Template marketplace** for different project types
- **Advanced block types** (charts, forms, integrations)
- **Version branching** for major project iterations

### Integration Ecosystem
- **Slack integration** for document notifications
- **Google Drive/Workspace** sync for deliverables
- **Calendar integration** for timeline blocks
- **Third-party tool embeds** (Figma, Miro, etc.)

### Analytics & Insights
- **Document engagement metrics** for client collaboration
- **Project completion patterns** across document types
- **Resource utilization** analysis from capacity blocks
- **Client satisfaction** tracking through feedback blocks

---

*This document-centric approach revolutionizes project management by making documentation a natural byproduct of project execution, while providing clients with unprecedented visibility and collaboration opportunities within the project context.*