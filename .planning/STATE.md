# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Automated payroll with accurate Indian statutory compliance — if nothing else works, payroll must run correctly and on time with zero compliance errors.

**Current focus:** Phase 6 - AI Assistant

## Current Position

Phase: 6 of 6 (AI Assistant)
Plan: 0 of TBD in current phase
Status: Planning needed
Last activity: 2026-02-04 — Completed Phase 5 (Supporting Workflows)

Progress: [████████████░░] ~83%

## Performance Metrics

**Velocity:**
- Total plans completed: 32
- Average duration: 5.6 min
- Total execution time: ~178 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | 29min | 7min |
| 02-time-attendance | 5 | 21min | 4min |
| 03-payroll-compliance | 9 | 38min | 4.2min |
| 04-employee-self-service | 8 | 52min | 6.5min |
| 05-supporting-workflows | 6 | 38min | 6.3min |

**Recent Trend:**
- Last 5 plans: 05-03 (9min), 05-04 (3min), 05-05 (13min), 05-06 (1min), Phase 5 complete
- Trend: Good velocity, Phase 5 complete with 15 requirements delivered

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

**Plan 03-08 (Statutory Deadline Tracking):**
- Store deadline type, month, year as unique constraint for upsert pattern
- Alert flags (7/3/1 day) prevent duplicate alert sending
- Overdue status applied automatically by cron to enable filtering
- Compliance score calculated from 3-month history (filed on time / total applicable)
- Cron endpoint uses Bearer token authorization for security
- Deadline calculation handles monthly (Xth of next month), quarterly (Form 24Q dates), annual (June 15 for Form 16)
- Severity-based alerts: CRITICAL (<= 1 day or overdue), WARNING (<= 3 days), INFO (7 days)

**Plan 03-09 (Payroll Admin UI):**
- Poll every 3 seconds for PROCESSING status updates instead of WebSocket for simplicity
- Validate attendance lock client-side before submission to provide better UX
- Restrict payroll APIs to ADMIN, PAYROLL_MANAGER, and HR_MANAGER roles
- Progressive disclosure pattern: Validate button enables Run button only after successful validation
- Client-side validation checks prerequisites (attendance lock, existing payroll) before API submission

**From Phase 4 execution:**

**Plan 04-01 (Email Notification Infrastructure):**
- Use Resend SDK over Nodemailer for better DX and webhook tracking
- Worker concurrency of 5 for email sending (balance between throughput and rate limits)
- 24h retention for completed jobs, 7 days for failed jobs
- Template registry pattern with dynamic lookup for extensibility
- Email templates return { subject, html, text } structure
- addEmailJob helper for queue operations instead of direct queue.add
- Template data passed as generic Record<string, any> for flexibility

**Plan 04-02 (Investment Declaration APIs):**
- Store all investment amounts in paise (integers) for precision consistency with payroll
- Use Zod refine for Section 80C total validation with descriptive error messages
- Only DRAFT declarations can be edited or deleted (status enforcement)
- One declaration per employee per financial year (unique constraint)
- Support action-based PATCH for status transitions (submit, verify, reject)
- Investment validation with Indian tax rules: 80C max Rs.1.5L, 80D self max Rs.25K, parents max Rs.50K
- Landlord PAN required when annual HRA rent exceeds Rs.1,00,000
- RBAC pattern: employees see own, admins/HR/payroll managers see all

**Plan 04-03 (Profile Update Request Workflow):**
- Store changes as JSON diff with old/new values for audit trail
- Only allow updating non-sensitive fields (address, contact, emergency info)
- Prevent duplicate pending requests per employee
- Apply approved changes in transaction with status update
- UPDATABLE_FIELDS whitelist pattern for employee-modifiable fields
- Changes diff format: { field_name: { old: value, new: value } }

**Plan 04-04 (Employee Portal with Mobile-First UI):**
- Separate (employee) route group isolated from (dashboard) for role-based access
- Fixed bottom navigation on mobile (<md), sidebar on desktop (md+)
- Dual-view pattern: cards on mobile, tables on desktop for list views
- PDF viewing with react-pdf library (zoom, pagination, touch-friendly)
- Payslip list and detail pages with inline PDF viewer
- Form 16 certificate list with completed FY filtering (after March)
- Dashboard stats showing leave balance, last payslip, pending requests
- Simplified payslip API endpoint taking record ID instead of runId + employeeId

