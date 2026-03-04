---
phase: 14-admin-dashboard
plan: 01
subsystem: database
tags: [prisma, postgresql, email-templates, cache, announcements, polls, bullmq]

# Dependency graph
requires:
  - phase: 04-employee-self-service
    provides: email template registry pattern and cache.ts with unstable_cache pattern
  - phase: 01-foundation
    provides: Prisma schema base with User and Employee models for new relations
provides:
  - Announcement and Poll Prisma models with full relations and unique constraints
  - PollOption and PollResponse models with cascade delete
  - Announcement and birthday notification email templates registered in template registry
  - Cached queries for active announcements, polls, and pending action counts
  - Invalidation helpers for announcements, polls, and pending actions
affects:
  - 14-02 through 14-05 (all downstream API and UI plans depend on these models)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tag-based cache invalidation with revalidateTag and INVALIDATE_NOW pattern for new feature areas"
    - "Related author/creator pattern via named relations (AnnouncementCreatedBy, PollCreatedBy)"
    - "Cascade delete via onDelete: Cascade on child model foreign keys"
    - "Unique constraint @@unique([poll_id, employee_id]) for one-vote-per-poll enforcement"

key-files:
  created:
    - src/lib/email/templates/announcement-notification.ts
    - src/lib/email/templates/birthday-notification.ts
  modified:
    - prisma/schema.prisma
    - src/lib/email/templates/index.ts
    - src/lib/cache.ts

key-decisions:
  - "Poll unique constraint at DB level prevents duplicate votes even under concurrent requests"
  - "Announcement cache TTL 300s, Poll cache TTL 60s (votes change more frequently)"
  - "PendingActionCounts uses Promise.all across 4 models to minimize DB round-trips"
  - "Birthday template uses digest style (all celebrations in one email) rather than individual emails"

patterns-established:
  - "getCachedActive* pattern: fetch non-archived/non-closed records with author name only"
  - "invalidate* functions always revalidate both feature tag and dashboard tag to keep summary views fresh"

requirements-completed:
  - REQ-14-01
  - REQ-14-02
  - REQ-14-03

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 14 Plan 01: Database Foundation Summary

**Prisma schema extended with Announcement, Poll, PollOption, PollResponse models; announcement and birthday email templates registered; cached queries with invalidation helpers added to cache.ts**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-04T05:54:02Z
- **Completed:** 2026-03-04T05:57:38Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added 4 new Prisma models (Announcement, Poll, PollOption, PollResponse) with full relations, cascade delete, and a unique constraint on PollResponse preventing duplicate votes
- Created 2 email templates (announcement-notification, birthday-notification) registered in template registry alongside existing templates
- Extended cache.ts with 3 new cached query functions and 3 invalidation helpers for announcements, polls, and pending action inbox counts

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Announcement and Poll models to Prisma schema** - `7d24b8b` (feat)
2. **Task 2: Create announcement and birthday email templates** - `b2b70bb` (feat)
3. **Task 3: Add cached dashboard queries and invalidation helpers** - `78dd324` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Added Announcement, Poll, PollOption, PollResponse models; reverse relations on User and Employee
- `src/lib/email/templates/announcement-notification.ts` - Org-wide announcement email with styled HTML and plain text
- `src/lib/email/templates/birthday-notification.ts` - Birthday/anniversary digest email listing all celebrations
- `src/lib/email/templates/index.ts` - Registered both new templates in registry
- `src/lib/cache.ts` - Added getCachedActiveAnnouncements, getCachedActivePolls, getCachedPendingActionCounts + invalidation helpers

## Decisions Made

- Poll unique constraint placed at DB level `@@unique([poll_id, employee_id])` — prevents duplicate votes even under concurrent requests without application-level locking
- Cache TTL 300s for announcements (rarely changes), 60s for polls (votes change frequently), 120s for pending action counts (moderate change rate)
- `getCachedPendingActionCounts` uses `Promise.all` across 4 COUNT queries to minimize round-trips while aggregating leave, expense, profile, and correction pending counts
- Birthday notification uses digest style (all celebrations in one email per day) rather than individual emails per celebration to avoid email fatigue

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - schema validated cleanly, TypeScript compiled without errors on first attempt.

## User Setup Required

None - no external service configuration required. Database sync via `pnpm db:push` was run automatically during task execution.

## Next Phase Readiness

- All four models exist in Prisma schema and are reflected in the generated client
- `getCachedActiveAnnouncements` and `getCachedActivePolls` ready for server components
- `invalidateAnnouncements` and `invalidatePolls` ready for use in mutation API routes
- Email templates ready for `addEmailJob('announcement-notification', ...)` and `addEmailJob('birthday-notification', ...)` calls
- Plan 14-02 (Announcement API) can proceed immediately

---
*Phase: 14-admin-dashboard*
*Completed: 2026-03-04*
