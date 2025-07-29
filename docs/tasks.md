# strideOS - Implementation Tasks & User Stories

## Session Status
**Last Updated:** [07-29-25]
**Current Focus:** Foundation Phase - Authentication Complete, Ready for Feature 4
**Next Session Priority:** Feature 4: Role-Based Access & Simple Views

### Recent Session Summary ([07-29-25])
- ✅ Feature 3: Authentication System completed and fully functional
- ✅ Resolved all authentication bugs (middleware, database schema, JWT keys)
- ✅ Updated documentation with proper setup instructions
- ✅ Implemented official Convex Auth CLI setup process
- ✅ All foundation features (1-3) now complete and tested

**Blockers/Notes for Next Session:**
- Authentication system fully operational
- Ready to implement role-based access control
- Development environment properly configured

---

## 🐛 Bug Reports

### Bug #001: Authentication System Not Using Convex Auth ✅ FIXED
**Status:** ✅ Fixed
**Discovered:** [Current Date]
**Fixed:** [Current Date]
**Priority:** High
**Impact:** Users cannot sign up or sign in

**Description:**
The authentication system was using a custom implementation that bypassed Convex Auth's built-in functionality. This caused the error "User with this email already exists" when trying to sign up, and prevented proper authentication flow.

**Error Details:**
```
[CONVEX M(auth:signUp)] [Request ID: 2f30d59cc648c35a] Server Error
Uncaught Error: User with this email already exists
at handler (../convex/auth.ts:56:13)
```

**Root Cause:**
1. `ConvexProvider` was not using `ConvexAuthNextjsProvider`
2. Custom `signUp` mutation tried to create users directly in database
3. Convex Auth's built-in user management was not being utilized
4. Authentication flow was not properly integrated

**Fixes Applied:**
1. ✅ Updated `ConvexProvider` to use `ConvexAuthNextjsProvider`
2. ✅ Replaced custom `signUp` and `signIn` mutations with Convex Auth's Password provider
3. ✅ Updated `createOrUpdateUser` to work with Convex Auth identity
4. ✅ Updated frontend forms to use Convex Auth hooks (`useAuthActions`)
5. ✅ Created HTTP router configuration for auth routes
6. ✅ Set SITE_URL environment variable for Convex Auth
7. ✅ Installed required Convex Auth packages
8. ✅ Added `ConvexAuthNextjsServerProvider` to root layout for server-side authentication support

**Files Modified:**
- `src/components/providers/ConvexProvider.tsx` - Updated to use ConvexAuthNextjsProvider
- `convex/auth.ts` - Completely rewritten to use Convex Auth's Password provider
- `src/components/auth/SignUpForm.tsx` - Updated to use useAuthActions hook
- `src/components/auth/SignInForm.tsx` - Updated to use useAuthActions hook
- `src/components/providers/AuthProvider.tsx` - Updated to work with Convex Auth
- `src/app/(auth)/sign-out/page.tsx` - Updated to use useAuthActions hook
- `convex/http.ts` - Created HTTP router configuration
- `package.json` - Added @convex-dev/auth and @auth/core dependencies
- `src/app/layout.tsx` - Added ConvexAuthNextjsServerProvider for server-side auth support

**Testing Status:** Ready for testing
**Estimated Fix Time:** 2-3 hours (Completed)

---

### Bug #002: Missing Auth Database Schema & Middleware Placement ✅ FIXED
**Status:** ✅ Fixed
**Discovered:** [Current Date]
**Fixed:** [Current Date]
**Priority:** Critical
**Impact:** Authentication completely non-functional despite proper setup

**Description:**
Multiple interconnected issues prevented authentication from working:
1. Middleware placement issue (root vs src directory)
2. Missing required database schema for Convex Auth tables

**Error Details:**
```
POST /api/auth 404 in 3431ms
Hit error while running `auth:signIn`:
Index authAccounts.providerAndAccountId not found
✓ Compiled middleware in 2ms
```

**Root Cause:**
1. **File Placement**: `middleware.ts` in root directory instead of `src/middleware.ts` (required for Next.js App Router + src structure)
2. **Missing Database Schema**: `convex/schema.ts` was missing required `authTables` import and auth table definitions
3. **Schema Mismatch**: Custom users table didn't match Convex Auth expectations

