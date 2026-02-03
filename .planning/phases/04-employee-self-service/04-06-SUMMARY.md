---
phase: 04-employee-self-service
plan: 06
subsystem: ui
tags: [react-hook-form, zod, investment-declaration, file-upload, tax-deductions]

# Dependency graph
requires:
  - phase: 04-02
    provides: Investment declaration API with 80C, 80D, HRA validation
  - phase: 01-01
    provides: Storage infrastructure with file validation and retention

provides:
  - Mobile-first investment declaration UI with real-time validation
  - Document upload component for investment proofs
  - Investment summary visualization with tax savings estimate
  - API for managing investment proof documents (upload, delete, download)

affects: [04-07, 05-admin, Phase-6-AI]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Collapsible form sections for mobile UX
    - Real-time total calculation with useWatch hook
    - Drag-and-drop file upload with client-side validation
    - Currency input with Rs. prefix pattern
    - Dual view pattern (cards mobile, table desktop)

key-files:
  created:
    - src/components/employee/investment-declaration-form.tsx
    - src/components/employee/investment-summary.tsx
    - src/components/employee/document-upload.tsx
    - src/app/(employee)/investments/page.tsx
    - src/app/(employee)/investments/declare/page.tsx
    - src/app/api/investments/[declarationId]/documents/route.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Store document metadata in InvestmentProofDocument model with soft delete for 8-year retention"
  - "Enable document upload only after saving declaration as draft (needs declarationId)"
  - "Group documents by section (80C, 80D, HRA, OTHER) for organization"
  - "Use collapsible sections on form to reduce mobile scroll"
  - "Show real-time 80C total with remaining limit to prevent exceeding max"

patterns-established:
  - "Document upload pattern: drag-drop zone + file picker + upload progress + file list"
  - "Financial year calculation: April to March, YYYY-YY format"
  - "Currency display in rupees, storage in paise for consistency"
  - "Form state: amounts in rupees for UX, convert to paise on submit"

# Metrics
duration: 7min
completed: 2026-02-04
---

# Phase 04 Plan 06: Investment Declaration UI with Document Upload Summary

**Mobile-first investment declaration form with real-time 80C validation, collapsible sections, drag-and-drop document upload for proofs, and tax savings estimate visualization**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-03T22:34:06Z
- **Completed:** 2026-02-03T22:41:16Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Investment declaration form with 80C real-time total validation showing remaining limit
- Document upload component with drag-and-drop, file validation, and section grouping
- Investment summary component displaying all sections with tax savings estimate
- Investment list and declare pages with current FY detection
- API for uploading, viewing, and deleting investment proof documents

## Task Commits

Each task was committed atomically:

1. **Task 1: Create investment declaration form component with document upload** - `dcce612` (feat)
2. **Task 2: Create investment pages and document upload API** - `f210db1` (feat)

## Files Created/Modified

- `src/components/employee/investment-declaration-form.tsx` - Multi-section form with real-time 80C validation, collapsible sections, currency inputs, save as draft and submit options
- `src/components/employee/investment-summary.tsx` - Declaration visualization with section breakdowns, totals, and estimated tax savings
- `src/components/employee/document-upload.tsx` - Drag-and-drop upload component with file validation, progress, and document list
- `src/app/(employee)/investments/page.tsx` - Investment list page showing current FY declaration with document count and past declarations
- `src/app/(employee)/investments/declare/page.tsx` - Declare page for creating/editing declarations with FY calculation
- `src/app/api/investments/[declarationId]/documents/route.ts` - Document upload API with GET (list), POST (upload), DELETE (soft delete)
- `prisma/schema.prisma` - Added InvestmentProofDocument model with section, retention, and soft delete fields

## Decisions Made

**1. Document upload enabled after draft save**
- Need declarationId to associate documents with declaration
- Better UX: save form first, then upload proofs section by section
- Prevents orphaned documents

**2. Group documents by section**
- Each section (80C, 80D, HRA, OTHER) has dedicated upload area
- Helps organize different proof types (PF statements vs rent receipts)
- Makes verification easier for HR

**3. Collapsible form sections**
- Reduces scroll on mobile devices
- Shows totals in header for quick reference
- Expands first section (80C) by default as most commonly used

**4. Real-time 80C total calculation**
- useWatch monitors all 80C fields
- Shows remaining limit as user fills form
- Visual warning when exceeds Rs.1,50,000 limit
- Prevents submission errors

**5. Financial year calculation (April to March)**
- Detects current FY based on month
- Format: YYYY-YY (e.g., "2025-26")
- Matches Indian fiscal year convention

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. TypeScript errors with Prisma client after schema changes**
- **Issue:** Prisma client not regenerated after adding InvestmentProofDocument model
- **Resolution:** Ran `pnpm db:push` and `pnpm prisma generate` to regenerate client
- **Impact:** Minor delay, standard Prisma workflow

**2. Form default values type mismatch**
- **Issue:** Zod schema with `.default(0)` caused type conflicts with React Hook Form
- **Resolution:** Removed `.default()` from schema, set explicit defaultValues in useForm
- **Impact:** Cleaner type inference, better form state management

## User Setup Required

None - uses existing storage infrastructure and database.

## Next Phase Readiness

**Ready for Phase 4 completion:**
- Investment declaration UI complete for employee self-service
- Document upload integrated with existing storage system
- All Phase 4 employee features complete (payslips, tax forms, attendance, leave, profile, investments)

**Next capabilities:**
- HR/Admin UI for verifying investment declarations (Phase 5)
- TDS calculation integration using declared investments in payroll
- Bulk investment declaration import from previous system

**Database changes:**
- InvestmentProofDocument model added
- Run `pnpm db:push` to apply schema changes

---
*Phase: 04-employee-self-service*
*Completed: 2026-02-04*
