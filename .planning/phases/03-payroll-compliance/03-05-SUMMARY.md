---
phase: 03-payroll-compliance
plan: 05
subsystem: pdf-generation
tags: [react-pdf, pdf, payslip, jszip, download]

# Dependency graph
requires:
  - phase: 03-04
    provides: PayrollRecord model with all earnings/deductions fields for payslip data
provides:
  - PDF payslip generation using @react-pdf/renderer
  - Individual and bulk payslip download APIs
  - Indian numbering system (Lakh, Crore) for amounts in words
  - PAN masking for privacy
affects: [payroll-ui, employee-portal, statutory-compliance]

# Tech tracking
tech-stack:
  added: [@react-pdf/renderer, jszip]
  patterns: [PDF generation from React components, stream-to-buffer conversion for ZIP, RBAC on download endpoints]

key-files:
  created:
    - src/lib/pdf/utils.ts
    - src/lib/pdf/components/index.tsx
    - src/lib/pdf/payslip.tsx
    - src/app/api/payroll/[runId]/payslips/[employeeId]/route.ts
    - src/app/api/payroll/[runId]/payslips/download-all/route.ts
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Use @react-pdf/renderer for declarative PDF generation with React components"
  - "Use NextAuth v5 auth() function instead of getServerSession for session management"
  - "Mask PAN showing only last 4 digits on payslips for privacy"
  - "Use Indian numbering system (Lakh, Crore) for net pay in words"
  - "Use jszip for bulk download with individual PDF per employee"

patterns-established:
  - "PDF generation: Create PayslipData interface, render with @react-pdf/renderer, return stream"
  - "Bulk download: Generate PDFs in loop, add to JSZip, return as ZIP file"
  - "RBAC on downloads: employees can only access own payslip, admin roles can access all"

# Metrics
duration: 5min
completed: 2026-02-04
---

# Phase 03 Plan 05: PDF Payslip Generation Summary

**Professional PDF payslips with @react-pdf/renderer showing earnings, deductions, net pay in words, and bulk ZIP download for admin**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-04T02:55:06Z
- **Completed:** 2026-02-04T02:59:44Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- PDF payslip generation with all salary components and statutory info
- Individual payslip download API with RBAC enforcement
- Bulk download API creating ZIP with all employee payslips
- Indian numbering system for net pay in words (Lakh, Crore)
- PAN masking for privacy compliance

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @react-pdf/renderer and create PDF utilities** - `84f340d` (chore)
2. **Task 2: Create PayslipDocument component** - `633f94f` (feat)
3. **Task 3: Create payslip download API endpoints** - `35a8782` (feat)

**Note:** Individual payslip endpoint already existed from commit `6fbb6d2` (plan 03-06 executed earlier)

## Files Created/Modified

**PDF Generation:**
- `src/lib/pdf/utils.ts` - Currency formatting, PAN masking, number to words with Indian numbering
- `src/lib/pdf/components/index.tsx` - Reusable PDF styles and components (InfoRow, TotalRow, SectionTitle)
- `src/lib/pdf/payslip.tsx` - PayslipDocument React component with full layout

**API Endpoints:**
- `src/app/api/payroll/[runId]/payslips/[employeeId]/route.ts` - Individual payslip download
- `src/app/api/payroll/[runId]/payslips/download-all/route.ts` - Bulk ZIP download

**Dependencies:**
- `package.json` - Added @react-pdf/renderer and jszip
- `pnpm-lock.yaml` - Updated lock file

## Decisions Made

**1. Use @react-pdf/renderer instead of puppeteer/pdfkit**
- Declarative React component approach fits existing stack
- No headless browser overhead
- TypeScript-friendly with good styling capabilities

**2. Use NextAuth v5 auth() instead of getServerSession**
- Project uses NextAuth v5 beta
- auth() is the recommended approach for v5
- Avoids import issues with getServerSession in v5

**3. Mask PAN to last 4 digits on payslips**
- Privacy best practice
- Sufficient for identification without full disclosure
- Consistent with industry standards

**4. Indian numbering for net pay in words**
- Use Lakh (1,00,000) and Crore (1,00,00,000)
- More natural for Indian employees
- Matches format on cheques and financial documents

**5. Stream-to-buffer conversion for bulk download**
- @react-pdf/renderer returns ReadableStream
- Convert to Buffer for JSZip compatibility
- Efficient memory usage with chunked reading

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Pre-existing TypeScript errors in other files:**
- Several PT slab and salary structure routes have getServerSession import errors
- These are pre-existing from previous plans
- Do not affect newly created PDF functionality
- New routes use auth() to avoid the issue

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Payroll UI to integrate download endpoints
- Employee portal to show "Download Payslip" button
- Admin payroll dashboard with bulk download feature

**Considerations:**
- Company info (name, address, PF code) is hardcoded in routes
- Should be moved to database or config in future
- COMPANY_INFO constant appears in both endpoints (DRY opportunity)

**Integration points:**
- GET `/api/payroll/{runId}/payslips/{employeeId}` - Individual download
- GET `/api/payroll/{runId}/payslips/download-all` - Bulk ZIP download
- Both require authentication and enforce RBAC

---
*Phase: 03-payroll-compliance*
*Completed: 2026-02-04*
