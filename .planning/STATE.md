# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Automated payroll with accurate Indian statutory compliance — if nothing else works, payroll must run correctly and on time with zero compliance errors.

**Current focus:** Phase 3 - Payroll & Compliance

## Current Position

Phase: 3 of 6 (Payroll & Compliance)
Plan: 7 of 9 in current phase
Status: In progress
Last activity: 2026-02-04 — Completed 03-07-PLAN.md (Form 24Q and Form 16 TDS Filing)

Progress: [█████░░░░░] ~47%

## Performance Metrics

**Velocity:**
- Total plans completed: 17
- Average duration: 5.1 min
- Total execution time: ~86 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | 29min | 7min |
| 02-time-attendance | 5 | 21min | 4min |
| 03-payroll-compliance | 8 | 36min | 4.5min |

**Recent Trend:**
- Last 5 plans: 03-02 (5min), 03-04 (8min), 03-06 (3min), 03-05 (5min), 03-07 (4min)
- Trend: Excellent velocity (Phase 3 averaging 4.5min, consistent statutory file generation speed)

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

**Plan 03-04 (Payroll Calculation Engine):**
- TDD for PF calculations to ensure correctness of wage ceiling and EPS cap logic
- PF admin rate is 0.51% (0.50% EDLI admin + 0.01% inspection), not 0.85%
- Standard deduction updated to Rs.75,000 for new regime (Budget 2024), Rs.50,000 for old regime
- EPS effectively capped at Rs.1,249.50 (8.33% of Rs.15,000 wage ceiling)
- ESI contribution period tracking for continuity across 6-month periods (Apr-Sep, Oct-Mar)
- TDS calculation projects annual income and spreads tax over remaining FY months
- LOP calculation based on working days (exclude weekends): (gross / working days) × LOP days
- Upsert pattern for idempotent payroll processing (safe to re-run)

**Plan 03-05 (PDF Payslip Generation):**
- Use @react-pdf/renderer for declarative PDF generation with React components
- Use NextAuth v5 auth() function instead of getServerSession for session management
- Mask PAN showing only last 4 digits on payslips for privacy
- Use Indian numbering system (Lakh, Crore) for net pay in words
- Individual payslip download API with RBAC (employees own only, admin all)
- Bulk ZIP download with jszip for all employees in a payroll run
- Stream-to-buffer conversion for PDF to ZIP compatibility

**Plan 03-06 (ECR and ESI Challan Generators):**
- ECR format uses EPFO-compliant #~# separators with 12 fields per employee line
- ESI challan generated as CSV with summary totals at bottom for quick verification
- IP Days (Insured Person days) calculated as: working days - LOP days
- Statutory files stored in uploads/statutory/{runId}/ separate from employee documents
- StatutoryFile model tracks all generated files with record count and total amount for audit
- Establishment code and company name from environment variables (will move to database in Phase 4)
- RBAC: Only ADMIN, SUPER_ADMIN, and PAYROLL_MANAGER can download statutory files
- Files tracked in database enable re-download without regeneration

**Plan 03-07 (Form 24Q and Form 16 TDS Filing):**
- Form 24Q Annexure I generated for all quarters (Q1-Q4) with TDS summary
- Form 24Q Annexure II generated only for Q4 with annual salary details for Form 16
- Form 16 PDF with Part A (employer/employee details) and Part B (income/tax computation)
- Quarterly TDS breakdown shows payment and deduction for each quarter
- Tax calculation supports both OLD and NEW regimes with different standard deductions
- Rebate 87A applied for NEW regime incomes <= Rs.7L (up to Rs.25,000)
- Health & Education Cess at 4% on tax after rebate
- Financial year quarters: Q1(Apr-Jun), Q2(Jul-Sep), Q3(Oct-Dec), Q4(Jan-Mar)
- Employee RBAC: Can download own Form 16, admin can download any employee's
- TDS APIs accept quarter/year parameters for flexible reporting

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

