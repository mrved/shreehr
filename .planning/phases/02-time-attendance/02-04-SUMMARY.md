---
phase: 02-time-attendance
plan: 04
subsystem: ui
tags: [react, ui, attendance, leave, components]
dependency-graph:
  requires: [02-01, 02-02, 02-03]
  provides: [attendance-ui, leave-ui, manager-dashboards]
  affects: [03-payroll]
tech-stack:
  added: []
  patterns: [server-components, client-components, react-hooks, rbac-ui]
key-files:
  created:
    - src/components/attendance/check-in-button.tsx
    - src/components/attendance/attendance-calendar.tsx
    - src/components/attendance/team-attendance.tsx
    - src/components/leave/leave-balance-card.tsx
    - src/components/leave/leave-request-form.tsx
    - src/components/leave/leave-requests-list.tsx
    - src/components/leave/leave-types-manager.tsx
    - src/app/(dashboard)/attendance/page.tsx
    - src/app/(dashboard)/attendance/team/page.tsx
    - src/app/(dashboard)/leave/page.tsx
    - src/app/(dashboard)/leave/apply/page.tsx
    - src/app/(dashboard)/leave/types/page.tsx
    - src/components/ui/switch.tsx
    - src/components/ui/progress.tsx
    - src/hooks/use-toast.ts
  modified: []
decisions:
  - id: DEC-0204-01
    choice: "Client components for interactive UI"
    reason: "Check-in button, calendars, forms all need client-side interactivity"
  - id: DEC-0204-02
    choice: "Simple useToast hook with console/alert fallback"
    reason: "MVP toast notification without full shadcn/ui toast setup"
  - id: DEC-0204-03
    choice: "Prompt-based rejection reason input"
    reason: "Simple UX for manager rejection flow, can upgrade to modal later"
metrics:
  duration: 8min
  completed: 2026-02-04
---

# Phase 02 Plan 04: Attendance & Leave UI Summary

Attendance and Leave management UI for employees, managers, and admins with check-in/out, calendar view, leave application, and admin configuration.

## What Was Built

### Attendance Components

1. **CheckInButton** (`src/components/attendance/check-in-button.tsx`)
   - Shows today's attendance status
   - Check-in and check-out buttons with loading states
   - Displays work duration when checked out
   - Uses `/api/attendance` and `/api/attendance/check-in|check-out`

2. **AttendanceCalendar** (`src/components/attendance/attendance-calendar.tsx`)
   - Monthly calendar view with color-coded status
   - Navigation between months
   - Legend showing status colors (PRESENT, HALF_DAY, ABSENT, ON_LEAVE, HOLIDAY, WEEKEND)
   - Accepts optional employeeId for viewing specific employee

3. **TeamAttendance** (`src/components/attendance/team-attendance.tsx`)
   - Table view of all team members' today status
   - Filter by: All, Present, Absent, Missing Punch
   - Shows check-in/out times and alerts for missing punches
   - Summary counts (total, absent, missing punches)

### Leave Components

4. **LeaveBalanceCard** (`src/components/leave/leave-balance-card.tsx`)
   - Grid of cards showing each leave type balance
   - Progress bar showing used/pending vs opening
   - Displays available days prominently

5. **LeaveRequestForm** (`src/components/leave/leave-request-form.tsx`)
   - Leave type selection from active types
   - Date range picker with start/end dates
   - Half-day toggle with first/second half selection
   - Reason textarea with validation
   - Submits to `/api/leave-requests`

6. **LeaveRequestsList** (`src/components/leave/leave-requests-list.tsx`)
   - Dual-mode: "My Leave Requests" and "Pending Approvals"
   - Table with type, dates, days, reason, status
   - Approve/Reject actions for managers
   - Cancel action for employees' pending requests

7. **LeaveTypesManager** (`src/components/leave/leave-types-manager.tsx`)
   - CRUD table for leave types
   - Dialog form for add/edit
   - Fields: name, code, annual quota, carry forward, paid, requires approval, min days notice
   - Delete with confirmation

### Pages

8. **Attendance Page** (`/attendance`)
   - Employee view with CheckInButton + AttendanceCalendar

9. **Team Attendance Page** (`/attendance/team`)
   - Manager/Admin only, TeamAttendance component

10. **Leave Dashboard** (`/leave`)
    - LeaveBalanceCard + LeaveRequestsList
    - Plus "Pending Approvals" section for managers

