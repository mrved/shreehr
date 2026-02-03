# Architecture Patterns: Indian HRMS

**Domain:** Self-hosted HRMS for 20-person Indian company
**Researched:** 2026-02-04
**Confidence:** HIGH (verified with multiple sources including Keka architecture, industry patterns, and compliance requirements)

## Executive Summary

Indian HRMS systems require a modular architecture that balances simplicity with robust compliance capabilities. For a 20-person company migrating from Keka HR, a **modular monolith** architecture is optimal—providing clear component boundaries while avoiding microservices complexity.

The architecture must prioritize Indian statutory compliance (PF, ESI, TDS, PT), employee self-service, and approval workflows. Data flows from attendance/leave modules through compliance engines to payroll, with audit trails capturing all changes.

## Recommended Architecture

### Overall Pattern: Modular Monolith with Clear Domain Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   ESS    │  │ Payroll  │  │Attendance│  │   Leave  │   │
│  │ Portal   │  │Dashboard │  │ Tracking │  │ Management│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Onboarding│  │ Expenses │  │AI Chat   │  │ Reports  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Next.js API Routes)             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Authentication  │  │  Authorization  │                   │
│  │   (JWT/OAuth)   │  │     (RBAC)      │                   │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Core HR  │  │  Payroll   │  │ Attendance │            │
│  │   Module   │  │   Engine   │  │  Module    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Leave    │  │ Onboarding │  │  Expenses  │            │
│  │   Module   │  │   Module   │  │   Module   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Compliance │  │  Workflow  │  │Notification│            │
│  │   Engine   │  │   Engine   │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                     Data Access Layer                        │
│  ┌─────────────────────────────────────────┐                │
│  │         Prisma ORM (Type-safe)          │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Employees │  │ Payroll  │  │Attendance│  │  Leave   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Expenses │  │Documents │  │Audit Log │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Supporting Services                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Redis    │  │ Job Queue  │  │    S3      │            │
│  │   Cache    │  │  (Bull)    │  │  Storage   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Why Modular Monolith:**
- **Simplicity**: Single deployment unit, easier for 20-person company
- **Lower Ops Complexity**: No container orchestration needed
- **Type Safety**: Shared TypeScript types across modules
- **Performance**: No network latency between modules
- **Cost-Effective**: Single server deployment sufficient
- **Future-Proof**: Clear boundaries enable extraction to microservices if needed

## Component Boundaries

### Core Components

| Component | Responsibility | Communicates With | Data Owned |
|-----------|---------------|-------------------|------------|
| **Core HR Module** | Employee master data, org structure, personal information, documents | All modules (central data source) | employees, departments, positions, employee_documents |
| **Payroll Engine** | Salary calculation, statutory compliance (PF/ESI/TDS/PT), payslip generation | Core HR, Attendance, Leave, Compliance Engine | payroll_runs, salary_components, deductions, payslips, statutory_filings |
| **Attendance Module** | Time tracking, shift management, biometric integration, work hours | Core HR, Leave, Payroll | attendance_records, shifts, work_hours |
| **Leave Module** | Leave balance, requests, approvals, leave types, accruals | Core HR, Attendance, Workflow Engine | leave_types, leave_balances, leave_requests, leave_transactions |
| **Onboarding Module** | New hire workflows, document collection, task assignments, e-signatures | Core HR, Workflow Engine, Document Storage | onboarding_checklists, onboarding_tasks, new_hire_documents |
| **Expenses Module** | Expense claims, reimbursements, approvals, policy enforcement | Core HR, Workflow Engine, Payroll | expense_claims, expense_items, reimbursements |
| **Employee Self-Service (ESS)** | Employee portal, profile updates, request submission, information access | All modules (read-only mostly) | None (presentational layer) |
| **AI Chat Module** | Natural language queries, HR policy assistance, employee support | All modules (read-only), external AI API | chat_history, chat_sessions |
| **Compliance Engine** | Indian statutory calculations, filing generation, deadline tracking | Payroll, Core HR | compliance_rules, filing_deadlines, statutory_rates |
| **Workflow Engine** | Approval routing, notifications, escalations, multi-level approvals | Leave, Expenses, Onboarding | approval_workflows, approval_chains, approval_history |
| **Notification Service** | Email/SMS alerts, approval reminders, deadline notifications | All modules | notification_templates, notification_queue, notification_log |
| **Document Storage** | File uploads, version control, access permissions, retention | Core HR, Onboarding, Expenses | document_metadata (files in S3) |
| **Audit Log Service** | Change tracking, compliance audit trail, user activity logging | All modules | audit_logs, change_history |
| **Authentication/Authorization** | User login, JWT management, RBAC, MFA | All modules | users, roles, permissions, sessions |

