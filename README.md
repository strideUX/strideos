# strideOS

A modern, document-centric project management platform that embeds PM functionality within rich, collaborative documents. Built with Next.js 15, TypeScript, Tailwind CSS, and Convex.

## 🚀 Features

- **Document-Centric Approach**: Embed project management features within rich documents
- **Real-time Collaboration**: Work together with your team in real-time
- **Role-Based Access Control**: Secure access based on user roles (admin, pm, task_owner, client)
- **Modern Tech Stack**: Built with Next.js 15, TypeScript, and Tailwind CSS
- **Real-time Database**: Powered by Convex for instant data synchronization

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Convex (Full-stack TypeScript backend)
- **Database**: Convex (Built-in reactive database)
- **Authentication**: Convex Auth
- **Styling**: Tailwind CSS with shadcn/ui
- **State Management**: React Query (built into Convex) + React useState/useReducer
- **Type Safety**: TypeScript with strict mode
- **Validation**: Zod schemas for form validation

## 📋 Prerequisites

- Node.js 18+ with npm or pnpm
- Git for version control
- Convex account (create at [convex.dev](https://convex.dev))
- Modern browser for testing

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd strideos
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

**Step 3a: Create Next.js environment file**

Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

Update the `.env.local` file with your configuration:

```env
# Convex Configuration
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=strideOS
```

**Step 3b: Set Convex environment variables**

**Critical**: Set required Convex Auth environment variables:

```bash
# Required for JWT token generation (use a secure random string)
npx convex env set JWT_PRIVATE_KEY "your-secure-random-key-here"

# Required for authentication redirects
npx convex env set SITE_URL "http://localhost:3000"
```

**⚠️ Without these, authentication will fail!**

### 4. Start the development servers

**Important**: You need to run both servers for full functionality including authentication, database operations, and real-time features.

```bash
# Terminal 1: Start Convex backend first
npx convex dev

# Terminal 2: Start Next.js frontend  
npm run dev
```

**What each server does:**
- **Convex (`npx convex dev`)**: Handles database, authentication, API endpoints, real-time subscriptions
- **Next.js (`npm run dev`)**: Serves the frontend application with hot reloading

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**Troubleshooting**: If authentication doesn't work, ensure both servers are running. You should see activity in both terminals when using the app.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles with Tailwind directives
│   ├── layout.tsx         # Root layout (required)
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # shadcn/ui base components
│   └── features/          # Feature-specific components
├── lib/
│   ├── utils.ts          # Utility functions (including cn helper)
│   └── validations.ts    # Zod schemas for form validation
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## 🧪 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

## 📚 Documentation

- [Project Specifications](./docs/specs.md) - Detailed project requirements
- [Technical Architecture](./docs/architecture.md) - System design and decisions
- [UI/UX Design](./docs/design.md) - Design patterns and guidelines
- [Technology Stack](./docs/stack.md) - Tech stack guidelines and best practices
- [Implementation Tasks](./docs/tasks.md) - Development roadmap and user stories

## 🔧 Development Guidelines

### Code Style

- Use TypeScript with strict mode
- Follow ESLint and Prettier configurations
- Use Server Components by default, Client Components only when needed
- Implement proper error boundaries and loading states
- Use Tailwind CSS for styling with the `cn` utility for class merging

### Component Architecture

- Keep client boundary minimal
- Use TypeScript interfaces for props
- Implement proper loading and error states
- Follow the established folder structure

### Data Fetching

- Use Convex queries directly in Server Components
- Use `useQuery` hook from Convex for Client Components
- Implement proper loading states with Suspense boundaries
- Handle errors gracefully with error boundaries

## 🚧 Development Roadmap

### Foundation Features (In Progress)
- ✅ **Feature 1**: Project Setup & Basic Infrastructure
- 🔄 **Feature 2**: Convex Backend Integration
- ⏳ **Feature 3**: Authentication System
- ⏳ **Feature 4**: Role-Based Access & Simple Views
- ⏳ **Feature 5**: shadcn/ui Dashboard Foundation

### Core Data Features (Planned)
- **Feature 6**: Project Management Core
- **Feature 7**: Task Management System
- **Feature 8**: Client Management

### Document Features (Planned)
- **Feature 9**: Document Editor Foundation
- **Feature 10**: Custom Document Blocks
- **Feature 11**: Document Collaboration
- **Feature 11.5**: Document Versioning

## 🤝 Contributing

1. Follow the established code style and architecture patterns
2. Reference the documentation in the `docs/` folder
3. Update relevant documentation when making architectural changes
4. Use TypeScript for all new code
5. Implement proper error handling and loading states

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For questions or issues, please refer to the documentation in the `docs/` folder or create an issue in the repository.