**Fixes Applied:**
1. ✅ **CRITICAL FIX**: Moved middleware from root to `src/middleware.ts` 
2. ✅ **DATABASE FIX**: Added `import { authTables } from '@convex-dev/auth/server'` to schema
3. ✅ **SCHEMA UPDATE**: Spread `...authTables` into schema definition to include all required auth tables
4. ✅ **USERS TABLE**: Updated users table to extend Convex Auth base schema with optional fields
5. ✅ **INDEX FIX**: Changed email index from 'by_email' to 'email' to match Convex Auth expectations

**Files Modified:**
- `src/middleware.ts` - Moved from root directory with convexAuthNextjsMiddleware configuration
- `convex/schema.ts` - Added authTables import and spread, updated users table schema

**Database Tables Added:**
- `authAccounts` - User authentication accounts per provider
- `authSessions` - Active user sessions  
- `authRefreshTokens` - JWT refresh token management
- `authVerificationCodes` - OTP/magic link tokens
- `authVerifiers` - PKCE verifiers for OAuth
- `authRateLimits` - Rate limiting for authentication attempts

**Testing Status:** ✅ Authentication fully functional - all endpoints responding correctly
**Estimated Fix Time:** 2 hours (Completed)

---

### Bug #003: Missing JWT_PRIVATE_KEY Environment Variable ✅ FIXED
**Status:** ✅ Fixed
**Discovered:** [Current Date]
**Fixed:** [Current Date]
**Priority:** Critical
**Impact:** Authentication completely fails during sign-up/sign-in with JWT token generation errors

**Description:**
Users attempting to sign up or sign in encountered "Missing environment variable 'JWT_PRIVATE_KEY'" errors. This critical environment variable is required by Convex Auth for JWT token generation but was not documented in setup instructions.

**Error Details:**
```
[Request ID: bc69853953e6a4c1] Server Error
Uncaught Error: Missing environment variable 'JWT_PRIVATE_KEY'
at requireEnv (../../node_modules/@convex-dev/auth/src/server/utils.ts:5:9)
at generateToken (../../node_modules/@convex-dev/auth/src/server/implementation/tokens.ts:19:19)
```

**Root Cause:**
1. **Missing Environment Variable**: `JWT_PRIVATE_KEY` was not set in Convex deployment
2. **Documentation Gap**: Setup instructions didn't include required Convex Auth environment variables
3. **Incomplete Setup**: Only `SITE_URL` was configured, but `JWT_PRIVATE_KEY` was missing

**Solution Applied:**
1. ✅ **Official CLI Setup**: Used `npx @convex-dev/auth` to properly configure all authentication keys
2. ✅ **Environment Variables**: Generated proper RSA `JWT_PRIVATE_KEY` and `JWKS` keys
3. ✅ **Documentation Update**: Added Convex environment variables section to README.md
4. ✅ **Setup Instructions**: Updated docs/tasks.md with official CLI setup process
5. ✅ **Warning Added**: Included critical warnings about authentication failure without these variables

**Environment Variables Required:**
- `JWT_PRIVATE_KEY` - RSA private key for JWT token generation and signing
- `JWKS` - JSON Web Key Set for public key verification  
- `SITE_URL` - For authentication redirects and callbacks

**Files Modified:**
- **Convex Deployment**: Added `JWT_PRIVATE_KEY`, `JWKS`, and `SITE_URL` environment variables
- **convex/auth.config.ts**: Created by CLI for auth configuration
- **README.md**: Added Step 3b with official CLI setup process
- **docs/tasks.md**: Updated Environment Variables section with CLI-first approach

**Commands for Setup:**
```bash
# Recommended: Use official CLI
npx @convex-dev/auth

# Alternative: Manual setup
npx convex env set JWT_PRIVATE_KEY "secure-random-key"
npx convex env set SITE_URL "http://localhost:3000"
```

**Testing Status:** ✅ Authentication now fully functional - sign-up and sign-in working correctly
**Estimated Fix Time:** 30 minutes (Completed)

---

## Current Sprint

### ✅ Completed Features
**Feature 1: Project Setup & Basic Infrastructure**
- **Status:** ✅ Completed
- **Assigned To:** Current Developer
- **Progress:** 100% complete
- **Completed:** Next.js 15 project initialized with TypeScript, ESLint, Prettier, and proper folder structure

**Feature 2: Convex Backend Integration**
- **Status:** ✅ Completed
- **Assigned To:** Current Developer
- **Progress:** 100% complete
- **Completed:** Convex backend integrated with real-time functionality

