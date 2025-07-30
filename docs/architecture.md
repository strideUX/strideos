# strideOS - Technical Architecture

## System Overview

strideOS is a document-centric project management platform built on modern web technologies with real-time collaboration at its core. The architecture emphasizes type safety, real-time data synchronization, and role-based access control while maintaining high performance and scalability.

---

## Key Architectural Decisions

### Decision 1: Convex vs. Traditional Database + API
**Context:** Need for real-time collaboration with complex permissions
**Decision:** Use Convex as primary backend platform
**Rationale:** 
- Built-in real-time subscriptions eliminate WebSocket complexity
- TypeScript-first with automatic type generation
- Integrated auth and file storage
- Serverless scaling without infrastructure management
**Trade-offs:** 
- Vendor lock-in risk
- Limited complex query capabilities vs. SQL
- File storage limitations for large assets
**Alternatives Considered:** Supabase + Socket.io, Firebase, custom Node.js + PostgreSQL

### Decision 2: BlockNote for Document Editing
**Context:** Need for rich text editing with custom interactive blocks
**Decision:** Build on BlockNote foundation (Migrated from Novel.sh)
**Rationale:**
- Superior custom block system with React-first architecture
- Built-in Yjs collaboration infrastructure for real-time editing
- Excellent TypeScript support with comprehensive type definitions
- Modern block-based approach optimized for complex interactive content
- Active development with strong community support
- Better extensibility for custom interactive blocks (tasks, stakeholders, etc.)
**Trade-offs:**
- Newer ecosystem compared to established alternatives
- Custom block development requires understanding BlockNote patterns
- Performance optimization needed for very large documents
- Migration complexity from existing Novel.sh implementation
**Alternatives Considered:** Novel.sh/Tiptap, Notion-style editors, plain text with markdown, custom editor
**Implementation Status:** ✅ Successfully migrated with content persistence and cleaning

### Decision 3: Document-Centric vs. Traditional PM Tools
**Context:** Differentiate from existing PM tools while improving documentation
**Decision:** Embed PM functionality within rich documents
**Rationale:**
- Documentation becomes natural byproduct of project work
- Clients get better context and collaboration experience
- Single source of truth for projects and deliverables
- Innovative positioning in crowded PM market
**Trade-offs:**
- User adoption curve for non-traditional workflow
- Complexity of block-level permissions
- Performance challenges with large documents
**Alternatives Considered:** Traditional kanban boards, hybrid approach, separate PM + docs tools

---

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (Next.js)     │◄──►│   (Convex)      │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React UI      │    │ • Database      │    │ • Email         │
│ • BlockNote     │    │ • Auth          │    │ • File Storage  │
│ • shadcn/ui     │    │ • Real-time     │    │ • Notifications │
│ • TypeScript    │    │ • Functions     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Frontend Architecture

### Framework & Core Technologies
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library with dashboard blocks

### Document Editing System
```
BlockNote Editor (Migrated from Novel.sh)
├── Core Editor (BlockNote/ProseMirror)
├── Content Migration System
│   ├── Novel.js/TipTap to BlockNote conversion
│   ├── Empty block filtering and cleaning
│   └── Backward compatibility maintenance
├── Custom Block Extensions (Planned)
│   ├── Tasks Block
│   ├── Stakeholders Block
│   ├── Comments Block
│   ├── Timeline Block
│   ├── Capacity Block
│   └── Deliverables Block
├── Real-time Features (Planned)
│   ├── Yjs Real-time Collaboration
│   └── Multi-user editing
└── Document Persistence
    ├── Convex database integration
    ├── Auto-save with visual feedback
    └── Content versioning
```

### State Management
- **React State** - Local component state with hooks
- **Convex Queries** - Real-time data subscriptions
- **React Context** - Authentication and global state
- **BlockNote State** - Document editing state

### Component Architecture
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── admin/
│   ├── client/
│   └── layout.tsx
├── projects/
│   ├── [id]/
│   └── planning/
└── globals.css

components/
├── ui/ (shadcn/ui components)
├── blocks/ (BlockNote custom blocks)
├── navigation/
├── forms/
└── dashboard/

