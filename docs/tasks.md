# strideOS - Implementation Tasks & User Stories

## Current Session Status
**Last Updated:** January 2025  
**Session Duration:** January 2025  
**Current Focus:** Feature 17.3 – JIRA-Style Slug Identifiers  
**Next Session Focus:** Feature 17.3 – JIRA-Style Slug Identifiers  
**Session Strategy:** Established production deployment workflow with automated versioning.

**Recent Enhancement:** Implemented Dark Mode Theme System with database persistence
- Backend: added `users.themePreference` in `convex/schema.ts`; new mutation `users.updateThemePreference`
- Frontend: created `src/components/providers/ThemeProvider.tsx` and wrapped in `src/app/layout.tsx`
- UI: wired `AccountPreferencesTab` theme selector to mutation with instant apply and toast
- Tailwind: class-based dark theme confirmed via `.dark` + `@custom-variant` in `globals.css`

**Recent Enhancement:** Sprint Page UX Redesign (Tabs + Kanban) & Client Dashboard Refinement
- Frontend: refactored `src/app/(dashboard)/sprints/page.tsx` to tabbed layout: Active Sprints | Upcoming | Completed
- New Kanban: `src/components/sprints/ActiveSprintsKanban.tsx` aggregates tasks across all active sprints
- Data Table Filters: `src/components/sprints/SprintsTable.tsx` now accepts `statusFilter` for planning/completed views
- Backend: added `convex/tasks.ts#getTasksForActiveSprints` to fetch tasks across active sprints with enrichment and RBAC
- Empty states and compact cards with client logo, project subtitle, size and sprint badges
- Client page: replaced content with client‑scoped tabs (Active Sprints Kanban, Planning, Completed, Projects, Team)
- Added `ClientActiveSprintsKanban` and inner tab components to ensure hook ordering
- Updated KPI cards: Active Sprint Capacity, Total Projects, Projects At Risk, Team Members
- Backend: `clients.getClientDashboardById` now returns `atRiskProjects`, `activeSprintCapacityHours`, `activeSprintCommittedHours`

### 🚀 SESSION STATUS: Feature 17.2.8 Complete
**Status:** ✅ COMPLETE – Deployment workflow with automated versioning

### 🎯 Session Accomplishments Summary (January 2025)
- ✅ Fixed Vercel deployment issues with Tailwind CSS v4 and Lightning CSS
- ✅ Established dev/main branch strategy with automatic deployments
- ✅ Implemented version management system with environment-aware display
- ✅ Created GitHub Actions for automatic version bumping (dev and production)
- ✅ Version displays on login screen and user menu
- ✅ Comprehensive deployment documentation created

### 📋 Next Session Priorities (Feature 17.3)
1. Backend schema for slugs (project keys, slug fields, counters)
2. Slug generation mutations + search queries
3. UI surfacing of slugs (tables, cards, details) and routing
4. Migration planning for existing data

---

## ✅ COMPLETED: Feature 22 – User Account Management System
**Status:** ✅ PRODUCTION READY

**Acceptance Criteria Met:**
- Users can update profile information (name, email, job title)
- Users can change their password with proper validation
- Users can add or change profile avatar
- All changes validated and securely processed
- Success/error feedback for all operations

**Implementation Notes:**
- Frontend: `src/app/(dashboard)/account/page.tsx` with `AccountProfileTab`, `AccountSecurityTab`, `AccountPreferencesTab`
- Backend: `convex/users.ts` new mutations listed above; reuses existing auth token set flow in `convex/auth.ts`
- UI: shadcn/ui Cards, Tabs, Inputs, Buttons; toasts via `sonner`
- Nav: `src/components/app-sidebar.tsx` and `src/components/nav-user.tsx` updated to show avatar and link to Account

**Files Created/Modified (key):**
- `src/app/(dashboard)/account/page.tsx`
- `src/components/account/AccountProfileTab.tsx`
- `src/components/account/AccountSecurityTab.tsx`
- `src/components/account/AccountPreferencesTab.tsx`
- `src/components/app-sidebar.tsx`
- `convex/users.ts`

---

## 📋 Feature 17.2 Series Roadmap

### ✅ Feature 17.2.8 – Deployment & Version Management
**Completed:** January 2025  
**Status:** Production Ready  
**Key Achievements:**
- **Vercel Deployment Fixed**: Resolved Tailwind CSS v4 and Lightning CSS compatibility issues
- **Branch Strategy**: Established dev/main branches with automatic deployments
- **Version Management**: Semantic versioning with environment-aware display
- **Automated Versioning**: GitHub Actions for dev (patch) and production (major/minor/patch) bumps
- **Version Display**: Added to login screen and user dropdown menu
- **Documentation**: Created comprehensive deployment workflow guide