### Cross-Cutting Concerns

| Concern | Implementation | Used By |
|---------|---------------|---------|
| **Authentication** | JWT tokens with refresh token rotation | All modules |
| **Authorization** | Role-Based Access Control (Admin/Manager/Employee) | All modules |
| **Audit Logging** | Automatic tracking of all data changes | All modules |
| **Validation** | Zod schemas for input validation | All modules |
| **Error Handling** | Centralized error middleware | All modules |
| **Caching** | Redis for session and frequently-accessed data | Core HR, Payroll |
| **Background Jobs** | Bull queue with Redis for batch processing | Payroll, Compliance, Notifications |

## Data Flow Patterns

### 1. Attendance → Payroll Flow

```
Employee Check-in/Check-out
    ↓
Attendance Module (capture time)
    ↓
Work Hours Calculation
    ↓
Attendance Records (database)
    ↓
Payroll Engine (fetch attendance for pay period)
    ↓
Salary Calculation (apply attendance to salary)
    ↓
Payslip Generation
```

**Key Points:**
- Attendance data is frozen at payroll run initiation
- Corrections after freeze require payroll adjustment flow
- Late attendance impacts considered during calculation

### 2. Leave Request → Approval Flow

```
Employee submits leave request (ESS Portal)
    ↓
Workflow Engine (determine approval chain)
    ↓
Notification Service (alert manager)
    ↓
Manager reviews via ESS Portal
    ↓
Approval/Rejection recorded
    ↓ (if approved)
Leave Balance updated
    ↓
Attendance Module (mark future dates as leave)
    ↓
Notification Service (confirm to employee)
```

**Key Points:**
- Multi-level approvals for specific leave types or durations
- Leave balance validation before approval
- Integration with calendar systems

### 3. Payroll Processing Flow

```
Payroll Run Initiated (monthly)
    ↓
Background Job Created (Bull queue)
    ↓
Fetch Attendance Data (work days, overtime)
    ↓
Fetch Leave Data (paid/unpaid leave)
    ↓
Fetch Employee Master (salary components)
    ↓
Compliance Engine
  ├─> Calculate PF (12% employer + 12% employee)
  ├─> Calculate ESI (3.25% employer + 0.75% employee)
  ├─> Calculate TDS (based on tax regime, declarations)
  └─> Calculate Professional Tax (state-specific)
    ↓
Generate Payslips
    ↓
Store Payroll Records
    ↓
Generate Statutory Reports (ESIC, PF, PT)
    ↓
Notification Service (payslips available)
    ↓
Audit Log (all calculations logged)
```

**Key Points:**
- Payroll is a background job (can take 5-10 minutes)
- Atomic transaction: all or nothing
- Retry logic for failed calculations
- Audit trail for every calculation step

### 4. Onboarding Flow

```
New Hire Record Created (Core HR)
    ↓
Onboarding Checklist Generated
    ↓
Workflow Engine (assign tasks)
  ├─> HR: Collect documents
  ├─> IT: Create accounts
  ├─> Manager: Schedule meetings
  └─> Employee: Complete forms
    ↓
Task Notifications (Notification Service)
    ↓
Document Upload (Document Storage)
    ↓
E-signature Collection
    ↓
Task Completion Tracking
    ↓
Onboarding Complete → Employee Active
```

**Key Points:**
- Parallel task execution where possible
- Conditional workflows (IT tasks only after document verification)
- Deadline tracking and escalations

### 5. Expense Reimbursement Flow

```
Employee submits expense claim (ESS Portal)
    ↓
Expense Module (validate policy compliance)
    ↓
Document Upload (receipts to S3)
    ↓
Workflow Engine (approval hierarchy)
  ├─> Manager approval (< ₹5000)
  ├─> Manager + Finance (₹5000-₹20000)
  └─> Manager + Finance + Director (> ₹20000)
    ↓
Notification Service (each approval level)
    ↓
Final Approval → Reimbursement Record
    ↓
Payroll Integration (add to next salary run)
    ↓
Notification Service (payment scheduled)
```

