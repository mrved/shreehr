# Codebase Structure

**Analysis Date:** 2026-02-08

## Directory Layout

```
shreehr/
├── src/                        # Application source code
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── (auth)/            # Auth-specific routes grouped layout
│   │   ├── api/               # API routes (65 endpoints)
│   │   ├── dashboard/         # Admin/HR dashboard
│   │   ├── employee/          # Employee portal
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage redirect
│   │   └── global-error.tsx   # Error boundary
│   ├── components/            # Reusable React components
│   │   ├── ui/               # Shadcn UI primitives
│   │   ├── layout/           # App shell components
│   │   ├── chat/             # AI assistant components
│   │   ├── admin/            # Admin-specific components
│   │   ├── auth/             # Authentication forms
│   │   ├── attendance/       # Attendance features
│   │   ├── payroll/          # Payroll displays
│   │   ├── leave/            # Leave management
│   │   ├── employees/        # Employee management
│   │   ├── expenses/         # Expense claims
│   │   ├── loans/            # Loan management
│   │   └── [more]/           # Other feature components
│   ├── lib/                   # Business logic, utilities, services
│   │   ├── ai/               # AI model and tool integration
│   │   ├── payroll/          # Payroll calculations
│   │   ├── statutory/        # Indian compliance rules
│   │   ├── email/            # Email service
│   │   ├── pdf/              # PDF generation
│   │   ├── qdrant/           # Vector DB integration
│   │   ├── queues/           # Job queue setup
│   │   ├── validations/      # Zod schemas
│   │   ├── workflows/        # Business workflows
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── auth-options.ts   # Auth provider options
│   │   ├── db.ts             # Prisma client singleton
│   │   ├── rbac.ts           # Role-based access control
│   │   ├── audit.ts          # Audit logging
│   │   ├── cache.ts          # Redis caching
│   │   ├── encryption.ts     # Data encryption
│   │   ├── error-logger.ts   # Error tracking
│   │   └── [utilities]/      # Other helpers
│   ├── types/                # TypeScript types
│   │   └── index.ts          # Shared types
│   ├── hooks/                # React custom hooks
│   │   └── use-toast.ts      # Toast notification hook
│   └── middleware.ts         # Next.js middleware
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma         # Prisma ORM schema
│   └── migrations/           # Database migrations
├── e2e/                      # Playwright end-to-end tests
│   ├── fixtures/             # Test fixtures
│   ├── pages/                # POM helpers
│   ├── setup/                # Test setup
│   └── utils/                # Test utilities
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
├── .planning/                # GSD planning documents
│   ├── codebase/            # Architecture analysis
│   └── phases/              # Implementation phases
├── .claude/                  # Claude integration config
├── node_modules/            # Dependencies (pnpm)
├── uploads/                 # File uploads directory
├── package.json            # Project manifest
├── tsconfig.json           # TypeScript config
├── next.config.ts          # Next.js config
├── biome.json              # Code style config
├── dockerfile              # Container image definition
└── docker-compose.yml      # Local dev environment
```

## Directory Purposes

**`src/app/`**
- Purpose: Next.js App Router - pages, layouts, API routes
- Contains: TypeScript/TSX files organized by route
- Key pattern: Nested folder structure maps to URL paths
- Example: `src/app/dashboard/employees/page.tsx` → `/dashboard/employees`

**`src/app/(auth)/`**
- Purpose: Authentication routes with shared layout
- Contains: Login page and auth-specific layouts
- Pattern: Route group using parentheses - doesn't affect URL
- Auth layout: Centered, minimal UI without dashboard shell

**`src/app/api/`**
- Purpose: 65 API endpoints for CRUD, webhooks, cron jobs
- Contains: `route.ts` files with GET/POST/PUT/DELETE handlers
- Organization: Grouped by feature (attendance, employees, payroll, etc.)
- Pattern: Nested routes support path parameters (e.g., `/api/employees/[id]`)

