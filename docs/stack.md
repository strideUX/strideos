# Technology Stack Guidelines

## Stack Overview
**Frontend:** Next.js 15 with App Router
**Backend:** Convex (Full-stack TypeScript backend)
**Database:** Convex (Built-in reactive database)
**Authentication:** Convex Auth
**Document Editor:** BlockNote (Migrated from Novel.sh)
**Styling:** Tailwind CSS with shadcn/ui
**State Management:** React Query (built into Convex) + React useState/useReducer
**Testing:** Jest + React Testing Library + Playwright

---

## Next.js 15 App Router Guidelines

### Framework Standards
- **Always use App Router** (`app/` directory) - Pages Router is legacy
- **Prefer Server Components** over Client Components by default
- **Use Client Components only when needed** for interactivity (`'use client'` directive)
- **TypeScript strict mode** enabled for all components
- **Follow Next.js 15 conventions** and latest best practices

### File Organization Standards
```
src/
├── app/
│   ├── (marketing)/         # Route groups for organization
│   ├── (dashboard)/         # Protected routes group
│   ├── api/                # API routes (minimal - most logic in Convex)
│   ├── globals.css         # Global styles with Tailwind directives
│   ├── layout.tsx          # Root layout (required)
│   └── page.tsx            # Home page
├── components/
│   ├── ui/                 # shadcn/ui base components
│   └── features/           # Feature-specific components
├── lib/
│   ├── utils.ts           # Utility functions (including cn helper)
│   └── validations.ts     # Zod schemas for form validation
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

### Component Standards
- **Use Server Components by default** for data fetching and static content
- **Mark Client Components explicitly** with `'use client'` directive
- **Keep client boundary minimal** - only mark components that actually need interactivity
- **Use TypeScript interfaces** for props with proper typing
- **Implement error boundaries** for graceful error handling
- **Use React.memo()** for expensive Client Components when needed

### Data Fetching Patterns
- **Use Convex queries directly** in Server Components
- **Use `useQuery` hook** from Convex for Client Components
- **Implement proper loading states** with Suspense boundaries
- **Handle errors gracefully** with error boundaries
- **Cache strategy**: Let Convex handle caching (don't use fetch() cache options)

### Routing & Navigation
- **Use file-based routing** with App Router conventions
- **Implement route groups** `()` for organization without affecting URLs
- **Use dynamic routes** `[slug]` for parameter-based pages
- **Use `generateStaticParams`** instead of `getStaticPaths`
- **Link component** for client-side navigation with proper prefetching

### Authentication Integration
- **Use Convex Auth** for authentication
- **Protect routes** using Convex authentication state
- **Use `<Authenticated>` and `<Unauthenticated>`** components from Convex
- **Server-side auth checks** in Server Components when needed

### Styling Standards
- **Use Tailwind CSS** utility classes for styling
- **Implement shadcn/ui** for consistent design system components
- **Mobile-first responsive design** with Tailwind breakpoints
- **Use CSS custom properties** for theme customization
- **Import globals.css** in root layout only

### Performance & SEO
- **Use `next/image`** component for all images with proper optimization
- **Implement metadata API** for SEO in layout.tsx and page.tsx files
- **Use Suspense boundaries** for loading states and code splitting
- **Follow Core Web Vitals** best practices
- **Minimize Client Components** to reduce JavaScript bundle size

---

## BlockNote Editor Integration

### Editor Standards
- **Use BlockNote for all rich text editing** - migrated from Novel.sh
- **Implement client-side only components** for BlockNote to avoid SSR issues
- **Use custom CSS theming** to integrate with shadcn/ui design system
- **Handle content migration** from old Novel.js/TipTap formats
- **Implement content cleaning** to remove empty blocks automatically

### BlockNote Component Structure
```
BlockNoteEditor (Client Component)
├── useCreateBlockNote hook
├── BlockNoteView component
├── Custom schema with extensibility
└── Content change handling