**Feature 3: Authentication System**
- **Status:** ✅ Completed
- **Assigned To:** Current Developer
- **Progress:** 100% complete
- **Completed:** Convex Auth properly integrated with email/password authentication
- **Bug Fixes:** Resolved middleware placement, database schema, and JWT key issues

### 📋 Up Next (Backlog)
1. Feature 4: Role-Based Access & Simple Views
2. Feature 5: shadcn/ui Dashboard Foundation
3. Feature 6: Project Management Core
4. Feature 7: Task Management System

---

## ✅ Completed Features Details

### Feature 1: Project Setup & Basic Infrastructure ✅
- Next.js 15 project initialized with TypeScript
- ESLint and Prettier configured with proper rules
- Project folder structure established (`/components`, `/lib`, `/app`, etc.)
- Tailwind CSS v4 installed and configured
- Basic layout.tsx and page.tsx created with proper metadata
- Environment variables structure set up
- next.config.ts configured for production settings
- Development server tested and working
- TypeScript type definitions and validation schemas created
- Utility functions including `cn` helper implemented

### Feature 2: Convex Backend Integration ✅
- Convex CLI installed and project initialized
- Convex configured in Next.js application with proper provider setup
- Database schema created with all core tables (users, clients, departments, projects, tasks, comments)
- Basic counter functions implemented for testing real-time functionality
- Real-time data synchronization tested and working
- Environment variables configured for Convex deployment
- Development and production environments set up
- Test component created to verify real-time updates

### Feature 3: Authentication System ✅
- Convex Auth properly integrated with Next.js application using ConvexAuthNextjsProvider
- User schema updated for Convex Auth integration with Password provider
- Authentication functions created (getCurrentUser, createOrUpdateUser, getUserById) using Convex Auth
- Authentication context provider implemented for state management
- Custom sign-in and sign-up forms created with Tailwind CSS using useAuthActions hook
- Authentication pages created (/sign-in, /sign-up, /sign-out) with proper Convex Auth integration
- Home page updated with authentication UI (sign in/up/out links, user profile)
- Authentication state properly managed across the application
- User registration and login functionality working with proper password validation
- Logout functionality implemented with custom sign-out page using useAuthActions
- HTTP router configured for Convex Auth routes
- Environment variables properly set for authentication
- **Critical Fixes**: Resolved middleware placement, database schema, and JWT key issues

---

## Development Prerequisites

### Required Software
- **Node.js 18+** with npm or pnpm
- **Git** for version control
- **VS Code** with TypeScript and Tailwind extensions (recommended)
- **Modern browser** for testing (Chrome, Firefox, Safari, Edge)

### Required Accounts & Services
- **Convex Account** - Create at convex.dev
- **Vercel Account** - For deployment (optional initially)
- **GitHub Account** - For repository hosting

### Development Environment Setup
1. Clone/create repository
2. Install Convex CLI: `npm install -g convex`
3. Set up development environment variables
4. Install project dependencies
5. Verify development server functionality

**Development Workflow**: Use two terminal windows:
- Terminal 1: `npx convex dev` (backend)
- Terminal 2: `npm run dev` (frontend)

Both servers must be running for authentication and database functionality.

### Environment Variables (Development)

**Next.js Environment Variables (.env.local):**
```env
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
# Additional variables will be added as features are implemented
```

**Required Convex Environment Variables:**
These must be set using the official Convex Auth CLI (recommended):

```bash
# Run the Convex Auth CLI to set up all required environment variables
npx @convex-dev/auth
```

This automatically configures:
- `JWT_PRIVATE_KEY` - RSA private key for JWT token generation and signing
- `JWKS` - JSON Web Key Set for public key verification
- `SITE_URL` - For authentication redirects and callbacks
- `convex/auth.config.ts` - Auth configuration file

