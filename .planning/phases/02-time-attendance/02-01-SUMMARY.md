---
phase: 02-time-attendance
plan: 01
subsystem: attendance
tags: [prisma, attendance, check-in, check-out, work-hours, rbac, typescript, nextjs]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Employee model, User model with roles, NextAuth authentication, Prisma setup
provides:
  - Attendance and AttendanceLock Prisma models
  - Check-in/check-out API endpoints with automatic work hours calculation
  - Attendance list and detail APIs with role-based access control
  - Regularization (manual correction) API for admin/HR
affects: [payroll, leave-management, reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Attendance status based on work hours: >=7.5h = PRESENT, >=4h = HALF_DAY, <4h = ABSENT"
    - "Attendance locking mechanism for payroll cut-off with unlock approval workflow"
    - "Role-based filtering in list APIs: employees see own, managers see team, admin sees all"

key-files:
  created:
    - prisma/schema.prisma (Attendance, AttendanceLock models)
    - src/lib/validations/attendance.ts
    - src/app/api/attendance/check-in/route.ts
    - src/app/api/attendance/check-out/route.ts
    - src/app/api/attendance/route.ts
    - src/app/api/attendance/[id]/route.ts
  modified:
    - prisma/schema.prisma (added User/Employee relations)

key-decisions:
  - "Work hours thresholds: >=7.5h = PRESENT, >=4h = HALF_DAY, <4h = ABSENT"
  - "Unique constraint on (employee_id, date) ensures one attendance record per employee per day"
  - "AttendanceLock prevents changes to historical attendance with unlock approval workflow"
  - "Store work duration in minutes for precision and flexibility"
  - "Regularization tracks who/when for audit compliance"

patterns-established:
  - "calculateAttendanceStatus helper function for consistent status determination"
  - "Attendance lock checking in all mutation APIs to prevent locked period changes"
  - "HEAD endpoint pattern for quick status check without full data fetch"

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 2 Plan 01: Attendance Foundation Summary

**Check-in/check-out attendance tracking with automatic work hours calculation, status determination (PRESENT/HALF_DAY/ABSENT), and RBAC-enabled list/detail APIs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T20:06:08Z
- **Completed:** 2026-02-03T20:10:19Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Attendance and AttendanceLock models added to Prisma schema with audit fields and relations
- Check-in API creates daily attendance record with timestamp
- Check-out API calculates work_minutes and assigns status based on hours worked
- Attendance list API with role-based filtering (employees see own, managers see team, admin sees all)
- Attendance detail API with regularization support for admin/HR manual corrections
- Attendance locking mechanism prevents changes to historical periods with unlock approval workflow

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Attendance model to Prisma schema** - `217cd9e` (feat)
2. **Task 2: Create attendance validation schemas and check-in/check-out APIs** - `e164635` (feat)
3. **Task 3: Create attendance list and detail APIs** - `62507ce` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added Attendance model (employee_id, date, check_in, check_out, work_minutes, status, source, remarks, is_regularized) with unique constraint on (employee_id, date) and AttendanceLock model for payroll locking
- `src/lib/validations/attendance.ts` - Zod schemas for check-in/check-out/query/regularize and calculateAttendanceStatus helper
- `src/app/api/attendance/check-in/route.ts` - POST endpoint to create attendance record with check-in timestamp
- `src/app/api/attendance/check-out/route.ts` - POST endpoint to update attendance with check-out time and calculated work_minutes/status
- `src/app/api/attendance/route.ts` - GET endpoint with pagination and RBAC filtering, HEAD endpoint for quick status check
- `src/app/api/attendance/[id]/route.ts` - GET endpoint for single record, PATCH endpoint for regularization by admin/HR

## Decisions Made
- Work hours thresholds follow plan specification: >=7.5h (450 min) = PRESENT, >=4h (240 min) = HALF_DAY, <4h = ABSENT
- Store work duration in minutes (not hours) for precision and future flexibility
- Use snake_case for all Prisma fields to match existing convention from Phase 1
- Compound unique key naming follows Prisma convention: `employee_id_date` for @@unique([employee_id, date])
- Attendance lock checking prevents modifications to locked periods unless unlock is approved
- Regularization sets is_regularized flag and tracks regularized_by/regularized_at for audit trail

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Pre-existing Tailwind CSS build error:**
- `pnpm build` fails with "@tailwindcss/postcss" error
- This is a pre-existing issue from Phase 1 (not caused by this plan)
- TypeScript compilation (`pnpm tsc --noEmit`) passes successfully
- All attendance APIs are correctly typed and compile without errors
- Build fix can be addressed separately without blocking attendance functionality

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 02-02 (Leave management APIs):
- Attendance model provides foundation for leave-to-attendance sync
- AttendanceStatus enum includes ON_LEAVE for leave integration
- Attendance locking mechanism will prevent leave changes after payroll cut-off

---
*Phase: 02-time-attendance*
*Completed: 2026-02-03*