DocumentEditor (Wrapper Component)
├── State management
├── Auto-save functionality
├── Database integration
└── UI polish and theming
```

### Content Management
- **Store content as BlockNote JSON** in Convex database
- **Use `v.any()` schema type** for flexible content storage
- **Implement content migration** for backward compatibility
- **Clean empty blocks** before saving to database
- **Handle SSR properly** with client-side only initialization

### Performance Considerations
- **Lazy load BlockNote** to reduce initial bundle size
- **Use key prop** for proper component re-initialization
- **Avoid infinite loops** in content change handlers
- **Optimize auto-save** with debounced updates
- **Handle large documents** with efficient rendering

---

## UI Development Standards

### Pattern Consistency Requirements
- Reference existing pages for layout and component patterns
- Maintain consistency in component library usage
- Follow established styling and spacing conventions
- Integrate with existing navigation and routing patterns

### Implementation Process
1. Identify similar existing functionality
2. Copy proven patterns and structures
3. Adapt content while maintaining pattern integrity
4. Verify consistency with established design system

---

## Convex Backend Guidelines

### Database & Schema Design
- **Define schemas** using Convex schema definitions with proper types
- **Use relational patterns** with document references (Convex IDs)
- **Implement proper indexing** for query performance
- **Use Convex validators** (v.string(), v.id(), etc.) for type safety
- **Design for real-time updates** - Convex handles reactivity automatically

### Query Patterns
- **Use Convex queries** for data fetching (replace REST APIs)
- **Implement proper filters** with `.withIndex()` instead of `.filter()`
- **Keep queries focused** - single responsibility per query
- **Use internal queries** for shared logic between functions
- **Handle authentication** in every query/mutation with `ctx.auth.getUserIdentity()`

### Mutation Best Practices
- **Validate all inputs** using Convex validators
- **Check authentication** before any data modification
- **Use transactions** implicitly (Convex mutations are atomic)
- **Implement proper error handling** with meaningful error messages
- **Keep mutations focused** on single operations

### Authentication & Security
- **Always check auth state** with `ctx.auth.getUserIdentity()` 
- **Never trust client-side data** - validate everything server-side
- **Use internal functions** for sensitive operations
- **Implement proper access control** - check user permissions for resources
- **Secure by default** - deny access unless explicitly allowed

### File Organization
```
convex/
├── schema.ts              # Database schema definitions
├── auth.config.ts         # Authentication configuration
├── users.ts              # User-related functions
├── posts.ts              # Post-related functions
├── _generated/           # Auto-generated files (don't edit)
└── lib/                  # Shared utilities and helpers
```

### Real-time Features
- **Leverage Convex reactivity** - queries automatically update
- **Use `useQuery`** for real-time data in React components
- **Implement optimistic updates** where appropriate
- **Handle connection states** with Convex auth hooks

---

## Authentication
- **Email/Password authentication** (initial implementation)
- **Convex Auth** as the primary authentication system
- **Future integrations**: Google OAuth and Slack OAuth
- **Role-based access control**: Admin, PM, Task Owner, Client roles

---

## BlockNote Document Editor Guidelines

### Editor Framework
- **BlockNote** built on ProseMirror for rich text editing with extensible block system
- **Custom block system** designed specifically for interactive project management blocks
- **Real-time collaboration** with Yjs (production-proven by NY Times, Atlassian, WordPress)
- **React-first architecture** with excellent TypeScript support
- **Reference ID pattern** for external data integration with Convex

### Custom Block Development
- **Block Components**: Create React components for custom block functionality
- **Slash Commands**: Register blocks with slash command system for easy insertion
- **External Data**: Use reference ID pattern to connect blocks to Convex data
- **Role-Based Editing**: Implement conditional rendering based on user roles within blocks
- **Real-time Updates**: Leverage Convex useQuery hooks for automatic data synchronization

### Block Architecture Pattern
```typescript
// Custom block with external data reference
interface StrideBlock {
  type: 'tasks' | 'stakeholders' | 'comments' | 'timeline' | 'capacity' | 'deliverables'
  props: {
    referenceId: string  // ID of external Convex data
    // Block stores only reference, actual data in Convex
  }
  content: ReactElement  // React component with role-based rendering
}