lib/
├── convex.ts
├── auth.ts
├── utils.ts
└── types.ts
```

### Real-Time Features
- **Document Collaboration** - Live cursor tracking, simultaneous editing
- **Data Synchronization** - Automatic updates across all connected clients
- **Optimistic Updates** - Immediate UI feedback with rollback capability
- **Conflict Resolution** - Operational Transform for concurrent edits

---

## Backend Architecture (Convex)

### Database Design
Convex provides a real-time, serverless database with TypeScript schemas and automatic indexing.

#### Core Tables
```typescript
// Users and Authentication
users: {
  _id: Id<"users">
  email: string
  name: string
  role: "admin" | "pm" | "task_owner" | "client"
  clientId?: Id<"clients">
  departmentIds?: Id<"departments">[]
  createdAt: number
  updatedAt: number
}

// Client Organization
clients: {
  _id: Id<"clients">
  name: string
  description?: string
  createdAt: number
  updatedAt: number
}

departments: {
  _id: Id<"departments">
  name: string
  clientId: Id<"clients">
  workstreamCount: number
  workstreamCapacity: number
  sprintDuration: number
  createdAt: number
  updatedAt: number
}

// Project Documents
projects: {
  _id: Id<"projects">
  title: string
  clientId: Id<"clients">
  departmentId: Id<"departments">
  status: "draft" | "active" | "review" | "complete"
  targetDueDate?: number
  
  // Document type system (Phase 2 foundation)
  documentType: "project_brief" | "meeting_notes" | "wiki_article" | "resource_doc" | "retrospective"
  
  documentContent: object // BlockNote JSONContent
  sections: object[]
  createdAt: number
  updatedAt: number
}

// Task Management
tasks: {
  _id: Id<"tasks">
  title: string
  description: string
  projectId: Id<"projects">
  blockId: string
  assignedTo?: Id<"users">
  dueDate?: number
  size: 0.5 | 1 | 2 | 3 | 4
  type: "design" | "dev" | "client_review" | "pm" | "content" | "strategy" | "other"
  priority: "low" | "medium" | "high"
  sprintId?: Id<"sprints">
  status: "backlog" | "todo" | "in_progress" | "review" | "complete"
  createdAt: number
  updatedAt: number
}

// Personal Todos
todos: {
  _id: Id<"todos">
  userId: Id<"users">
  title: string
  description?: string
  dueDate?: number
  status: "todo" | "in_progress" | "complete"
  priority: "low" | "medium" | "high"
  order: number
  createdAt: number
  updatedAt: number
}

// Sprint Management
sprints: {
  _id: Id<"sprints">
  name: string
  departmentId: Id<"departments">
  startDate: number
  endDate: number
  status: "planning" | "active" | "review" | "complete"
  maxCapacity: number
  currentCapacity: number
  createdAt: number
  updatedAt: number
}

// Comments and Collaboration
comments: {
  _id: Id<"comments">
  content: string
  authorId: Id<"users">
  projectId: Id<"projects">
  blockId?: string
  parentId?: Id<"comments">
  type: "internal" | "client_feedback" | "approval"
  createdAt: number
  updatedAt: number
}

// User Organization
userTaskOrders: {
  _id: Id<"userTaskOrders">
  userId: Id<"users">
  orderedItems: Array<{
    id: string
    type: "task" | "todo"
    order: number
  }>
  updatedAt: number
}

// Cross-document references and linking
documentReferences: {
  _id: Id<"documentReferences">
  sourceDocumentId: Id<"projects">
  targetDocumentId: Id<"projects">
  referenceType: "mention" | "auto_link" | "manual_link"
  sourceBlockId?: string
  targetBlockId?: string
  createdAt: number
}
```

### API Layer (Convex Functions)

#### Queries (Real-time Data Subscriptions)
```typescript
// User queries
queries/users.ts
├── getCurrentUser()
├── getUsersByClient()
└── getUsersByRole()

// Project queries
queries/projects.ts
├── getProjectsByDepartment()
├── getProjectDocument()
├── getProjectTasks()
└── getUserProjects()

// Sprint queries
queries/sprints.ts
├── getActiveSprintsByDepartment()
├── getSprintTasks()
├── getUserSprints()
└── getSprintCapacity()

// Task queries
queries/tasks.ts
├── getTasksByProject()
├── getTasksByUser()
├── getUnassignedTasks()
└── getTasksForSprint()

// Todo queries
queries/todos.ts
├── getUserTodos()
├── getUserTaskOrder()
└── getUnifiedWorkList()

// Search and discovery queries
queries/search.ts
├── searchDocuments()
├── searchByDocumentType() // Phase 2
├── searchByBlockType()
├── getDocumentReferences()
├── getCrossReferences()
└── getAutoLinkSuggestions() // Phase 2
```

#### Mutations (Data Modifications)
```typescript
// User mutations
mutations/users.ts
├── createUser()
├── updateUserRole()
├── assignUserToClient()
└── deactivateUser()

