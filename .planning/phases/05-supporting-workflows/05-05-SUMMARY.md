---
phase: 05-supporting-workflows
plan: 05
subsystem: ui
tags: [nextjs, react, forms, dashboard, employee-portal]
requires:
  - 05-01-onboarding-api
  - 05-02-expense-api
  - 05-03-loan-api
provides:
  - onboarding-ui-components
  - expense-ui-components
  - loan-ui-components
  - admin-dashboard-pages
  - employee-portal-pages
affects:
  - future-ui-enhancements
  - mobile-responsiveness
tech-stack:
  added:
    - react-hook-form
    - zod-validation
  patterns:
    - mobile-first-ui
    - client-server-components
    - form-validation
key-files:
  created:
    - src/components/onboarding/onboarding-list.tsx
    - src/components/onboarding/onboarding-form.tsx
    - src/components/onboarding/checklist-manager.tsx
    - src/components/expenses/expense-list.tsx
    - src/components/expenses/expense-form.tsx
    - src/components/expenses/expense-approval.tsx
    - src/components/loans/loan-list.tsx
    - src/components/loans/loan-form.tsx
    - src/components/loans/loan-schedule.tsx
    - src/app/(dashboard)/onboarding/page.tsx
    - src/app/(dashboard)/expenses/page.tsx
    - src/app/(dashboard)/loans/page.tsx
    - src/app/(employee)/expenses/page.tsx
    - src/app/(employee)/loans/page.tsx
  modified: []
decisions:
  - what: Mobile-first responsive design
    why: Employee portal must work well on mobile devices
    impact: All lists have both table (desktop) and card (mobile) views
  - what: Real-time EMI calculation in loan form
    why: Users need immediate feedback on loan terms
    impact: Calculates EMI, interest, and shows mini schedule preview as user types
  - what: Receipt upload with file type and size validation
    why: Prevent large file uploads and ensure compatible formats
    impact: 5MB limit, only images and PDFs allowed
  - what: Inline checklist management
    why: HR needs quick task completion without navigation
    impact: Checkbox interface with optimistic updates
metrics:
  duration: 13min
  completed: 2026-02-04
---

# Phase 05 Plan 05: Supporting Workflows UI Summary

**One-liner:** Complete admin dashboard and employee portal UI for onboarding, expenses, and loans with mobile-responsive components

## What Was Built

Created comprehensive user interface for all three supporting workflows (onboarding, expenses, loans) with admin dashboard pages for management and employee portal pages for self-service.

### Onboarding UI (Task 1)
**Components:**
- `OnboardingList`: Desktop table + mobile card view with status filtering and progress bars
- `OnboardingForm`: Multi-section form with dynamic checklist using useFieldArray
- `ChecklistManager`: Grouped task viewer with inline completion toggles

**Pages:**
- Admin list page with "New Onboarding" button
- Create page with form for candidate details, position, salary, joining date, and checklist
- Detail page showing candidate info, status badges, and interactive checklist

**Features:**
- Status color coding (PENDING=yellow, ACCEPTED=blue, IN_PROGRESS=purple, COMPLETED=green, CANCELLED=red)
- Progress calculation showing checklist completion percentage
- Grouped checklist display by category (IT, Admin, Manager, HR)
- RBAC enforcement (ADMIN, HR_MANAGER only)

### Expense Management UI (Task 2)
**Components:**
- `ExpenseList`: Tabbed interface with "All Expenses" and "Pending My Approval" tabs
- `ExpenseForm`: Multi-step form with policy dropdown, receipt upload, and validation
- `ExpenseApproval`: Full approval interface with receipt viewer and approval chain

**Pages:**
- Admin dashboard showing all expenses or subordinate expenses for managers
- Detail page with approval interface if user can approve at current level
- Employee expense list with status summary (drafts, pending, approved this month)
- Employee submission page with drag-drop receipt upload

**Features:**
- Real-time policy limit validation with visual warnings
- Receipt upload: drag-drop zone, 5MB limit, images + PDFs
- Receipt viewer: image preview or PDF download link
- Approval chain display showing levels, roles, and completion status
- Save as draft + submit for approval workflow
- Mobile-responsive with cards on small screens

### Loan Management UI (Task 3)
**Components:**
- `LoanList`: Desktop table + mobile cards showing loan details and status
- `LoanForm`: Interactive form with **real-time EMI calculation and mini schedule preview**
- `LoanSchedule`: Full amortization table with color-coded payment status

