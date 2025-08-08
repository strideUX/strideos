# strideOS - Core Specification

**strideOS** is the operating system for strideUX - a revolutionary project management solution where **projects ARE living documents**. Built with section-based document architecture using BlockNote editors, this tool eliminates the traditional separation between project management and documentation by making every project a collaborative, sectioned document containing both rich content and interactive PM functionality.

## Core Philosophy
- **Projects as Living Documents**: Every project is a rich document with embedded functional blocks
- **Progressive Documentation**: Documentation happens naturally as projects progress
- **Task vs Todo Distinction**: Tasks are project-owned and PM-controlled; Todos are personal and user-controlled
- **Unified Personal Workspace**: Users see assigned tasks and personal todos in one organized, reorderable list
- **Client Collaboration**: Clients interact within the project context, not separate tools
- **Single Source of Truth**: No duplication between PM tools and final documentation
- **Dedicated Admin Details View**: `/projects/[id]/details` provides a full-width admin view (Overview, Tasks, Team) complementary to the brief at `/projects/[id]`
- **Admin Safety Controls**: Admin-only project deletion with exact-name confirmation and full cascade cleanup

## Tech Stack

### Frontend
- **Next.js 15** (upgrade to 16 when stable)
- **TypeScript** for type safety
- **BlockNote** for section-based document editing with multiple editors
- **Tiptap/ProseMirror** (via BlockNote) for editor framework
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
  
  // Team Structure & Organization
  primaryContactId: string     // Client user (main point of contact)
  leadId: string              // Internal user (admin/pm role) who leads department
  teamMemberIds: string[]     // Additional client users assigned to department
  
  // Capacity Planning
  workstreamCount: number     // Number of parallel workstreams for capacity calculation
  
  // Future Integration
  slackChannelId?: string     // For department-specific Slack notifications
  
  createdAt: Date
  updatedAt: Date
}
```

#### Projects (Business Entities with Document Integration)
```typescript
interface Project {
  id: string
  title: string
  clientId: string
  departmentId: string
  status: 'new' | 'planning' | 'ready_for_work' | 'in_progress' | 'client_review' | 'client_approved' | 'complete'
  targetDueDate?: Date
  
  // Document integration (references standalone document system)
  documentId: string // Links to associated project brief document
  
  // Team management (dynamic composition)
  projectManagerId: string // Department lead (internal PM)
  teamMemberIds: string[] // Auto-populated from task assignments + department users
  
