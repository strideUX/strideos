# Admin UX Refinement Specification

## Overview

This document outlines the comprehensive UX refinement plan for the StrideOS admin interface, focusing on creating a cohesive, demo-ready experience that balances document-centric project management with efficient administrative workflows.

## Navigation Structure

### Admin Navigation
```
├── Inbox (Notifications/Actions)
├── My Work (Personal Dashboard)
├── Projects (Project Management)
├── Sprints (Sprint Planning)
├── Team (Capacity Planning)
├── Clients
│   ├── Acme Corp
│   ├── Tech Solutions
│   ├── Startup Inc
│   └── Enterprise Co
└── Admin Config
    ├── Clients (Client Management)
    ├── Users (User Management)
    └── Settings (System Settings)
```

### PM Navigation
- Same as Admin but without "Admin Config" section
- Retains all operational views

## Core Concepts

### 1. Project Management Architecture

#### Document-Centric Approach
- **Project Brief Document** = Primary interface and source of truth
- Tasks managed within document via custom blocks
- Client-facing and collaborative environment
- Rich context surrounds all project elements

#### Admin Interface Role
- Quick project overview and metadata adjustments
- Bulk task operations
- Cross-project visibility
- PM-specific workflows
- Operational efficiency without opening documents

### 2. Sprint Architecture

#### Hierarchy
```
Client
└── Department
    └── Sprint
        ├── Capacity = (# of workstreams × base capacity)
        └── Tasks (pulled from any project in department)
```

#### Key Principles
- Sprints belong to **departments**, not projects
- Department backlog = All unassigned tasks from all department projects
- Tasks can be pulled from multiple projects into one sprint
- Dynamic capacity tracking during sprint planning

#### Capacity Calculation
- **Base capacity**: 32 hours (4 days) per workstream per sprint (global setting)
- **Department workstreams**: Configurable per department
- **Sprint capacity**: Calculated at sprint creation (locked value)
- Example: 3 workstreams × 32 hours = 96 hours sprint capacity

### 3. Task Management

#### Task Properties
- **Assignment**: Single user at a time
- **Type**: deliverable, bug, feedback, personal/todo
- **Skill Category**: design, engineering, PM, stakeholder
- **Size**: T-shirt sizing with day values
  - XS = 0.5 days (4 hours)
  - S = 2 days (16 hours)
  - M = 4 days (32 hours)
  - L = 6 days (48 hours)
  - XL = 8 days (64 hours)

#### Task Workflow
1. Tasks created in project (via document or admin)
2. Tasks available in department backlog when project is "Ready for Work"
3. Tasks pulled into sprints during planning
4. Tasks appear in assignee's "My Work" when sprint is active
5. Users can reorder their task list and add personal todos

#### Task Permissions
- **Task Owners**: Update status, add comments (cannot edit task details)
- **PMs/Admins**: Full edit capabilities on all tasks
- **Clients**: Can be assigned tasks, add comments, update status
- **Personal Todos**: Private to user, full edit control

## Status Flows

### Task Status
- `todo` → `in-progress` → `in-review` → `complete`
- Additional states: `blocked`

### Project Status
1. `New (Planning)` - Initial intake and scoping
2. `Ready for Work` - Tasks available for sprint planning
3. `In Progress` - Active sprint contains project tasks
4. `Client Review` - Deliverables under review
5. `Client Approved` - Awaiting final steps
6. `Complete` - Project finished

### Sprint Status
- `Planning` → `Active` → `Complete`

## View Specifications

### 1. Inbox View
- Unified notification center
- Categorized by type (task assignments, comments, status changes)
- Quick actions (mark read, view source)
- Priority indicators

### 2. My Work View
- Combined view of assigned tasks and personal todos
- Reorderable list
- Task context (project/sprint info)
- Upcoming deadlines sidebar
- Quick add for personal todos

### 3. Projects View
- Project cards with key metrics
- Quick access to project brief document
- Inline task management
- Status and progress tracking
- Filter by client/status

### 4. Sprints View
- Sprint timeline visualization
- Create sprint with client/department selection
- Capacity planning interface
- Sprint metrics and velocity tracking

### 5. Team View
- Team member capacity/workload
- Department grouping
- Contact information
- Current assignments

### 6. Client Views
- Filtered view of client's departments, projects, sprints
- Quick create actions (project/sprint)
- Active vs. Upcoming tabs
- Client-specific metrics

### 7. Admin Config Views
- **Clients**: Add/edit clients and departments
- **Users**: User management and role assignment
- **Settings**: Global configurations (base capacity, etc.)

## User Roles & Permissions

