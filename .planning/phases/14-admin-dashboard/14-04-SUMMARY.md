---
phase: 14-admin-dashboard
plan: 04
subsystem: ui
tags: [nextjs, react, tailwind, date-fns, lucide-react, prisma, server-component, client-component, rbac]

# Dependency graph
requires:
  - phase: 14-admin-dashboard
    plan: 01
    provides: getCachedActiveAnnouncements, getCachedActivePolls, getCachedPendingActionCounts from cache.ts
  - phase: 14-admin-dashboard
    plan: 02
    provides: POST /api/announcements, POST /api/polls, POST /api/polls/[id]/vote endpoints consumed by client widgets
  - phase: 14-admin-dashboard
    plan: 03
    provides: getUpcomingBirthdays, getUpcomingAnniversaries pure functions, GET /api/dashboard/pending-actions

provides:
  - AnnouncementsWidget: client component with post form (admin) and read-only feed with truncation and relative time
  - PollsWidget: client component with poll creation form, radio vote UI, progress bar results
  - BirthdaysWidget: server-renderable component showing upcoming birthdays and work anniversaries with day counts
  - PendingActionsWidget: server-renderable component with summary count cards (linked) and recent items list
  - Redesigned src/app/dashboard/page.tsx: server component composing all 4 widgets with parallel data fetch

affects:
  - 14-05 (employee dashboard will use BirthdaysWidget and PollsWidget patterns)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client widget pattern: 'use client', useState for form toggle, fetch to API, router.refresh() to revalidate server data"
    - "Server component data fetch: parallel Promise.all across cached queries + one Prisma query for employees"
    - "myVote lookup: separate prisma.pollResponse.findMany after cached polls to merge per-user votes"
    - "Pending items normalized: API's meta shape converted to { title, employeeName, type, createdAt } for widget"
    - "Pure function reuse: getUpcomingBirthdays/getUpcomingAnniversaries called directly in dashboard page"

key-files:
  created:
    - src/components/dashboard/announcements-widget.tsx
    - src/components/dashboard/polls-widget.tsx
    - src/components/dashboard/birthdays-widget.tsx
    - src/components/dashboard/pending-actions-widget.tsx
  modified:
    - src/app/dashboard/page.tsx

key-decisions:
  - "myVote fetched after cached polls via separate Prisma query — cache cannot be user-personalized"
  - "Pending items shaped inline in dashboard page (title string) rather than using raw API meta shape"
  - "Quick actions show exactly 5 links (REQ-14-06): Run Payroll, Add Employee, View Approvals, Post Policy, View Reports"
  - "Non-admin users see announcements/polls/birthdays only — PendingActionsWidget hidden with isAdmin guard"
  - "redirect('/login') on unauthenticated session (was return null in old dashboard)"
  - "BirthdaysWidget and PendingActionsWidget are server-renderable (no 'use client') — data passed as props from server page"
  - "AnnouncementsWidget and PollsWidget use 'use client' for interactive forms and vote UI"

patterns-established:
  - "Widget data flow: server page fetches → passes as props → client widget uses router.refresh() for mutations"
  - "Progress bar without chart library: plain div with dynamic style={{ width: `${pct}%` }}"

requirements-completed:
  - REQ-14-01
  - REQ-14-02
  - REQ-14-03
  - REQ-14-04
  - REQ-14-05
  - REQ-14-06

# Metrics
duration: 6min
completed: 2026-03-04
---

# Phase 14 Plan 04: Admin Dashboard Widget Components and Page Redesign Summary

**4 React widget components (announcements post/read, poll create/vote/results, birthdays/anniversaries, pending actions inbox) composing into a redesigned 2-column admin dashboard server page with parallel data fetch and per-user vote tracking**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-04T06:11:02Z
- **Completed:** 2026-03-04T06:17:27Z
- **Tasks:** 2
- **Files modified:** 5 (4 created, 1 replaced)

## Accomplishments

- Created 4 self-contained widget components: announcements (client, post form + feed), polls (client, creation + voting + progress bar results), birthdays (server-renderable, two sections), pending-actions (server-renderable, count summary cards + recent items list)
- Replaced the bare-bones 3-card dashboard with a feature-rich server page that: fetches all data in parallel, merges per-user myVote into cached polls, fetches top-5 pending items for admin, calculates birthdays/anniversaries via pure functions, renders 5 quick action buttons, and composes all 4 widgets in a responsive two-column grid
- All client widgets follow the pattern: useState toggle for forms, fetch to API endpoints from Plan 14-02/14-03, router.refresh() to revalidate server-side data after mutations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dashboard widget components (announcements, polls, birthdays, pending actions)** - `1c95de2` (feat)
2. **Task 2: Redesign admin dashboard page composing all widgets** - `dd74a1d` (feat)

## Files Created/Modified

- `src/components/dashboard/announcements-widget.tsx` — Client widget: togglable post form (admin), scrollable feed with truncation at 200 chars and "Read more", formatDistanceToNow relative time
- `src/components/dashboard/polls-widget.tsx` — Client widget: poll creation with dynamic option list (2-10 options), radio vote form, progress bar results highlighting user's vote
- `src/components/dashboard/birthdays-widget.tsx` — Server-renderable widget: two sections (birthdays with Cake icon, anniversaries with Trophy icon), "Today!" for daysUntil=0, year badge on anniversaries
- `src/components/dashboard/pending-actions-widget.tsx` — Server-renderable widget: 4 linked summary count cards (Leave/Expenses/Profile/Corrections), recent 5 items with type badge and relative time
- `src/app/dashboard/page.tsx` — Complete rewrite: parallel Promise.all fetch, myVote per-user lookup, pending items normalized, 3-card metrics row, 5 quick action buttons, 2-column lg:grid-cols-2 widget grid

## Decisions Made

- **myVote after cached polls:** `getCachedActivePolls()` returns shared cache with no user context. A separate `prisma.pollResponse.findMany` keyed by `session.user.id` merges myVote into each poll object. This is the correct pattern for personalized data with shared cache.
- **Pending items shaped in page, not widget:** The `PendingActionsWidget` accepts `{ title, employeeName, type, createdAt }` (simple strings). The dashboard page converts `meta.leaveType` and `meta.description` into `title`. This keeps the widget props clean and reusable.
- **Exactly 5 quick actions (REQ-14-06):** Run Payroll, Add Employee, View Approvals, Post Policy, View Reports — chosen as highest-frequency admin actions.
- **redirect('/login') replacing return null:** Consistent with other protected pages in the codebase, uses Next.js redirect for cleaner auth guard.
- **BirthdaysWidget server-renderable:** No interactivity needed, so no 'use client' directive — keeps bundle smaller and SSR-friendly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compiled without errors for all 5 files.

## User Setup Required

None - uses existing infrastructure (Prisma, Next.js server components, BullMQ email via existing workers). No new external services.

## Next Phase Readiness

- All 4 widget components available for reuse in Plan 14-05 (employee dashboard)
- Dashboard page at `/dashboard` now feature-rich and ready for demo/production use
- Announcement post and poll create flows require email worker for notification delivery (existing setup)
- Plan 14-05 can proceed immediately using the same widget pattern

---
*Phase: 14-admin-dashboard*
*Completed: 2026-03-04*