**Key Points:**
- Amount-based approval routing
- Policy validation before submission
- Integration with payroll for payment

### 6. AI Chat Query Flow

```
Employee asks question (Chat UI)
    ↓
AI Chat Module (process query)
    ↓
Determine Intent
  ├─> Policy Query → Fetch from knowledge base
  ├─> Personal Data → Query relevant module (leave balance, payslip)
  ├─> Action Request → Generate workflow (apply leave)
  └─> General Query → External AI API
    ↓
Generate Response
    ↓
Return to Employee
    ↓
Log Interaction (audit trail)
```

**Key Points:**
- Permission-based data access (employee sees only own data)
- Context-aware responses based on user role
- Fallback to human support for complex queries

## Security Architecture

### Authentication & Authorization Layers

```
┌─────────────────────────────────────────────────────────────┐
│                       User Login                             │
│              (Email + Password + MFA)                        │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              JWT Token Generation                            │
│  Access Token (15 min) + Refresh Token (7 days)             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Request with JWT                        │
│              Authorization: Bearer <token>                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Token Validation Middleware                     │
│  ├─> Verify signature                                       │
│  ├─> Check expiration                                       │
│  ├─> Load user + role                                       │
│  └─> Check revocation list                                  │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              RBAC Authorization                              │
│  ├─> Admin: Full system access                             │
│  ├─> Manager: Team data + approval actions                 │
│  └─> Employee: Own data + submission actions               │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│            Resource-Level Permissions                        │
│  Can employee X view/edit resource Y?                       │
└─────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

| Role | Permissions | Use Cases |
|------|------------|-----------|
| **Admin** | Full access to all modules, system configuration, user management | HR Head, System Administrator |
| **Manager** | View team data, approve leave/expenses, view team reports | Department Managers, Team Leads |
| **Employee** | View/edit own profile, submit requests, view own payslips | All Employees |
| **Finance** | Payroll module, expense approvals, statutory reports | Finance Team |
| **IT** | User account management, system health, audit logs | IT Team |

### Data Security Measures

| Layer | Security Measure | Implementation |
|-------|-----------------|----------------|
| **Transit** | HTTPS encryption | SSL/TLS certificates, enforce HTTPS |
| **Rest** | Database encryption | PostgreSQL encrypted storage |
| **Files** | Encrypted object storage | S3 server-side encryption |
| **Passwords** | Bcrypt hashing | Bcrypt with cost factor 12 |
| **Tokens** | JWT with short expiry | 15-min access, 7-day refresh |
| **Sessions** | Redis-backed sessions | Encrypted session data |
| **API** | Rate limiting | 100 requests/min per user |
| **Audit** | Comprehensive logging | All data changes logged |
| **Backup** | Daily encrypted backups | Automated PostgreSQL dumps |

## Compliance Architecture

### Indian Statutory Compliance Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Compliance Engine                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Statutory Rate Configuration               │    │
│  │  PF: 12% (EE) + 12% (ER) → 8.33% EPS + 3.67% EPF  │    │
│  │  ESI: 0.75% (EE) + 3.25% (ER)                     │    │
│  │  TDS: Regime-based tax slabs                       │    │
│  │  PT: State-specific slabs                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Threshold Configuration                    │    │
│  │  ESI: Applicable if gross ≤ ₹21,000/month        │    │
│  │  PF: Applicable for all employees                  │    │
│  │  PT: State-specific (not in Delhi/Haryana)        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Filing Deadline Tracking                   │    │
│  │  PF: 15th of next month                           │    │
│  │  ESI: 15th of next month                          │    │
│  │  TDS: 7th of next month                           │    │
│  │  PT: 15th of next month (state-dependent)         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Report Generation                          │    │
│  │  ECR (PF): Monthly contribution details            │    │
│  │  ESIC: Monthly contribution details                │    │
│  │  Form 24Q (TDS): Quarterly TDS return             │    │
│  │  Form 16 (TDS): Annual tax certificate            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Compliance Design Principles:**
- Configurable rates (updated without code changes)
- Audit trail for every compliance calculation
- Validation before statutory filing generation
- Reminder system for filing deadlines
- Historical rate tracking (for backdated corrections)

## Performance & Scalability Considerations

### Current Scale (20 Employees)

| Concern | Approach | Rationale |
|---------|----------|-----------|
| **Database** | Single PostgreSQL instance | Sufficient for 20 users, < 1GB data |
| **Caching** | Redis for sessions + frequent queries | Reduces DB load, improves response time |
| **Background Jobs** | Bull queue with Redis | Async payroll processing, email sending |
| **File Storage** | S3-compatible storage | Scalable, pay-per-use |
| **API Rate Limiting** | 100 req/min per user | Prevents abuse, sufficient for normal use |
| **Database Connections** | Pool of 20 connections | One per employee max + background jobs |

### Growth Scenarios

| Scale | Architecture Changes | Estimated Timeline |
|-------|---------------------|-------------------|
| **50 employees** | None (same architecture) | Year 1-2 |
| **100 employees** | Add read replicas for reports | Year 2-3 |
| **500 employees** | Consider microservices for payroll | Year 3-5 |
| **1000+ employees** | Full microservices architecture | Year 5+ |

**Premature Optimization Avoided:**
- No Kubernetes (single server sufficient)
- No microservices (monolith is simpler)
- No message brokers (Redis queue sufficient)
- No CDN (internal users only)

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router) | React framework with SSR, Server Components |
| **Backend** | Next.js API Routes | Unified codebase, no separate backend server |
| **Database** | PostgreSQL 16 | Robust, ACID-compliant, JSON support |
| **ORM** | Prisma | Type-safe queries, migrations, excellent DX |
| **Authentication** | NextAuth.js | Built for Next.js, supports JWT + OAuth |
| **Caching** | Redis | Fast, reliable, supports queues |
| **Job Queue** | Bull | Redis-backed, retry logic, monitoring |
| **File Storage** | S3-compatible (Minio/S3) | Scalable, secure, pay-per-use |
| **Email** | Resend / SendGrid | Reliable delivery, templates |
| **SMS** | Twilio / MSG91 | Indian SMS gateway support |
| **AI** | OpenAI API / Anthropic | Natural language processing |

## Build Order & Dependencies

### Phase 1: Foundation (Build First)
**Goal:** Core infrastructure that everything depends on

1. **Database Schema** (using Prisma)
   - Employee master table
   - User authentication tables
   - Audit log structure

2. **Authentication & Authorization**
   - JWT token generation/validation
   - RBAC middleware
   - Login/logout flows

3. **Core HR Module**
   - Employee CRUD operations
   - Department/position management
   - Employee profile UI

**Why First:** Every other module depends on employee data and authentication.

**Estimated Time:** 2-3 weeks

---

### Phase 2: Time & Attendance (Build Second)
**Goal:** Track employee working hours

1. **Attendance Module**
   - Check-in/check-out functionality
   - Shift management
   - Attendance reports

2. **Leave Module**
   - Leave types configuration
   - Leave balance tracking
   - Leave request/approval workflow

**Why Second:** Payroll depends on attendance and leave data.

**Dependencies:** Core HR (employee data), Workflow Engine (approvals)

**Estimated Time:** 2-3 weeks

---

### Phase 3: Payroll (Build Third)
**Goal:** Calculate and process salaries

1. **Salary Structure**
   - Basic + allowances configuration
   - Salary component definitions

2. **Compliance Engine**
   - PF/ESI/TDS/PT calculations
   - Threshold logic
   - Rate configuration

3. **Payroll Processing**
   - Monthly payroll run (background job)
   - Payslip generation
   - Statutory reports

**Why Third:** Requires attendance, leave, and employee data.

**Dependencies:** Core HR, Attendance, Leave, Background Job Queue

**Estimated Time:** 3-4 weeks

---

### Phase 4: Employee Self-Service (Build Fourth)
**Goal:** Employee portal for common tasks

1. **ESS Portal**
   - Profile viewing/editing
   - Payslip download
   - Leave application
   - Attendance viewing

2. **Notification System**
   - Email notifications
   - SMS alerts
   - In-app notifications

**Why Fourth:** Frontend for employees to interact with backend modules.

**Dependencies:** Core HR, Payroll, Attendance, Leave

**Estimated Time:** 2 weeks

---

### Phase 5: Supporting Modules (Build Fifth)
**Goal:** Additional HR workflows

1. **Onboarding Module**
   - Onboarding checklist
   - Document collection
   - Task assignment

2. **Expense Management**
   - Expense claim submission
   - Approval workflow
   - Reimbursement processing

**Why Fifth:** Not critical for day-to-day operations, can be added later.

**Dependencies:** Core HR, Workflow Engine, Document Storage

**Estimated Time:** 2-3 weeks

---

### Phase 6: Advanced Features (Build Last)
**Goal:** Differentiating features

1. **AI Chat Assistant**
   - Natural language queries
   - HR policy knowledge base
   - Integration with modules

2. **Advanced Reports**
   - Custom report builder
   - Data visualization
   - Export capabilities

**Why Last:** Nice-to-have features, not critical for MVP.

**Dependencies:** All other modules (for data access)

**Estimated Time:** 2-3 weeks

---

### Parallel Development Opportunities

These can be built in parallel with phases above:

- **Document Storage Service**: Needed by Phase 1 (employee documents) and Phase 5 (onboarding, expenses)
- **Audit Log Service**: Should run from Phase 1 onwards
- **Workflow Engine**: Needed by Phase 2 (leave approvals) and Phase 5 (expense approvals)
- **Background Job Queue**: Needed by Phase 3 (payroll) and Phase 4 (notifications)

## Patterns to Follow

### Pattern 1: Module Encapsulation
**What:** Each module owns its data and exposes a clean API

**When:** Always. Prevent tight coupling between modules.

**Example:**
```typescript
// Leave Module API
export class LeaveService {
  async getLeaveBalance(employeeId: string): Promise<LeaveBalance> {
    // Only Leave Module accesses leave_balances table
  }