**Created (Plan 03-04):**
- src/lib/statutory/pf.ts — PF calculation with wage ceiling and employer breakdown (EPF/EPS/EDLI)
- src/lib/statutory/pf.test.ts — 12 unit tests for PF calculation (TDD)
- src/lib/statutory/esi.ts — ESI calculation with wage ceiling check
- src/lib/statutory/tds.ts — TDS calculation with new/old regime support
- src/lib/payroll/calculator.ts — Complete payroll calculator orchestrating all deductions

**Created (Plan 03-05):**
- src/lib/pdf/utils.ts — Currency formatting, PAN masking, number to words with Indian numbering
- src/lib/pdf/components/index.tsx — Reusable PDF styles and components (InfoRow, TotalRow, SectionTitle)
- src/lib/pdf/payslip.tsx — PayslipDocument React component with full payslip layout
- src/app/api/payroll/[runId]/payslips/[employeeId]/route.ts — Individual payslip download API
- src/app/api/payroll/[runId]/payslips/download-all/route.ts — Bulk ZIP download API

**Created (Plan 03-06):**
- prisma/schema.prisma — StatutoryFile model and StatutoryFileType enum
- src/lib/statutory/file-generators/ecr.ts — EPFO ECR file generator with #~# format
- src/lib/statutory/file-generators/esi-challan.ts — ESIC challan CSV generator with summary totals
- src/app/api/payroll/[runId]/statutory/ecr/route.ts — ECR download API with RBAC
- src/app/api/payroll/[runId]/statutory/esi/route.ts — ESI challan download API with RBAC
- src/lib/storage.ts — Added statutory file storage helpers

**Created (Plan 03-07):**
- src/lib/statutory/file-generators/form24q.ts — Form 24Q generator with Annexure I and II
- src/lib/statutory/file-generators/form16.ts — Form 16 PDF generator with Part A and B
- src/app/api/payroll/tds/form24q/route.ts — Form 24Q download API with quarterly filtering
- src/app/api/payroll/tds/form16/[employeeId]/route.ts — Form 16 download API with employee RBAC

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

**User setup required for TDS filing (Plan 03-07):**
1. Add company TDS details to .env file:
   - COMPANY_TAN=YOUR_TAN_NUMBER
   - COMPANY_PAN=YOUR_PAN_NUMBER
   - COMPANY_NAME=YOUR_COMPANY_NAME
   - COMPANY_ADDRESS=YOUR_COMPANY_ADDRESS
   - COMPANY_RESPONSIBLE_PERSON=NAME
   - COMPANY_RESPONSIBLE_DESIGNATION=DESIGNATION
2. Ensure employees have encrypted PAN in database
3. Ensure PayrollRecord has tax_regime field populated

### Blockers/Concerns

**Build Issues:**
- Tailwind CSS PostCSS plugin error (pre-existing from Phase 1, not plan-related)
- `pnpm build` fails but `pnpm tsc --noEmit` passes (code is correct)
- Requires @tailwindcss/postcss installation and config update
- Does not block functionality, can be addressed separately

**Phase 3 Concerns:**
- TDS calculation is simplified (no HRA exemption, LTA, 80C deductions) - completed basic Form 24Q/16 in Plan 03-07, enhancements needed
- ESI contribution period continuity check is stubbed (checkESIContinuity returns false) - needs query of previous payroll records
- Form 24Q generates JSON format, not FVU file format for TRACES portal upload - manual preparation needed
- TDS payment tracking (challan numbers, BSR codes, dates) not implemented - shows deducted = deposited
- PT slab accuracy should be verified against latest state government notifications before production
- Additional PT states (WB, AP, AS, CG, GJ, MP, ML, OR, TR) need slab data

**Phase 6 Planning:**
- Will require deep research on RAG implementation patterns (Vercel AI SDK + Ollama + Qdrant)
- Embedding model selection and chunking strategies for HR policy documents
- Permission-aware data access in RAG queries (RBAC enforcement)

## Session Continuity

Last session: 2026-02-04 — Completed 03-07-PLAN.md (Form 24Q and Form 16 TDS Filing)
Stopped at: Completed Plan 03-07 with Form 24Q quarterly return and Form 16 annual certificate generation
Resume file: None
