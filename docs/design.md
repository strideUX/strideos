# strideOS - Navigation & UI Guide

## Overview
strideOS uses role-based navigation to provide each user with appropriate access and functionality. The interface is built on shadcn/ui dashboard blocks with a document-centric approach where projects are living documents with embedded functional blocks.

**Phase 1:** Single navigation focused on project management ✅ **COMPLETED**
**Phase 2:** Mode switcher enabling separate Projects and Documentation workspaces
**Current Phase:** Editor Enhancement Phase - BlockNote migration and custom block development

---

## Implementation Consistency Standards

### Reference Page System
- **Admin List Pages**: Follow established data table pattern
- **Detail Pages**: Follow established editor/view pattern
- **Coming Soon Pages**: Use standardized placeholder pattern

### Development Workflow
- Analyze existing patterns before implementation
- Copy proven structures rather than innovating
- Maintain component library consistency
- Follow established navigation patterns

### Quality Gates
- New pages must match existing similar pages
- Component usage must be consistent with established patterns
- Styling must follow existing color/typography schemes
- Navigation integration must match established patterns

### Current Editor Implementation
**BlockNote Editor with shadcn/ui Integration:**
- **Professional Theming:** Custom CSS theme integrating with shadcn/ui design system
- **Auto-Save:** 3-second auto-save with visual status indicators
- **Content Persistence:** Real database integration with content cleaning
- **Performance:** Optimized for smooth editing experience
- **Mobile Responsive:** Touch-friendly interface with responsive design
- **Accessibility:** Keyboard shortcuts, tooltips, and screen reader support

**Demo Platform:** `/editor-demo` for iteration and testing

---

## Admin Navigation (Super PM + System Management)

### Sidebar Menu:
- **📊 Dashboard** - System overview + project management metrics
- **📁 Projects** - Full PM access to all project documents across all clients
- **🏃 Sprints** - Complete sprint planning and management for all departments
- **✅ Tasks** - Task overview across all projects and clients
- **👥 Users** - User management and role assignment *(admin only)*
- **🏢 Clients** - Client & department management with workstream config *(admin only)*
- **⚙️ Settings** - System configuration and global settings *(admin only)*

### Admin Dashboard Layout:
**System Health Section:**
- Active users, total clients, system metrics
- Recent user activity and registrations
- Global project completion rates

**Project Management Section:**
- Active sprints across all departments
- Cross-client project status overview
- Capacity utilization across all departments
- Urgent tasks and overdue items

### Admin Capabilities:
- **Full PM Access:** Can create, edit, and manage any project document
- **System Administration:** User management, client setup, global configuration
- **Cross-Client Visibility:** See and manage projects across all clients
- **Global Sprint Planning:** Plan and manage sprints for any department
- **System Configuration:** Workstream capacity, sprint durations, global settings

---

## PM (Project Manager) Navigation

### Sidebar Menu:
- **📊 Dashboard** - Active sprints, project overview, capacity metrics
- **📁 Projects** - Project documents they manage (client-scoped)
- **🏃 Sprints** - Sprint planning and management for their departments
- **✅ Tasks** - Task overview across their managed projects

### PM Dashboard Layout:
**Active Sprints Section:**
- Current sprint capacity and utilization
- Upcoming sprint planning needs
- Overdue tasks and capacity warnings

**Project Overview Section:**
- Recent project activity and updates
- Projects requiring attention
- Client deliverables and deadlines

### PM Capabilities:
- **Project Document Management:** Create, edit, manage project documents
- **Task Control:** Full control over task details (title, description, due date, size, type, assignment)
- **Sprint Planning:** Assign tasks to sprints, manage capacity
- **Team Coordination:** Assign work and manage project timelines

---

## Task Owner Navigation

### Sidebar Menu:
- **🏠 Dashboard** - Personal workspace with unified task/todo list
- **📋 My Work** - Alternative view of personal dashboard
- **🏃 Sprints** - Read-only view of sprints containing their tasks
- **📁 Projects** - Read-only view of projects where they have assigned tasks

### Task Owner Dashboard (Primary Workspace):
**Unified Task/Todo List:**
```
My Work Today:
├── 🔒 [TASK] Design homepage mockups (Due: Jan 15, 2 days) [Sprint 3]
├── ✏️ [TODO] Review quarterly goals (Personal)
├── 🔒 [TASK] Client feedback review (Due: Jan 12, 0.5 days) [Sprint 3]
├── ✏️ [TODO] Schedule dentist appointment (Personal)
└── ✏️ [TODO] Update portfolio (Personal)
```