**Pages:**
- Admin dashboard with summary stats (active loans count, total outstanding)
- Create page with employee selector and loan details
- Detail page with full loan info and complete amortization schedule
- Employee loan list with summary (total loans, total remaining)
- Employee detail page with EMI deduction notice and full schedule

**Features:**
- **Real-time EMI calculation** as user types (reducing balance method)
- **Mini schedule preview** showing first 3 months and last month
- Full amortization schedule with color coding:
  - Green: Past months (paid)
  - Red: Past months (skipped)
  - Yellow: Current month
  - Gray: Future months
- Mobile schedule: collapsible months with summary prominently displayed
- Loan type labels (SALARY_ADVANCE, PERSONAL, EMERGENCY)

## Key Implementation Details

**Forms:**
- Used React Hook Form with Zod validation for all forms
- Implemented useFieldArray for dynamic checklist items
- Real-time validation feedback with error messages
- Convert rupees to paise on submission, paise to rupees on display

**Mobile Responsiveness:**
- All lists: hidden md:block for desktop table, md:hidden for mobile cards
- Unprefixed classes for mobile, md: prefix for desktop breakpoint
- Touch-friendly card interfaces with proper spacing

**RBAC:**
- Onboarding: ADMIN, HR_MANAGER only
- Expenses: ADMIN, HR_MANAGER, PAYROLL_MANAGER see all; MANAGER sees subordinates
- Loans: ADMIN, HR_MANAGER, PAYROLL_MANAGER only
- Employee pages: ownership verification

**Data Transformation:**
- Server components fetch from Prisma
- Transform to plain objects for client components
- Handle dates with toISOString() for serialization
- Map schema field names (e.g., policy.name instead of policy.category)

## Integration Points

**API Endpoints Used:**
- POST /api/onboarding - Create onboarding record
- PATCH /api/onboarding/[id]/checklist - Update checklist items
- POST /api/expenses - Create expense claim
- POST /api/expenses/[id]/receipt - Upload receipt
- PATCH /api/expenses/[id] - Approve/reject expense
- GET /api/expense-policies - Fetch policies for dropdown
- POST /api/loans - Create loan
- GET /api/loans/[id]/schedule - Fetch amortization schedule

**Layout Integration:**
- Admin pages use (dashboard) layout with sidebar
- Employee pages use (employee) layout with bottom navigation on mobile
- Both layouts enforce authentication and role-based access

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**Manual Testing Required:**
1. Onboarding form submission with various checklist items
2. Expense form with receipt upload (test file size and type validation)
3. Expense approval flow with multi-level approval chain
4. Loan form EMI calculation with different principals, rates, and tenures
5. Loan schedule display on both desktop and mobile
6. Mobile responsiveness for all pages (resize browser)

**Type Safety:**
- All components fully typed with TypeScript
- No type errors in compilation
- Proper Prisma include types handled

## Next Phase Readiness

**Blockers:** None

**Concerns:**
- Receipt upload uses client-side FormData - may need server action for better error handling
- Mini schedule preview in loan form could be extracted to reusable component
- Approval chain display assumes policy_snapshot structure - needs API alignment

**Ready for:**
- Phase 6: Advanced features (notifications, audit logs, reporting)
- UI enhancements: dark mode, animations, better mobile navigation
- Testing: End-to-end tests for form submission flows

## Performance Notes

- Forms use controlled inputs with real-time validation - no performance issues observed
- Loan EMI calculation runs on every keystroke - lightweight math, no debounce needed
- Schedule fetching uses useEffect - could add loading skeleton for better UX
- Mobile card views use CSS instead of separate components - good bundle size

## Screenshots / Visual Reference

**Onboarding List:**
- Desktop: Table with 7 columns + progress bars
- Mobile: Cards with status badge, department, joining date, progress bar

**Expense Form:**
- Policy dropdown with limit display
- Receipt upload: drag-drop zone or file picker
- Real-time validation warnings for exceeds limit

**Loan Form EMI Preview:**
- Three cards: Monthly EMI, Total Interest, Total Repayment
- Mini schedule table below with first 3 + last month
- All values update as user types

**Loan Schedule:**
- Desktop: Full table with 7 columns
- Mobile: Expandable cards (tap to see breakdown)
- Color-coded rows for payment status
