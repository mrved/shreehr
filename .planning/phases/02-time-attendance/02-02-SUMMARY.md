---
phase: 02-time-attendance
plan: 02
subsystem: leave-management
tags: [prisma, api, validation, authorization, leave, balance]

requires:
  - 01-04 # LeaveBalance model from Keka import

provides:
  - leave-type-configuration
  - leave-request-workflow
  - balance-validation

affects:
  - 03-payroll # Payroll will use leave data for salary deductions

tech-stack:
  added: []
  patterns:
    - role-based-authorization
    - balance-validation-with-pending
    - soft-delete-for-referenced-entities

key-files:
  created:
    - prisma/schema.prisma # LeaveType and LeaveRequest models
    - src/lib/validations/leave.ts # Leave validation schemas
    - src/app/api/leave-types/route.ts # Leave type list/create
    - src/app/api/leave-types/[id]/route.ts # Leave type detail/update/delete
    - src/app/api/leave-requests/route.ts # Leave request list/create
    - src/app/api/leave-requests/[id]/route.ts # Leave request approve/reject/cancel
  modified: []

key-decisions:
  - Use LeaveType model instead of enum for flexible leave policy configuration
  - Balance validation considers both LeaveBalance records and pending/approved requests
  - Weekend exclusion in days calculation (Saturday and Sunday)
  - Soft delete for leave types that have associated requests
  - Manager authorization based on reporting_manager_id relationship
  - Auto-approve for leave types with requires_approval=false

metrics:
  duration: 3 min
  completed: 2026-02-03
---

# Phase 2 Plan 02: Leave Management Summary

> LeaveType/LeaveRequest models with CRUD APIs, balance validation, and approval workflow

## One-liner

Leave type configuration API (admin-managed quotas and policies) and leave request workflow with balance validation against LeaveBalance and pending requests, weekend exclusion, and manager/admin approval.

## What Was Built

### Database Models

**LeaveType model** - Configurable leave policies:
- name, code, description
- annual_quota, max_carry_forward
- is_paid, requires_approval, min_days_notice
- is_active for soft deletion
- Audit fields (created_by, updated_by, timestamps)

**LeaveRequest model** - Leave applications:
- employee_id, leave_type_id
- start_date, end_date, days_count
- is_half_day, half_day_period (FIRST_HALF/SECOND_HALF)
- reason, status (PENDING/APPROVED/REJECTED/CANCELLED)
- Approval tracking (approved_by, approved_at, rejection_reason)
- Cancellation tracking (cancelled_at, cancellation_reason)
- Audit fields

**Relations added:**
- User: created_leave_types, updated_leave_types, created_leave_requests, updated_leave_requests, approved_leave_requests
- Employee: leave_requests

### APIs Created

**Leave Type CRUD** (Admin/HR Manager only):
- `GET /api/leave-types` - List all types (filter by activeOnly)
- `POST /api/leave-types` - Create new leave type
- `GET /api/leave-types/[id]` - Get single leave type
- `PATCH /api/leave-types/[id]` - Update leave type
- `DELETE /api/leave-types/[id]` - Delete (soft if has requests)

**Leave Request Workflow**:
- `POST /api/leave-requests` - Create leave request with validation
  - Balance check against LeaveBalance + pending requests
  - Overlap detection
  - Minimum notice period validation
  - Weekend exclusion in days calculation
- `GET /api/leave-requests` - List requests (role-based filtering)
  - EMPLOYEE: own requests only
  - PAYROLL_MANAGER: own + direct reports
  - ADMIN/HR_MANAGER: all requests
- `GET /api/leave-requests/[id]` - Get single request
- `PATCH /api/leave-requests/[id]` - Approve/reject/cancel
  - Approve: Updates LeaveBalance.used and .balance
  - Reject: Requires reason
  - Cancel: Employee can cancel own pending requests

### Validation Logic

**Leave Type Validation**:
- name: 2-50 chars
- code: 1-10 chars, uppercase
- annualQuota, maxCarryForward: 0-365 days
- minDaysNotice: non-negative integer

**Leave Request Validation**:
- Half-day must be single day with period specified
- End date >= start date
- Balance check: available = (opening + accrued - used) - pending
- Overlap check: no conflicting PENDING/APPROVED requests
- Notice period: request start >= today + min_days_notice