### Internal Roles
1. **Admin**: Full system access
2. **PM**: Operational access, no admin config
3. **Task Owner**: Limited to assigned work and personal items

### External Role
4. **Client**: Department-scoped access, limited actions

## Department Configuration
- Primary client contact (required)
- Internal PM lead (required)
- Number of workstreams
- Client users assigned to department
- All projects in department inherit these stakeholders

## Notification Triggers
- New task assignment
- Task status changes
- Comments on tasks/projects
- Sprint start/end
- Overdue tasks/projects
- Project status changes

## Demo Flow

### Optimal Demo Path
1. **Client Setup** (Admin > Clients)
   - Create client with departments
   - Assign users and workstreams

2. **Project Creation** (Projects > New)
   - Fill metadata
   - Create project brief document
   - Add initial tasks in document

3. **Sprint Planning** (Sprints > New)
   - Select client/department
   - View capacity and backlog
   - Drag tasks into sprint
   - Monitor capacity usage

4. **Task Management** (My Work)
   - View assigned tasks
   - Update status
   - Add personal todos

5. **Client Collaboration** (Documents)
   - Review project brief
   - Add feedback tasks
   - Track progress

## Implementation Phases

### Phase 1: Navigation & Route Consolidation
- Update sidebar navigation
- Consolidate duplicate routes
- Create consistent layouts

### Phase 2: Core Views
- Implement Inbox with real notifications
- Build My Work with mixed task types
- Create Projects with document integration
- Develop Sprints with capacity planning

### Phase 3: Client & Team Views
- Client-filtered dashboards
- Team capacity visualization
- Department management

### Phase 4: Admin Configuration
- Client/department setup
- User management
- Global settings

### Phase 5: Polish & Demo Prep
- Sample data generation
- Smooth transitions
- Performance optimization

## Key Differentiators
1. **Document-centric** project management
2. **Flexible sprint planning** across projects
3. **Department-based** resource allocation
4. **Dual-interface** flexibility (document + admin)
5. **Real-time** collaboration via Convex

## Schema Extensions Required

### Safe Additions (DO NOT MODIFY EXISTING)
**🚨 CRITICAL:** Only ADD optional fields. Never modify existing document/documentSections tables.

#### Tasks Table Extensions
```typescript
// ADD to existing tasks table (schema.ts:xxx)
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
```

#### Personal Todos Table (NEW)
```typescript
// NEW table for personal todos in My Work view
personalTodos: defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  userId: v.id('users'),
  status: v.union(v.literal('todo'), v.literal('done')),
  priority: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
  dueDate: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number()
}).index('by_user', ['userId']),
```

#### Users Table Extensions  
```typescript
// ADD to existing users table (schema.ts:10)
workstreams: v.optional(v.array(v.object({
  name: v.string(),
  hoursPerSprint: v.number() // Default 32
}))),
currentWorkload: v.optional(v.number()), // Percentage 0-100
```

### Protected Areas (DO NOT TOUCH)
- `documents` table structure ✅ PRESERVE
- `documentSections` table structure ✅ PRESERVE  
- `documentTemplates` table structure ✅ PRESERVE
- All BlockNote custom blocks ✅ PRESERVE
- Document permissions system ✅ PRESERVE

## Reference Implementation

### Static Mockup Components
**Location:** `/Users/mattelsey/Documents/Work/Playground/admin-panel/components/views/`

**✅ Use These Patterns:**
- **Component Structure:** KPI cards, table layouts, search/filter patterns
- **UI Components:** shadcn/ui usage, card headers, progress bars, badges
- **Status/Priority Systems:** Color coding, badge variants, icon usage
- **Layout Grids:** 4-column KPI sections, responsive breakpoints
- **Data Display:** Team avatars, workload visualizations, notification styling

**⚠️ Adapt These Concepts:**
- **Navigation:** Mockup uses basic routing - adapt to role-based navigation
- **Data Flow:** Static data - replace with Convex subscriptions  
- **Sprint Model:** Mockup shows project-based - implement department-based
- **Document Integration:** Add click-through to document editor
- **Personal Todos:** Extend task model rather than separate system

**Key Files to Reference:**
- `inbox-view.tsx` - Notification categorization and priority handling
- `my-work-view.tsx` - Task list structure and personal todo integration
- `projects-view.tsx` - Project table and document navigation patterns
- `team-view.tsx` - Capacity visualization and workload display
- `client-view.tsx` - Department filtering and metrics display

## Technical Considerations
- All data synced via Convex subscriptions
- Document blocks update in real-time
- Sprint capacity calculations are dynamic
- Notifications use Convex reactivity
- Role-based view filtering at component level