// Project mutations
mutations/projects.ts
├── createProject()
├── updateProjectDocument()
├── updateProjectStatus()
└── deleteProject()

// Task mutations
mutations/tasks.ts
├── createTask()
├── updateTaskStatus()
├── assignTaskToSprint()
├── updateTaskDetails() // PM only
└── addTaskComment()

// Todo mutations
mutations/todos.ts
├── createTodo()
├── updateTodo()
├── deleteTodo()
├── reorderTodos()
└── updateTaskOrder()

// Sprint mutations
mutations/sprints.ts
├── createSprint()
├── assignTasksToSprint()
├── updateSprintStatus()
└── calculateSprintCapacity()

// Document and reference mutations
mutations/documents.ts
├── createDocument()
├── updateDocumentType() // Phase 2
├── createDocumentReference()
├── createAutoLink()
└── updateCrossReferences()

// Search mutations
mutations/search.ts
├── indexDocumentContent()
├── updateSearchIndexes()
└── createSearchSuggestions()
```

### Authentication & Authorization

#### Convex Auth Integration
```typescript
auth.config.ts
├── Email/Password Provider
├── Session Management
├── Role-Based Middleware
└── Permission Validation
```

#### Permission System
```typescript
// Role-based access control
permissions/
├── adminOnly()
├── pmOrAdmin()
├── taskOwnerOrHigher()
├── clientScoped()
└── departmentScoped()

// Document-level permissions
├── canEditProject()
├── canViewProject()
├── canEditTask()
└── canViewComments()
```

---

## Unified Document Architecture with Custom Sections

### Document-as-Container Philosophy
strideOS implements a unified document model where projects exist as single, continuous BlockNote documents containing custom section blocks. This approach creates a Notion-like experience while maintaining the structured organization needed for project management.

```
Unified Project Document Structure:
├── Section Header Block → "Overview" (generates nav)
├── Content Blocks (paragraphs, lists, etc.)
├── Weekly Update Block → Interactive form
├── Section Header Block → "Tasks" (generates nav)
├── Task Management Block → Full CRUD interface
├── Section Header Block → "Team" (generates nav)
├── Stakeholder Block → Team member management
├── Section Header Block → "Settings" (generates nav)
├── Configuration Block → Project settings
└── Auto-generated Navigation from Section Headers
```

### Custom Block Architecture

#### Section Header Block (Foundation)
```typescript
interface SectionHeaderBlock extends BlockNoteBlockSpec {
  name: "section-header"
  group: "strideOS"
  props: {
    title: string
    level: 1 | 2 | 3  // h1, h2, h3
    anchor: string    // auto-generated from title
    order: number     // for navigation ordering
  }
  render: SectionHeaderRenderer
  navigation: {
    generateId: (title: string) => string
    updateNavigation: (sections: SectionHeaderBlock[]) => void
    scrollToSection: (anchor: string) => void
  }
}
```

**Navigation Generation Pattern:**
```typescript
// Auto-scan document for section headers
const generateNavigation = (document: Block[]) => {
  const sections = document
    .filter(block => block.type === 'section-header')
    .map(block => ({
      id: block.props.anchor,
      title: block.props.title,
      level: block.props.level,
      order: block.props.order
    }))
    .sort((a, b) => a.order - b.order);
  
  return sections;
};
```

#### Interactive Custom Blocks

##### Weekly Update Block
```typescript
interface WeeklyUpdateBlock extends BlockNoteBlockSpec {
  name: "weekly-update"
  group: "strideOS"
  props: {
    blockId: string
    updates: Array<{
      id: string
      week: string
      milestones: string[]
      blockers: string[]
      nextWeek: string[]
      authorId: string
      createdAt: number
    }>
  }
  permissions: {
    canAddUpdate: ['admin', 'pm', 'task_owner']
    canEditStructure: ['admin', 'pm']
    canView: ['all']
  }
  convexIntegration: {
    query: api.updates.getByBlock
    mutations: {
      addUpdate: api.updates.create
      editUpdate: api.updates.update
    }
  }
}
```

##### Task Management Block
```typescript
interface TaskBlock extends BlockNoteBlockSpec {
  name: "task-management"
  group: "strideOS"
  props: {
    blockId: string
    projectId: string
    displayMode: 'list' | 'kanban' | 'compact'
  }
  permissions: {
    canCreateTask: ['admin', 'pm']
    canEditTaskDetails: ['admin', 'pm']
    canUpdateStatus: ['admin', 'pm', 'assignee']
    canComment: ['all']
  }
  convexIntegration: {
    query: api.tasks.getByProject
    mutations: {
      create: api.tasks.create
      update: api.tasks.update
      updateStatus: api.tasks.updateStatus
      assign: api.tasks.assign
    }
  }
}
```

##### Stakeholder Block
```typescript
interface StakeholderBlock extends BlockNoteBlockSpec {
  name: "stakeholders"
  group: "strideOS"
  props: {
    blockId: string
    projectId: string
    stakeholders: Array<{
      userId: string
      role: string
      responsibilities: string[]
      contactPreference: string
    }>
  }
  permissions: {
    canManageStakeholders: ['admin', 'pm']
    canEditResponsibilities: ['admin', 'pm']
    canView: ['all']
  }
  convexIntegration: {
    query: api.stakeholders.getByProject
    mutations: {
      add: api.stakeholders.add
      update: api.stakeholders.update
      remove: api.stakeholders.remove
    }
  }
}
```

### Block Development Framework

#### Custom Block Base Pattern
```typescript
abstract class CustomBlockBase {
  abstract name: string;
  abstract group: "strideOS";
  abstract props: Record<string, any>;
  abstract permissions: BlockPermissions;
  
