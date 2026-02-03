---
phase: 04-employee-self-service
plan: 03
subsystem: api
tags: [profile-management, approval-workflow, prisma, zod, nextjs]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Employee model, NextAuth v5, RBAC patterns, Prisma setup"
  - phase: 02-time-attendance
    provides: "Approval workflow patterns from leave requests"
provides:
  - "ProfileUpdateRequest model with JSON diff storage"
  - "Profile view and update request APIs"
  - "Admin approval workflow for profile changes"
  - "Validation schemas for updatable employee fields"
affects: [05-document-management, 06-ai-chat]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JSON diff storage for change tracking ({ field: { old, new } })"
    - "Approval workflow with transaction-based updates"
    - "Updatable fields whitelist pattern"

key-files:
  created:
    - "src/lib/validations/profile.ts"
    - "src/app/api/profile/route.ts"
    - "src/app/api/profile/update-requests/route.ts"
    - "src/app/api/profile/update-requests/[id]/route.ts"
  modified:
    - "prisma/schema.prisma"

key-decisions:
  - "Store changes as JSON diff with old/new values for audit trail"
  - "Only allow updating non-sensitive fields (address, contact, emergency info)"
  - "Prevent duplicate pending requests per employee"
  - "Apply approved changes in transaction with status update"

patterns-established:
  - "UPDATABLE_FIELDS whitelist: Explicitly define which fields employees can request to update"
  - "Changes diff format: { field_name: { old: value, new: value } } for clear audit trail"
  - "Transaction pattern: Update employee record and request status atomically"

# Metrics
duration: 5min
completed: 2026-02-04
---

# Phase 04 Plan 03: Profile Update Request Workflow Summary

**Profile update request system with JSON diff tracking and admin approval workflow for employee self-service changes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-04T03:52:00Z
- **Completed:** 2026-02-04T03:57:07Z
- **Tasks:** 2
- **Files modified:** 5 (1 modified, 4 created)

## Accomplishments
- ProfileUpdateRequest model tracks employee-initiated profile change requests
- Employee can view own profile with masked PII (PAN/Aadhaar last 4 digits)
- Request workflow validates only updatable fields and detects actual changes
- Admin approval applies changes to Employee record in atomic transaction
- Prevents duplicate pending requests and validates field-specific formats

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ProfileUpdateRequest model** - `2c4b292` (feat)
2. **Task 2: Create profile APIs with approval workflow** - `7aa49cb` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added ProfileUpdateRequest model with status enum and relations
- `src/lib/validations/profile.ts` - Validation schemas for profile updates with UPDATABLE_FIELDS whitelist
- `src/app/api/profile/route.ts` - GET endpoint for current employee profile with masked PII
- `src/app/api/profile/update-requests/route.ts` - GET (list requests) and POST (create request) endpoints
- `src/app/api/profile/update-requests/[id]/route.ts` - GET (view request) and PATCH (approve/reject) endpoints

## Decisions Made

**1. JSON diff storage for changes**
- Store changes as `{ field_name: { old: value, new: value } }` for clear audit trail
- Only include fields that actually changed (compare with current values)
- Enables easy display of what changed for approval review

**2. Updatable fields whitelist**
- Defined UPDATABLE_FIELDS constant: address, emergency contact, personal phone/email
- Excludes sensitive fields (PAN, Aadhaar, bank details) and employment fields
- Prevents employees from requesting changes to critical data

**3. Prevent duplicate pending requests**
- Check for existing pending request before creating new one
- Ensures clean approval queue for admins
- Employee must wait for processing before submitting new request

**4. Transaction-based approval**
- Apply changes to Employee record and update request status atomically
- Prevents partial updates if either operation fails
- Maintains data consistency between request and actual profile

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Database not running during execution**
- **Issue:** `pnpm db:push` failed because PostgreSQL not running
- **Resolution:** Generated Prisma client successfully to validate schema syntax. Database push verification deferred to user setup as documented in STATE.md
- **Impact:** Schema changes are syntactically valid and Prisma client generated. User must run `docker compose up -d postgres` and `pnpm db:push` to apply to database

## User Setup Required

**Before using profile update workflow:**

1. Start PostgreSQL: `docker compose up -d postgres`
2. Apply schema changes: `pnpm db:push`
3. Verify tables created: Check `profile_update_requests` table exists

**No external services or API keys required for this feature.**

## Next Phase Readiness

**Ready for Phase 4 continuation:**
- Profile update request workflow complete
- Pattern established for employee self-service with approval
- Can be extended to other employee-modifiable fields if needed

**Considerations for UI implementation (Phase 5):**
- Profile view component should display current values with edit request button
- Update request form should show current → new values for review
- Admin approval queue should display all pending requests with diff view
- Consider notification system for request status changes (approved/rejected)

---
*Phase: 04-employee-self-service*
*Completed: 2026-02-04*
