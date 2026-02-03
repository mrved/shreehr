---
phase: 05-supporting-workflows
plan: 01
subsystem: onboarding
tags: [prisma, zod, workflow, state-machine, email, bullmq, resend]

# Dependency graph
requires:
  - phase: 04-employee-self-service
    provides: Email notification infrastructure with BullMQ and Resend
  - phase: 03-payroll-compliance
    provides: BullMQ queue infrastructure for background jobs
  - phase: 01-foundation
    provides: Prisma schema, authentication, RBAC patterns

provides:
  - OnboardingRecord model with candidate details and workflow status
  - OnboardingStatus enum with PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED states
  - Checklist JSON field for task tracking with categories (IT, ADMIN, MANAGER, HR)
  - Workflow state machine with canTransitionOnboarding validation
  - Default checklist generation with task categories and due dates
  - Onboarding CRUD APIs with RBAC (ADMIN, HR_MANAGER)
  - Offer letter email notification with candidate acceptance token
  - Checklist item completion tracking with assignee RBAC

affects: [06-ai-capabilities, future-hr-workflows]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - State machine workflow pattern with ALLOWED_TRANSITIONS map
    - Action-based status update via PATCH with transition validation
    - JSON checklist field with Zod schema validation
    - Unique token generation for candidate acceptance flow
    - Email notification queueing on record creation

key-files:
  created:
    - prisma/schema.prisma (OnboardingRecord model, OnboardingStatus enum)
    - src/lib/validations/onboarding.ts
    - src/lib/workflows/onboarding.ts
    - src/app/api/onboarding/route.ts
    - src/app/api/onboarding/[id]/route.ts
    - src/app/api/onboarding/[id]/checklist/route.ts
    - src/lib/email/templates/offer-letter-notification.ts
  modified:
    - src/lib/email/templates/index.ts (added offer-letter template to registry)

key-decisions:
  - "Store checklist as JSON array instead of separate table for flexibility and atomicity"
  - "Use action-based status updates (accept, start_tasks, complete, cancel) instead of direct status field"
  - "Generate unique offer_token for candidate acceptance link instead of relying on email confirmation"
  - "Default checklist includes IT (laptop, email), Admin (desk), HR (docs), Manager (welcome) tasks"
  - "Verify all required checklist items completed before allowing transition to COMPLETED status"
  - "Assignee-based RBAC for checklist updates (can only update assigned tasks)"

patterns-established:
  - "Workflow state machine: ALLOWED_TRANSITIONS map with canTransition validation function"
  - "Action-based API: PATCH with action enum instead of exposing status field directly"
  - "Checklist progress tracking: calculateChecklistProgress returns total, completed, percentage"
  - "Default data generation: generateDefaultChecklist creates starter tasks with relative due dates"

# Metrics
duration: 6min
completed: 2026-02-04
---

# Phase 05 Plan 01: Onboarding Workflows Summary

**Digital onboarding with workflow state machine, checklist tracking, and automated offer letter notification via Resend**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-04T13:20:06Z
- **Completed:** 2026-02-04T13:26:22Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- OnboardingRecord model with candidate details, position, salary, and workflow status
- Workflow state machine with status transition validation (PENDING → ACCEPTED → IN_PROGRESS → COMPLETED)
- Default checklist generation with IT, Admin, HR, Manager tasks linked to joining date
- Complete onboarding CRUD APIs with RBAC (ADMIN, HR_MANAGER, linked employee)
- Offer letter email notification with candidate acceptance token
- Checklist item completion tracking with assignee-based RBAC

## Task Commits

Each task was committed atomically:

1. **Task 1: Add onboarding Prisma models** - `58db140` (feat)
2. **Task 2: Create onboarding validation schemas and workflow logic** - `e0558c5` (feat)
3. **Task 3: Create onboarding API endpoints and email template** - `17eba6f` (feat)

_All tasks executed as planned with no TDD._

## Files Created/Modified