**Alternative Manual Setup** (if CLI doesn't work):
```bash
# Required for JWT token generation (use a secure random string)
npx convex env set JWT_PRIVATE_KEY "your-secure-random-key-here"

# Required for authentication redirects  
npx convex env set SITE_URL "http://localhost:3000"
```

**⚠️ Important**: Without `JWT_PRIVATE_KEY`, authentication will fail with "Missing environment variable" errors.

---

## Feature Dependencies

```
Foundation Features (Must Complete First):
Feature 1 → Feature 2 → Feature 3 → Feature 4 → Feature 5

Core Data Features (After Foundation):
Feature 6 → Feature 7 → Feature 8

Document Features (After Foundation):
Feature 9 → Feature 10 → Feature 11 → Feature 11.5

Sprint Features (After Core Data + Document):
Feature 12 → Feature 13 → Feature 13.5

Advanced Features (After All Above):
Feature 14 → Feature 15 → Feature 16
```

**Critical Path:** Features 1-5 are blockers for everything else
**Parallel Work:** Features 6-8 can be built alongside Features 9-11

---

## Foundation Features (Build These First)

### Feature 1: Project Setup & Basic Infrastructure ✅
**Priority:** Critical
**Estimated Time:** 4-6 hours
**Dependencies:** None
**Goal:** Establish the basic Next.js application with proper project structure
**Status:** ✅ COMPLETED

**User Story:** As a developer, I want a properly configured Next.js project so that I can build the application on a solid foundation.

**Acceptance Criteria:**
- Next.js 15 project initialized with TypeScript
- ESLint and Prettier configured with proper rules
- Basic folder structure established
- Development environment runs successfully

**Tasks:**
- [x] Initialize Next.js 15 project with TypeScript
- [x] Configure ESLint and Prettier
- [x] Set up project folder structure (/components, /lib, /app, etc.)
- [x] Install and configure Tailwind CSS
- [x] Create basic layout.tsx and page.tsx
- [x] Set up environment variables structure
- [x] Configure next.config.js for production settings
- [x] Test development server startup

**Additional Infrastructure Completed:**
- [x] Create utility functions (cn helper, date formatting, debounce)
- [x] Set up Zod validation schemas for all data models
- [x] Create comprehensive TypeScript type definitions
- [x] Enhance package.json scripts for development workflow
- [x] Create comprehensive README.md with setup instructions
- [x] Update project metadata and SEO optimization
- [x] Implement modern landing page with responsive design

---

### Feature 2: Convex Backend Integration ✅
**Priority:** Critical
**Estimated Time:** 6-8 hours
**Dependencies:** Feature 1
**Goal:** Connect the application to Convex for real-time database and backend functionality
**Status:** ✅ COMPLETED

**User Story:** As a developer, I want Convex integrated as the backend so that I can store and sync data in real-time.

**Acceptance Criteria:**
- Convex is properly installed and configured
- Database connection is established
- Basic queries and mutations work
- Real-time updates are functional

**Tasks:**
- [x] Install Convex CLI and initialize Convex project
- [x] Configure Convex in Next.js application
- [x] Set up Convex provider in app layout
- [x] Create basic test schema (e.g., a simple counter)
- [x] Implement basic query and mutation
- [x] Test real-time data synchronization
- [x] Configure environment variables for Convex
- [x] Set up Convex development and production environments

---

### Feature 3: Authentication System ✅
**Priority:** Critical
**Estimated Time:** 8-10 hours
**Dependencies:** Feature 2
**Goal:** Implement secure email/password authentication with Convex Auth
**Status:** ✅ COMPLETED

**User Story:** As a user, I want to sign up and log in with email/password so that I can access the application securely.

**Implementation Note:** Switched from Clerk to Convex Auth for better integration and simplicity.

**Acceptance Criteria:**
- Users can register with email and password
- Users can log in with existing credentials
- Passwords are securely hashed
- Authentication state persists across sessions
- Users can log out

**Tasks:**
- [x] Install and configure Convex Auth
- [x] Create User schema in Convex
- [x] Set up authentication provider configuration
- [x] Create registration form component
- [x] Create login form component
- [x] Implement form validation for auth forms
- [x] Add password strength requirements
- [x] Create authentication context provider
- [x] Implement logout functionality
- [x] Add authentication error handling

---

### Feature 4: Role-Based Access & Simple Views
**Priority:** Critical
**Estimated Time:** 6-8 hours
**Dependencies:** Feature 3
**Goal:** Implement user roles and create simple text-only views to verify role-based routing

**User Story:** As a user, I want to see different content based on my role so that I can access appropriate features for my permissions.

**Acceptance Criteria:**
- User roles (admin, pm, task_owner, client) are properly stored and managed
- Role-based routing protects different areas of the app
- Simple text views confirm role detection is working
- Role switching (for testing) works in development

**Tasks:**
- [ ] Add role field to User schema
- [ ] Create role-based route protection middleware
- [ ] Create simple text-only dashboard pages for each role:
  - [ ] `/admin/dashboard` - "Admin Dashboard - You are an admin"
  - [ ] `/dashboard` - "PM Dashboard - You are a PM" 
  - [ ] `/dashboard` - "Task Owner Dashboard - You are a task owner"
  - [ ] `/client/dashboard` - "Client Dashboard - You are a client"
- [ ] Implement role detection in components
- [ ] Add role assignment during user registration (temp: manual selection)
- [ ] Create development role switching utility
- [ ] Test role-based navigation and access control

---

### Feature 5: shadcn/ui Dashboard Foundation
**Priority:** Critical
**Estimated Time:** 8-10 hours
**Dependencies:** Feature 4
**Goal:** Replace simple text views with proper dashboard layouts using shadcn/ui components

**User Story:** As a user, I want a professional, well-designed dashboard so that I have a pleasant and functional user experience.

**Acceptance Criteria:**
- shadcn/ui is properly installed and configured
- Dashboard blocks are implemented for different user roles
- Navigation sidebar works with role-based menu items
- Header with user profile and logout is functional
- Layout is responsive and professional

**Tasks:**
- [ ] Install and configure shadcn/ui with CLI
- [ ] Install shadcn/ui dashboard blocks and required components
- [ ] Create layout wrapper component with sidebar navigation
- [ ] Build role-based navigation menu component
- [ ] Create header component with user profile dropdown
- [ ] Implement responsive sidebar (mobile/desktop)
- [ ] Replace text-only views with proper dashboard layouts:
  - [ ] Admin dashboard with metrics cards placeholder
  - [ ] PM dashboard with project overview placeholder  
  - [ ] Task owner dashboard with task list placeholder
  - [ ] Client dashboard with project status placeholder
- [ ] Add proper loading states and error boundaries
- [ ] Style components consistently with design system

---

## Core Data & Management Features

### Feature 6: Client & Department Data Models
**Priority:** High
**Estimated Time:** 6-8 hours
**Dependencies:** Feature 5
**Goal:** Implement the core data models for clients and departments with workstream configuration

**User Story:** As an admin, I want to create and manage clients and their departments so that I can organize projects properly.

**Acceptance Criteria:**
- Client and Department schemas are implemented
- Clients can have multiple departments
- Departments have configurable workstream settings
- Data relationships are properly established

**Tasks:**
- [ ] Create Client schema in Convex with validation
- [ ] Create Department schema with client relationship
- [ ] Add workstream configuration fields to Department
- [ ] Create client CRUD mutations and queries
- [ ] Create department CRUD mutations and queries
- [ ] Implement data validation for workstream settings
- [ ] Add database indexes for performance
- [ ] Create sample data for development and testing

### Feature 7: Admin Client Management Interface
**Priority:** High
**Estimated Time:** 10-12 hours
**Dependencies:** Feature 6
**Goal:** Build the admin interface for managing clients and departments

**User Story:** As an admin, I want to create, edit, and manage clients and departments through a user-friendly interface.

**Acceptance Criteria:**
- Admin can view all clients in a data table
- Admin can create new clients with a form
- Admin can edit existing client information
- Admin can manage departments for each client
- Workstream configuration is editable

**Tasks:**
- [ ] Create clients list page with shadcn/ui data table
- [ ] Build client creation form with validation
- [ ] Implement client edit modal
- [ ] Add client search and filtering functionality
- [ ] Create department management interface within client view
- [ ] Build department creation form with workstream config
- [ ] Add department edit functionality
- [ ] Implement client and department deletion with confirmation
- [ ] Add success/error notifications for all operations

### Feature 8: User Management System  
**Priority:** High
**Estimated Time:** 10-12 hours
**Dependencies:** Feature 7
**Goal:** Allow admins to manage users and assign them to clients/departments

**User Story:** As an admin, I want to manage user accounts and assign them to appropriate clients and departments.

**Acceptance Criteria:**
- Admin can view all users in the system
- Admin can create new user accounts
- Admin can assign users to clients and departments
- Role assignment and management works properly

**Tasks:**
- [ ] Update User schema to include client and department assignments
- [ ] Create user management queries and mutations
- [ ] Build users list page with role and assignment display
- [ ] Create user creation form with role and assignment selection
- [ ] Implement user edit functionality
- [ ] Add user activation/deactivation capability
- [ ] Create user invitation system (email invites)
- [ ] Add bulk user operations
- [ ] Implement user search and filtering

---

## Document & Project Features

### Feature 9: Novel.sh Editor Integration
**Priority:** High
**Estimated Time:** 12-16 hours
**Dependencies:** Feature 5
**Goal:** Integrate Novel.sh as the core document editing platform

**User Story:** As a user, I want to edit rich text documents with a modern editor so that I can create comprehensive project documentation.

**Acceptance Criteria:**
- Novel.sh editor is integrated and functional
- Documents can be created, edited, and saved
- Real-time collaboration works
- Basic rich text features are available

**Tasks:**
- [ ] Install and configure Novel.sh editor
- [ ] Create Document schema in Convex for storing document content
- [ ] Build document editor component wrapper
- [ ] Implement document save/load functionality with Convex
- [ ] Configure real-time collaboration
- [ ] Add document title editing
- [ ] Create document list view
- [ ] Add document creation/deletion functionality
- [ ] Test editor performance with large documents

### Feature 10: Project as Document Foundation
**Priority:** High
**Estimated Time:** 8-10 hours
**Dependencies:** Features 8, 9
**Goal:** Establish projects as documents with section navigation

**User Story:** As a PM, I want to create project documents with organized sections so that I can structure project information logically.

**Acceptance Criteria:**
- Projects are created as rich documents instead of simple records
- Document sections can be created and navigated
- Table of contents shows document structure
- Projects maintain client/department associations

**Tasks:**
- [ ] Update Project schema to include document content
- [ ] Create ProjectSection schema for document organization
- [ ] Build project document creation flow
- [ ] Implement section detection and navigation
- [ ] Create floating table of contents component
- [ ] Add section anchor navigation
- [ ] Build project list view showing document previews
- [ ] Implement project document templates
- [ ] Add project status management within document context

### Feature 11: Tasks Block with PM Control
**Priority:** High
**Estimated Time:** 16-20 hours
**Dependencies:** Feature 10
**Goal:** Create task management blocks with proper PM/assignee permission separation

**User Story:** As a PM, I want to add interactive task blocks to project documents so that I can manage tasks while maintaining control over project details.

**Acceptance Criteria:**
- Tasks block can be inserted using slash commands (/tasks)
- PMs have full control over task details (title, description, due date, size, type, assignment)
- Assignees can only update status and add comments
- Tasks are stored in Convex and sync in real-time
- Clear visual distinction between PM-controlled and user-controlled fields

**Tasks:**
- [ ] Create Task schema in Convex with field-level permissions
- [ ] Build custom Novel.js tasks block extension
- [ ] Implement tasks block UI component with role-based editing
- [ ] Add slash command registration (/tasks)
- [ ] Create task creation interface (PM only)
- [ ] Implement task editing with permission controls
- [ ] Add task status update interface (assignee accessible)
- [ ] Create task commenting system
- [ ] Connect tasks to Convex backend with real-time sync
- [ ] Add visual indicators for read-only vs editable fields
- [ ] Style tasks block with permission-based UI states

---

### Feature 11.5: Personal Todo Management
**Priority:** Medium
**Estimated Time:** 8-10 hours
**Dependencies:** Feature 11
**Goal:** Allow users to create and manage personal todos alongside assigned tasks

**User Story:** As a user, I want to add personal todos and organize them with my assigned tasks so that I can manage all my work in one unified view.

**Acceptance Criteria:**
- Users can create, edit, delete personal todos
- Personal todos are completely user-controlled
- Todos can be reordered against assigned tasks
- Clear visual distinction between tasks and todos
- Personal workspace shows unified task/todo list

**Tasks:**
- [ ] Create Todo schema in Convex
- [ ] Create personal todo CRUD mutations and queries
- [ ] Build personal todo creation interface
- [ ] Implement todo editing and deletion
- [ ] Create UserTaskOrder schema for personal organization
- [ ] Build unified task/todo list component
- [ ] Implement drag-and-drop reordering for mixed list
- [ ] Add visual distinction between tasks (locked) and todos (editable)
- [ ] Create personal dashboard with unified work view
- [ ] Add filtering options (all, tasks only, todos only)
- [ ] Implement personal productivity metrics

---

## Sprint & Planning Features

### Feature 12: Sprint Data Model & Basic Management
**Priority:** Medium
**Estimated Time:** 8-10 hours
**Dependencies:** Features 8, 11
**Goal:** Implement sprint system for capacity planning

**User Story:** As a PM, I want to create sprints for departments so that I can plan work in time-boxed iterations.

**Acceptance Criteria:**
- Sprints belong to specific departments
- Sprint capacity is calculated from department workstreams
- Sprints have proper status lifecycle
- Basic sprint CRUD operations work

**Tasks:**
- [ ] Create Sprint schema in Convex
- [ ] Implement capacity calculation logic based on workstreams
- [ ] Create sprint CRUD mutations and queries
- [ ] Build sprint creation form
- [ ] Implement sprint list view
- [ ] Add sprint status management (planning, active, review, complete)
- [ ] Create sprint detail page
- [ ] Add sprint date validation and conflict checking

### Feature 13: Sprint Planning Interface
**Priority:** Medium
**Estimated Time:** 12-14 hours
**Dependencies:** Feature 12
**Goal:** Create the core sprint planning interface with task assignment

**User Story:** As a PM, I want to assign tasks from project documents to sprints so that I can plan sprint capacity effectively.

**Acceptance Criteria:**
- Tasks from all project documents appear in backlog
- Tasks can be assigned to sprints
- Real-time capacity tracking shows sprint utilization
- Capacity warnings appear when approaching limits

**Tasks:**
- [ ] Create sprint planning page layout
- [ ] Build task backlog aggregation query (all unassigned tasks)
- [ ] Implement task assignment to sprints (PM only)
- [ ] Add real-time capacity calculation and display
- [ ] Create capacity warning indicators
- [ ] Build task filtering and search in backlog
- [ ] Add sprint selection interface
- [ ] Implement optimistic updates for task assignment
- [ ] Add drag-and-drop task assignment (advanced)
- [ ] Ensure task immutability during sprint assignment

### Feature 13.5: Task Owner Sprint Visibility
**Priority:** Medium
**Estimated Time:** 6-8 hours
**Dependencies:** Feature 13
**Goal:** Provide task owners with appropriate sprint context and visibility

**User Story:** As a task owner, I want to see sprint information for my assigned tasks so that I can understand project timelines and coordinate with my team.

**Acceptance Criteria:**
- Task owners can view sprints containing their assigned tasks
- Sprint timeline and progress are visible (read-only)
- Other team member tasks are visible for coordination
- Sprint capacity is shown but not editable

**Tasks:**
- [ ] Create task owner sprint list view
- [ ] Build current sprint detail page (read-only)
- [ ] Add sprint context to task owner dashboard
- [ ] Implement sprint progress visualization for task owners
- [ ] Add team coordination view within sprints
- [ ] Create upcoming sprint visibility for assigned tasks
- [ ] Add sprint history for completed work
- [ ] Integrate sprint context into unified task/todo dashboard

---

## Advanced Features

### Feature 14: Additional Document Blocks
**Priority:** Low
**Estimated Time:** 16-20 hours
**Dependencies:** Feature 11
**Goal:** Complete the custom block ecosystem with stakeholders, comments, timeline

**User Story:** As a PM, I want additional block types so that I can create comprehensive project documents.

**Acceptance Criteria:**
- Stakeholders block for team management
- Comments block for discussions
- Timeline block for project visualization
- All blocks integrate properly with existing data

**Tasks:**
- [ ] Build stakeholders block Novel extension
- [ ] Create stakeholder management interface
- [ ] Implement comments block with threading
- [ ] Add @mention functionality in comments
- [ ] Build timeline block with milestone visualization
- [ ] Create capacity block for sprint utilization
- [ ] Add deliverables block for project outputs
- [ ] Style all blocks consistently
- [ ] Test block interactions and performance

### Feature 15: Client Access & Permissions
**Priority:** Low
**Estimated Time:** 12-16 hours
**Dependencies:** Features 8, 14
**Goal:** Provide clients with appropriate access to their project documents

**User Story:** As a client, I want to view my project documents and provide feedback so that I can stay informed and collaborate effectively.

**Acceptance Criteria:**
- Clients can only access their own client's data
- Department switching works for multi-department clients
- Block-level permissions filter content appropriately
- Client interactions are properly limited

**Tasks:**
- [ ] Implement client data scoping middleware
- [ ] Create department switcher for client users
- [ ] Build client project document viewer (read-only)
- [ ] Implement block-level permission filtering
- [ ] Add client-specific commenting capability
- [ ] Create client task assignment and completion
- [ ] Build client notification system
- [ ] Add client-friendly project status indicators

### Feature 16: Search & Polish
**Priority:** Low
**Estimated Time:** 14-18 hours
**Dependencies:** Features 14, 15
**Goal:** Add search functionality and polish the overall experience

**User Story:** As a user, I want to search across documents and have a polished experience so that I can work efficiently.

**Acceptance Criteria:**
- Full-text search across all accessible documents
- Document type filtering (foundation for Phase 2)
- Block-type filtering for focused results
- Fast performance and responsive design
- Comprehensive error handling
- Professional polish throughout

**Tasks:**
- [ ] Implement full-text search in Convex
- [ ] Build global search interface
- [ ] Add search result highlighting and navigation
- [ ] Create document type filtering foundation
- [ ] Implement block-type filtering (tasks, comments, etc.)
- [ ] Add client-scoped search functionality
- [ ] Create cross-document reference detection
- [ ] Build auto-linking infrastructure (Phase 2 foundation)
- [ ] Optimize document loading performance
- [ ] Implement comprehensive error boundaries
- [ ] Add loading states throughout application
- [ ] Improve mobile responsiveness
- [ ] Add offline capability basics
- [ ] Implement notification system
- [ ] Create admin analytics dashboard

---

## Testing Checkpoints

### After Foundation Features (1-5)
- [ ] All user roles can authenticate and access appropriate dashboards
- [ ] Role-based routing works correctly
- [ ] shadcn/ui components render properly across devices
- [ ] Basic Convex queries and mutations function
- [ ] Development environment is stable

### After Core Data Features (6-8)
- [ ] Admin can manage clients, departments, and users
- [ ] Data relationships and validation work properly
- [ ] Role assignments and permissions function correctly
- [ ] Sample data can be created and managed

### After Document Features (9-11.5)
- [ ] Novel.js editor works with real-time collaboration
- [ ] Custom task blocks function with proper permissions
- [ ] Personal todos integrate with assigned tasks
- [ ] Document creation and editing is stable

### After Sprint Features (12-13.5)
- [ ] Sprint planning and task assignment works
- [ ] Capacity calculations are accurate
- [ ] Both PM and task owner views function properly
- [ ] Sprint lifecycle management is complete

### Before Production Release
- [ ] All user journeys tested end-to-end
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Mobile experience verified
- [ ] Client access and permissions validated

---

## Risk Mitigation & Contingency Plans

### Technical Risks
**Novel.sh Complexity:** Custom block development may be more complex than expected
- *Mitigation:* Start with simple text blocks, add interactivity incrementally
- *Contingency:* Fall back to simpler editor with separate task management

**Convex Scaling:** Real-time collaboration may hit performance limits
- *Mitigation:* Test with multiple concurrent users early
- *Contingency:* Implement selective real-time updates or polling fallback

**Mobile Performance:** Complex document blocks may not work well on mobile
- *Mitigation:* Design mobile-first, test on real devices frequently
- *Contingency:* Simplified mobile UI with full features on desktop only

### Development Risks
**Feature Scope Creep:** Temptation to add features beyond Phase 1 scope
- *Mitigation:* Strict adherence to Phase 1 feature list
- *Contingency:* Move additional features to Phase 2 backlog

**Authentication Complexity:** Role-based permissions may become overly complex
- *Mitigation:* Start with simple roles, add granularity incrementally
- *Contingency:* Simplify initial role model, enhance in Phase 2

---

## Development Guidelines

### Foundation-First Approach
**Start with Features 1-5 before moving to any complex features. This ensures:**
- Authentication and permissions work correctly
- Role-based routing is secure
- Dashboard foundation is solid
- All core infrastructure is validated

### Phase 1 vs Phase 2
**Phase 1:** Focus on project management core (Features 1-16)
- All projects are `project_brief` document type
- Single navigation structure
- Core functionality fully operational

**Phase 2:** Document type system and mode switching (Features 17-18)
- Multiple document types and templates
- Mode switcher between Projects and Documentation
- Advanced cross-document features

### Testing Strategy
- Test role-based permissions thoroughly for each feature
- Use real-time collaboration testing with multiple browser instances  
- Test mobile responsiveness throughout development
- Implement E2E tests for critical user flows

### Performance Considerations
- Progressive loading for large documents
- Efficient queries with proper indexing
- Real-time update optimization
- Mobile-first responsive design

### Security Priorities
- Role-based access control at API level
- Data isolation between clients
- Input validation and sanitization
- Secure authentication implementation

---

## Session Notes Archive

### [DATE] Session
**Duration:** [X hours]
**Focus:** [What was the main focus]
**Completed:** [What was accomplished]
**Next:** [What's next on the priority list]
**Key Decisions:** [Any important decisions made]
**Docs Updated:** [Which docs were modified]

---

*This document serves as the living implementation roadmap for strideOS. Update progress, session notes, and current focus as development proceeds.*