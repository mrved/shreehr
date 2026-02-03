---
phase: 03-payroll-compliance
plan: 04
subsystem: payroll
tags: [pf, esi, pt, tds, bullmq, statutory-compliance, tdd, vitest]

# Dependency graph
requires:
  - phase: 03-01
    provides: Salary structure types and constants, paise-based calculations
  - phase: 03-02
    provides: Professional Tax calculation utility
  - phase: 03-03
    provides: BullMQ queue infrastructure and worker framework
provides:
  - PF calculation with wage ceiling (Rs.15,000) and employer breakdown (EPF/EPS/EDLI)
  - ESI calculation with wage ceiling check (Rs.21,000)
  - TDS calculation with new/old regime support and 4% cess
  - Complete payroll calculator orchestrating all deductions
  - Multi-stage payroll worker processing (validation → calculation → statutory → finalization)
affects: [03-05-payslip-generation, 03-06-ecr-esi, 03-07-form16, 03-09-payroll-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD cycle for critical calculations (RED → GREEN → REFACTOR)
    - Paise-based monetary calculations throughout
    - Stage-based async job processing with progress tracking
    - Upsert pattern for idempotent payroll processing

key-files:
  created:
    - src/lib/statutory/pf.ts
    - src/lib/statutory/pf.test.ts
    - src/lib/statutory/esi.ts
    - src/lib/statutory/tds.ts
    - src/lib/payroll/calculator.ts
  modified:
    - src/lib/payroll/constants.ts
    - src/lib/queues/workers/payroll.worker.ts

key-decisions:
  - "Use TDD for PF calculations to ensure correctness of wage ceiling and EPS cap logic"
  - "PF admin rate is 0.51% (not 0.85%) per EPFO regulations"
  - "Standard deduction updated to Rs.75,000 for new regime (Budget 2024)"
  - "EPS effectively capped at Rs.1,249.50 due to 8.33% of Rs.15,000 wage ceiling"
  - "ESI contribution period tracking for continuity across 6-month periods"
  - "TDS calculation projects annual income and spreads tax over remaining FY months"
  - "PT calculation delegates to existing calculatePT utility from Plan 03-02"

patterns-established:
  - "TDD pattern: Write failing test → Implement minimum code to pass → Refactor"
  - "Statutory calculation functions return result objects with breakdown for audit trail"
  - "Worker stages update PayrollRun status and queue next stage on success"
  - "Attendance summary counts ABSENT as LOP, ON_LEAVE as paid"

# Metrics
duration: 8min
completed: 2026-02-04
---

# Phase 03 Plan 04: Payroll Calculation Engine Summary

**PF/ESI/PT/TDS calculations with TDD, complete payroll calculator orchestrating all deductions, and multi-stage BullMQ worker processing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-03T21:13:11Z
- **Completed:** 2026-02-03T21:21:22Z
- **Tasks:** 3
- **Files created:** 5
- **Files modified:** 2

## Accomplishments

- PF calculation with 12% employee contribution, wage ceiling cap at Rs.15,000, and employer breakdown (EPF 3.67%, EPS 8.33% capped at Rs.1,249.50, EDLI 0.50%, admin 0.51%)
- ESI calculation with 0.75% employee + 3.25% employer when gross ≤ Rs.21,000
- TDS calculation with new regime (Rs.75,000 standard deduction) and old regime support, 4% cess, and annual tax projection
- Complete payroll calculator orchestrating gross calculation, LOP deduction, and all statutory deductions (PF/ESI/PT/TDS)
- Multi-stage payroll worker implementing validation, calculation, statutory (stub), and finalization stages
- 12 passing unit tests for PF calculation covering wage ceiling, EPS cap, and employer breakdown

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement PF calculation with TDD** - `233d68d` (test)
   - RED phase: Tests written first and failing
   - Implementation: `233d68d` (feat) - calculatePF and calculateEmployerPFBreakdown functions

2. **Task 2: Implement ESI and TDS calculations** - `4bd43e3` (feat)
   - ESI calculation with wage ceiling check
   - TDS calculation with regime support and cess

3. **Task 3: Implement payroll calculator and complete worker** - `b163523` (feat)
   - Complete payroll calculator with all deductions
   - Worker stages: validation, calculation, statutory, finalization

## Files Created/Modified

**Created:**
- `src/lib/statutory/pf.ts` - PF calculation with wage ceiling and employer breakdown
- `src/lib/statutory/pf.test.ts` - 12 unit tests for PF calculation (TDD)
- `src/lib/statutory/esi.ts` - ESI calculation with wage ceiling check and contribution period tracking
- `src/lib/statutory/tds.ts` - TDS calculation with new/old regime, slabs, and 4% cess
- `src/lib/payroll/calculator.ts` - Complete payroll calculator orchestrating all deductions

**Modified:**
- `src/lib/payroll/constants.ts` - Added paise versions (PF_WAGE_CEILING_PAISE, ESI_WAGE_CEILING_PAISE, EPS_MAX_MONTHLY_PAISE, TDS_STANDARD_DEDUCTION_PAISE), fixed PF_ADMIN_RATE to 0.51%, updated standard deduction to Rs.75,000
- `src/lib/queues/workers/payroll.worker.ts` - Implemented validation, calculation, statutory (stub), and finalization stages

## Decisions Made

**1. TDD for PF calculations**
- PF has complex wage ceiling and EPS cap logic that's easy to get wrong
- TDD ensures correctness with 12 unit tests covering edge cases
- RED → GREEN → REFACTOR cycle caught interface mismatch issues early

**2. EPS cap is effectively Rs.1,249.50**
- Initially thought EPS cap was Rs.1,250 per EPFO regulations
- But 8.33% of Rs.15,000 (wage ceiling) = Rs.1,249.50
- Since PF wage ceiling is Rs.15,000, EPS never exceeds Rs.1,249.50 in practice
- Tests updated to reflect reality vs theoretical maximum

**3. Standard deduction updated to Rs.75,000**
- Budget 2024 increased standard deduction from Rs.50,000 to Rs.75,000 for new regime
- Old regime still Rs.50,000
- Both coded in TDS calculation

**4. PF admin rate is 0.51%**
- Previous value of 0.85% was incorrect
- EPFO admin charges are 0.50% EDLI admin + 0.01% inspection = 0.51%
- Updated in constants and calculation

**5. LOP calculation based on working days**
- Working days exclude weekends (Saturday, Sunday)
- LOP deduction = (gross / working days) × LOP days
- Paid days = working days - LOP days

**6. ESI contribution period continuity**
- ESI has 6-month contribution periods (Apr-Sep, Oct-Mar)
- Once covered in a period, employee remains covered even if salary exceeds limit
- Added getESIContributionPeriod helper for future continuity check implementation

**7. TDS spreads over remaining FY months**
- Projects annual income from current monthly gross
- Calculates total annual tax
- Spreads remaining tax over remaining FY months
- Handles year-to-date TDS for accurate monthly deduction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript interface mismatch (resolved)**
- `PFCalculationResult.breakdown` defined as anonymous type without `total` field
- But `calculateEmployerPFBreakdown` returns `EmployerPFBreakdown` which has `total`
- Fixed by moving `EmployerPFBreakdown` interface before `PFCalculationResult` and using it in `breakdown` field
- All TypeScript compilation errors resolved

**EPS cap understanding**
- Initial test expected EPS to reach Rs.1,250 cap
- But with Rs.15,000 wage ceiling, 8.33% = Rs.1,249.50
- EPS never actually hits the cap in practice
- Test corrected to match reality

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- **03-05 Payslip Generation:** All deduction calculations complete, can generate detailed payslips
- **03-06 ECR/ESI Files:** PF and ESI breakdowns stored in PayrollRecords for file generation
- **03-07 Form 16:** TDS calculations and projections ready for annual tax statement
- **03-09 Payroll Dashboard:** PayrollRuns and PayrollRecords created with full status tracking

**Notes:**
- Statutory stage in worker is a stub (TODO for Plan 06)
- PT calculation delegates to existing utility from Plan 03-02
- Worker validates attendance lock exists before processing
- Worker validates salary structures are compliant with 50% Basic Pay Rule
- Upsert pattern ensures idempotent payroll processing (safe to re-run)

**Blockers:**
None

**Concerns:**
- TDS calculation is simplified (no HRA exemption, LTA, 80C deductions)
- More complex TDS scenarios will need enhancement in Plan 03-07
- ESI contribution period continuity check is stubbed (checkESIContinuity returns false)
- Will need to query previous payroll records for actual continuity

---
*Phase: 03-payroll-compliance*
*Completed: 2026-02-04*