11. **Leave Apply Page** (`/leave/apply`)
    - LeaveRequestForm component

12. **Leave Types Page** (`/leave/types`)
    - Admin/HR only, LeaveTypesManager component

### Supporting Components

13. **Switch** (`src/components/ui/switch.tsx`) - Toggle switch component
14. **Progress** (`src/components/ui/progress.tsx`) - Progress bar component
15. **useToast Hook** (`src/hooks/use-toast.ts`) - Simple toast notification hook

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| DEC-0204-01 | Client components for interactive UI | Check-in button, calendars, forms all need client-side interactivity |
| DEC-0204-02 | Simple useToast hook with console/alert fallback | MVP toast notification without full shadcn/ui toast setup |
| DEC-0204-03 | Prompt-based rejection reason input | Simple UX for manager rejection flow, can upgrade to modal later |

## Deviations from Plan

### Auto-added Missing Components

**1. [Rule 3 - Blocking] Created Switch UI component**
- **Found during:** Task 1 setup
- **Issue:** Switch component not present in UI library
- **Fix:** Created simple toggle switch component
- **Files:** src/components/ui/switch.tsx

**2. [Rule 3 - Blocking] Created Progress UI component**
- **Found during:** Task 2 - LeaveBalanceCard needs progress bar
- **Issue:** Progress component not present in UI library
- **Fix:** Created progress bar component
- **Files:** src/components/ui/progress.tsx

**3. [Rule 3 - Blocking] Created useToast hook**
- **Found during:** Task 1 setup
- **Issue:** Toast notification system not present
- **Fix:** Created simple useToast hook with console/alert fallback
- **Files:** src/hooks/use-toast.ts

## Commits

| Hash | Message |
|------|---------|
| 55ca257 | feat(02-04): create attendance UI components and pages |
| cc7939f | feat(02-04): create leave UI components and pages |

## Files Created

```
src/components/attendance/
  check-in-button.tsx       # 151 lines - Check-in/out with status
  attendance-calendar.tsx   # 127 lines - Monthly calendar view
  team-attendance.tsx       # 164 lines - Team attendance table

src/components/leave/
  leave-balance-card.tsx    # 77 lines - Balance cards grid
  leave-request-form.tsx    # 186 lines - Leave application form
  leave-requests-list.tsx   # 175 lines - Requests table with actions
  leave-types-manager.tsx   # 236 lines - Admin CRUD for types

src/app/(dashboard)/attendance/
  page.tsx                  # 25 lines - Employee attendance view
  team/page.tsx             # 25 lines - Manager team view

src/app/(dashboard)/leave/
  page.tsx                  # 37 lines - Leave dashboard
  apply/page.tsx            # 20 lines - Leave application page
  types/page.tsx            # 20 lines - Admin leave types config

src/components/ui/
  switch.tsx                # 42 lines - Toggle switch
  progress.tsx              # 32 lines - Progress bar

src/hooks/
  use-toast.ts              # 55 lines - Toast notification hook
```

## API Integration Points

| Component | API Endpoint | Method |
|-----------|--------------|--------|
| CheckInButton | /api/attendance | GET |
| CheckInButton | /api/attendance/check-in | POST |
| CheckInButton | /api/attendance/check-out | POST |
| AttendanceCalendar | /api/attendance | GET |
| TeamAttendance | /api/employees | GET |
| TeamAttendance | /api/attendance | GET |
| LeaveBalanceCard | /api/leave-balances | GET |
| LeaveRequestForm | /api/leave-types | GET |
| LeaveRequestForm | /api/leave-requests | POST |
| LeaveRequestsList | /api/leave-requests | GET |
| LeaveRequestsList | /api/leave-requests/:id | PATCH |
| LeaveTypesManager | /api/leave-types | GET/POST |
| LeaveTypesManager | /api/leave-types/:id | PATCH/DELETE |

## Next Phase Readiness

**Phase 2 UI Completed:**
- Employees can check-in/out via web interface
- Employees can view attendance calendar
- Managers can view team attendance with filters
- Employees can view leave balances
- Employees can apply for leave
- Managers can approve/reject leave requests
- Admins can configure leave types

**Ready for:**
- Phase 02-05: Integration testing and polish
- Phase 3: Payroll processing (will use attendance data)