  // Administrative fields
  visibility: 'private' | 'department' | 'client' | 'organization'
  
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Project Status Flow:
// 1. 'new' - Initial intake and discovery
// 2. 'planning' - Active scoping and task definition
// 3. 'ready_for_work' - Tasks available for sprint planning
// 4. 'in_progress' - Active sprint contains project tasks
// 5. 'client_review' - Deliverables under review
// 6. 'client_approved' - Awaiting final steps
// 7. 'complete' - Project finished

// Project-Document Relationship:
// - Projects are business entities that reference Documents via documentId
// - Documents remain independent and support multiple use cases (project briefs, meeting notes, retros, etc.)
// - Project admin provides oversight; Document brief provides collaborative workspace
// - Tasks belong to projects but appear in both project admin views and document task blocks
// - Template information lives in Document schema, not Project schema

interface ProjectSection {
  id: string
  type: 'overview' | 'deliverables' | 'timeline' | 'feedback' | 'getting_started' | 'final_delivery' | 'weekly_status' | 'original_request' | 'team'
  title: string
  icon: string
  order: number
  content: JSONContent // BlockNote content for this section
  required: boolean // Cannot be deleted if last section
}
```

#### Document Templates (Section Configuration)
```typescript
interface DocumentTemplate {
  id: string
  name: string
  documentType: 'project_brief' | 'meeting_notes' | 'wiki_article' | 'resource_doc' | 'retrospective'
  sections: SectionTemplate[]
  createdAt: Date
  updatedAt: Date
}

interface SectionTemplate {
  type: 'overview' | 'deliverables' | 'timeline' | 'feedback' | 'getting_started' | 'final_delivery' | 'weekly_status' | 'original_request' | 'team'
  title: string
  icon: string
  order: number
  required: boolean
  defaultContent?: JSONContent // Default BlockNote content
  permissions: {
    canEdit: string[] // user roles
    canView: string[]
    clientVisible: boolean
  }
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
  maxCapacity: number // Calculated from department workstreams (hours); locked at creation
  currentCapacity: number // Sum of assigned task estimatedHours
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
  // Sizing: ideal days; persisted as estimatedHours (days × 8)
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL' // UI scale
  estimatedHours?: number // Source of truth for capacity math
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

## Department Organization & Capacity Model

### Department Structure
Departments serve as the organizational unit that bridges clients and projects, providing:
- **Team Boundaries:** Clear assignment of client users and internal leads to specific focus areas
- **Capacity Planning:** Workstream-based calculation for sprint planning
- **Communication Segmentation:** Department-specific notifications and Slack integration
- **Project Grouping:** All projects belong to a department for organizational clarity

### Team Assignment Model
- **Primary Contact:** Client user who serves as main point of contact for the department
- **Department Lead:** Internal user (admin/pm role) responsible for department management
- **Team Members:** Additional client users assigned to the department for collaboration
- **Multi-Department Assignment:** Users can belong to multiple departments as needed

### Capacity Calculation
Sprint capacity is calculated using department workstreams:
```
Sprint Capacity = workstreamCount × workstreamCapacity (from global settings)
```
- **Workstream Count:** Number of parallel work streams (set per department)
- **Workstream Capacity:** Default capacity per workstream (32 hrs/4 days for 2-week sprint)
- **Global Defaults:** Workstream capacity and sprint duration configured in system settings
- **Sprint Snapshot:** Capacity calculated and stored per sprint for historical accuracy

### Project-Department Relationship
- **All projects belong to exactly one department**
- **Sprint planning happens at department level** (tasks from multiple projects can be in same sprint)
- **Department inherits client status** (no separate department status needed)
- **Notifications and access are segmented by department assignment**

### Future Integration
- **Slack Channel Integration:** Each department can have dedicated Slack channel for notifications
- **Department-Scoped Notifications:** Users receive notifications only for their assigned departments
- **Cross-Department Coordination:** Projects can reference or depend on other department work

## User Management & Organization Structure

### Organization Model
All users belong to a single organization (multi-tenant ready for future SaaS):
- **Organization:** Top-level entity containing all settings, users, and clients
- **Settings:** Global defaults for workstream capacity, sprint duration, branding
- **Feature Flags:** Control feature rollout and integrations
- **Email Configuration:** Branded templates and sender settings

### User Assignment Rules

#### Client Users
- **MUST** be assigned to exactly one client
- **MAY** be assigned to zero or more departments within that client
- **CANNOT** be assigned to multiple clients
- **Purpose:** Allows for stakeholder visibility without full project participation
- **Department Assignment:** Optional - enables users to view client-wide info without department noise

#### Internal Users (Admin/PM/Task Owner)
- **MAY** be assigned to a client (for dedicated support)
- **MAY** be assigned to departments (for project involvement)
- **CAN** work across multiple clients and departments
- **Purpose:** Flexible assignment for internal team management

### User Onboarding Flow
1. **Admin Creates User:** Sets name, email, role, and assignments
2. **Invitation Email:** Branded email with secure token sent via Postmark
3. **Password Setup:** User clicks link, sets password (8+ chars, 1 upper, 1 lower, 1 number)
4. **Status Transition:** Changes from "invited" to "active" upon password creation
5. **Auto-Login:** User automatically logged in after password setup
6. **Profile Completion:** Optional avatar and profile updates post-login

### Authentication & Security
- **No Public Signup:** All users must be created by admin
- **Password Requirements:** Minimum 8 characters with complexity rules
- **Token Expiration:** Password reset tokens expire after 48 hours
- **Future Integration:** Slack OAuth planned for seamless authentication

## User Roles & Permissions

### Admin (Super PM + System Management)
- **System Administration:** Full user, client, and department management
- **Organization Settings:** Configure defaults, branding, and features
- **Global Configuration:** Workstream capacity, sprint durations, system settings
- **Complete PM Access:** Can create, edit, and manage any project document across all clients
- **Cross-Client Visibility:** See and manage projects, sprints, and tasks across all clients
- **Global Sprint Planning:** Plan and manage sprints for any department

### PM (Project Manager)
- **Project Document Management:** Create and manage project documents (client-scoped)
- **Task Control:** Full control over task details, assignment, and sprint allocation
- **Sprint Planning:** Assign tasks to sprints and manage department capacity
- **Team Coordination:** Assign work and manage project timelines within their scope
- **User Visibility:** Can view team workload and capacity

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
- **Stakeholder Mode:** Can be assigned to client without department for overview access

## Section-Based Document Architecture

### Section Types & Purpose

#### Overview Section
**Purpose:** Project summary and high-level information
**UI Components:**
- Project metadata and stats
- Status indicators and progress visualization
- Key stakeholder information
- Project timeline overview
**Content:** BlockNote editor for project description and details

#### Deliverables Section (Tasks)
**Purpose:** Interactive task management for project deliverables
**UI Components:**
- Task creation and management interface (PM only)
- Task assignment and sizing controls (PM only)
- Task status updates (assignee accessible)
- Sprint assignment visualization
- Priority indicators and progress tracking
**Content:** BlockNote editor for task notes and documentation

#### Timeline Section (Sprint Schedule)
**Purpose:** Visual project progression and sprint planning
**UI Components:**
- Sprint schedule visualization
- Task assignment to sprints
- Timeline and milestone tracking
- Resource allocation display
**Content:** BlockNote editor for timeline notes and adjustments

#### Feedback Section
**Purpose:** Client feedback management and communication
**UI Components:**
- Feedback submission interface
- Approval workflows
- Client communication tools
- Feedback resolution tracking
**Content:** BlockNote editor for feedback discussion and notes

#### Getting Started Section
**Purpose:** Project onboarding and setup information
**UI Components:**
- Onboarding checklists
- Setup instructions
- Resource links and references
**Content:** BlockNote editor for setup instructions and resources

#### Final Delivery Section
**Purpose:** Project completion and handoff tracking
**UI Components:**
- Completion checklists
- Deliverable tracking
- Client sign-off workflows
- Project closure documentation
**Content:** BlockNote editor for final delivery notes and handoff information

#### Weekly Status Section
**Purpose:** Regular progress updates and reporting
**UI Components:**
- Weekly update forms
- Progress indicators
- Milestone tracking
- Status reporting tools
**Content:** BlockNote editor for detailed weekly update information

#### Original Request Section
**Purpose:** Initial project requirements and specifications
**UI Components:**
- Requirements documentation
- Original brief preservation
- Scope management tools
**Content:** BlockNote editor for original project brief and requirements

#### Team Section
**Purpose:** Stakeholder management and team coordination
**UI Components:**
- Team member cards with roles and avatars
- Stakeholder management interface
- Contact information display
- Role assignment and permissions
**Content:** BlockNote editor for team notes and coordination information

## Implementation Approach

This project will be built in phases, with each phase building upon the previous foundation. The implementation plan is detailed in a separate document with specific user stories and tasks for Cursor development.

### Foundation-First Strategy
1. **Core Infrastructure** - Next.js, Convex, Authentication
2. **Role-Based Access** - Ensure security and permissions work correctly
3. **Dashboard Shell** - Basic navigation and layouts with shadcn/ui
4. **Data Models** - All backend schemas and relationships
5. **Document Editor** - BlockNote integration with section-based architecture
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