**`src/app/dashboard/`**
- Purpose: Admin and manager interface
- Contains: Pages for employees, payroll, attendance, documents, leave, expenses, etc.
- Redirect logic: Employees redirect to `/employee/dashboard`
- Layout: Uses DashboardShell with sidebar, header

**`src/app/employee/`**
- Purpose: Employee self-service portal
- Contains: Attendance, payslips, tax info, leave requests, loans, expenses
- Separate from admin to provide role-specific UX
- Layout: Similar shell but with employee-only navigation

**`src/components/ui/`**
- Purpose: Reusable Shadcn UI component primitives
- Contains: Alert, Badge, Button, Card, Dialog, Label, Select, Separator
- Source: Installed via shadcn CLI, customized via Tailwind
- Approach: Building blocks for higher-level components

**`src/components/layout/`**
- Purpose: Application shell and navigation
- Key files:
  - `dashboard-shell.tsx` - Main layout wrapper (sidebar + header + content)
  - `header.tsx` - Top navigation bar
  - `sidebar.tsx` - Role-based navigation menu
- Pattern: Composition of shell with role-aware sidebar

**`src/components/chat/`**
- Purpose: AI assistant UI components
- Contains: Chat interface, message display, floating button
- Integration: Uses AI SDK React hooks for streaming responses

**`src/components/[feature]/`**
- Purpose: Feature-specific UI components (attendance, payroll, etc.)
- Pattern: Co-locate with feature logic
- Example: `src/components/attendance/check-in-form.tsx`, `src/components/payroll/payslip-viewer.tsx`

**`src/lib/ai/`**
- Purpose: AI model integration and tool definitions
- Files:
  - `model-client.ts` - Load Claude (Anthropic) or Ollama
  - `conversation.ts` - Manage chat history and persistence
  - `prompts.ts` - System prompts for HR assistant
  - `tools/` - Tool definitions for model to call
- Flexibility: Pluggable providers (Anthropic, Ollama, mock)

**`src/lib/payroll/`**
- Purpose: Salary and statutory compliance calculations
- Files:
  - `calculator.ts` - Core payroll math
  - `constants.ts` - Tax slabs, deduction rates (FY-specific)
  - `validators.ts` - Salary structure validation
  - `types.ts` - TypeScript interfaces
- Indian compliance: PF (Provident Fund), ESI, Income Tax per government rules

**`src/lib/statutory/`**
- Purpose: Compliance-specific rules and utilities
- Contains: Statutory alert generators, compliance checks
- Example: Generate alerts for PF registration deadlines, tax filing requirements

**`src/lib/queues/`**
- Purpose: Background job processing via BullMQ
- Files:
  - `connection.ts` - Redis connection config
  - `payroll.queue.ts` - Payroll run job definitions
  - `embedding.queue.ts` - Vector embedding jobs
  - `workers/` - Job handlers
- Usage: Long-running tasks decoupled from HTTP requests

**`src/lib/email/`**
- Purpose: Email notification dispatch
- Contains: Email templates, sending logic
- Integration: Resend for email delivery

**`src/lib/pdf/`**
- Purpose: PDF generation (payslips, documents)
- Contains: PDF rendering functions
- Libraries: @react-pdf/renderer, pdfjs-dist

**`src/lib/qdrant/`**
- Purpose: Vector database integration for semantic search
- Usage: Policy document search in AI assistant

**`src/lib/validations/`**
- Purpose: Zod schemas for form and API validation
- Pattern: Define once, use on client and server
- Approach: Shared validation logic across frontend and backend

**`src/lib/auth.ts`**
- Purpose: NextAuth v5 configuration and session helpers
- Exports: `auth()` function for server-side session access
- Session strategy: JWT with 24-hour expiry

**`src/lib/rbac.ts`**
- Purpose: Centralized permission system
- Pattern:
  - `PERMISSIONS` constant maps permissions to allowed roles
  - `hasPermission(role, permission)` check
  - `requirePermission(session, permission)` throws on denial
