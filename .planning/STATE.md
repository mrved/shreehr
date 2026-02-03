# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Automated payroll with accurate Indian statutory compliance — if nothing else works, payroll must run correctly and on time with zero compliance errors.

**Current focus:** Phase 3 - Payroll & Compliance

## Current Position

Phase: 3 of 6 (Payroll & Compliance)
Plan: 2 of 9 in current phase
Status: In progress
Last activity: 2026-02-04 — Completed 03-02-PLAN.md (Professional Tax Configuration)

Progress: [█████░░░░░] ~38%

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 5.3 min
- Total execution time: ~64 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | 29min | 7min |
| 02-time-attendance | 5 | 21min | 4min |
| 03-payroll-compliance | 3 | 14min | 4.7min |

**Recent Trend:**
- Last 5 plans: 02-04 (8min), 02-05 (5min), 03-03 (4min), 03-01 (5min), 03-02 (5min)
- Trend: Excellent velocity (Phase 3 maintaining consistent 4-5min average)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Self-hosted over SaaS (control costs, own data, no vendor dependency)
- Web-only, no native apps (20 users don't justify native app complexity)
- AI chat as differentiator (reduce admin burden, better than Keka's UX)
- Full Keka migration (need historical data for Form 16 and continuity)

**From Phase 1 execution:**
- Use Prisma 7 with datasource config in prisma.config.ts (new architecture)
- Use Biome instead of ESLint for 50x faster linting
- Store PII encrypted at rest with separate fields (pan_encrypted, aadhaar_encrypted, bank_account_encrypted)
- Use pnpm for package management (faster, disk-efficient)
- Audit fields on all entities (created_at, created_by, updated_at, updated_by)
- Use NextAuth v5 (beta) for future-proof authentication
- JWT session strategy over database sessions for simplicity
- Role stored in JWT token for efficient authorization checks
- Route groups for layout separation ((auth) vs (dashboard))
- Middleware-based route protection with redirect logic
- Use snake_case for Prisma field names to match database schema conventions
- Mask PII in list responses, provide full decrypted values only to admins in _sensitive field
- Soft delete for employees (set employment_status to TERMINATED) rather than hard delete
- Allow HR_MANAGER role same permissions as ADMIN for employee management
- Zod validation schemas with Indian-specific regex (PAN, Aadhaar, IFSC)
- Store documents on local filesystem (./uploads/employees/{id}/) rather than cloud storage
- Use integers (paise) for salary amounts instead of Decimal for precision
- Store leave types as flexible strings instead of enum to support Keka's various types
- Auto-create departments and designations during employee import
- Two-pass employee import: first create employees, then assign managers
- Track import errors in JSON field without failing entire batch
- Soft delete documents with retention_until field for 8-year compliance

**From Phase 2 execution:**
- LeaveType model for configurable leave policies instead of hardcoded enum
- Balance validation includes pending/approved requests to prevent over-booking
- Weekend exclusion in leave days calculation (Saturday, Sunday)
- Soft delete for leave types that have associated requests
- Manager authorization via reporting_manager_id relationship
- Auto-approve for leave types with requires_approval=false
- Work hours thresholds: >=7.5h (450 min) = PRESENT, >=4h (240 min) = HALF_DAY, <4h = ABSENT
- Unique constraint on (employee_id, date) ensures one attendance record per day
- AttendanceLock prevents changes to historical attendance with unlock approval workflow
- Store work duration in minutes (not hours) for precision and flexibility
- Regularization tracks who/when for audit compliance
- Upsert pattern for attendance sync (idempotent, handles multiple sync runs)
- LOP identification marks days without attendance or leave as ABSENT
- Balance view includes pending requests to show real availability
- Carry forward respects max_carry_forward limit from leave type
- Manual balance adjustments update accrued/used for audit trail
- Client components for interactive UI (check-in, calendars, forms)
- Simple useToast hook with console/alert fallback for MVP
- Prompt-based rejection reason input for manager approval flow
- Correction workflow: only for locked periods with approved unlock
- Lock lifecycle: lock -> request-unlock -> approve-unlock -> corrections -> re-lock

**From Phase 3 execution:**

**Plan 03-01 (Salary Structure Configuration):**
- Store all salary amounts in paise (integers) for precision and avoid floating-point errors
- Validate 50% Basic Pay Rule at API level before database save
- Auto-end previous active salary structure when creating new one
- Calculate and store derived fields (gross, CTC, basic percentage) for performance
- ValidationResult pattern: return isValid, data, and error message together
- Zod refine for cross-field validation with descriptive error messages
- Shortfall calculation in error messages to guide correction

**Plan 03-02 (Professional Tax Configuration):**
- PT slabs stored in database for runtime updates without code changes
- Karnataka February PT is Rs.300 (not Rs.200) for proper annual total of Rs.2,400
- Support month-specific PT rates via month field (null = applies to all months)
- Support gender-based exemptions (Maharashtra women pay reduced rates)
- Exempt states (DL, HR, HP, etc.) handled in code, no database slabs
- Currency helpers: rupeeToPaise, rupeeToRupee, formatCurrency for consistency
- Comprehensive statutory constants documented in constants.ts (PF, ESI, PT, TDS, Gratuity)

**Plan 03-03 (BullMQ Infrastructure):**
- BullMQ over Bull for modern TypeScript-first queue library
- Process one payroll at a time (concurrency: 1) to prevent resource contention
- Stage-based payroll processing: validation → calculation → statutory → finalization
- Keep completed jobs 24h, failed jobs 7 days for debugging
- Exponential backoff with 3 retry attempts for transient failures
- Singleton pattern for Redis connection to prevent connection pool exhaustion
- Job IDs include payroll run ID and stage for idempotency
- All payroll monetary values stored in paise (integer precision)
- PF breakdown stored separately (EPF, EPS, EDLI, admin charges) for ECR accuracy

### Phase 1 Artifacts

**Created:**
- prisma/schema.prisma — 8 models (User, Employee, Department, Designation, Document, ImportBatch, SalaryRecord, LeaveBalance)
- src/lib/encryption.ts — AES-256-GCM encryption for PII
- src/lib/auth.ts — NextAuth v5 configuration
- src/lib/storage.ts — Document storage with 8-year retention
- src/lib/parsers/keka.ts — CSV parsers for Keka import
- src/app/api/employees/ — Employee CRUD with PII encryption
- src/app/api/departments/ — Department CRUD
- src/app/api/designations/ — Designation CRUD
- src/app/api/documents/ — Document upload/download
- src/app/api/import/ — Keka CSV import (employees, salary, leave)
- src/app/(dashboard)/ — Protected dashboard with sidebar navigation
- src/components/employees/ — Employee list and form components
- src/components/auth/ — Login form

### Phase 2 Artifacts

**Created:**
- prisma/schema.prisma — Added Attendance, AttendanceLock, LeaveType and LeaveRequest models
- src/lib/validations/attendance.ts — Attendance validation schemas and calculateAttendanceStatus helper
- src/lib/validations/leave.ts — Leave validation schemas and calculateLeaveDays helper
- src/app/api/attendance/ — Check-in/check-out, list, and detail APIs with RBAC
- src/app/api/attendance/sync/ — Leave-to-attendance sync with LOP identification
- src/app/api/leave-types/ — Leave type CRUD (admin/HR only)
- src/app/api/leave-requests/ — Leave request workflow with balance validation
- src/app/api/leave-balances/ — Balance viewing, initialization, and manual adjustment APIs
- src/components/attendance/ — Check-in button, calendar, team attendance views
- src/components/leave/ — Balance cards, request form, requests list, types manager
- src/app/(dashboard)/attendance/ — Employee and team attendance pages
- src/app/(dashboard)/leave/ — Leave dashboard, apply, and types configuration pages
- src/hooks/use-toast.ts — Toast notification hook
- src/components/ui/switch.tsx — Toggle switch component
- src/components/ui/progress.tsx — Progress bar component
- src/app/api/attendance/lock/ — Attendance lock management API
- src/app/api/attendance/corrections/ — Correction request and approval APIs
- src/app/(dashboard)/attendance/lock/ — Admin lock management page
- src/components/attendance/attendance-lock-manager.tsx — Lock management UI

### Phase 3 Artifacts

**Created (Plan 03-01):**
- src/lib/payroll/types.ts — TypeScript interfaces for salary components, paise conversion utilities
- src/lib/payroll/validators.ts — 50% Basic Pay Rule validation, annual CTC calculation, Zod schemas
- src/app/api/salary-structures/route.ts — GET/POST endpoints for salary structures with RBAC
- src/app/api/salary-structures/[id]/route.ts — GET/PATCH/DELETE endpoints for individual structures
- prisma/schema.prisma — SalaryStructure model, TaxRegime enum, relations

**Created (Plan 03-02):**
- prisma/schema.prisma — ProfessionalTaxSlab model, PaymentFrequency enum
- src/lib/payroll/constants.ts — Comprehensive statutory constants (PF, ESI, PT, TDS, Gratuity, Bonus)
- src/lib/statutory/pt.ts — PT calculation with month-specific and gender-based logic
- src/app/api/pt-slabs/route.ts — GET/POST endpoints for PT slabs with RBAC
- src/app/api/pt-slabs/[state]/route.ts — State-specific GET/PUT/DELETE endpoints
- prisma/seed-pt-slabs.ts — Seed data for KA, MH, TN, TS with accurate slab definitions

**Created (Plan 03-03):**
- prisma/schema.prisma — Added PayrollRun, PayrollRecord models with status/stage tracking
- src/lib/queues/connection.ts — Redis connection singleton for BullMQ
- src/lib/queues/payroll.queue.ts — BullMQ queue with addPayrollJob, getPayrollJobStatus, cancelPayrollJobs
- src/lib/queues/workers/payroll.worker.ts — Worker with stage-based processing (validation, calculation, statutory, finalization)
- docker-compose.yml — PostgreSQL and Redis services with persistent volumes

### Pending Todos

**User setup required before login works:**
1. Install PostgreSQL or run Docker container
2. Generate encryption key: `openssl rand -hex 32`
3. Configure .env file with DATABASE_URL and ENCRYPTION_KEY
4. Run `pnpm db:push` to create database schema
5. Run `pnpm db:seed` to create admin user (admin@shreehr.local / admin123)

**User setup required before payroll processing works:**
1. Start Redis via Docker Compose: `docker compose up -d redis`
2. Add REDIS_URL to .env file: `REDIS_URL="redis://localhost:6379"`
3. Verify Redis connection: `docker compose logs redis`
4. Seed PT slabs: `pnpm db:seed-pt` (after database is running)

### Blockers/Concerns

**Build Issues:**
- Tailwind CSS PostCSS plugin error (pre-existing from Phase 1, not plan-related)
- `pnpm build` fails but `pnpm tsc --noEmit` passes (code is correct)
- Requires @tailwindcss/postcss installation and config update
- Does not block functionality, can be addressed separately

**Phase 3 Concerns:**
- Will require deep research on Indian tax calculation edge cases (HRA formula, LTA rules, arrears taxation)
- Form 24Q/16 generation specifications need latest FVU file format from TRACES portal
- PT slab accuracy should be verified against latest state government notifications before production
- Additional PT states (WB, AP, AS, CG, GJ, MP, ML, OR, TR) need slab data

**Phase 6 Planning:**
- Will require deep research on RAG implementation patterns (Vercel AI SDK + Ollama + Qdrant)
- Embedding model selection and chunking strategies for HR policy documents
- Permission-aware data access in RAG queries (RBAC enforcement)

## Session Continuity

Last session: 2026-02-04 — Completed 03-02-PLAN.md (Professional Tax Configuration)
Stopped at: Completed Plan 03-02 with PT slabs for KA, MH, TN, TS
Resume file: None