**Features:**
- **Drag-and-drop reordering** for personal organization
- **Visual distinction** between tasks (🔒 locked) and todos (✏️ editable)
- **Status updates** for assigned tasks
- **Full CRUD** for personal todos
- **Sprint context** shown for assigned tasks

### Sprint View for Task Owners:
**Current Sprint:**
- My tasks with status and deadlines
- Sprint timeline and progress
- Other team member tasks (for coordination)
- Sprint capacity visualization (read-only)

**Upcoming Sprints:**
- Tasks assigned to me in future sprints
- Planning timeline and sprint dates

### Task Owner Capabilities:
- **Task Status & Comments:** Update status and add comments on assigned tasks
- **Personal Todo Management:** Full control over personal todos
- **Task/Todo Organization:** Reorder unified work list
- **Sprint Visibility:** See sprint context and team coordination

---

## Client Navigation

### Header Controls:
- **Department Switcher** - Toggle between their assigned departments
- **User Profile** - Account settings and logout

### Sidebar Menu:
- **📊 Dashboard** - Project status overview for selected department
- **📁 Projects** - Project documents (read-only) for selected department  
- **🏃 Sprints** - Sprint progress for selected department (read-only)

### Client Dashboard Layout:
**Department Overview:**
- Active projects in selected department
- Recent project updates and milestones
- Upcoming deliverables and deadlines

**Sprint Progress:**
- Current sprint status for department
- Deliverables expected from current sprint
- Timeline and completion estimates

### Client Project Document View:
**Available Blocks (Read-Only):**
- Project brief and scope
- Timeline and milestones
- Deliverables and outputs
- Progress indicators

**Limited Interactions:**
- Comment in designated comment blocks
- Complete assigned review tasks
- Approve deliverables
- View project history and updates

### Client Capabilities:
- **Department Switching:** View different departments within their client
- **Project Visibility:** Read-only access to project documents
- **Limited Interaction:** Comment and complete assigned review tasks
- **Progress Tracking:** Monitor project and sprint progress

### Global Search & Discovery:
**Phase 1:**
- **Full-text search** across all project documents
- **Block-type filtering** (tasks, comments, stakeholders, etc.)
- **Client-scoped results** for organized search

**Phase 2 Enhancements:**
- **Document type filtering** (project briefs, meeting notes, wiki articles)
- **Cross-document references** and auto-linking
- **Advanced search scoping** by workspace mode
- **Auto-linking suggestions** (meeting actions → project tasks)

---

## Phase 2: Mode Switcher & Documentation Workspace

### Global Mode Switcher (Phase 2)
Located in the top navigation bar:
```
[Projects ▼] [User Profile] [Notifications]
     ↓
[Projects] [Documentation]
```

When switching modes, the entire sidebar navigation changes to match the workspace context.

### Admin Documentation Mode (Phase 2)
When admin switches to Documentation mode:

**Documentation Workspace Sidebar:**
- **📊 Documentation Dashboard** - Document analytics and team activity
- **📚 Company Wiki** - Internal knowledge base and processes
- **📋 Team Resources** - Templates, guidelines, best practices
- **📝 Meeting Notes** - Team meeting documentation
- **🔄 Retrospectives** - Project learnings and improvements
- **🔍 Search All Docs** - Advanced search with type filtering

### Client Documentation Mode (Phase 2)
When client switches to Documentation mode:

**Client Documentation Sidebar:**
- **📊 Documentation Home** - Overview of their documentation
- **📁 Completed Projects** - Archive of finished project documents
- **📚 Resources & Guidelines** - Client-specific resources
- **🔍 Search Documents** - Search across their documentation

### Cross-Document Features (Phase 2)
- **Auto-linking** - Meeting action items automatically create project tasks
- **Cross-references** - Wiki articles can reference and link to projects
- **Document relationships** - Visual connections between related documents
- **Smart suggestions** - System suggests relevant documents based on content

---

## Common UI Elements

### Phase 1 Navigation Components:
- **Sidebar:** Role-based menu with active state indicators
- **Header:** User profile, notifications, global search
- **Breadcrumbs:** Clear navigation path within documents and sections
- **Role Indicators:** Visual cues showing permission levels