**Technical Implementation:**
- Created `src/lib/version.ts` for version management
- Updated `vercel.json` with Linux binary installation commands
- Created `.github/workflows/dev-version-bump.yml` for dev auto-versioning
- Created `.github/workflows/version-bump.yml` for production versioning
- Updated `src/components/auth/SignInForm.tsx` with version display
- Updated `src/components/nav-user.tsx` with version in dropdown
- Created `docs/deployment-workflow.md` documentation

<!-- Removed legacy mislabeled summary (was duplicating Feature 22 content) -->

### ✅ Feature 17.2.3 Completion Summary
**Completed:** December 2024  
**Status:** Production Ready  
**Key Achievements:**
- **Complete Projects Dashboard**: Enhanced project management interface with stats cards, advanced filtering, and comprehensive project details
- **7-Status Project Workflow**: Updated project status system with new, planning, ready_for_work, in_progress, client_review, client_approved, complete
- **Project Stats & Metrics**: Real-time dashboard with total projects, on-track projects, at-risk projects, and average progress
- **Enhanced Project Table**: Progress bars, team avatars, status badges, and advanced filtering by client, department, and PM
- **Project Details Modal**: Tabbed interface with Overview, Tasks, and Team tabs for comprehensive project management
- **Unified Task Integration**: Full task management within projects using existing task system
- **Dynamic Team Composition**: Automatic team assembly from department members and task assignees

**Technical Implementation:**
- Updated `convex/schema.ts` with new 7-status project workflow
- Updated `convex/projects.ts` with new queries for stats, team composition, and project tasks
- Created `/src/app/(dashboard)/projects/page.tsx` with enhanced dashboard
- Created `src/components/projects/ProjectStatsCards.tsx` for dashboard metrics
- Created `src/components/projects/ProjectFilters.tsx` for advanced filtering
- Created `src/components/projects/ProjectsTable.tsx` for enhanced project table
- Created `/src/app/projects/[id]/details/page.tsx` with dedicated project details page
- Created `src/components/projects/ProjectOverviewTab.tsx` for project overview
- Created `src/components/projects/ProjectTasksTab.tsx` for task management
- Created `src/components/projects/ProjectTeamTab.tsx` for team composition

**Files Created/Modified:**
- `convex/schema.ts` - Updated project status workflow
- `convex/projects.ts` - Added new queries and updated mutations
- `src/app/(dashboard)/projects/page.tsx` - Complete rewrite with enhanced dashboard
- `src/app/projects/[id]/details/page.tsx` - New dedicated project details page
- `src/components/projects/` - All new project management components
- Updated project creation to use new status system
- Removed `src/components/projects/ProjectDetailsModal.tsx` (replaced with dedicated page)

### ✅ Feature 17.2.9 Completion Summary
**Completed:** December 2024  
**Status:** Production Ready  
**Key Achievements:**
- **Complete Organization Settings Management**: Three-tab interface for general, sprint/capacity, and email/features configuration
- **Logo Upload System**: Integrated with Convex file storage for organization branding
- **Sprint & Capacity Settings**: Default values for sprint duration and workstream capacity with helpful previews
- **Email & Feature Configuration**: Email sender settings, brand color management, and feature toggles
- **Professional UI**: Consistent with existing admin patterns using shadcn/ui components
- **Real-time Updates**: All settings update immediately with proper validation and error handling

**Technical Implementation:**
- Created `/src/app/(dashboard)/admin/settings/page.tsx` with tabbed interface
- Created `src/components/admin/SettingsGeneralTab.tsx` for organization info and logo
- Created `src/components/admin/SettingsSprintTab.tsx` for sprint/capacity defaults
- Created `src/components/admin/SettingsEmailTab.tsx` for email and feature settings
- Updated `convex/organizations.ts` with logo upload mutations and queries

**Files Created/Modified:**
- `src/app/(dashboard)/admin/settings/page.tsx` - Main settings page with tabs
- `src/components/admin/SettingsGeneralTab.tsx` - General settings component
- `src/components/admin/SettingsSprintTab.tsx` - Sprint settings component  
- `src/components/admin/SettingsEmailTab.tsx` - Email & features component
- `convex/organizations.ts` - Added logo upload functionality