**Plan 04-06 (Investment Declaration UI):**
- Store document metadata in InvestmentProofDocument model with soft delete for 8-year retention
- Enable document upload only after saving declaration as draft (needs declarationId)
- Group documents by section (80C, 80D, HRA, OTHER) for organization
- Collapsible form sections to reduce mobile scroll with totals in header
- Real-time 80C total calculation with remaining limit display to prevent exceeding max
- Financial year calculation: April to March, YYYY-YY format matching Indian fiscal year
- Document upload pattern: drag-drop zone + file picker + upload progress + file list

**From Phase 5 execution:**

**Plan 05-01 (Onboarding Workflows):**
- Store checklist as JSON array instead of separate table for flexibility and atomicity
- Use action-based status updates (accept, start_tasks, complete, cancel) instead of direct status field
- Generate unique offer_token for candidate acceptance link instead of relying on email confirmation
- Default checklist includes IT (laptop, email), Admin (desk), HR (docs), Manager (welcome) tasks
- Verify all required checklist items completed before allowing transition to COMPLETED status
- Assignee-based RBAC for checklist updates (can only update assigned tasks)
- Workflow state machine pattern: ALLOWED_TRANSITIONS map with canTransition validation function
- Action-based API pattern: PATCH with action enum instead of exposing status field directly

**Plan 05-02 (Expense Management):**
- Policy snapshot captured at submission time to prevent policy change issues
- Multi-level approval routing: Manager (< Rs.500), HR_Manager (< Rs.2500), Admin (> Rs.2500)
- Auto-approve logic for small expenses below policy threshold
- Receipt storage in uploads/expenses/{claimId}/ with file validation (PDF/images, max 5MB)
- Action-based PATCH API for submit/approve/reject workflow
- RBAC filtering: employees see own, managers see subordinates' pending, admins see all
- Sequential approval (must complete level N before level N+1)

**Plan 05-03 (Employee Loan Management):**
- EMI calculation using reducing balance method with zero-interest handling
- Pre-create all LoanDeduction records on loan creation for payroll sync readiness
- Unique constraint (loan_id, month, year) prevents double deduction
- Calculate total interest from schedule (not formula) for rounding accuracy
- Cancel action deletes SCHEDULED deductions, preserves DEDUCTED for audit trail
- Only PENDING loans can be deleted, active loans must be cancelled/closed
- Loan lifecycle: PENDING (created) → ACTIVE (disbursed) → CLOSED (repaid) or CANCELLED
- LoanDeduction status: SCHEDULED (future) → DEDUCTED (processed) or SKIPPED

**Plan 05-04 (Payroll Integration for Expenses and Loans):**
- Net pay formula: Gross - Deductions + Reimbursements - Loan EMI
- Expenses transition to REIMBURSED during payroll sync with payroll_record_id link
- Loan deductions transition to DEDUCTED with payroll_record_id link
- Loan balance decremented by principal paid (not total EMI)
- Loans auto-close when remaining_balance_paise ≤ 0
- Expense sync queries: WHERE status=APPROVED AND synced_to_payroll=false
- Loan sync queries: WHERE status=SCHEDULED AND loan.status=ACTIVE
- All loan updates wrapped in transactions for atomicity

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

**Created (Plan 03-08):**
- prisma/schema.prisma — StatutoryDeadline model, DeadlineType enum, FilingStatus enum
- src/lib/statutory/deadlines.ts — Deadline calculation, alert checking, and filing utilities
- src/app/api/statutory/deadlines/route.ts — GET (list with filtering) and POST (generate for month) endpoints
- src/app/api/statutory/deadlines/[id]/route.ts — GET (detail) and PATCH (mark as filed) endpoints
- src/app/api/cron/statutory-alerts/route.ts — Daily cron endpoint for alert checking
- src/app/api/dashboard/statutory/route.ts — Dashboard summary with compliance score

**Created (Plan 03-09):**
- src/app/(dashboard)/payroll/page.tsx — Dashboard with recent runs and quick stats
- src/app/(dashboard)/payroll/run/page.tsx — Run payroll page
- src/app/(dashboard)/payroll/[runId]/page.tsx — Run detail page with progress tracking
- src/components/payroll/payroll-run-form.tsx — Form with validation and submission
- src/components/payroll/payroll-records-table.tsx — Records table with payslip downloads
- src/app/api/payroll/run/route.ts — POST endpoint to initiate payroll run
- src/app/api/payroll/runs/route.ts — GET endpoint to list payroll runs
- src/app/api/payroll/runs/[runId]/route.ts — GET endpoint for single run details
- src/app/api/payroll/runs/[runId]/records/route.ts — GET endpoint for run records

### Phase 4 Artifacts

