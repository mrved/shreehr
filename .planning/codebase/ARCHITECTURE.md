# Architecture

**Analysis Date:** 2026-02-08

## Pattern Overview

**Overall:** Next.js App Router with layered architecture (UI → API Routes → Service Layer → Database)

**Key Characteristics:**
- Server-first architecture (async layouts, server components by default)
- Role-based access control (RBAC) enforced at API layer
- Modular feature-based organization (attendance, payroll, leave, expenses, etc.)
- AI-assistant integration with pluggable model providers (Anthropic/Ollama)
- Event-driven job processing using BullMQ for long-running tasks
- Audit logging and error tracking throughout

## Layers

**UI Layer (Client & Server Components):**
- Purpose: User-facing interface for admin dashboard and employee portal
- Location: `src/app/` (pages, layouts) and `src/components/`
- Contains: Next.js App Router pages, React components (both server and client)
- Depends on: `src/lib/auth` (session), API routes, custom hooks
- Used by: Browser clients, authenticated users

**API Routes Layer:**
- Purpose: RESTful endpoints handling requests with auth and RBAC
- Location: `src/app/api/` (65 routes total)
- Contains: Next.js API handlers for CRUD operations, chat, webhooks
- Pattern: Each feature area has dedicated routes (attendance/, employees/, payroll/, etc.)
- Depends on: `src/lib/db`, `src/lib/rbac`, `src/lib/audit`, service functions
- Used by: Frontend components, external integrations

**Service/Business Logic Layer:**
- Purpose: Core HR business logic, data transformations, validations
- Location: `src/lib/` (specialized directories for concerns)
- Contains:
  - `src/lib/ai/` - AI model loading, tool definitions, conversation management
  - `src/lib/payroll/` - Salary calculations, statutory compliance
  - `src/lib/statutory/` - Indian compliance rules (PF, ESI, Income Tax)
  - `src/lib/email/` - Email notification dispatch
  - `src/lib/pdf/` - PDF generation for payslips, documents
  - `src/lib/qdrant/` - Vector search setup
  - `src/lib/workflows/` - Complex business workflows
- Depends on: Prisma ORM, external APIs
- Used by: API routes, cron jobs, background workers

**Data Access Layer:**
- Purpose: Database abstraction and ORM
- Location: `src/lib/db.ts` (Prisma singleton), `prisma/schema.prisma` (schema)
- Contains: Prisma client with PostgreSQL adapter, connection pooling
- Pattern: Global singleton with reuse prevention in dev
- Uses: PostgreSQL with pg adapter
- Used by: All service functions and API routes

**Infrastructure Layer:**
- Purpose: Cross-cutting concerns and utilities
- Location: `src/lib/`
- Contains:
  - `src/lib/auth.ts` - NextAuth configuration, JWT strategy
  - `src/lib/rbac.ts` - Permission matrix, role hierarchy, access checking
  - `src/lib/audit.ts` - Action logging for compliance
  - `src/lib/error-logger.ts` - Error tracking and reporting
  - `src/lib/cache.ts` - Redis caching (revalidation strategy)
  - `src/lib/encryption.ts` - Data encryption utilities

**Background Job Queue:**
- Purpose: Async job processing for long operations
- Location: `src/lib/queues/`
- Contains: BullMQ queue definitions, Redis connections
- Patterns: payroll.queue, embedding.queue
- Used by: Payroll runs, vector embedding jobs

## Data Flow

**User Authentication & Session:**

1. User submits credentials on `/login`
2. Credentials provider validates against User table (bcrypt hash check)
3. On success, JWT token created with user.id, role, employeeId
4. Session available via `await auth()` in Server Components and API routes
5. RBAC checks performed using session.user.role

**Feature Request Flow (Example: Attendance Check-in):**

1. Client submits POST `/api/attendance/check-in`
2. Route handler: `src/app/api/attendance/check-in/route.ts`
   - Auth check: `const session = await auth()`
   - RBAC check: `requirePermission(session, 'attendance:write')`