### Section Refinement Order (Admin Config First):
1. **Feature 17.2.1:** Inbox Section Deep Dive ✅ **COMPLETED**
2. **Feature 17.2.2:** My Work Section Deep Dive ✅ **COMPLETED**
3. **Feature 17.2.7:** Client Admin Config Deep Dive ✅ **COMPLETED**
4. **Feature 17.2.8:** User Admin Config Deep Dive ✅ **COMPLETED**
5. **Feature 17.2.9:** Settings Admin Config Deep Dive ✅ **COMPLETED**
6. **Feature 17.2.3:** Projects Section Deep Dive ✅ **COMPLETED**
7. **Feature 17.2.4:** Sprints Section Deep Dive ✅ **COMPLETED**
8. **Feature 17.2.5:** Team Section Deep Dive ✅ **COMPLETED**
9. **Feature 17.2.6:** Client View Section Deep Dive ✅ **COMPLETED**

---

## ✅ Completed: Feature 17.2.4 – Sprints Section Deep Dive

Acceptance focus for this phase:
- Capacity in HOURS (workstreams × org default 32h) and locked at creation
- Task size selection in DAYS with mapping (XS=0.5d/4h, S=2d/16h, M=4d/32h, L=6d/48h, XL=8d/64h); backend accepts `estimatedHours`
- Department backlog across ALL projects (not gated by project status)
- Sprint timeline visualization and hour-based metrics
- Full‑page sprint create/edit experience to handle large backlogs

Delivered:
- [x] Backend: Hour-based capacity calculation using `organizations.defaultWorkstreamCapacity`
- [x] Backend: `getSprintStats` hour metrics (capacity/committed/utilization, velocity)
- [x] Backend: Department backlog `getDepartmentBacklog` across all department projects
- [x] Backend: `getSprintsWithDetails` for table metrics and timeline
- [x] Frontend: Stats cards, filters, table+timeline
- [x] Frontend: Sprint create/edit as full page (`/sprints/new`, `/sprints/[id]/edit`) with DnD backlog
- [x] Business‑week target end date computed from start date and duration (weeks)
- [x] Assignee dropdown shows all internal users + client users assigned to department
- [x] Project tasks UI updated with days dropdown and size shown in table
- [x] Sprints index now routes to full‑page create/edit; modal removed for create

Remaining polish (tracked for later):
- [ ] Virtualized backlog and multi‑select assign
- [ ] Sprint board reorder and capacity view


### Strategic Rationale for Reordering:
- Admin Config sections establish foundational client/department/user relationships
- Projects and Sprints depend on properly configured clients and departments
- Aligns with optimal demo flow (start with client setup)
- Schema validation happens early before complex operational views

---

## ✅ Completed: Feature 17.2.5 – Team View with capacity & workload visualization
## ✅ Completed: Feature 17.2.6 – Client View Dashboard with project/sprint overview

Acceptance Criteria Met:
- Client header with avatar/name
- KPI cards: Total Projects, Average Progress, Team Members, Contact Info
- Tabbed interface: Active | Upcoming | Team | Documents | Activity (Recent Updates)
- Active Projects and Active Sprints cards side-by-side
- Create Project and Create Sprint dialogs with client preselected and disabled
- Backend queries: `clients.getClientDashboardById`, `clients.getClientActiveItems`, `clients.getClientUpcomingItems`

Implementation Notes:
- Frontend: `src/app/(dashboard)/clients/[id]/page.tsx` unified tabs and dashboard components
- Components: `ClientStatsCards`, `ClientProjectsCard`, `ClientSprintsCard`, `ProjectFormDialog`
- Backend: `convex/clients.ts` new queries; safeguarded role checks
- Removed duplicate overview and budget references to align with new dashboard

Status: ✅ PRODUCTION READY


**Acceptance Criteria Met:**
- KPI cards: Total Members, Active Projects, Average Workload, Departments
- Searchable team member table with columns: Member, Role, Department, Status, Projects, Tasks, Workload, Contact
- Workload visualization as progress bars with percentage
- Individual member detail modal showing capacity breakdown and assigned work
- Row click opens details modal; actions menu retains at least one option
- Proper empty states across tabs (Capacity/Current/Upcoming)
- Client dropdown for scoping; filter button removed

**Implementation Notes:**
- Backend (`convex/users.ts`):
  - `getTeamOverview` – team stats, per-member workload %, project counts, departments
  - `getTeamMemberDetails` – in‑progress/todo tasks, project/sprint enrichment, capacity breakdown
- Frontend:
  - Page: `src/app/(dashboard)/team/page.tsx` (client-scoped filter, search, layout)
  - Components: `src/components/team/TeamStatsCards.tsx`, `TeamMembersTable.tsx`, `TeamMemberDetailsModal.tsx`
  - UX: Row click to open modal; menu with "View Details"; empty states for all tabs

**Status:** ✅ PRODUCTION READY (17.2 now complete)

