---
phase: 14-admin-dashboard
plan: 03
subsystem: api
tags: [birthday, anniversary, pending-actions, cron, rbac, date-fns, vitest, tdd, bullmq]

# Dependency graph
requires:
  - phase: 14-admin-dashboard
    plan: 01
    provides: getCachedPendingActionCounts and invalidatePendingActions from cache.ts, birthday-notification email template registered
  - phase: 04-employee-self-service
    provides: addEmailJob from email/queue.ts for digest email queueing
  - phase: 03-payroll-compliance
    provides: statutory-alerts cron Bearer auth pattern
affects:
  - 14-04 (dashboard widget UI will consume /api/dashboard/birthdays and /api/dashboard/pending-actions)
  - 14-05 (dashboard summary view depends on pending-actions counts)

provides:
  - Pure birthday/anniversary query functions with December-January boundary handling
  - GET /api/dashboard/birthdays endpoint (names + computed dates only, no PII)
  - GET /api/dashboard/pending-actions endpoint with RBAC (admin=org-wide, manager=subordinates)
  - GET /api/cron/birthday-notifications daily cron with Bearer auth and org-wide digest email

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function pattern for date logic: no Prisma dependency, receive arrays for testability"
    - "December-January boundary via nextOccurrence helper: compare ms timestamps, use next year if passed"
    - "TDD RED-GREEN cycle: test file committed first (failing), implementation committed second (green)"
    - "Manager-scoped RBAC: query reporting_manager_id relationship to find subordinate IDs, then filter"
    - "Merge-and-sort pattern for unified inbox: combine two model lists, sort by created_at, return top 5"

key-files:
  created:
    - src/lib/dashboard/birthdays.ts
    - src/lib/dashboard/birthdays.test.ts
    - src/app/api/dashboard/birthdays/route.ts
    - src/app/api/dashboard/pending-actions/route.ts
    - src/app/api/cron/birthday-notifications/route.ts

key-decisions:
  - "Pure functions (no Prisma) for birthday/anniversary logic — enables Vitest unit testing without DB mocking"
  - "nextOccurrence helper normalizes month+day to UTC ms for boundary-safe day arithmetic"
  - "Pending actions uses description instead of title for ExpenseClaim (schema has no title field)"
  - "Manager RBAC: PAYROLL_MANAGER + any EMPLOYEE with subordinates both use the subordinates view"
  - "Cron queues individual emails per recipient (not bulk) so email worker handles rate limiting naturally"

patterns-established:
  - "daysDiff(reference, target): Uses UTC timestamps to avoid DST issues in Indian timezone"
  - "nextOccurrence(month, day, today): Returns this-year or next-year Date for any month/day pair"

requirements-completed:
  - REQ-14-03
  - REQ-14-04
  - REQ-14-05

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 14 Plan 03: Birthday/Anniversary APIs and Pending Actions Inbox Summary

**Pure date-query utility with 10 Vitest tests (including Dec-Jan boundary), birthday/anniversary dashboard API, RBAC-filtered pending-actions unified inbox, and daily birthday digest cron route**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-04T06:02:20Z
- **Completed:** 2026-03-04T06:06:44Z
- **Tasks:** 2 (Task 1: TDD with 3 commits; Task 2: 3 API routes with 1 commit)
- **Files modified:** 5

## Accomplishments

- Created `src/lib/dashboard/birthdays.ts` with three pure functions: `getUpcomingBirthdays`, `getUpcomingAnniversaries`, and `getTodayCelebrations` — all testable without a database
- Wrote 10 Vitest unit tests covering edge cases: 30-day window inclusion/exclusion, December-to-January year boundary (Dec 20 + 16 days = Jan 5), today=daysUntil 0, first-year employee exclusion, yearsOfService count, type annotation on anniversary celebrations
- Built 3 API routes: birthday dashboard endpoint (all-auth, names only), pending-actions inbox with full RBAC (admin org-wide via cached counts, manager subordinates-only, employee with reports gets scoped view), and birthday cron route with Bearer token auth and org-wide email digest

## Task Commits

Each task was committed atomically:

1. **Task 1a (TDD RED): Add failing birthday tests** - `e273964` (test)
2. **Task 1b (TDD GREEN): Implement birthday utility functions** - `69826c7` (feat)
3. **Task 2: Birthday API, pending-actions API, birthday cron route** - `cab62fa` (feat)

## Files Created/Modified

- `src/lib/dashboard/birthdays.ts` — Pure utility: getUpcomingBirthdays, getUpcomingAnniversaries, getTodayCelebrations with year-boundary handling
- `src/lib/dashboard/birthdays.test.ts` — 10 Vitest unit tests (TDD RED-GREEN)
- `src/app/api/dashboard/birthdays/route.ts` — GET endpoint, any-auth, 30-day window, names+dates only (no PII)
- `src/app/api/dashboard/pending-actions/route.ts` — GET endpoint, RBAC: admin uses cached counts, managers filter by subordinates
- `src/app/api/cron/birthday-notifications/route.ts` — GET cron endpoint, Bearer auth, calls getTodayCelebrations, queues addEmailJob per recipient

## Decisions Made

- **Pure functions for date logic:** No Prisma dependency means Vitest runs instantly without database or mock setup. Route files do the Prisma queries and pass arrays to pure functions.
- **nextOccurrence uses UTC ms arithmetic:** `Date.UTC(y, m, d)` avoids daylight saving time issues common in Indian timezone (IST +5:30) when comparing dates.
- **ExpenseClaim uses `description` not `title`:** Plan referenced `title` but schema has `description`. Fixed inline to match actual schema.
- **Manager RBAC unified:** Both `PAYROLL_MANAGER` role and regular `EMPLOYEE` with subordinates use the same subordinates-scoped view. PAYROLL_MANAGER is explicitly listed as a manager role but the employee check handles the general case of informal managers.
- **Individual email per recipient (not bulk send):** Cron loops and calls `addEmailJob` per recipient so BullMQ email worker handles rate limiting and retries naturally — consistent with existing email patterns.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ExpenseClaim has no `title` field — used `description` instead**
- **Found during:** Task 2 (pending-actions route implementation)
- **Issue:** Plan specified `select: { title: true }` for ExpenseClaim but Prisma schema has `description: String` not `title`
- **Fix:** Changed select and response mapping to use `description` instead of `title`
- **Files modified:** `src/app/api/dashboard/pending-actions/route.ts`
- **Verification:** TypeScript compiled without errors (`npx tsc --noEmit`)
- **Committed in:** `cab62fa` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — field name mismatch between plan and schema)
**Impact on plan:** Minimal. Schema-accurate fix. No scope change.

## Issues Encountered

None — all tests passed on first run, TypeScript compiled cleanly.

## User Setup Required

None - no external service configuration required for these routes. The `birthday-notification` email template was already registered in 14-01. Daily cron scheduling via Vercel/crontab is a deployment concern covered in vercel.json.

## Next Phase Readiness

- `GET /api/dashboard/birthdays` ready for birthday widget in dashboard UI (Plan 14-04)
- `GET /api/dashboard/pending-actions` ready for pending-actions inbox widget (Plan 14-04 / 14-05)
- `GET /api/cron/birthday-notifications` ready to configure in vercel.json or crontab
- Birthday utility module ready for any future feature that needs celebration detection

---
*Phase: 14-admin-dashboard*
*Completed: 2026-03-04*