- Roles: EMPLOYEE, HR_MANAGER, PAYROLL_MANAGER, ADMIN, SUPER_ADMIN

**`src/lib/audit.ts`**
- Purpose: Action logging for compliance and debugging
- Functions: `logAuditAction()`, `logToolExecution()`, `logPermissionDenied()`
- Data: User ID, action, resource, timestamp, outcome

**`src/lib/cache.ts`**
- Purpose: Redis caching with revalidation
- Pattern: Get-or-compute pattern with cache invalidation
- Example: Dashboard counts cached with revalidatePath on updates

**`src/lib/error-logger.ts`**
- Purpose: Centralized error reporting
- Pattern: `logError()` with type, severity, context
- Tracking: File, line number, user context, metadata

**`src/types/`**
- Purpose: Shared TypeScript interfaces
- Contains: Types used across app (User, Session, etc.)
- Single file: `index.ts` exports all types

**`src/hooks/`**
- Purpose: Reusable React hooks
- Example: `use-toast.ts` for toast notifications
- Pattern: Custom hooks for UI state management

**`prisma/schema.prisma`**
- Purpose: Database schema definition
- Contains: Models (User, Employee, Attendance, Payroll, etc.)
- Relationships: Defined via @relation directives
- Audit fields: created_at, created_by, updated_at, updated_by on key models

**`e2e/`**
- Purpose: Playwright end-to-end tests
- Structure:
  - `fixtures/` - Test data and setup
  - `pages/` - Page Object Model helpers
  - `setup/` - Test environment setup
  - `utils/` - Test utilities

**`.planning/codebase/`**
- Purpose: Architecture analysis documents
- Files: STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout (HTML, global styles)
- `src/app/page.tsx` - Homepage (redirect logic)
- `src/app/(auth)/login/page.tsx` - Login form
- `src/app/dashboard/layout.tsx` - Admin dashboard shell
- `src/app/employee/layout.tsx` - Employee portal shell

**Configuration:**
- `package.json` - Project manifest, scripts, dependencies
- `tsconfig.json` - TypeScript compiler options
- `next.config.ts` - Next.js configuration
- `biome.json` - Code style and linting rules
- `prisma/schema.prisma` - Database schema
- `docker-compose.yml` - Local dev environment

**Core Logic:**
- `src/lib/auth-options.ts` - NextAuth configuration (credentials provider)
- `src/lib/rbac.ts` - Permission definitions and checking
- `src/lib/db.ts` - Prisma client singleton
- `src/lib/payroll/calculator.ts` - Salary calculations
- `src/lib/ai/model-client.ts` - AI provider detection and loading

**API Routes:**
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `src/app/api/chat/route.ts` - AI chat endpoint (streaming)
- `src/app/api/employees/route.ts` - Employee CRUD
- `src/app/api/attendance/check-in/route.ts` - Check-in endpoint
- `src/app/api/conversations/route.ts` - Chat history endpoint

**Testing:**
- `e2e/` - Playwright test suite
- `src/lib/encryption.test.ts` - Encryption unit tests

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: `ComponentName.tsx` (PascalCase for React components)
- Utilities: `utility-name.ts` (kebab-case for non-component files)
- Tests: `*.test.ts` or `*.spec.ts`

**Directories:**
- Feature areas: singular lowercase (`attendance`, `employees`, `payroll`)
- Feature grouping: folder per major feature with nested routes
- UI components: `ui/` for Shadcn primitives, `[feature]/` for feature-specific
- Services: Under `src/lib/` organized by concern (ai/, payroll/, email/)

**Variables & Functions:**
- Functions: camelCase (`checkInAttendance`, `calculatePayroll`)
- Constants: UPPER_CASE (`MAX_LEAVE_DAYS`, `PAYROLL_CUTOFF_DATE`)
- React components: PascalCase (`DashboardShell`, `AttendanceForm`)
- Types: PascalCase (`Session`, `Employee`, `AttendanceRecord`)