**calculateLeaveDays helper**:
- Excludes weekends (Saturday, Sunday)
- Returns 0.5 for half-day
- Iterates date range counting weekdays

## Files Created/Modified

**Created:**
- prisma/schema.prisma (LeaveType, LeaveRequest models)
- src/lib/validations/leave.ts
- src/app/api/leave-types/route.ts
- src/app/api/leave-types/[id]/route.ts
- src/app/api/leave-requests/route.ts
- src/app/api/leave-requests/[id]/route.ts

## Decisions Made

**1. LeaveType model instead of enum**
- **Why:** Flexibility for admin to configure leave policies without code changes
- **Impact:** Admin can add custom leave types, adjust quotas per year
- **Alternative considered:** Hardcoded enum (rejected - not flexible)

**2. Balance validation includes pending requests**
- **Why:** Prevents over-booking (employee can't apply for more than available)
- **Implementation:** Aggregate pending + approved days, subtract from balance
- **Edge case handled:** No balance record = use annual_quota as default

**3. Weekend exclusion in days calculation**
- **Why:** Standard practice - weekends don't count as leave days
- **Implementation:** Iterate date range, skip Saturday (6) and Sunday (0)
- **Alternative considered:** Business days API (rejected - adds dependency)

**4. Soft delete for leave types**
- **Why:** Leave types with historical requests can't be hard deleted
- **Implementation:** Check request count, set is_active=false if > 0
- **Benefit:** Preserves data integrity, allows filtering active types

**5. Manager authorization via reporting_manager_id**
- **Why:** Managers approve their direct reports' leave
- **Implementation:** Check reporting_manager_id === session.user.employeeId
- **Fallback:** ADMIN/HR_MANAGER can approve any request

**6. Auto-approve for non-approval leave types**
- **Why:** Some leave types don't require approval (e.g., comp-off)
- **Implementation:** Set status=APPROVED, approved_at=now if requires_approval=false
- **Benefit:** Reduces admin burden for automatic leave types

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Build failure (pre-existing):**
- Next.js build fails with Tailwind CSS PostCSS plugin error
- **Not related to this plan** - pre-existing project setup issue
- TypeScript compilation passes, APIs functionally complete
- Requires separate fix: install @tailwindcss/postcss and update config

## Testing Notes

**Manual testing required** (database not running during execution):
1. Start PostgreSQL database
2. Run `pnpm db:push` to create tables
3. Create leave types: POST /api/leave-types
4. Apply for leave: POST /api/leave-requests
5. Verify balance validation rejects insufficient balance
6. Verify overlap detection rejects conflicting requests
7. Approve request: PATCH /api/leave-requests/[id] with action=approve
8. Verify LeaveBalance.used incremented
9. Test manager authorization (only direct reports)
10. Test cancellation (employee can cancel own pending)

**Test scenarios:**
- Sufficient balance → Request created
- Insufficient balance → 400 error with message
- Overlapping dates → 400 error
- Advance notice violated → 400 error
- Weekend days excluded from count
- Half-day = 0.5 days
- Soft delete leave type with requests → is_active=false

## Next Phase Readiness

**Ready for Phase 3 (Payroll)** with the following:
- Leave request data available for salary calculations
- LeaveBalance tracks used days for deductions
- Unpaid leave (is_paid=false) flagged for LOP calculation

**Dependencies met:**
- LeaveBalance model from Phase 1 (01-04) integrated
- Leave data structure compatible with payroll requirements

**Blockers:** None

**Concerns:**
- Tailwind CSS build issue needs fix before deployment
- Database must be running for API testing

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-02-03T20:06:13Z
- **Completed:** 2026-02-03T20:09:38Z
- **Tasks:** 3/3 completed
- **Files created:** 6
- **Commits:** 3

## Commits

- `016230b` - feat(02-02): add LeaveType and LeaveRequest models
- `df85dba` - feat(02-02): create leave type CRUD API with validation
- `9fc2068` - feat(02-02): create leave request API with balance validation

## Next Steps

Continue to next plan in Phase 2 (Time & Attendance) or proceed to Phase 3 (Payroll) if phase complete.