  // Standard patterns for all custom blocks
  protected useConvexData<T>(query: any, args: any): T {
    return useQuery(query, args);
  }
  
  protected useConvexMutation(mutation: any) {
    return useMutation(mutation);
  }
  
  protected renderWithPermissions(user: User, children: React.ReactNode) {
    return (
      <BlockPermissionWrapper user={user} permissions={this.permissions}>
        {children}
      </BlockPermissionWrapper>
    );
  }
}
```

#### Reference ID Integration Pattern
```typescript
// Custom blocks store minimal data, reference external entities
interface CustomBlockProps {
  blockId: string      // Unique block identifier
  referenceId?: string // Optional reference to external data
  localData?: any      // Block-specific data
}

// Example usage in Task Block
const TaskBlockRenderer = ({ block }: { block: TaskBlock }) => {
  // Real-time data from Convex
  const tasks = useQuery(api.tasks.getByProject, { 
    projectId: block.props.projectId 
  });
  
  // Block handles display, Convex handles data
  return (
    <TaskManagementInterface 
      tasks={tasks}
      canEdit={checkPermission(user, block.permissions.canCreateTask)}
      onTaskUpdate={(taskId, updates) => 
        updateTask({ taskId, updates })
      }
    />
  );
};
```

### Navigation & Scrolling Architecture

#### Dynamic TOC Generation
```typescript
interface DocumentNavigation {
  sections: Array<{
    id: string
    title: string
    level: number
    element: HTMLElement
    children?: DocumentNavigation['sections']
  }>
  activeSection: string
  scrollToSection: (id: string) => void
  updateActiveSection: (id: string) => void
}

const useDocumentNavigation = (document: Block[]) => {
  const [navigation, setNavigation] = useState<DocumentNavigation>();
  
  useEffect(() => {
    // Scan document for section blocks
    const sections = extractSections(document);
    
    // Set up intersection observer for active tracking
    const observer = new IntersectionObserver((entries) => {
      const visibleSections = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => entry.target.id);
      
      if (visibleSections.length > 0) {
        setNavigation(nav => ({ 
          ...nav, 
          activeSection: visibleSections[0] 
        }));
      }
    });
    
    // Observe all section headers
    sections.forEach(section => {
      observer.observe(section.element);
    });
    
    return () => observer.disconnect();
  }, [document]);
  
  return navigation;
};
```

#### Smooth Scrolling Implementation
```typescript
const scrollToSection = (anchor: string) => {
  const element = document.getElementById(anchor);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });
    
    // Update URL hash without page reload
    window.history.replaceState(null, null, `#${anchor}`);
  }
};
```

### Block Permissions System
```typescript
interface BlockPermissions {
  canView: string[] // User roles
  canEdit: string[] // User roles
  canInteract: string[] // Can use interactive features
  clientVisible: boolean
  fieldPermissions?: {
    [field: string]: {
      canEdit: string[]
      canView: string[]
    }
  }
}