---

## 🚀 Major Features (Post-Admin Config)

### Feature 18: Universal Attachment System  
**Priority:** Medium  
**Estimated Time:** 12-16 hours  
**Dependencies:** Feature 17.2 (Admin UX Complete) ✅ **COMPLETE ALL 17.X FIRST**  
**Goal:** Implement a comprehensive attachment system that supports media, documents, and files across all entities (projects, documents, sections, tasks, comments) with library aggregation capabilities.

**User Story:** As a user, I want to attach images, documents, and files to any content (projects, documents, sections, tasks, comments) so that I can provide visual context, reference materials, and supporting documentation. As a team lead, I want to view all attachments in a library view so that I can manage project assets centrally.

#### Core Architecture (Following Existing Patterns)
**Polymorphic Attachment Model** (Following comments.ts pattern):
- Single `attachments` table with polymorphic relationships
- Supports: projects, documents, sections, tasks, comments
- Future-proof for new entities
- Client/department scoping for permissions
- Library aggregation via `isPublic` flag

#### Implementation Components
1. **File Upload System**: Drag-and-drop upload zones for all supported entities
2. **Attachment Display Components**: Image preview, document icons, library grid view
3. **Polymorphic Query System**: Dynamic queries based on entity type
4. **Upload & Management Mutations**: Complete CRUD operations for attachments

### Feature 19: Enhanced Document Comments: Live Team Collaboration Feature
**Priority:** Medium  
**Estimated Time:** 20-24 hours  
**Dependencies:** Feature 18 (Universal Attachment System)  
**Goal:** Transform the existing document commenting system from isolated annotations into a live, conversational message thread that encourages team collaboration and enables actionable feedback through AI analysis.

**User Story:** As a team member, I want to collaborate through live message threads within documents so that I can have natural conversations, track feedback, and automatically extract actionable tasks from our discussions.

#### Core Concept:
- Keep existing Convex comment infrastructure - this is a UI/UX transformation, not a rebuild
- Present comments as live message thread - chronological flow with threading capabilities
- Maintain document anchoring - comments can still reference specific elements/sections
- Enable AI-assisted task extraction - analyze conversations for actionable items

### Feature 20: Client Access & Permissions
**Priority:** Low  
**Estimated Time:** 12-16 hours  
**Dependencies:** Features 8, 14, Feature 19  
**Goal:** Provide clients with appropriate access to their project documents

**User Story:** As a client, I want to view my project documents and provide feedback so that I can stay informed and collaborate effectively.

**Acceptance Criteria:**
- Clients can only access their own client's data
- Department switching works for multi-department clients
- Block-level permissions filter content appropriately
- Client interactions are properly limited

### Feature 21: Search & Polish
**Priority:** Low  
**Estimated Time:** 14-18 hours  
**Dependencies:** Features 14, 15, Enhancement 14.2, Feature 19  
**Goal:** Add search functionality and polish the overall experience

**User Story:** As a user, I want to search across documents and have a polished experience so that I can work efficiently.

**Acceptance Criteria:**
- Full-text search across all accessible documents
- Document type filtering (foundation for Phase 2)
- Block-type filtering for focused results
- Fast performance and responsive design
- Comprehensive error handling
- Professional polish throughout

### Feature 22: User Account Management System
**Priority:** Medium  
**Estimated Time:** 8-10 hours  
**Dependencies:** Feature 21 (Search & Polish)  
**Goal:** Allow users to manage their account information, password, and preferences

**User Story:** As a user, I want to manage my account settings so that I can update my profile information, change my password, and customize my experience.

**Acceptance Criteria:**
- Users can update profile information (name, email, job title)
- Users can change their password with proper validation
- Users can add or change profile avatar 
- All changes are validated and securely processed
- Success/error feedback is provided for all operations

### Feature 23: System Email Infrastructure
**Priority:** Medium  
**Estimated Time:** 6-8 hours  
**Dependencies:** Feature 22 (User Account Management)  
**Goal:** Implement comprehensive email system for user communications and system notifications

**User Story:** As a system, I want to send transactional emails so that users receive important notifications about their account and system activities.

**Acceptance Criteria:**
- Email service integration with reliable delivery
- Professional email templates with consistent branding
- Secure token generation and validation
- Queue management with retry logic for failed sends
- Comprehensive email tracking and logging

---

## 🔧 Technical Standards

### Quality Criteria per Feature:
- ✅ Visually polished and consistent with design system
- ✅ All functionality working as intended
- ✅ Schema optimized for the use case
- ✅ Real-time features integrated
- ✅ Performance optimized
- ✅ Ready for production use