// Usage pattern in block component
const TaskBlock = ({ referenceId, user }) => {
  const task = useQuery(api.tasks.getById, { id: referenceId })
  return (
    <div>
      {user.role === 'pm' ? <PMEditInterface task={task} /> : <AssigneeInterface task={task} />}
    </div>
  )
}
```

---

## Styling (Tailwind CSS + shadcn/ui)

### Tailwind Standards
- **Use utility classes** for all styling
- **Follow mobile-first** responsive design principles
- **Use Tailwind's design tokens** for consistency (spacing, colors, typography)
- **Configure custom colors** in tailwind.config.js when needed
- **Use @layer directives** in CSS for custom utilities

### shadcn/ui Integration
- **Use shadcn/ui components** as the foundation for UI elements
- **Customize theme** in CSS custom properties
- **Extend components** by wrapping shadcn/ui components
- **Maintain design system consistency** across the application
- **Use proper TypeScript** with shadcn/ui component props

### Component Patterns
- **Create compound components** using shadcn/ui primitives
- **Use consistent spacing** with Tailwind's spacing scale
- **Implement proper focus states** for accessibility
- **Follow color contrast** guidelines for accessibility
- **Use semantic color names** in theme configuration

---

## Role-Based Development Patterns

### Permission Checking Standards
```typescript
// Always check user role and permissions
export const updateTask = mutation({
  args: { taskId: v.id("tasks"), updates: taskUpdateSchema },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");
    
    // Role-specific logic
    const userRole = await getUserRole(ctx, user.tokenIdentifier);
    if (userRole === 'client') {
      throw new Error("Clients cannot edit tasks");
    }
    
    // PM vs Task Owner permissions
    if (userRole === 'task_owner') {
      // Can only update status, not details
      const allowedFields = ['status'];
      const filteredUpdates = pick(args.updates, allowedFields);
      return await ctx.db.patch(args.taskId, filteredUpdates);
    }
    
    // PM and Admin can update everything
    return await ctx.db.patch(args.taskId, args.updates);
  }
});
```

### Client Data Isolation

- Scope all queries by client/department access
- Filter sensitive data before sending to frontend
- Implement department-based access control
- Block-level visibility controls for client users

---

## Document-Centric Development Patterns

### Project as Document Architecture
- **Every project is a rich document** with embedded functional blocks
- **Avoid traditional CRUD pages** - work within document context
- **Block-based interactions** rather than separate task management screens
- **Progressive documentation** happens naturally through project work

### Document State Management
```typescript
// Document-centric state patterns
const useProjectDocument = (projectId: string) => {
  const document = useQuery(api.projects.getDocument, { projectId });
  const tasks = useQuery(api.tasks.getByProject, { projectId });
  const comments = useQuery(api.comments.getByProject, { projectId });
  
  return {
    document,
    blocks: {
      tasks,
      comments,
      // Other block data
    }
  };
};
```

---

## State Management

### Client State
- **Use React useState/useReducer** for local component state
- **Use Convex queries** for server state (no need for additional libraries)
- **Leverage React Context** for global client state when needed
- **Avoid prop drilling** with proper component composition
- **Keep state close** to where it's used

### Server State
- **Convex handles all server state** - no need for React Query/SWR
- **Use `useQuery` hook** for reactive data fetching
- **Implement `useMutation` hook** for data modifications
- **Let Convex handle** caching, invalidation, and real-time updates
- **Use optimistic updates** for better UX where appropriate

---

## Form Handling

### Form Libraries
- **Use React Hook Form** for complex forms
- **Integrate with Zod** for validation schemas
- **Use shadcn/ui form components** for consistent styling
- **Implement proper error handling** with field-level errors
- **Use Convex mutations** for form submissions

### Validation Strategy
- **Client-side validation** with Zod schemas for immediate feedback
- **Server-side validation** in Convex mutations for security
- **Share validation schemas** between client and server when possible
- **Provide clear error messages** for validation failures
- **Use TypeScript** for compile-time type checking

---

## Testing Strategy

### Unit & Integration Testing
- **Jest + React Testing Library** for component testing
- **Test user interactions** not implementation details
- **Mock Convex functions** in tests when needed
- **Test accessibility** with appropriate queries and assertions
- **Use MSW (Mock Service Worker)** for API mocking if needed

### End-to-End Testing
- **Playwright** for E2E testing workflows
- **Test critical user journeys** (authentication, core features)
- **Use proper test data** setup and cleanup
- **Test across different browsers** and device sizes
- **Implement visual regression testing** when appropriate

---

## Development Workflow

### Code Quality
- **ESLint + Prettier** for code formatting and linting
- **TypeScript strict mode** for type safety
- **Use Convex ESLint rules** for best practices
- **Implement pre-commit hooks** with Husky
- **Code reviews** for all changes

### Environment Management
- **Use .env.local** for development environment variables
- **Use .env** for production environment variables
- **Never commit secrets** to version control
- **Document all required** environment variables
- **Use TypeScript** for environment variable validation

### Development Scripts
- **`npx convex dev`** - Start Convex backend development server (Terminal 1)
- **`npm run dev`** - Start Next.js frontend development server (Terminal 2)  
- **`npm run build`** - Build production application
- **`npm run lint`** - Run ESLint and type checking
- **`npm run test`** - Run test suite

### Development Workflow (Two Terminal Setup)
**Important**: Both servers must be running for full functionality including authentication, database operations, and real-time features.

1. **Terminal 1**: `npx convex dev` - Start Convex backend first
2. **Terminal 2**: `npm run dev` - Start Next.js frontend
3. **Browser**: Navigate to `http://localhost:3000`
4. **Verify**: Both servers show successful startup messages

**Expected Output:**
- **Convex Terminal**: Shows database operations, auth requests, function calls
- **Next.js Terminal**: Shows page requests, compilation status, hot reload events
- **Browser**: Full application functionality with working authentication

---

## Deployment Strategy

### Production Setup
- **Deploy to Vercel** for optimal Next.js performance
- **Use Convex Cloud** for backend deployment
- **Configure proper domains** for production
- **Set up monitoring** and error tracking
- **Implement proper environment** variable management

### Performance Monitoring
- **Monitor Core Web Vitals** with Next.js analytics
- **Track Convex function performance** in dashboard
- **Set up error tracking** with Sentry or similar
- **Monitor authentication flows** for issues
- **Use proper logging** for debugging

---

*Last Updated: [07-29-25]*
*Review Date: [07-29-25]*

## Key Principles

1. **Server Components First** - Use Client Components only when necessary
2. **Convex for Everything** - Replace traditional APIs with Convex functions
3. **Type Safety Everywhere** - Use TypeScript strictly throughout the stack
4. **Real-time by Default** - Leverage Convex's reactive nature
5. **Security First** - Always authenticate and authorize on the server
6. **Performance Matters** - Optimize for Core Web Vitals and user experience

## Notes
- This stack represents the latest best practices as of 2025
- Next.js App Router is the recommended approach (Pages Router is legacy)
- Convex eliminates the need for traditional REST APIs and state management
- Authentication is handled by Convex Auth
- All examples follow TypeScript strict mode conventions