### Phase 2 Navigation Enhancements:
- **Mode Switcher:** Toggle between Projects and Documentation workspaces
- **Document Type Indicators:** Visual badges for different document types
- **Cross-Reference Links:** Clickable links between related documents
- **Auto-Link Suggestions:** Smart suggestions for document connections

### Document Interface:
**Phase 1:**
- **Floating TOC:** Table of contents for document navigation
- **Block Toolbar:** Insert custom blocks (/tasks, /stakeholders, etc.)
- **Section Anchors:** Quick jump navigation between document sections
- **Real-time Indicators:** Show active collaborators and recent changes

**Phase 2 Enhancements:**
- **Document Type Templates:** Pre-configured layouts for different document types
- **Cross-Reference Panel:** Show related documents and auto-link suggestions
- **Document Mode Indicators:** Visual cues for current workspace mode
- **Smart Block Suggestions:** Context-aware block recommendations

### Data Display:
**Phase 1:**
- **Status Badges:** Consistent color coding (draft, active, review, complete)
- **Progress Bars:** Project, sprint, and capacity visualization
- **Capacity Indicators:** Visual warnings for overallocation
- **Priority Markers:** High/medium/low priority visual cues

**Phase 2 Enhancements:**
- **Document Type Badges:** Visual indicators for meeting notes, wiki articles, etc.
- **Cross-Reference Indicators:** Show when documents are linked to each other
- **Auto-Link Highlights:** Visual cues for automatically created links
- **Template Indicators:** Show when documents are based on templates

### Interactive Elements:
- **Drag-and-Drop:** Sprint planning and personal task organization
- **Inline Editing:** Document content and block interactions
- **Modal Forms:** Create/edit operations for structured data
- **Toast Notifications:** Success, error, and update messages

---

## Role-Based UI States

### Task Blocks in Documents:

**PM View:**
- ✅ Edit task title, description, due date, size, type
- ✅ Assign tasks to team members
- ✅ Assign tasks to sprints
- ✅ Delete tasks
- 📝 Full editing controls visible

**Task Owner View (Assigned Tasks):**
- ❌ Read-only task details (grayed out)
- ✅ Update task status (checkbox)
- ✅ Add comments
- 🔒 "PM Controlled" indicators on locked fields

**Client View:**
- ❌ Read-only task list
- ❌ No editing capabilities
- 👁️ High-level progress indicators only

### Personal Todo Interface:

**Available to Task Owners Only:**
- ✅ Create new personal todos
- ✅ Edit todo title, description, due date
- ✅ Reorder todos with assigned tasks
- ✅ Mark todos complete
- ✅ Delete personal todos

---

## Responsive Design Patterns

### Mobile (< 768px):
- **Collapsible sidebar** with hamburger menu
- **Stacked dashboard cards** instead of grid layout
- **Touch-friendly** drag-and-drop with larger targets
- **Simplified task/todo list** with swipe actions

### Tablet (768px - 1024px):
- **Condensed sidebar** with icon + text
- **Two-column dashboard** layout
- **Touch-optimized** sprint planning interface
- **Modal overlays** for detailed editing

### Desktop (> 1024px):
- **Full sidebar** with complete navigation
- **Multi-column dashboard** layouts
- **Advanced drag-and-drop** with visual feedback
- **Side panels** for quick actions and details

---

## Accessibility Standards

### Navigation:
- **Keyboard navigation** for all interactive elements
- **Screen reader support** with proper ARIA labels
- **Focus indicators** visible and consistent
- **Skip links** for main content areas

### Visual Design:
- **High contrast** ratios for text and backgrounds
- **Color-blind friendly** status indicators
- **Scalable text** support up to 200%
- **Reduced motion** options for animations

### Interactive Elements:
- **Clear focus states** for all interactive elements
- **Descriptive link text** and button labels
- **Error messages** clearly associated with form fields
- **Loading states** with appropriate feedback

---

## Performance Considerations

### Document Loading:
- **Progressive loading** for large project documents
- **Block lazy loading** for complex functional blocks
- **Skeleton screens** during initial load
- **Optimistic updates** for real-time collaboration

### Navigation:
- **Route prefetching** for likely next pages
- **Cached navigation** state between page loads
- **Instant transitions** for dashboard switching
- **Background sync** for real-time updates

This navigation structure provides each user role with exactly what they need while maintaining consistency in the document-centric approach across all user types. Phase 2 enhancements will add the mode switcher and documentation workspace capabilities while preserving all Phase 1 functionality.