### Current Architecture:
- **Organization Layer**: Single org (multi-tenant ready)
- **User Management**: Role-based with client/department assignments
- **Authentication**: Convex Auth with email invitation flow
- **Real-time**: Convex subscriptions throughout
- **UI Framework**: Next.js 14 + Tailwind + shadcn/ui
- **Database**: Convex with real-time subscriptions

### Key Technical Achievements:
- Real-time Convex subscriptions for live data updates
- Drag & drop functionality with @dnd-kit library
- Personal task management with taskType field extension
- Status management system (todo/in_progress/review/done/blocked)
- Unified task/personal todo architecture in single tasks table
- Organization-based multi-tenancy foundation

---

## 📚 Documentation References

- **Full Archive**: See `/docs/archive/` for completed work details
- **Foundation Work**: `/docs/archive/foundation-work.md` - All infrastructure & setup
- **Current Specs**: `/docs/specs.md` - Updated with sprints sizing and planning decisions
- **Architecture**: `/docs/architecture.md` - Added decision: full‑page sprint form vs modal
- **Workflow**: See `.cursor/rules/` for session protocols

---

## ✅ Completed: Feature 17.2.7 – Client View UI Iteration & Polish
**Status:** ✅ COMPLETED  
**Summary:** Refined the Client dashboard with a full tab-based layout, polished spacing, consistent components, and improved empty/loading states. Updated KPI cards to: Active Sprint Capacity, Total Projects, Projects At Risk, Team Members. Ensured hook order stability via inner tab components. Styled tab bar full width and aligned spacing with system patterns.

**Acceptance Criteria Met:**
- [x] Header spacing and typography aligned with global patterns
- [x] Tab labels and counts consistent and accessible
- [x] Empty states refined for all cards (active/upcoming)
- [x] Consistent icon sizing, paddings, and button variants
- [x] No regressions in existing behavior

**Implementation Notes:**
- Page: `src/app/(dashboard)/clients/[id]/page.tsx` tab layout (Active Sprints, Planning, Completed, Projects, Team)
- Components: `ClientActiveSprintsKanban`, inner tab components for queries, `ProjectsTable` wrapped in `Card`
- KPI: `src/components/clients/ClientStatsCards.tsx` updated; backend `clients.getClientDashboardById` extended with capacity and at‑risk metrics

Archived details: see `docs/archive/completed-features.md`.

**Dependencies:** 17.2.6 completed

---

## 🆕 Feature 17.3: JIRA-Style Slug Identifiers
**Priority:** High  
**Estimated Time:** 10-14 hours  
**Dependencies:** Feature 17.2 (All sub-features complete)  
**Goal:** Implement human-readable slug identifiers for tasks, projects, and sprints to improve reference capabilities and external tool integration

**User Story:** As a user, I want to reference tasks, projects, and sprints using memorable identifiers like "STRIDE-42" instead of UUIDs so that I can easily communicate about work items and integrate with external tools.

**Acceptance Criteria:**
- Project keys automatically generated from client/department combinations
- Unique project keys with conflict resolution and manual override
- Auto-incrementing numbers per project key
- Immutable slugs once assigned
- Search by slug functionality
- Display slugs in UI (tables, cards, details)
- URL routing support for slug-based navigation
- Migration tool for existing data

**Implementation Tasks:**
1. **Backend Schema & Infrastructure**
   - [ ] Add `projectKeys` table to Convex schema
   - [ ] Add slug fields to tasks, projects, sprints tables
   - [ ] Create slug generation mutations
   - [ ] Implement project key creation with uniqueness validation
   - [ ] Add atomic counter increment logic
   - [ ] Create search by slug queries

2. **Slug Generation Logic**
   - [ ] Auto-generate project keys from client/department names
   - [ ] Handle key conflicts with suggestion system
   - [ ] Implement manual key override for admins
   - [ ] Ensure thread-safe counter increments

3. **UI Integration**
   - [ ] Display slugs in task tables and cards
   - [ ] Show slugs in project lists and details
   - [ ] Add slugs to sprint views
   - [ ] Implement slug search in global search
   - [ ] Add copy-to-clipboard for slugs
   - [ ] Create project key management UI for admins

4. **Migration & Deployment**
   - [ ] Create migration script for existing data
   - [ ] Test migration on staging environment
   - [ ] Deploy schema changes
   - [ ] Run migration in production
   - [ ] Verify slug assignment

**Technical Considerations:**
- Use Convex transactions for atomic counter updates
- Implement proper indexes for slug searches
- Ensure backward compatibility during migration
- Consider performance impact of slug lookups
- Plan for future multi-tenant slug scoping