**Created (Plan 04-01):**
- src/lib/email/resend.ts — Resend SDK wrapper with sendEmail function
- src/lib/email/queue.ts — BullMQ email queue with addEmailJob helper
- src/lib/email/worker.ts — Email worker with concurrency and retry configuration
- src/lib/email/templates/payslip-notification.ts — Payslip notification email template
- src/lib/email/templates/index.ts — Template registry with getTemplate lookup
- .env.example — Added RESEND_API_KEY and EMAIL_FROM environment variables

**Created (Plan 04-02):**
- src/lib/validations/investment.ts — Zod schemas for 80C, 80D, HRA, other deductions with Indian tax limit validation
- src/app/api/investments/route.ts — GET (list with RBAC filtering) and POST (create) endpoints
- src/app/api/investments/[id]/route.ts — GET (detail), PATCH (update/submit/verify/reject), DELETE endpoints

**Created (Plan 04-03):**
- prisma/schema.prisma — ProfileUpdateRequest model, ProfileUpdateStatus enum
- src/lib/validations/profile.ts — Profile update validation schemas with UPDATABLE_FIELDS whitelist
- src/app/api/profile/route.ts — GET endpoint for current employee profile with masked PII
- src/app/api/profile/update-requests/route.ts — GET (list) and POST (create) endpoints for update requests
- src/app/api/profile/update-requests/[id]/route.ts — GET (view) and PATCH (approve/reject) endpoints

**Created (Plan 04-04):**
- src/app/(employee)/layout.tsx — Employee portal layout with auth check, role redirect, mobile bottom nav
- src/app/(employee)/dashboard/page.tsx — Employee dashboard with leave balances, last payslip, pending requests
- src/components/employee/dashboard-stats.tsx — Stats cards showing leave balance, last payslip, pending requests
- src/app/(employee)/payslips/page.tsx — Payslip list page fetching employee payroll records
- src/app/(employee)/payslips/[id]/page.tsx — Payslip detail page with inline PDF viewer
- src/components/employee/payslip-list.tsx — Responsive payslip list (cards mobile, table desktop)
- src/components/employee/pdf-viewer.tsx — PDF viewer with zoom and navigation controls using react-pdf
- src/app/api/payroll/payslips/[id]/download/route.tsx — API endpoint for downloading payslips by record ID
- src/app/(employee)/tax/page.tsx — Tax documents landing page with links
- src/app/(employee)/tax/form16/page.tsx — Form 16 list page with completed FY filtering
- src/components/employee/form16-list.tsx — Form 16 certificate list (cards mobile, table desktop)

**Created (Plan 04-05):**
- src/components/employee/attendance-calendar.tsx — Mobile-first calendar with color-coded days, monthly summary, day detail view
- src/app/(employee)/attendance/page.tsx — Attendance viewing page fetching records for current employee
- src/components/employee/leave-balance-cards.tsx — Visual balance cards with progress bars and usage breakdown
- src/components/employee/leave-request-form.tsx — Leave application form with React Hook Form, Zod validation, real-time balance checking
- src/app/(employee)/leave/page.tsx — Leave dashboard with balances and recent requests
- src/app/(employee)/leave/apply/page.tsx — Leave application page wrapper

**Created (Plan 04-06):**
- prisma/schema.prisma — InvestmentProofDocument model with section, retention, soft delete
- src/components/employee/investment-declaration-form.tsx — Multi-section form with real-time 80C validation, collapsible sections, currency inputs
- src/components/employee/investment-summary.tsx — Declaration visualization with section breakdowns and tax savings estimate
- src/components/employee/document-upload.tsx — Drag-and-drop upload with file validation, progress, and document list
- src/app/(employee)/investments/page.tsx — Investment list page with current FY declaration and document count
- src/app/(employee)/investments/declare/page.tsx — Declare page for creating/editing with FY calculation
- src/app/api/investments/[declarationId]/documents/route.ts — Document upload API (GET, POST, DELETE)

**Created (Plan 04-07):**
- src/components/employee/profile-view.tsx — Profile view component showing personal, contact, address, employment, and statutory info in sections
- src/components/employee/profile-edit-form.tsx — Profile edit form with React Hook Form, Zod validation, visual change highlighting
- src/app/(employee)/profile/page.tsx — Profile page fetching employee data and pending update requests
- src/app/(employee)/profile/edit/page.tsx — Profile edit page with pending request warning
- src/components/admin/profile-approval-list.tsx — Approval list with approve/reject actions, desktop table and mobile cards
- src/app/(dashboard)/approvals/page.tsx — Approvals dashboard page with RBAC, shows profile and leave request counts