// Permission checking utility
const checkBlockPermission = (
  user: User, 
  permission: keyof BlockPermissions, 
  block: CustomBlock
): boolean => {
  const userRoles = [user.role];
  if (user.clientId) userRoles.push('client');
  
  return block.permissions[permission]?.some(role => 
    userRoles.includes(role) || role === 'all'
  ) ?? false;
};
```

---

## Data Flow Architecture

### Real-Time Synchronization
```
User Action → Frontend State → Convex Mutation → Database Update
     ↓              ↓              ↓              ↓
UI Update ← Optimistic Update ← Real-time Query ← Change Event
```

### Document Collaboration Flow
```
User Edits Document
     ↓
BlockNote Captures Change
     ↓
Yjs Transform Applied
     ↓
Convex Document Mutation
     ↓
Real-time Broadcast
     ↓
Other Users Receive Update
     ↓
UI Updates Automatically
```

### Task/Todo Management Flow
```
Create Task (PM) → Task Block → Convex → Real-time Update
     ↓
Assign to User → Notification → User Dashboard
     ↓
Status Update (User) → Convex → Real-time Update
     ↓
Sprint Planning ← Task Aggregation ← All Projects
```

---

## Security Architecture

### Authentication Security
- **Secure Password Hashing** - bcrypt with salt rounds
- **Session Management** - Secure HTTP-only cookies
- **JWT Tokens** - Short-lived access tokens
- **Password Requirements** - Strength validation and requirements

### Authorization Security
- **Role-Based Access Control** - Enforced at API level
- **Data Scoping** - Client isolation and department restrictions
- **Block-Level Permissions** - Granular content access control
- **Mutation Guards** - Permission validation before data changes

### Data Security
- **Client Data Isolation** - Enforced database queries
- **Input Validation** - Comprehensive sanitization
- **Audit Logging** - All user actions tracked
- **File Security** - Secure upload and storage handling

### API Security
```typescript
// Convex function security pattern
export const updateTask = mutation({
  args: { taskId: v.id("tasks"), updates: taskUpdateSchema },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const user = await requireAuth(ctx);
    
    // 2. Authorize action
    await requirePermission(ctx, user, "canEditTask", args.taskId);
    
    // 3. Validate input
    const validatedData = validateTaskUpdate(args.updates);
    
    // 4. Execute mutation
    return await ctx.db.patch(args.taskId, validatedData);
  }
});
```

---

## Performance Architecture

### Frontend Performance
- **Code Splitting** - Route-based lazy loading
- **Component Optimization** - React.memo and useMemo
- **Image Optimization** - Next.js automatic optimization
- **Bundle Analysis** - Regular bundle size monitoring

### Document Performance
- **Progressive Loading** - Large documents load incrementally
- **Block Lazy Loading** - Complex blocks load on demand
- **Virtual Scrolling** - Efficient rendering of long lists
- **Debounced Updates** - Reduced API calls during typing

### Backend Performance
- **Query Optimization** - Efficient Convex queries with indexes
- **Caching Strategy** - Strategic data caching
- **Real-time Optimization** - Selective data subscriptions
- **Database Indexing** - Proper indexes for common queries

### Caching Strategy
```typescript
// Query-level caching
const cachedQuery = useMemo(
  () => api.projects.getByDepartment,
  [departmentId]
);