3. Business logic: Call service function to validate and record check-in
4. Database operation: Prisma updates Attendance record
5. Response: 200 with updated record or error response
6. Audit log: Action logged asynchronously via `logAuditAction()`

**AI Chat Data Flow:**

1. Client sends POST `/api/chat` with messages and conversationId
2. Handler loads session, validates conversation ownership
3. Retrieves conversation history from database
4. Creates tools based on user context (role, employeeId)
5. Calls `streamText()` with Claude/Ollama model
6. Model processes tools, retrieves data via tool functions
7. Response streamed back with `X-Conversation-Id` header
8. Messages and tool calls saved asynchronously

**Payroll Processing Flow (Background Job):**

1. Admin triggers payroll run via `/dashboard/payroll`
2. API route enqueues job: `payrollQueue.add('run-payroll', { ... })`
3. BullMQ worker: `src/lib/queues/workers/payroll.ts`
   - Loads employees, salary structures
   - Calls `calculatePayroll()` for each employee
   - Generates payslips
   - Saves SalaryRecords
4. Job completion event triggers notifications

**State Management:**

- **Server State:** Database (Prisma), Redis cache for dashboard counts
- **Session State:** JWT in NextAuth (24-hour expiry)
- **Client State:** React local state for UI (modal open/closed, form values)
- **Conversation State:** Database stored, retrieved on each chat API call
- **Cache Strategy:**
  - Dashboard counts cached with `revalidatePath()` on updates
  - API responses use Cache-Control headers (15min default)
  - User session cached in JWT (verified via signature)

## Key Abstractions

**Session & User Context:**
- Purpose: Encapsulates authenticated user info and permissions
- Examples: `src/lib/auth.ts`, `src/lib/auth-options.ts`
- Pattern: Session retrieved via `await auth()`, contains user.id, user.role, user.employeeId
- Usage: Guards all API routes and protected pages

**Permission & RBAC:**
- Purpose: Declarative permission checking
- Examples: `src/lib/rbac.ts` (PERMISSIONS constant, hasPermission function)
- Pattern: Check via `requirePermission(session, 'feature:action')` or `hasPermission(role, permission)`
- Roles: EMPLOYEE, HR_MANAGER, PAYROLL_MANAGER, ADMIN, SUPER_ADMIN
- Permissions: Defined as 'feature:scope' (e.g., 'payroll:read:all', 'leave:approve:team')

**API Route Pattern:**
- Purpose: Consistent structure for all API handlers
- Pattern: Auth → RBAC check → Business logic → Audit log → Response
- Files: `src/app/api/[feature]/route.ts`
- Error handling: Via `withErrorLogging()` wrapper or manual try/catch

**Service Functions:**
- Purpose: Reusable business logic, isolated from routing
- Examples: `src/lib/payroll/calculator.ts`, `src/lib/email/send.ts`
- Pattern: Pure functions taking data, returning results or throwing typed errors
- Reuse: Called from API routes and background jobs

**Tool System (AI Assistant):**
- Purpose: Define capabilities for AI model to access data safely
- Examples: `src/lib/ai/tools/employee-data.ts`, `src/lib/ai/tools/policy-search.ts`
- Pattern: Tool objects with name, description, parameters, execute function
- Safety: Tools check permissions before accessing data

**Error Response Format:**
- Purpose: Consistent error shape across API
- Pattern: `{ error: string, code?: string, requestId?: string, metadata?: object }`
- Status codes: 400 (validation), 401 (auth), 403 (permission), 500 (server)

## Entry Points

**Root Application:**
- Location: `src/app/layout.tsx`
- Triggers: Server startup, renders root layout with metadata
- Responsibilities: HTML structure, global styles, children render

**Homepage:**
- Location: `src/app/page.tsx`
- Triggers: Request to `/`
- Responsibilities: Redirect to `/login` (no session) or `/dashboard` (authenticated)

