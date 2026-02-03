---
phase: 05-supporting-workflows
plan: 03
subsystem: payroll
tags: [loans, emi, reducing-balance, amortization, prisma, zod, vitest]

# Dependency graph
requires:
  - phase: 03-payroll-compliance
    provides: Paise-based monetary storage pattern and types
  - phase: 04-employee-self-service
    provides: Employee portal RBAC patterns
provides:
  - Employee loan management with EMI calculation
  - Reducing balance amortization schedule generation
  - Pre-created monthly deduction records for payroll integration
  - Loan status lifecycle (PENDING → ACTIVE → CLOSED/CANCELLED)
affects: [payroll-processing, employee-portal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Reducing balance EMI calculation with zero-interest handling
    - Pre-creation of scheduled deductions for entire loan tenure
    - Transaction-based loan creation with deduction records
    - Amortization schedule with principal/interest breakdown

key-files:
  created:
    - prisma/schema.prisma (EmployeeLoan, LoanDeduction models)
    - src/lib/validations/loan.ts
    - src/lib/workflows/loan.ts
    - src/lib/workflows/loan.test.ts
    - src/app/api/loans/route.ts
    - src/app/api/loans/[id]/route.ts
    - src/app/api/loans/[id]/schedule/route.ts
  modified:
    - prisma/schema.prisma (added loan relations to Employee and User)

key-decisions:
  - "EMI calculation using reducing balance method with correct formula"
  - "Pre-create all LoanDeduction records on loan creation for payroll sync"
  - "Unique constraint (loan_id, month, year) prevents double deduction"
  - "Calculate total interest from schedule (not formula) for rounding accuracy"
  - "Cancel action deletes SCHEDULED deductions, preserves DEDUCTED"
  - "Only PENDING loans can be deleted, active loans must be cancelled/closed"

patterns-established:
  - "Loan lifecycle: PENDING (created) → ACTIVE (disbursed) → CLOSED (repaid) or CANCELLED"
  - "LoanDeduction status: SCHEDULED (future) → DEDUCTED (processed) or SKIPPED"
  - "Amortization schedule: interest on remaining balance, principal = EMI - interest, last month adjusted to zero out balance"

# Metrics
duration: 9min
completed: 2026-02-04
---

# Phase 5 Plan 3: Employee Loan Management Summary

**Employee loan management with EMI calculation using reducing balance method, pre-created amortization schedules, and status-based lifecycle tracking for payroll integration**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-04T04:38:03Z
- **Completed:** 2026-02-04T04:47:34Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Loan EMI calculated using reducing balance formula with 9 comprehensive tests
- Full amortization schedule pre-generated showing principal/interest breakdown per month
- Pre-created LoanDeduction records for entire tenure on loan creation
- Unique constraint prevents double deduction per month
- Status-based loan lifecycle with proper transitions and RBAC

## Task Commits

Each task was committed atomically:

1. **Task 1: Add loan Prisma models** - `674d7fd` (feat)
   - EmployeeLoan and LoanDeduction models with status enums
   - Unique constraint on (loan_id, month, year)
   - Relations to Employee and User for audit trail

2. **Task 2: Create loan validation schemas and EMI calculation** - `0135513` (feat)
   - CreateLoanSchema, UpdateLoanStatusSchema, LoanFilterSchema
   - calculateEMI using reducing balance formula
   - generateAmortizationSchedule with principal/interest breakdown
   - 9 unit tests covering EMI accuracy and edge cases

3. **Task 3: Create loan API endpoints** - `0ebdc89` (feat)
   - GET/POST /api/loans (list and create with RBAC)
   - GET/PATCH/DELETE /api/loans/[id] (detail, status actions, delete)
   - GET /api/loans/[id]/schedule (full amortization schedule)
   - Transaction-based creation ensures atomicity

**Lint fix:** `712f54b` (style: organize imports)

## Files Created/Modified

- `prisma/schema.prisma` - EmployeeLoan, LoanDeduction models with status enums and unique constraints
- `src/lib/validations/loan.ts` - Zod schemas for loan creation, status updates, and filtering
- `src/lib/workflows/loan.ts` - EMI calculation, amortization schedule generation, total interest calculation
- `src/lib/workflows/loan.test.ts` - 9 comprehensive tests for EMI accuracy
- `src/app/api/loans/route.ts` - List and create loans with RBAC filtering
- `src/app/api/loans/[id]/route.ts` - Get, update status (disburse/close/cancel), delete loans
- `src/app/api/loans/[id]/schedule/route.ts` - Get full amortization schedule with status tracking

## Decisions Made

**EMI calculation accuracy:**
- calculateTotalInterest sums from amortization schedule instead of using (EMI × tenure) - principal formula for accuracy with rounding
- Last month EMI adjusted to zero out balance exactly, handles rounding discrepancies

**Deduction pre-creation:**
- Create all LoanDeduction records when loan is created (not on-demand)
- Enables payroll integration to simply update status from SCHEDULED to DEDUCTED
- Cancel action deletes only SCHEDULED deductions, preserves DEDUCTED for audit trail

**Status transitions:**
- disburse: PENDING → ACTIVE, sets disbursement_date
- close: ACTIVE → CLOSED, requires balance=0 OR closure_reason (early closure)
- cancel: PENDING/ACTIVE → CANCELLED, deletes SCHEDULED deductions
- delete: Only PENDING loans can be deleted (not started yet)

**RBAC:**
- Employees see own loans only
- ADMIN/HR_MANAGER/PAYROLL_MANAGER see all loans
- Only admins can create, update status, or delete loans

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript and linting issues resolved:**

1. **Prisma client regeneration:** Generated client after schema changes to include new models
2. **Session field naming:** Fixed `session.user.employee_id` to `session.user.employeeId` (3 occurrences)
3. **Zod enum syntax:** Changed `errorMap` to `message` parameter for Zod v3+ compatibility
4. **LoanDeduction status type:** Added `as const` to status string literal for type inference
5. **Where clause typing:** Used `Prisma.EmployeeLoanWhereInput` type instead of `any`
6. **updatedLoan type:** Added explicit type annotation to satisfy linter
7. **Import organization:** Applied Biome import type and sorting rules

All issues were development-time only, no runtime impact.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for payroll integration:**
- LoanDeduction records available for monthly payroll runs to update
- Balance tracking enables automatic closure when repaid
- Status-based filtering enables reporting

**Future enhancements (not in scope):**
- Payroll sync to mark deductions as DEDUCTED
- Prepayment handling (partial or full early closure)
- Interest rate changes mid-tenure
- Grace periods and penalty interest for defaults
- Loan restructuring workflows

**No blockers or concerns.**

---
*Phase: 05-supporting-workflows*
*Completed: 2026-02-04*