// Component-level caching
const MemoizedTaskBlock = React.memo(TaskBlock, 
  (prev, next) => prev.tasks === next.tasks
);
```

---

## Scalability Considerations

### Horizontal Scaling
- **Convex Auto-scaling** - Automatic backend scaling
- **CDN Distribution** - Global content delivery
- **Load Balancing** - Automatic request distribution
- **Database Sharding** - Client-based data partitioning

### Vertical Scaling
- **Resource Optimization** - Efficient memory and CPU usage
- **Query Optimization** - Reduced database load
- **Caching Layers** - Multiple levels of caching
- **Background Processing** - Async task processing

### Growth Planning
- **User Limits** - Scalable user management
- **Document Limits** - Large document handling
- **File Storage** - Scalable asset management
- **Real-time Connections** - WebSocket connection limits

---

## Monitoring & Observability

### Application Monitoring
- **Error Tracking** - Comprehensive error logging
- **Performance Monitoring** - Real-time performance metrics
- **User Analytics** - Usage patterns and engagement
- **System Health** - Uptime and availability monitoring

### Convex Monitoring
- **Function Performance** - Query and mutation timing
- **Database Metrics** - Query performance and usage
- **Real-time Metrics** - WebSocket connection health
- **Resource Usage** - Memory and CPU utilization

### Logging Strategy
```typescript
// Structured logging
const logger = {
  info: (message: string, meta?: object) => 
    console.log(JSON.stringify({ level: 'info', message, ...meta })),
  error: (message: string, error?: Error, meta?: object) =>
    console.error(JSON.stringify({ level: 'error', message, error: error?.stack, ...meta })),
  audit: (action: string, userId: string, resource: string) =>
    console.log(JSON.stringify({ level: 'audit', action, userId, resource, timestamp: Date.now() }))
};
```

---

## Database Schema Evolution

### Schema Migration Strategy
- **Convex Schema Versioning:** Backward-compatible schema changes
- **Data Migration Scripts:** Automated data transformation for breaking changes
- **Feature Flags:** Gradual rollout of schema-dependent features
- **Rollback Procedures:** Safe rollback mechanisms for failed migrations

### Document Format Versioning
- **Document Schema Versions:** Track document format versions for compatibility
- **Block Migration:** Upgrade custom blocks while preserving data
- **Export Compatibility:** Maintain export formats across versions
- **Legacy Support:** Support for older document formats during transition

---

## Deployment Architecture

### Development Environment
- **Local Development** - Next.js dev server + Convex dev
- **Hot Reloading** - Instant code updates
- **Mock Data** - Development seed data
- **Environment Variables** - Local configuration

### Staging Environment
- **Preview Deployments** - Branch-based previews
- **Integration Testing** - Full feature testing
- **Performance Testing** - Load and stress testing
- **Security Testing** - Vulnerability scanning

### Production Environment
- **Vercel Deployment** - Automatic deployments
- **Convex Production** - Production backend
- **Domain Configuration** - Custom domain setup
- **SSL/TLS** - Automatic HTTPS

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
Deploy Pipeline:
  1. Code Quality Checks
     ├── TypeScript compilation
     ├── ESLint validation
     ├── Prettier formatting
     └── Test execution
  
  2. Build Process
     ├── Next.js build
     ├── Bundle optimization
     ├── Asset optimization
     └── Performance analysis
  
  3. Deployment
     ├── Convex schema migration
     ├── Function deployment
     ├── Frontend deployment
     └── Health checks
```

---

## Future Architecture Considerations

### Microservices Evolution
- **Service Separation** - Breaking into focused services
- **API Gateway** - Centralized API management
- **Event-Driven Architecture** - Async communication patterns
- **Data Consistency** - Distributed transaction handling

### Advanced Features
- **AI Integration** - Content suggestions and automation
- **Advanced Analytics** - Business intelligence features
- **Third-party Integrations** - External tool connections
- **Mobile Applications** - Native mobile app architecture

### Technology Evolution
- **Next.js Updates** - Framework version upgrades
- **BlockNote Enhancements** - Editor feature additions
- **Convex Features** - Backend capability expansion
- **Performance Optimizations** - Continuous improvements

---

## Real-time Collaboration Architecture

### Operational Transform Implementation
- **Document-Level OT:** BlockNote's Yjs-based collaborative editing
- **Block-Level Conflicts:** Custom conflict resolution for interactive blocks
- **Cross-User Coordination:** Prevent simultaneous editing of same block elements
- **State Synchronization:** Ensure UI consistency across all connected clients

### Conflict Resolution Strategies
```typescript
// Example conflict resolution for task updates
interface ConflictResolution {
  strategy: 'last_write_wins' | 'merge_changes' | 'manual_resolution'
  field: string
  conflictedValues: any[]
  resolution?: any
}

const resolveTaskConflict = (
  original: Task,
  userUpdate: Partial<Task>,
  serverUpdate: Partial<Task>
): Task => {
  // PM-controlled fields: server wins
  // User-controlled fields: merge or user wins
  // Timestamp-based resolution for comments
}
```

---

## Error Handling Architecture

### Frontend Error Boundaries
- **Component-Level:** Custom error boundaries for each major UI section
- **Block-Level:** Individual block error handling to prevent document corruption
- **Network Errors:** Automatic retry with exponential backoff
- **Offline Handling:** Graceful degradation and sync recovery

### Backend Error Handling
- **Mutation Failures:** Atomic operations with rollback capabilities
- **Real-time Disconnections:** Automatic reconnection and state reconciliation
- **Permission Errors:** Clear user feedback with suggested actions
- **Data Validation:** Comprehensive input validation with detailed error messages

### Recovery Mechanisms
- **Document Recovery:** Auto-save with version history for corruption recovery
- **User Session Recovery:** Persistent auth state across browser crashes
- **Real-time Sync Recovery:** Conflict resolution for concurrent edits
- **Data Consistency:** Eventual consistency with conflict detection