**Authentication:**
- Location: `src/app/(auth)/login/page.tsx` and `src/app/api/auth/[...nextauth]/route.ts`
- Triggers: GET/POST `/login`, POST `/api/auth/**`
- Responsibilities: Credentials form rendering, session creation via NextAuth

**Admin Dashboard:**
- Location: `src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx`
- Triggers: Navigation to `/dashboard/...`
- Responsibilities: Dashboard shell layout, auth check, role validation (redirect employees to portal)

**Employee Portal:**
- Location: `src/app/employee/layout.tsx`, `src/app/employee/page.tsx`
- Triggers: Navigation to `/employee/...`
- Responsibilities: Employee-specific layout and views

**API Chat Endpoint:**
- Location: `src/app/api/chat/route.ts`
- Triggers: POST `/api/chat` with messages
- Responsibilities: Stream AI responses with tool execution

**Cron Jobs:**
- Location: `src/app/api/cron/...`
- Triggers: External scheduler (Vercel Cron, etc.)
- Responsibilities: Periodic tasks (statutory alerts, payroll reminders)

## Error Handling

**Strategy:** Layered error handling with logging at each level

**Patterns:**

1. **Validation Errors (400):**
   - In API routes: Check request shape, use Zod for validation
   - Pattern: `if (!email) return Response.json({ error: 'Email required' }, { status: 400 })`
   - Example: `src/app/api/employees/route.ts` validates POST payload

2. **Authentication Errors (401):**
   - In API routes: Check session via `await auth()`
   - Pattern: `if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })`
   - Example: All routes checking `session` first

3. **Permission Errors (403):**
   - In API routes: Check RBAC via `requirePermission(session, permission)`
   - Pattern: Throws PermissionError (caught and returned as 403)
   - Example: `src/lib/rbac.ts` requirePermission function

4. **Database Errors (500):**
   - In service functions: Prisma errors caught in try/catch
   - Pattern: Log error with context, return generic message to client
   - Example: `src/lib/error-logger.ts` logs with type, severity, user context

5. **AI Model Errors (503):**
   - In `/api/chat`: Model unavailable, API key missing
   - Pattern: Check provider info, return configError flag in dev
   - Example: `src/app/api/chat/route.ts` checks provider and returns helpful message

6. **Unhandled Client Errors:**
   - Via global error boundary: `src/app/global-error.tsx`
   - Pattern: Reports to `/api/errors/client` for server logging
   - UX: Shows error message with retry button

## Cross-Cutting Concerns

**Logging:**
- Framework: Manual via `console.log()`, structured via `src/lib/error-logger.ts`
- Approach: Development logs query details, production logs errors only
- Audit trail: `src/lib/audit.ts` for sensitive actions (permission checks, tool use)
- Pattern: Call `logAuditAction()` after successful operations that affect other users

**Validation:**
- Client-side: React Hook Form with Zod schemas
- Server-side: Zod validation in API routes and service functions
- Pattern: Define schemas in `src/lib/validations/`, reuse across client and server
- Example: Email format, password strength for auth

**Authentication:**
- Provider: NextAuth v5 with Credentials provider
- Strategy: JWT stored in secure httpOnly cookie
- Session: 24-hour expiry, refreshed on each request
- Pattern: `await auth()` in server functions, context hook on client

**Rate Limiting:**
- Not detected as explicit rate limiting middleware
- Consideration: Could be added at API layer or via external service

**Data Encryption:**
- Utility: `src/lib/encryption.ts` for sensitive data
- Pattern: Encrypt on write, decrypt on read for PII
- Usage: Document encryption, salary data masking

**Caching:**
- Strategy: Redis via `src/lib/cache.ts`
- Pattern: Cache with revalidation on updates
- Examples: Dashboard counts, employee lists
- Invalidation: Via `revalidatePath()` after mutations
