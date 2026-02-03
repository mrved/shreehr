---
phase: 04-employee-self-service
plan: 04
subsystem: ui
tags: [nextjs, react, pdf, mobile-first, employee-portal, payslips, form16]

# Dependency graph
requires:
  - phase: 03-payroll-compliance
    provides: PayrollRecord model with employee payslips, Form 16 PDF generation API
provides:
  - Mobile-first employee portal with role-based access
  - Payslip list and PDF viewer pages
  - Form 16 certificate download interface
  - Dashboard with leave balance and last payslip stats
affects: [04-05-leave-requests, 04-06-attendance-tracking, future-mobile-app]

# Tech tracking
tech-stack:
  added: [react-pdf, pdfjs-dist, @react-pdf-viewer/core, @react-pdf-viewer/default-layout]
  patterns: [mobile-first-responsive, route-group-isolation, bottom-navigation, card-table-dual-view]

key-files:
  created:
    - src/app/(employee)/layout.tsx
    - src/app/(employee)/dashboard/page.tsx
    - src/app/(employee)/payslips/page.tsx
    - src/app/(employee)/payslips/[id]/page.tsx
    - src/app/(employee)/tax/page.tsx
    - src/app/(employee)/tax/form16/page.tsx
    - src/components/employee/dashboard-stats.tsx
    - src/components/employee/payslip-list.tsx
    - src/components/employee/pdf-viewer.tsx
    - src/components/employee/form16-list.tsx
    - src/app/api/payroll/payslips/[id]/download/route.tsx
  modified: []

key-decisions:
  - "Separate (employee) route group for employee-only portal with dedicated layout"
  - "Fixed bottom navigation on mobile (<md), sidebar on desktop (md+)"
  - "Redirect admins/HR to dashboard, employees use employee portal"
  - "Dual-view components: cards on mobile, tables on desktop"
  - "Inline PDF viewer with zoom controls for payslips"
  - "Completed FY filtering for Form 16 (only show after March)"

patterns-established:
  - "Mobile-first responsive: Fixed bottom nav mobile, sidebar desktop"
  - "Card-table duality: Mobile cards, desktop tables for list views"
  - "Route group isolation: (employee) vs (dashboard) for different user types"
  - "PDF viewer component: Reusable with zoom, pagination, touch-friendly"

# Metrics
duration: 6min
completed: 2026-02-04
---

# Phase 04 Plan 04: Employee Portal with Mobile-First UI Summary

**Mobile-first employee portal with bottom navigation, payslip PDF viewer, and Form 16 downloads leveraging react-pdf**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-04T03:23:51Z
- **Completed:** 2026-02-04T03:30:12Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Mobile-first employee portal with role-based access control (EMPLOYEE only)
- Dashboard showing leave balance, last payslip, and pending requests
- Payslip viewing with inline PDF viewer and download capability
- Form 16 certificate list with completed FY filtering
- Responsive navigation: fixed bottom bar (mobile) and sidebar (desktop)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create employee portal layout with mobile navigation** - `6dcdf6f` (feat)
2. **Task 2: Create dashboard and payslip pages** - `1fcc69e` (feat)
3. **Task 3: Create Form 16 viewing and download pages** - Already completed in Plan 04-03

**Note:** Task 3 files (Form 16 pages) were already created in a previous plan (04-03), so no new commit was needed for Task 3.

## Files Created/Modified
- `src/app/(employee)/layout.tsx` - Employee portal layout with auth check, role redirect, mobile bottom nav
- `src/app/(employee)/dashboard/page.tsx` - Employee dashboard fetching leave balances, last payslip, pending requests
- `src/components/employee/dashboard-stats.tsx` - Stats cards showing leave balance, last payslip, pending requests
- `src/app/(employee)/payslips/page.tsx` - Payslip list page fetching employee payroll records
- `src/app/(employee)/payslips/[id]/page.tsx` - Payslip detail page with inline PDF viewer
- `src/components/employee/payslip-list.tsx` - Responsive payslip list (cards mobile, table desktop)
- `src/components/employee/pdf-viewer.tsx` - PDF viewer with zoom and navigation controls using react-pdf
- `src/app/api/payroll/payslips/[id]/download/route.tsx` - API endpoint for downloading payslips by record ID
- `src/app/(employee)/tax/page.tsx` - Tax documents landing page with links
- `src/app/(employee)/tax/form16/page.tsx` - Form 16 list page with completed FY filtering
- `src/components/employee/form16-list.tsx` - Form 16 certificate list (cards mobile, table desktop)