  async applyLeave(request: LeaveRequest): Promise<Leave> {
    // Workflow engine called internally
  }
}

// Other modules import LeaveService, not direct DB access
import { LeaveService } from '@/modules/leave';
```

### Pattern 2: Event-Driven Updates
**What:** Modules publish events when data changes, other modules subscribe

**When:** For cross-module updates (e.g., approved leave affects attendance)

**Example:**
```typescript
// Leave Module publishes event
await eventBus.publish('leave.approved', {
  employeeId: leave.employeeId,
  startDate: leave.startDate,
  endDate: leave.endDate,
});

// Attendance Module subscribes
eventBus.subscribe('leave.approved', async (data) => {
  await markAttendanceAsLeave(data);
});
```

### Pattern 3: Audit-First Design
**What:** Every data modification is logged automatically

**When:** All modules, all write operations

**Example:**
```typescript
// Prisma middleware for automatic audit logging
prisma.$use(async (params, next) => {
  const result = await next(params);

  if (params.action === 'update' || params.action === 'delete') {
    await auditLog.create({
      userId: currentUser.id,
      action: params.action,
      model: params.model,
      recordId: params.args.where.id,
      changes: result,
      timestamp: new Date(),
    });
  }

  return result;
});
```

### Pattern 4: Background Processing for Long Operations
**What:** Use job queues for operations taking > 5 seconds

**When:** Payroll processing, report generation, bulk notifications

**Example:**
```typescript
// API Route initiates background job
export async function POST(req: Request) {
  const job = await payrollQueue.add('process-monthly-payroll', {
    month: 'January',
    year: 2026,
  });

  return Response.json({ jobId: job.id, status: 'queued' });
}