**API Route Organization:**
```
src/app/api/
├── [feature]/
│   ├── route.ts           # GET all, POST create
│   ├── [id]/
│   │   └── route.ts       # GET one, PUT update, DELETE
│   └── [subresource]/
│       └── route.ts       # Feature-specific sub-endpoints
```

## Where to Add New Code

**New API Endpoint:**
1. Create folder: `src/app/api/[feature]/route.ts` (if not exists)
2. Export handler: `export async function GET(req, ctx) { ... }`
3. Structure:
   - Auth check: `const session = await auth()`
   - RBAC check: `requirePermission(session, 'feature:action')`
   - Business logic: Call service function
   - Audit log: `logAuditAction()` for sensitive ops
   - Response: Return with status code
4. Error handling: Wrap in try/catch or use `withErrorLogging()`

**New Component:**
1. Create: `src/components/[feature]/ComponentName.tsx`
2. If reusable UI primitive: Place in `src/components/ui/`
3. Use "use client" directive if interactive
4. Import from `@/components/` and `@/lib/` for utilities

**New Service Function:**
1. Create: `src/lib/[concern]/function-name.ts`
2. Organize by concern (ai, payroll, email, etc.)
3. Export pure function(s)
4. Include TypeScript types
5. Document with JSDoc comments

**New Page/Route:**
1. Create folder structure matching URL: `src/app/[segment]/...`
2. Add `page.tsx` for content
3. Add `layout.tsx` for shared structure (optional)
4. Auth check: `const session = await auth()` in component
5. Permission check: `requirePermission()` if needed
6. Redirect unauthorized users

**Database Model Changes:**
1. Edit `prisma/schema.prisma`
2. Add model or modify existing
3. Generate migration: `pnpm db:push`
4. Run: `pnpm db:generate` (Prisma client)
5. Update types in `src/types/` if needed

**New Background Job:**
1. Define queue: `src/lib/queues/[feature].queue.ts`
2. Import from `src/lib/queues/connection.ts`
3. Create worker: `src/lib/queues/workers/[feature].ts`
4. Enqueue from API: `await [feature]Queue.add('task-name', data)`

**New AI Tool:**
1. Create: `src/lib/ai/tools/[tool-name].ts`
2. Export object with: name, description, parameters, execute function
3. Permission check in execute: `requirePermission(context.session, permission)`
4. Register in: `src/lib/ai/tools/index.ts` createEmployeeDataTools or createPolicySearchTool
5. Test with chat interface

**New Validation Schema:**
1. Create/edit: `src/lib/validations/[feature].ts`
2. Use Zod: `export const CreateEmployeeSchema = z.object({ ... })`
3. Import in API route and form component
4. Use on server: `schema.parse(data)` for validation
5. Use on client: Integrate with React Hook Form

## Special Directories

**`src/app/api/auth/[...nextauth]/`**
- Purpose: NextAuth dynamic route handler
- Generated: No (static file)
- Committed: Yes

**`uploads/`**
- Purpose: File uploads directory for documents
- Generated: Yes (created at runtime)
- Committed: No (in .gitignore)
- Pattern: `uploads/employees/emp[id]/`

**`node_modules/`**
- Purpose: Package dependencies
- Generated: Yes (pnpm install)
- Committed: No (in .gitignore)

**`.next/`**
- Purpose: Next.js build output and dev cache
- Generated: Yes (next build, next dev)
- Committed: No (in .gitignore)

**`.planning/`**
- Purpose: GSD planning and analysis documents
- Generated: Yes (by GSD commands)
- Committed: Yes (version control planning)

**`prisma/migrations/`**
- Purpose: Database migration history
- Generated: Yes (prisma migrate)
- Committed: Yes (track schema changes)
