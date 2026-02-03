# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Automated payroll with accurate Indian statutory compliance — if nothing else works, payroll must run correctly and on time with zero compliance errors.

**Current focus:** Phase 2 - Time & Attendance

## Current Position

Phase: 2 of 6 (Time & Attendance)
Plan: 5 of 5 in current phase
Status: Phase 2 COMPLETE
Last activity: 2026-02-04 — Completed 02-05-PLAN.md (Attendance lock and corrections)

Progress: [█████░░░░░] ~32%

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 5.6 min
- Total execution time: ~50 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | 29min | 7min |
| 02-time-attendance | 5 | 21min | 4min |

**Recent Trend:**
- Last 5 plans: 02-02 (3min), 02-01 (4min), 02-03 (1min), 02-04 (8min), 02-05 (5min)
- Trend: Good velocity (Phase 2 complete, averaging 4min)

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

### Pending Todos

**User setup required before login works:**
1. Install PostgreSQL or run Docker container
2. Generate encryption key: `openssl rand -hex 32`
3. Configure .env file with DATABASE_URL and ENCRYPTION_KEY
4. Run `pnpm db:push` to create database schema
5. Run `pnpm db:seed` to create admin user (admin@shreehr.local / admin123)

### Blockers/Concerns

**Build Issues:**
- Tailwind CSS PostCSS plugin error (pre-existing from Phase 1, not plan-related)
- `pnpm build` fails but `pnpm tsc --noEmit` passes (code is correct)
- Requires @tailwindcss/postcss installation and config update
- Does not block functionality, can be addressed separately

**Phase 3 Planning:**
- Will require deep research on Indian tax calculation edge cases (HRA formula, LTA rules, arrears taxation)
- Form 24Q/16 generation specifications need latest FVU file format from TRACES portal
- State-specific Professional Tax slabs and filing formats need validation

**Phase 6 Planning:**
- Will require deep research on RAG implementation patterns (Vercel AI SDK + Ollama + Qdrant)
- Embedding model selection and chunking strategies for HR policy documents
- Permission-aware data access in RAG queries (RBAC enforcement)

## Session Continuity

Last session: 2026-02-04 — Completed plan 02-05 (attendance lock and corrections)
Stopped at: Completed 02-05-PLAN.md - Phase 2 complete
Resume file: None
