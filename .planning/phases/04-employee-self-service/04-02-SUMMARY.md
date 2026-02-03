---
phase: 04-employee-self-service
plan: 02
subsystem: api
tags: [investment-declarations, 80c, 80d, hra, tds, zod, prisma, rbac]

# Dependency graph
requires:
  - phase: 03-payroll-compliance
    provides: Payroll calculation infrastructure and TDS computation
  - phase: 01-foundation
    provides: Prisma schema, RBAC patterns, Zod validation patterns
provides:
  - InvestmentDeclaration model for tax-saving declarations
  - Validation schemas enforcing Indian tax limits (80C, 80D, HRA)
  - CRUD APIs with approval workflow (DRAFT → SUBMITTED → VERIFIED/REJECTED)
affects: [03-payroll-compliance, tds-calculation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Paise storage for all monetary amounts"
    - "Zod refine for cross-field validation (80C total limit)"
    - "Status-based edit restrictions (only DRAFT editable)"
    - "Action-based PATCH endpoints (submit, verify, reject)"

key-files:
  created:
    - src/lib/validations/investment.ts
    - src/app/api/investments/route.ts
    - src/app/api/investments/[id]/route.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Store all investment amounts in paise (integers) for precision consistency with payroll"
  - "Use Zod refine for Section 80C total validation with descriptive error messages"
  - "Only DRAFT declarations can be edited or deleted (status enforcement)"
  - "One declaration per employee per financial year (unique constraint)"
  - "Support action-based PATCH for status transitions (submit, verify, reject)"

patterns-established:
  - "Investment validation with Indian tax rules: 80C max Rs.1.5L, 80D self max Rs.25K, parents max Rs.50K"
  - "Landlord PAN required when annual HRA rent exceeds Rs.1,00,000"
  - "RBAC pattern: employees see own, admins/HR/payroll managers see all"
  - "Status workflow: DRAFT (editable) → SUBMITTED (pending review) → VERIFIED/REJECTED (final)"

# Metrics
duration: 6min
completed: 2026-02-04
---

# Phase 04 Plan 02: Investment Declaration APIs Summary

**Investment declaration schema with 80C/80D/HRA validation enforcing Indian tax limits via Zod refine, CRUD APIs with RBAC, and approval workflow (DRAFT/SUBMITTED/VERIFIED/REJECTED)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-03T22:23:32Z
- **Completed:** 2026-02-03T22:29:61Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- InvestmentDeclaration model added to database (already existed from plan 04-01)
- Validation schemas enforcing Rs.1,50,000 limit on Section 80C total
- Validation schemas enforcing Section 80D limits (Rs.25K self, Rs.50K parents, Rs.5K checkup)
- GET/POST /api/investments for listing and creating declarations with RBAC
- GET/PATCH/DELETE /api/investments/[id] with status-based restrictions
- Submit action changes status from DRAFT to SUBMITTED
- Verify/reject actions for admin approval workflow

## Task Commits

Each task was committed atomically:

1. **Task 1: Add InvestmentDeclaration model** - No commit (already existed from 04-01)
2. **Task 2: Create validation schemas and APIs** - `0d606f0` (feat)

**Plan metadata:** (To be committed after summary creation)

## Files Created/Modified
- `prisma/schema.prisma` - InvestmentDeclaration model (already existed)
- `src/lib/validations/investment.ts` - Zod schemas with Indian tax limit validation
- `src/app/api/investments/route.ts` - GET (list with RBAC) and POST (create) endpoints
- `src/app/api/investments/[id]/route.ts` - GET (detail), PATCH (update/submit/verify), DELETE endpoints

## Decisions Made

**Investment amounts stored in paise:**
- All Section 80C fields (PPF, ELSS, life insurance, etc.) stored as integers in paise
- All Section 80D fields (self, parents, checkup) stored as integers in paise
- HRA monthly rent stored in paise
- Other deductions (80E, 80G, Section 24) stored in paise
- Consistent with existing payroll infrastructure

**Validation approach:**
- Use Zod refine for cross-field validation (80C total, 80D individual limits, HRA landlord PAN requirement)
- Descriptive error messages with shortfall amounts (e.g., "Total cannot exceed Rs.1,50,000")
- PAN regex validation for landlord PAN

**Status workflow:**
- DRAFT: Employee can edit/delete
- SUBMITTED: Employee submitted for review, waiting admin approval
- VERIFIED: Admin approved the declaration
- REJECTED: Admin rejected the declaration
- Only DRAFT declarations can be edited or deleted
- Submit action transitions DRAFT → SUBMITTED
- Verify/reject actions transition SUBMITTED → VERIFIED/REJECTED

**RBAC pattern:**
- Employees: Can only see, create, and edit own declarations
- Admins/HR/Payroll managers: Can see all declarations, verify/reject submitted ones
- Consistent with leave request and payroll patterns

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Started Prisma Postgres database**
- **Found during:** Task 1 (Schema push)
- **Issue:** Database server not running, `pnpm db:push` failing with "Can't reach database server"
- **Fix:** Ran `pnpm prisma dev list` which automatically started the Prisma Postgres server on ports 51213-51215
- **Files modified:** None (infrastructure only)
- **Verification:** `pnpm db:push` succeeded after database startup
- **Committed in:** N/A (no code changes)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary to unblock schema push. No scope creep.

## Issues Encountered

**InvestmentDeclaration model already existed:**
- Task 1 specified adding the model, but it was already in the schema (likely from plan 04-01)
- Verified model exists at line 1024 in schema.prisma
- No changes needed, proceeded directly to Task 2

**Pre-existing TypeScript errors:**
- `pnpm tsc --noEmit` shows errors in payroll routes (params type mismatch)
- These are pre-existing from Phase 3, not related to investment APIs
- Verified no TypeScript errors in investment files specifically

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for integration:**
- Investment APIs ready for TDS calculation integration
- TDS calculator in Phase 3 can now query verified investment declarations
- Need to update TDS calculation to deduct 80C, 80D, HRA from taxable income

**Future enhancements:**
- Add UI components for employees to submit declarations
- Add admin dashboard to review and verify declarations
- Integrate with TDS calculation in payroll (use verified declarations)
- Add proof upload functionality (receipts, rent agreements)
- Add 80CCD(1B) NPS additional deduction (Rs.50,000)
- Add 80TTA/80TTB interest income deductions

**No blockers:**
- All APIs functional and type-safe
- Database schema synchronized
- Validation enforces Indian tax rules correctly

---
*Phase: 04-employee-self-service*
*Completed: 2026-02-04*
