---
phase: 14-admin-dashboard
plan: 02
subsystem: api
tags: [nextjs, prisma, bullmq, zod, announcements, polls, email, rbac]

# Dependency graph
requires:
  - phase: 14-01
    provides: Announcement/Poll Prisma models, invalidateAnnouncements/invalidatePolls cache helpers, addEmailJob queue helper, announcement-notification email template
  - phase: 04-employee-self-service
    provides: addEmailJob pattern and email queue infrastructure

provides:
  - GET /api/announcements — list non-archived announcements with author name
  - POST /api/announcements — create announcement, queue org-wide email to all active employees
  - PATCH /api/announcements/[id] — archive or unarchive announcement
  - DELETE /api/announcements/[id] — permanently delete announcement
  - GET /api/polls — list active polls with option vote counts and current user's myVote
  - POST /api/polls — create poll with 2-10 options
  - GET /api/polls/[id] — poll detail with results and user's vote
  - PATCH /api/polls/[id] — close or reopen poll
  - POST /api/polls/[id]/vote — cast or change vote via upsert (one per employee per poll)

affects:
  - 14-03 (dashboard UI widgets will consume these API endpoints)
  - 14-04 (employee view will call GET /api/polls and POST /api/polls/[id]/vote)
  - 14-05 (admin pages for announcements and polls management)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RBAC enforcement at function body start: check session.user.role against allowed roles array"
    - "Upsert for vote: poll_id_employee_id unique constraint enforces one-vote-per-employee atomically"
    - "myVote merge pattern: separate query for employee's votes then merged into poll objects"
    - "Promise.all for email jobs: queue adds are fast (Redis), parallel is safe and faster"
    - "closes_at enforcement: checked at vote time (poll.is_closed OR closes_at in past)"

key-files:
  created:
    - src/app/api/announcements/route.ts
    - src/app/api/announcements/[id]/route.ts
    - src/app/api/polls/route.ts
    - src/app/api/polls/[id]/route.ts
    - src/app/api/polls/[id]/vote/route.ts
  modified: []

key-decisions:
  - "HR_MANAGER included in ADMIN_ROLES for announcement/poll create and archive — same as other management features"
  - "DELETE restricted to ADMIN/SUPER_ADMIN only (PATCH for archive available to HR_MANAGER)"
  - "myVote lookup uses separate query instead of nested include to avoid N+1 (one batch query for all polls)"
  - "No PII exposed: only author.name returned in announcements, no email or encrypted fields"
  - "closes_at check at vote time: dual condition (is_closed flag OR closes_at past) prevents votes after automatic close"
  - "Employee filter for email: employment_status=ACTIVE AND user exists (not all employees have login accounts)"

patterns-established:
  - "ADMIN_ROLES/SUPER_ADMIN_ROLES constants per file for clear role differentiation"
  - "params destructured via await params (Next.js 15 async params pattern)"

requirements-completed:
  - REQ-14-01
  - REQ-14-02

# Metrics
duration: 5min
completed: 2026-03-04
---

# Phase 14 Plan 02: Announcement and Poll API Routes Summary

**5 API route files implementing announcement CRUD with org-wide BullMQ email dispatch and poll CRUD with upsert-based one-vote-per-employee voting**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-04T06:00:24Z
- **Completed:** 2026-03-04T06:05:30Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments

- Announcement API (2 files): GET lists non-archived, POST creates and queues org-wide email to all ACTIVE employees via addEmailJob, PATCH archives, DELETE permanently removes — all with RBAC
- Poll API (3 files): GET lists active polls with per-option vote counts merged with current user's vote, POST creates with nested options, GET detail includes votes, PATCH closes — all with cache invalidation
- Vote endpoint: POST uses `prisma.pollResponse.upsert` with the `poll_id_employee_id` unique constraint; changing vote updates option_id rather than creating duplicate; closes_at and is_closed both enforced

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Announcement API routes (CRUD + org-wide email)** - `d624663` (feat)
2. **Task 2: Create Poll API routes (CRUD + voting)** - `048fa69` (feat)

**Plan metadata:** (docs commit follows this summary)

## Files Created/Modified

- `src/app/api/announcements/route.ts` — GET (list active, take 10) and POST (create + queue email via Promise.all) endpoints
- `src/app/api/announcements/[id]/route.ts` — PATCH (archive/unarchive, ADMIN/SUPER_ADMIN/HR_MANAGER) and DELETE (ADMIN/SUPER_ADMIN only) endpoints
- `src/app/api/polls/route.ts` — GET (list active with vote counts + myVote) and POST (create with nested options) endpoints
- `src/app/api/polls/[id]/route.ts` — GET (detail with results + myVote) and PATCH (close/reopen) endpoints
- `src/app/api/polls/[id]/vote/route.ts` — POST (upsert vote with poll/option validation and closes_at check) endpoint

## Decisions Made

- HR_MANAGER included in ADMIN_ROLES for announcement/poll management (archive, create, close) — consistent with other management APIs in the system
- DELETE announcement restricted to ADMIN/SUPER_ADMIN only — permanent deletes are more destructive than archive
- myVote merged via a single batch query (`pollResponse.findMany` with `poll_id: { in: pollIds }`) rather than per-poll subqueries to avoid N+1
- No PII exposed in any response — only `author: { name }` returned, no email addresses or encrypted fields
- `closes_at` check enforced at vote time: both `poll.is_closed` flag and time-based check (`closes_at < now`) prevent late votes
- Email delivery filters by `employment_status: ACTIVE` AND `user != null` since not all employees have login accounts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compiled without errors on first attempt for all 5 files.

## User Setup Required

None - these are API routes that use existing infrastructure (Prisma, BullMQ email queue, cache). No new external services.

## Next Phase Readiness

- All 5 API endpoints are live and TypeScript-clean
- `GET /api/announcements` and `GET /api/polls` ready for dashboard widget consumption in Plan 14-03
- `POST /api/announcements` triggers org-wide email via BullMQ (requires email worker running)
- Vote upsert pattern confirmed working against PollResponse unique constraint
- Plan 14-03 (dashboard UI) can proceed immediately

---
*Phase: 14-admin-dashboard*
*Completed: 2026-03-04*
