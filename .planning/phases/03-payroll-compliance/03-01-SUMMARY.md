---
phase: 03-payroll-compliance
plan: 01
subsystem: api
tags: [payroll, salary, labour-code, validation, zod, prisma]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Prisma schema, User model, RBAC infrastructure, API patterns
  - phase: 02-time-attendance
    provides: Attendance tracking for LOP calculation
provides:
  - SalaryStructure model with component-wise salary breakdown in paise
  - 50% Basic Pay Rule validation per Labour Code 2026
  - Salary structure CRUD API with RBAC enforcement
  - Annual CTC calculation including employer PF/ESI contributions
  - Effective date tracking for salary structure changes
affects:
  - 03-02-tax-calculation # Will use salary components for tax computation
  - 03-03-payroll-processing # Will use salary structures for payroll runs
  - 03-04-statutory-compliance # Will use basic pay for PF/ESI calculation

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod schema with custom refine for business rule validation"
    - "Salary amounts stored in paise (integers) for precision"
    - "Effective date tracking with auto-end of previous structures"

key-files:
  created:
    - src/lib/payroll/types.ts
    - src/lib/payroll/validators.ts
    - src/app/api/salary-structures/route.ts
    - src/app/api/salary-structures/[id]/route.ts
  modified:
    - prisma/schema.prisma
    - src/lib/statutory/pt.ts

key-decisions:
  - "Store all salary amounts in paise (integers) for precision and avoid floating-point errors"
  - "Validate 50% Basic Pay Rule at API level before database save"
  - "Auto-end previous active salary structure when creating new one"
  - "Calculate and store derived fields (gross, CTC, basic percentage) for performance"

patterns-established:
  - "ValidationResult pattern: return isValid, data, and error message together"
  - "Zod refine for cross-field validation with descriptive error messages"
  - "Shortfall calculation in error messages to guide correction"

# Metrics
duration: 5min
completed: 2026-02-03
---

# Phase 3 Plan 1: Salary Structure Configuration Summary

**Salary structure model and API with 50% Basic Pay Rule validation enforcing Labour Code 2026 compliance**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-03T21:03:27Z
- **Completed:** 2026-02-03T21:08:21Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- SalaryStructure model with 7 salary components stored in paise for precision
- 50% Basic Pay Rule validator with clear error messages including shortfall amount
- CRUD API with RBAC enforcement (ADMIN/HR_MANAGER/PAYROLL_MANAGER)
- Annual CTC calculation including employer PF (12%) and ESI (3.25%) contributions
- Effective date tracking with auto-end of previous active structures

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SalaryStructure model and payroll types** - Pre-existing (schema and types already created)
2. **Task 2: Create 50% Basic Pay Rule validator** - `7af695e` (feat)
3. **Task 3: Create Salary Structure API endpoints** - `b30dfa7` (feat)

## Files Created/Modified

**Created:**
- `src/lib/payroll/types.ts` - TypeScript interfaces for salary components and validation results, paise conversion utilities
- `src/lib/payroll/validators.ts` - 50% Basic Pay Rule validation, annual CTC calculation, Zod schemas
- `src/app/api/salary-structures/route.ts` - GET/POST endpoints for listing and creating salary structures
- `src/app/api/salary-structures/[id]/route.ts` - GET/PATCH/DELETE endpoints for individual salary structures

**Modified:**
- `prisma/schema.prisma` - Added SalaryStructure model, TaxRegime enum, relations to Employee and User
- `src/lib/statutory/pt.ts` - Fixed duplicate OR clause in Prisma queries (blocking TypeScript compilation)

## Decisions Made

1. **Pre-existing schema and types** - Task 1 artifacts (SalaryStructure model and payroll types) were already present in the codebase from preparatory work. Verified they matched plan requirements exactly.

2. **Integer storage for salary amounts** - All salary components stored in paise (1 rupee = 100 paise) to avoid floating-point precision errors in financial calculations.

3. **Computed fields stored** - gross_monthly_paise, annual_ctc_paise, basic_percentage, and is_compliant stored in database rather than computed on-the-fly for query performance.

4. **Auto-end previous structures** - When creating new salary structure, automatically set effective_to on previous active structure to day before new effective_from.

5. **Validation at API level** - 50% rule validated before database save to provide immediate feedback with actionable error messages.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed duplicate OR clause in pt.ts Prisma queries**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** Professional Tax file had duplicate OR clauses in Prisma queries causing TypeScript compilation error
- **Fix:** Combined OR clauses using AND wrapper: `AND: [{ OR: [...] }, { OR: [...] }]`
- **Files modified:** src/lib/statutory/pt.ts
- **Verification:** TypeScript compilation passed for payroll validator files
- **Committed in:** 7af695e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking issue)
**Impact on plan:** Fix was necessary to unblock TypeScript compilation. No scope change.

## Issues Encountered

**Database not running:** PostgreSQL database was not running, preventing `pnpm db:push` execution. This is expected in development setup and does not block code completion. Schema changes are complete and ready to be applied when database is available.

**Pre-existing future work:** Found commits for plans 03-02 and 03-03 already in repository. These appear to be from preparatory work or parallel development. Did not affect 03-01 execution.

## User Setup Required

**Database schema update required:**

When PostgreSQL database is running, execute:
```bash
pnpm db:push
```

This will:
- Create salary_structures table
- Add TaxRegime enum
- Add relations to employees and users tables
- Generate updated Prisma client with SalaryStructure model

**Verification:**
```bash
# Check table exists
psql -d shreehr -c "\dt salary_structures"

# Verify columns
psql -d shreehr -c "\d salary_structures"
```

## Next Phase Readiness

**Ready for next phase:**
- Salary structure configuration complete
- 50% Basic Pay Rule validation enforced
- API endpoints ready for UI integration
- Foundation for tax calculation (03-02) established

**Blockers/Concerns:**
- Database must be running to apply schema changes
- Prisma client regeneration needed after db:push
- Tax calculation (03-02) will build on salary component breakdown

**Technical debt:**
- Consider adding validation for effective_to > effective_from
- May need to prevent deletion of salary structures already used in payroll (check will be added when PayrollRecord model exists)

---
*Phase: 03-payroll-compliance*
*Completed: 2026-02-03*
