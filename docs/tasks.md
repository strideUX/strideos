# strideOS - Implementation Tasks & User Stories

## Current Session Status
**Last Updated:** August 2025  
**Session Duration:** August 2025  
**Current Focus:** Feature 17.2.7 – Client View UI Iteration & Polish (next incremental)  
**Next Session Focus:** Feature 17.2.7 – Client View UI Iteration & Polish  
**Session Strategy:** After shipping Client View Dashboard (17.2.6), iterate on UI polish in small, focused passes.

### 🚀 SESSION STATUS: Feature 17.2.6 Complete
**Status:** ✅ COMPLETE – Client View Dashboard with project/sprint overview

### 🎯 Session Accomplishments Summary (New)
- ✅ Team page under `(dashboard)/team` using KPI cards + searchable table
- ✅ Backend: `users.getTeamOverview` and `users.getTeamMemberDetails`
- ✅ Row click opens member details modal; actions menu retained with "View Details"
- ✅ Modal tabs show proper empty states (Capacity/Current/Upcoming)
- ✅ Filter switched to Client selector; filter button removed

### 📋 Next Session Priorities
1. Client View UI Iteration (17.2.7): polish and UX tweaks
2. Sprint board: capacity view and reorder within sprint
3. BlockNote type fixes (custom blocks) and document integration polish

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

### ✅ Feature 17.2.8 Completion Summary
**Completed:** December 2024  
**Status:** Production Ready  
**Key Achievements:**
- **Complete User Lifecycle Management**: Create, edit, deactivate, and hard delete with proper validation
- **Email Authentication System**: Postmark integration with branded templates and organization email settings
- **Password Reset Flow**: Secure token-based authentication with Convex Auth integration
- **User Assignment Rules**: Client users must have clientId, department assignment optional
- **Critical Bug Fixes**: Resolved auth integration, email sending, and email From address issues
- **Professional UI**: Matches existing admin patterns with confirmation dialogs and proper validation

**Technical Implementation:**
- Updated `convex/users.ts` with complete user management mutations
- Created `convex/email.ts` for Postmark integration
- Updated `convex/auth.ts` with password reset token system
- Created `/src/app/auth/set-password/page.tsx` for password setting
- Updated `/src/app/(dashboard)/admin/users/page.tsx` with complete admin interface
- Created `src/components/ui/alert-dialog.tsx` for confirmation dialogs
- Fixed organization email settings integration

**Files Modified:**
- `convex/users.ts` - User management mutations and queries
- `convex/email.ts` - Email sending action
- `convex/auth.ts` - Password reset token system
- `src/types/user.ts` - Type definitions
- `src/app/(dashboard)/admin/users/page.tsx` - Admin interface
- `src/components/admin/UserFormDialog.tsx` - User form
- `src/app/auth/set-password/page.tsx` - Password setting page
- `src/components/ui/alert-dialog.tsx` - Confirmation dialog component
- `src/lib/email/templates/invitation.tsx` - Email template
- `src/lib/email/client.ts` - Postmark client setup

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

**Status:** ✅ PRODUCTION READY

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

**🎯 Current Session Priority:** Feature 17.2.7 – Client View UI Iteration & Polish — small iterative UX improvements and consistency passes.

---

## 🔄 New: Feature 17.2.7 – Client View UI Iteration & Polish
**Goal:** Iteratively refine the Client View dashboard UX and visual polish without introducing new backend scope.

**Acceptance Criteria:**
- [ ] Header spacing and typography aligned with global patterns
- [ ] Tab labels and counts consistent and accessible
- [ ] Empty states refined for all cards (active/upcoming)
- [ ] Consistent icon sizing, paddings, and button variants
- [ ] No regressions in existing behavior

**Tasks:**
- [ ] Review spacing/typography across `clients/[id]/page.tsx`
- [ ] Harmonize card paddings/margins with `ProjectStatsCards` patterns
- [ ] Add subtle hover/focus states to cards and headers
- [ ] Improve empty states copy and visuals
- [ ] Verify dark mode contrasts

**Priority:** High  
**Status:** In Progress (next session)  
**Estimate:** 2–4 hours  
**Dependencies:** 17.2.6 completed