## Decisions Made

**Route Group Architecture:**
- Created separate `(employee)` route group isolated from `(dashboard)`
- Employees redirected to employee portal, admins/HR/payroll managers to dashboard
- Ensures clean separation of concerns and prevents route collisions

**Mobile-First Navigation:**
- Fixed bottom navigation on mobile (<md breakpoint)
- Sidebar navigation on desktop (md+ breakpoint)
- Touch-friendly tap targets (48px minimum)

**Dual-View Pattern:**
- List components render cards on mobile, tables on desktop
- Same data, different presentations based on screen size
- Consistent pattern across payslips and Form 16 lists

**PDF Viewing Strategy:**
- Installed react-pdf and pdfjs-dist for client-side PDF rendering
- Inline viewer with zoom controls instead of download-only
- Touch-friendly zoom in/out buttons for mobile users

**API Endpoint Design:**
- Created simplified `/api/payroll/payslips/[id]/download` endpoint
- Takes payroll record ID directly instead of runId + employeeId
- Employee RBAC enforced at API level

**Form 16 Filtering:**
- Only show completed financial years (after March of ending year)
- Prevents showing incomplete FY certificates
- Clear messaging about availability timeline

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing react-pdf package**
- **Found during:** Task 2 (PDF viewer component creation)
- **Issue:** Plan specified @react-pdf-viewer packages but PDFViewer component needs react-pdf core library
- **Fix:** Ran `pnpm add react-pdf` to install missing dependency
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** TypeScript compilation passed, imports resolved
- **Committed in:** 1fcc69e (Task 2 commit)

**2. [Rule 1 - Bug] Fixed import path for prisma client**
- **Found during:** Task 1 (Dashboard page implementation)
- **Issue:** Imported from `@/lib/prisma` instead of correct `@/lib/db`
- **Fix:** Changed import to `@/lib/db` matching project convention
- **Files modified:** src/app/(employee)/dashboard/page.tsx
- **Verification:** TypeScript compilation passed
- **Committed in:** 6dcdf6f (Task 1 commit)

**3. [Rule 1 - Bug] Added explicit type annotation for TypeScript**
- **Found during:** Task 1 (Dashboard page compilation)
- **Issue:** LeaveBalance map parameter had implicit any type
- **Fix:** Added explicit type annotation `(lb: { leave_type: string; balance: number })`
- **Files modified:** src/app/(employee)/dashboard/page.tsx
- **Verification:** TypeScript compilation passed with no errors
- **Committed in:** 6dcdf6f (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All auto-fixes necessary for compilation and correctness. No scope creep.

## Issues Encountered

**PDF Viewer Library Confusion:**
- Plan listed both @react-pdf-viewer and react-pdf packages
- @react-pdf-viewer is a different library from react-pdf
- Resolved by installing react-pdf which provides Document and Page components
- Peer dependency warning about pdfjs-dist version mismatch (harmless, functional)

**Task 3 Already Complete:**
- Discovered Task 3 files (Form 16 pages) already existed from Plan 04-03
- No new work needed, just verified TypeScript compilation
- This is acceptable overlap - previous plan created foundation, this plan integrates it

## User Setup Required

None - no external service configuration required.

The employee portal uses existing authentication and database infrastructure. Users must:
1. Have EMPLOYEE role in the database
2. Have employeeId linked to their user account
3. Have payroll records in the database to see payslips
4. Have completed FY payroll records to see Form 16

## Next Phase Readiness

**Ready for:**
- Plan 04-05: Leave request submission from employee portal
- Plan 04-06: Attendance viewing from employee portal
- Plan 04-07: Profile management from employee portal

**Foundation established:**
- Employee portal layout and navigation pattern
- Dashboard stats pattern (can extend with attendance stats)
- PDF viewing infrastructure (reusable for other documents)
- Mobile-first responsive patterns (bottom nav, card/table duality)

**Notes:**
- Form 16 API already exists from Phase 3 (Plan 03-07)
- Payslip PDF generation API already exists from Phase 3 (Plan 03-05)
- This plan focused on UI/UX layer on top of existing backend

**Potential enhancements for later:**
- Active route highlighting in navigation
- Skeleton loaders for dashboard stats
- Empty states for new employees
- Download all payslips as ZIP
- Form 16 inline preview (currently download-only)

---
*Phase: 04-employee-self-service*
*Completed: 2026-02-04*