**Modified (Plan 04-07):**
- src/lib/queues/workers/payroll.worker.ts — Added email notification queueing in finalization stage using addEmailJob

### Phase 5 Artifacts

**Created (Plan 05-01):**
- prisma/schema.prisma — OnboardingRecord model, OnboardingStatus enum
- src/lib/validations/onboarding.ts — ChecklistItemSchema, CreateOnboardingSchema, UpdateOnboardingStatusSchema, UpdateChecklistSchema
- src/lib/workflows/onboarding.ts — ALLOWED_TRANSITIONS, canTransitionOnboarding, generateDefaultChecklist, calculateChecklistProgress
- src/app/api/onboarding/route.ts — GET (list with status filter), POST (create with email notification)
- src/app/api/onboarding/[id]/route.ts — GET (detail), PATCH (action-based status update), DELETE (soft delete)
- src/app/api/onboarding/[id]/checklist/route.ts — PATCH (update checklist item completion)
- src/lib/email/templates/offer-letter-notification.ts — Offer letter email template

**Modified (Plan 05-01):**
- src/lib/email/templates/index.ts — Added offer-letter template to registry

**Created (Plan 05-02):**
- prisma/schema.prisma — ExpensePolicy, ExpenseClaim, ExpenseApproval models, ExpenseStatus, ApprovalStatus enums
- src/lib/validations/expense.ts — Zod schemas for expense policies and claims
- src/lib/workflows/expense.ts — Multi-level approval routing, state transitions, policy validation
- src/app/api/expense-policies/route.ts — Policy list and create endpoints
- src/app/api/expense-policies/[id]/route.ts — Policy CRUD operations
- src/app/api/expenses/route.ts — Claim list and create with RBAC filtering
- src/app/api/expenses/[id]/route.ts — Claim submit/approve/reject actions
- src/app/api/expenses/[id]/receipt/route.ts — Receipt upload/download endpoints

**Created (Plan 05-03):**
- prisma/schema.prisma — EmployeeLoan, LoanDeduction models, LoanStatus, DeductionStatus enums
- src/lib/validations/loan.ts — CreateLoanSchema, UpdateLoanStatusSchema, LoanFilterSchema with Zod validation
- src/lib/workflows/loan.ts — EMI calculation, amortization schedule generation, total interest calculation
- src/lib/workflows/loan.test.ts — 9 comprehensive unit tests for EMI accuracy
- src/app/api/loans/route.ts — List and create loans with RBAC and pre-created deductions
- src/app/api/loans/[id]/route.ts — Loan detail, status transitions (disburse/close/cancel), delete
- src/app/api/loans/[id]/schedule/route.ts — Full amortization schedule with status tracking

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

**User setup required for deadline tracking (Plan 03-08):**
1. Run `pnpm db:push` to create StatutoryDeadline table
2. Generate initial deadlines: POST to /api/statutory/deadlines with {month, year}
3. (Optional) Set CRON_SECRET in .env for cron endpoint security
4. Configure daily cron job to call /api/cron/statutory-alerts

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
- Deadline alert flags track that alerts should be sent, but actual notification sending (email/SMS) not implemented
- Form 16 generator has TypeScript errors (pre-existing from 03-07) - needs fixing before production use

**Phase 6 Planning:**
- Will require deep research on RAG implementation patterns (Vercel AI SDK + Ollama + Qdrant)
- Embedding model selection and chunking strategies for HR policy documents
- Permission-aware data access in RAG queries (RBAC enforcement)

**User setup required for email notifications (Plan 04-01):**
1. Sign up for Resend account at https://resend.com
2. Generate API key from Resend dashboard
3. Add to .env file: RESEND_API_KEY=your_api_key
4. Add from email to .env: EMAIL_FROM=noreply@yourdomain.com
5. Start email worker: `pnpm worker:email` (or add to process manager)

**User setup required for onboarding workflows (Plan 05-01):**
1. Add COMPANY_NAME and NEXT_PUBLIC_APP_URL to .env file:
   - COMPANY_NAME=ShreeHR
   - NEXT_PUBLIC_APP_URL=http://localhost:3000
2. Ensure email worker running for offer letter notifications
3. Implement frontend page `/onboarding/accept?token=...` for candidate acceptance flow

## Session Continuity

Last session: 2026-02-04 — Completed 05-04-PLAN.md (Payroll Integration for Expenses and Loans)
Stopped at: Completed Phase 5 Plan 4, ready for next plan
Resume file: None