// Worker processes job
payrollQueue.process('process-monthly-payroll', async (job) => {
  const { month, year } = job.data;
  await processPayroll(month, year);
});
```

### Pattern 5: Validation at Boundaries
**What:** Use Zod schemas for input validation at API boundaries

**When:** All API routes, all user inputs

**Example:**
```typescript
import { z } from 'zod';

const LeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(10).max(500),
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = LeaveRequestSchema.parse(body); // Throws if invalid

  // Proceed with validated data
}
```

### Pattern 6: API Response Standardization
**What:** Consistent response format across all endpoints

**When:** All API routes

**Example:**
```typescript
// Success response
{
  success: true,
  data: { /* result */ },
  message: "Leave request submitted successfully"
}

// Error response
{
  success: false,
  error: {
    code: "INVALID_DATE_RANGE",
    message: "End date must be after start date",
    details: { /* validation errors */ }
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Microservices from Day 1
**What:** Building separate services for each module (Payroll Service, Attendance Service, etc.)

**Why Bad:**
- Massive operational complexity for 20 employees
- Network latency between services
- Distributed transaction headaches
- Requires DevOps expertise
- Higher infrastructure costs

**Instead:** Use modular monolith with clear boundaries. Extract to microservices only if specific module needs independent scaling (unlikely for 20 employees).

---

### Anti-Pattern 2: Direct Database Access Across Modules
**What:** Payroll Module directly querying attendance_records table

**Why Bad:**
- Breaks encapsulation
- Creates tight coupling
- Changes to one module break others
- Difficult to extract to microservices later

**Instead:** Each module exposes service APIs. Payroll calls `AttendanceService.getWorkDays()`, not direct DB query.

---

### Anti-Pattern 3: Synchronous Payroll Processing
**What:** Running payroll calculation in API request handler

**Why Bad:**
- Request timeout (payroll takes 5-10 minutes)
- User waits for calculation
- Blocks other requests
- No retry on failure

**Instead:** Use background job queue. User receives job ID immediately, checks status later.

---

### Anti-Pattern 4: Storing Files in Database
**What:** Saving employee documents, payslips as BLOBs in PostgreSQL

**Why Bad:**
- Database size explodes
- Slow backup/restore
- Expensive database storage
- Poor performance

**Instead:** Store files in S3, store metadata (filename, path, permissions) in database.

---

### Anti-Pattern 5: Building Custom Authentication
**What:** Writing JWT generation/validation from scratch

**Why Bad:**
- Security vulnerabilities
- Reinventing the wheel
- Missing features (refresh tokens, MFA)
- Time-consuming

**Instead:** Use NextAuth.js or similar battle-tested library.

---

### Anti-Pattern 6: No Audit Trail
**What:** Updating salary/attendance without logging who changed what

**Why Bad:**
- No compliance proof
- Can't track unauthorized changes
- Difficult to debug issues
- Legal risks

**Instead:** Implement audit logging middleware from Phase 1. Every write operation logged automatically.

---

### Anti-Pattern 7: Hardcoding Compliance Rates
**What:** PF rate = 12% in code, ESI threshold = 21000 in code

**Why Bad:**
- Government changes rates regularly
- Requires code change + deployment for rate update
- Historical calculations wrong after update

**Instead:** Store compliance rates in database with effective dates. Query correct rate for calculation date.

---

### Anti-Pattern 8: Over-Engineering Authorization
**What:** Implementing permission for every single field (canViewEmployee.firstName, canViewEmployee.lastName)

**Why Bad:**
- Extremely complex
- Difficult to maintain
- Overkill for 20 employees

**Instead:** Use role-based access (Admin/Manager/Employee) with resource-level permissions (can view employee, can edit employee).

## Integration Points

### External System Integrations

| System | Integration Type | Purpose | Priority |
|--------|-----------------|---------|----------|
| **Email Service** | REST API | Send notifications, payslips | High |
| **SMS Gateway** | REST API | Send OTPs, urgent alerts | High |
| **AI Provider** | REST API | Chat assistant, NLP queries | Medium |
| **Biometric Devices** | SDK/Database | Import attendance data | Medium |
| **Bank APIs** | File-based | Salary transfer files | Low (Phase 2) |
| **Government Portals** | Manual/File | Upload PF/ESI/TDS returns | Low (manual initially) |

### Internal Integration Pattern

```typescript
// Standardized module interface
interface HRModule {
  name: string;
  initialize(): Promise<void>;
  healthCheck(): Promise<boolean>;
  getMetrics(): Promise<ModuleMetrics>;
}

// Example: Payroll Module
export const PayrollModule: HRModule = {
  name: 'payroll',

  async initialize() {
    await initializeComplianceEngine();
    await startBackgroundWorkers();
  },

  async healthCheck() {
    const dbConnected = await checkDatabaseConnection();
    const queueRunning = await checkJobQueue();
    return dbConnected && queueRunning;
  },

  async getMetrics() {
    return {
      lastPayrollRun: await getLastPayrollDate(),
      pendingJobs: await getQueueSize(),
      errorRate: await getErrorRate(),
    };
  },
};
```

## Deployment Architecture

### Self-Hosted Deployment (Recommended for Start)

```
┌─────────────────────────────────────────────────────────────┐
│                     Single Linux Server                      │
│                    (4 CPU, 16GB RAM, 500GB SSD)              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js Application                     │   │
│  │              (Node.js 22, PM2)                       │   │
│  │              Port 3000                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PostgreSQL 16                           │   │
│  │              Port 5432                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Redis 7                                 │   │
│  │              Port 6379                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MinIO (S3-compatible)                   │   │
│  │              Port 9000                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Nginx (Reverse Proxy)                   │   │
│  │              Port 80/443                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    SSL/TLS Certificate
                    (Let's Encrypt)
                            ↓
                    hrms.company.com
```

**Backup Strategy:**
- Daily PostgreSQL dump to encrypted location
- Daily MinIO backup to external storage
- Retain 30 days of backups

**Monitoring:**
- Application health checks (PM2)
- Database monitoring (pg_stat_statements)
- Disk space alerts
- SSL certificate expiry alerts

## Migration from Keka HR

### Data Migration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Keka HR                               │
│                   (Current System)                           │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
               Export Data (CSV/API)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Migration Scripts                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Extract: Export from Keka                        │   │
│  │  2. Transform: Map to ShreeHR schema                 │   │
│  │  3. Validate: Check data integrity                   │   │
│  │  4. Load: Import into PostgreSQL                     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   ShreeHR Database                           │
│                  (New System)                                │
└─────────────────────────────────────────────────────────────┘
```

**Data to Migrate:**
- Employee master data
- Historical attendance records (last 2 years)
- Historical payroll records (last 2 years for ITR)
- Leave balances
- Active leave requests
- Employee documents

**Migration Strategy:**
- Phase 1: Historical read-only data (payroll, attendance)
- Phase 2: Current operational data (leave balances, pending requests)
- Phase 3: Cutover (switch to new system)
- Parallel run: 1 month overlap with both systems

## Sources

### Architecture & Design
- [ReactJS HRMS Guide](https://www.sevensquaretech.com/build-hr-management-system-reactjs-source-code/)
- [Next.js Architecture Documentation](https://nextjs.org/docs/architecture)
- [Modern Full Stack Application Architecture Using Next.js 15+](https://softwaremill.com/modern-full-stack-application-architecture-using-next-js-15/)

### HRMS Components & Modules
- [Keka HR Software Guide 2026](https://www.authencio.com/blog/keka-hr-software-guide-features-pricing-pros-cons-alternatives-for-indian-smbs)
- [Keka Reviews 2026](https://www.gartner.com/reviews/market/cloud-hcm-suites-for-regional-and-or-sub-1000-employee-enterprises/vendor/keka/product/keka-hr)
- [Attendance Management System: Complete Guide 2026](https://savvyhrms.com/attendance-management-system-complete-guide/)

### Indian Compliance
- [Payroll Compliance in India 2026](https://www.hono.ai/blog/payroll-compliance-in-india)
- [PF, ESI, Gratuity, TDS: What Every HR Must Know in 2026](https://hrsays.in/pf-esi-gratuity-tds-what-every-hr-must-know-in-2026)
- [India Payroll Tax & Compliance Guide 2026](https://remotepeople.com/countries/india/hire-employees/payroll-tax/)
- [How Payroll Software Simplifies PF, ESI, TDS & Compliances](https://hrone.cloud/blog/payroll-software-pf-esi-tds-statutory-compliance/)

### Security & Access Control
- [Role-Based Access Control: Comprehensive Guide 2026](https://www.zluri.com/blog/role-based-access-control)
- [Empowering HR Managers: Role-Based Access Control in Software Solutions](https://gridlex.com/a/empowering-hr-managers-role-based-access-control-in-software-solutions-st9716/)
- [Employee Self-Service Portal Guide](https://www.atomicwork.com/guides/employee-self-service)

### Audit & Compliance
- [What Is an Audit Trail? Everything You Need to Know](https://auditboard.com/blog/what-is-an-audit-trail)
- [Audit Trail Requirements: Guidelines for Compliance](https://www.inscopehq.com/post/audit-trail-requirements-guidelines-for-compliance-and-best-practices)

### Background Jobs & Processing
- [How to Build a Payroll System with Express Using Background Jobs](https://www.freecodecamp.org/news/build-a-payroll-system-with-express-and-monnify-using-background-jobs)
- [Oracle HRMS Payroll Processing Management Guide](https://docs.oracle.com/cd/E18727_01/doc.121/e13541/T4715T383511.htm)

---

**Research Confidence:** HIGH
**Verification:** Multiple authoritative sources cross-referenced
**Date:** 2026-02-04
**Next Steps:** Use this architecture to inform phase structure in roadmap