**Created:**
- `prisma/schema.prisma` - OnboardingRecord model with employee_id (nullable), candidate details, position, offer details, status, checklist JSON, timestamps, offer_token
- `src/lib/validations/onboarding.ts` - ChecklistItemSchema, CreateOnboardingSchema, UpdateOnboardingStatusSchema, UpdateChecklistSchema with Zod validation
- `src/lib/workflows/onboarding.ts` - ALLOWED_TRANSITIONS map, canTransitionOnboarding, generateDefaultChecklist, calculateChecklistProgress
- `src/app/api/onboarding/route.ts` - GET (list with status filter), POST (create with email notification)
- `src/app/api/onboarding/[id]/route.ts` - GET (detail), PATCH (action-based status update), DELETE (soft delete)
- `src/app/api/onboarding/[id]/checklist/route.ts` - PATCH (update checklist item completion)
- `src/lib/email/templates/offer-letter-notification.ts` - Offer letter email with accept button and joining date

**Modified:**
- `src/lib/email/templates/index.ts` - Added offer-letter template to registry

## Decisions Made

**Checklist storage as JSON:**
- Stored checklist as JSON array instead of separate OnboardingChecklistItem table
- Rationale: Simpler atomic updates, no need for complex joins, checklist is tightly coupled to onboarding record
- Trade-off: Can't query individual checklist items, but not needed for this use case

**Action-based status updates:**
- Used action enum (accept, start_tasks, complete, cancel) instead of exposing status field directly
- Rationale: Encapsulates business logic, enforces valid transitions, prevents invalid states
- Example: action=complete validates all required tasks completed before transitioning to COMPLETED

**Offer token for acceptance:**
- Generated unique offer_token (crypto.randomUUID()) for candidate acceptance link
- Rationale: Stateless acceptance flow, no need for magic links or email verification
- Security: Token is unique, stored in database, validated on acceptance

**Default checklist generation:**
- Auto-generate default checklist with 5 tasks if not provided on creation
- Categories: IT (laptop provisioning, email creation), Admin (desk assignment), HR (documentation), Manager (welcome meeting)
- Due dates: Relative to joining_date (IT tasks 2 days before, Admin 1 day before, HR/Manager on join date)

**Completion validation:**
- Verify all required checklist items completed before allowing transition to COMPLETED status
- Returns list of incomplete required tasks in error response
- Prevents premature completion and ensures onboarding process followed

**Assignee-based RBAC for checklist:**
- Only ADMIN, HR_MANAGER, or assigned user can update checklist item
- Prevents unauthorized task completion
- Enables distributed ownership (IT team completes IT tasks, HR completes HR tasks)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript errors after schema changes:**
- `prisma generate` required after adding OnboardingRecord model to generate types
- Fixed import path from `@/lib/prisma` to `@/lib/db` (correct path in project)
- Fixed session.user.employee_id to session.user.employeeId (correct property name)
- Fixed JsonArray to ChecklistItem[] type assertion using `as unknown as ChecklistItem[]`
- All fixed during Task 3 development, no additional commits needed

**Linter auto-formatting:**
- Biome auto-formatted files on `pnpm lint` (import sorting, quote style)
- No manual intervention needed, all formatting consistent

## User Setup Required

**For offer letter emails to send:**
1. Ensure Resend API key configured in `.env` (from Phase 04-01)
2. Ensure email worker running (`pnpm worker:email`)
3. Add `COMPANY_NAME` and `NEXT_PUBLIC_APP_URL` to `.env` for email template:
   ```env
   COMPANY_NAME=ShreeHR
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

**For candidate acceptance flow:**
- Frontend page `/onboarding/accept?token=...` needs to be implemented (not in this phase scope)
- Page should call `PATCH /api/onboarding/[id]` with `action=accept` and `offer_token`

## Next Phase Readiness

**Ready for:**
- Expense claim workflows (05-02) - can use similar state machine pattern
- Loan management workflows (05-03) - can use similar action-based status updates
- AI onboarding assistant (06) - can query onboarding records for context

**Blockers/Concerns:**
- None - onboarding workflow complete and ready for use
- Candidate acceptance frontend page needed for end-to-end flow
- Consider adding email notification when checklist tasks are assigned or completed (future enhancement)

---
*Phase: 05-supporting-workflows*
*Completed: 2026-02-04*
