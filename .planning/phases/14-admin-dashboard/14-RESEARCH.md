# Phase 14: Admin Dashboard - Research

**Researched:** 2026-03-04
**Domain:** Dashboard redesign with real-time features, announcements, polls, birthday/anniversary tracking, pending actions inbox, and employee quick check-in
**Confidence:** HIGH (deep codebase knowledge, established patterns throughout Phases 1-6)

---

## Summary

Phase 14 redesigns two separate dashboards: the **admin dashboard** (`/dashboard`) for HR/admin roles and the **employee dashboard** (`/employee/dashboard`) for rank-and-file employees. The existing admin dashboard is a bare-bones 3-card summary (employee count, departments, documents). The existing employee dashboard shows leave balances, last payslip, and quick action links. Both need substantial feature additions.

The core challenge is delivering seven discrete feature areas — announcements with org-wide email, polls with real-time results, birthday/anniversary detection and notifications, unified pending actions inbox, summary-only admin view, a 5-action cap on UI, and employee quick check-in — across two role-based dashboard surfaces, all using established patterns from prior phases.

The project already has every required infrastructure layer: BullMQ + Resend for email (Phase 4), attendance check-in/check-out APIs (Phase 2), a robust pending-approvals query pattern (Phase 5), `unstable_cache` with tag invalidation (caching layer), and a consistent server-component + client-component split pattern. The required new database models are Announcement, Poll+PollOption+PollResponse, and optionally a BirthdayAlert tracking table. Birthday/anniversary data already exists on the Employee model (`date_of_birth`, `date_of_joining`).

**Primary recommendation:** Add 3 new Prisma models (Announcement, Poll/PollOption/PollResponse), query existing Employee fields for birthday/anniversary logic, extend the existing approvals/pending-actions API, and keep the UI as pure Tailwind + existing shadcn components — no new UI framework needed.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-14-01 | Admin can post announcements that appear on dashboard AND trigger org-wide email | New Announcement model + existing addEmailJob + new email template + new dashboard widget |
| REQ-14-02 | Admin can create polls (e.g., shift holiday dates) visible to all with instant results | New Poll/PollOption/PollResponse models + Server Actions or API route + polling UI widget |
| REQ-14-03 | Dashboard shows upcoming birthdays and work anniversaries with org-wide email notifications | Query Employee.date_of_birth + Employee.date_of_joining with window arithmetic; cron-triggered email for notifications |
| REQ-14-04 | Unified pending actions section shows leave requests, expense approvals, and other actionable items | Extend existing /api/dashboard pattern; query LeaveRequest, ExpenseClaim, ProfileUpdateRequest with status=PENDING |
| REQ-14-05 | Dashboard is summary-only view — no employee personal data, just metrics and numbers | Aggregate counts only; never expose individual PII fields in dashboard APIs |
| REQ-14-06 | Max 5 core action buttons visible to avoid UI clutter | UI constraint: render at most 5 quick-action cards; priority-ordered list in component |
| REQ-14-07 | Employees can quick check-in for attendance directly from their dashboard | Reuse existing POST /api/attendance check-in logic; embed check-in/check-out button widget in /employee/dashboard |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma 7 | ^7.3.0 | New Announcement, Poll models | Already in use; snake_case schema convention |
| Next.js 16 | ^16.1.6 | Server components for dashboard pages | Already in use; app router with route groups |
| BullMQ | ^5.67.2 | Queue org-wide emails for announcements/birthday notifications | Already in use via `addEmailJob` |
| Resend | ^6.9.1 | Send transactional emails | Already in use; RESEND_API_KEY in .env |
| date-fns | ^4.1.0 | Birthday/anniversary window calculations | Already in use throughout codebase |
| Tailwind CSS 4 | ^4.1.18 | All UI styling | Already in use |
| lucide-react | ^0.563.0 | Icons for dashboard widgets | Already in use (megaphone, vote, cake, inbox icons available) |
| react-hook-form + zod | ^7.71.1 / ^4.3.6 | Announcement/poll creation forms | Already in use |
| `unstable_cache` / `revalidateTag` | Next.js built-in | Cache dashboard queries with tag invalidation | Already in `src/lib/cache.ts` |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | ^1.1.15 | Modal for announcement/poll creation | Already installed; use for creation forms overlay |
| @radix-ui/react-select | ^2.2.6 | Poll option dropdowns | Already installed |
| class-variance-authority | ^0.7.1 | Badge variants for poll results, pending action priority | Already installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| setInterval polling for poll results | WebSocket / Server-Sent Events | SSE/WS adds complexity (server infra, edge compatibility); setInterval every 30s is sufficient for a 20-person org |
| Cron-based birthday email | BullMQ delayed jobs | Delayed jobs require calculating exact fire time per employee; cron calling a batch query is simpler and already established in the codebase |
| New chart library for poll results | Plain progress bars | A poll with 3-5 options and 20 voters needs no chart library — `<div style={{width: pct%}}>` is sufficient and already used in leave balance cards |

**Installation:** No new packages required. All dependencies are already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

```
prisma/schema.prisma                        # Add Announcement, Poll, PollOption, PollResponse models

src/app/api/
├── announcements/
│   ├── route.ts                            # GET (list active), POST (create + queue email)
│   └── [id]/route.ts                       # PATCH (edit/archive), DELETE
├── polls/
│   ├── route.ts                            # GET (active polls + results), POST (create)
│   └── [id]/
│       ├── route.ts                        # GET (detail + results), PATCH (close), DELETE
│       └── vote/route.ts                   # POST (cast vote)
├── dashboard/
│   ├── pending-actions/route.ts            # GET (unified inbox: leave + expenses + corrections)
│   ├── birthdays/route.ts                  # GET (upcoming birthdays + anniversaries, window=30 days)
│   └── statutory/route.ts                 # Already exists - no change
└── cron/
    └── birthday-notifications/route.ts     # GET (called daily, sends org-wide birthday/anniversary emails)

src/lib/email/templates/
├── announcement-notification.ts            # New: org-wide announcement email
└── birthday-notification.ts               # New: birthday/anniversary digest email

src/components/dashboard/
├── announcements-widget.tsx                # Admin: post form + list; Employee: read-only feed
├── polls-widget.tsx                        # Create/vote/results (role-aware rendering)
├── birthdays-widget.tsx                    # Upcoming birthdays + work anniversaries list
├── pending-actions-widget.tsx              # Unified inbox with approve/reject shortcuts
└── quick-checkin-widget.tsx               # Employee-only: check-in/check-out button

src/app/dashboard/page.tsx                  # Redesigned admin dashboard (replace existing)
src/app/employee/dashboard/page.tsx         # Redesigned employee dashboard (extend existing)
```

### Pattern 1: Server Component Data Fetching with Tag-Based Cache Invalidation

**What:** Dashboard pages are Next.js server components that call cached Prisma queries. Cache tags are invalidated on mutations.

**When to use:** All dashboard aggregate data (announcement list, pending counts, birthday window).

**Example:**
```typescript
// src/lib/cache.ts — extend with new cache functions
export const getCachedActiveAnnouncements = unstable_cache(
  async () => {
    return prisma.announcement.findMany({
      where: { is_archived: false },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        created_at: true,
        author: { select: { name: true } },
      },
    });
  },
  ['announcements-active'],
  { revalidate: 300, tags: ['announcements'] } // 5 min TTL
);

export function invalidateAnnouncements() {
  revalidateTag('announcements', { expire: 0 });
}
```

### Pattern 2: Action-Based API (PATCH with action enum)

**What:** Already established in Phase 5 (expenses, loans, onboarding). Polls follow the same pattern.

**When to use:** State transitions on polls (open → closed), announcements (active → archived).

**Example:**
```typescript
// POST /api/polls/[id]/vote
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.employeeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { optionId } = await request.json();

  // Upsert: one vote per employee per poll
  const vote = await prisma.pollResponse.upsert({
    where: {
      poll_id_employee_id: {
        poll_id: params.id,
        employee_id: session.user.employeeId,
      },
    },
    update: { option_id: optionId },
    create: {
      poll_id: params.id,
      employee_id: session.user.employeeId,
      option_id: optionId,
    },
  });

  return NextResponse.json({ success: true, vote });
}
```

### Pattern 3: Birthday/Anniversary Window Query (No New Model Required)

**What:** Query existing Employee table for employees whose birthday (month+day) or work anniversary falls within the next N days. PostgreSQL `EXTRACT` functions handle month/day comparison.

**When to use:** Dashboard widget and cron-based notifications.

**Example:**
```typescript
// src/app/api/dashboard/birthdays/route.ts
export async function GET() {
  const session = await auth();
  // ... RBAC check ...

  const today = new Date();
  const windowDays = 30;

  // Use raw query for month/day extraction (Prisma doesn't abstract this well)
  const upcomingBirthdays = await prisma.$queryRaw<Array<{
    id: string; first_name: string; last_name: string;
    date_of_birth: Date; days_until: number;
  }>>`
    SELECT id, first_name, last_name, date_of_birth,
      CASE
        WHEN (MAKE_DATE(EXTRACT(YEAR FROM NOW())::INT, EXTRACT(MONTH FROM date_of_birth)::INT, EXTRACT(DAY FROM date_of_birth)::INT) >= CURRENT_DATE)
        THEN MAKE_DATE(EXTRACT(YEAR FROM NOW())::INT, EXTRACT(MONTH FROM date_of_birth)::INT, EXTRACT(DAY FROM date_of_birth)::INT) - CURRENT_DATE
        ELSE MAKE_DATE(EXTRACT(YEAR FROM NOW())::INT + 1, EXTRACT(MONTH FROM date_of_birth)::INT, EXTRACT(DAY FROM date_of_birth)::INT) - CURRENT_DATE
      END AS days_until
    FROM employees
    WHERE employment_status = 'ACTIVE'
    HAVING days_until <= ${windowDays}
    ORDER BY days_until ASC
  `;

  // Similar query for work anniversaries using date_of_joining
  // ...

  return NextResponse.json({ birthdays: upcomingBirthdays, anniversaries: upcomingAnniversaries });
}
```

**Alternative (simpler, avoids raw SQL):** Fetch all active employees' `date_of_birth` and `date_of_joining`, compute in TypeScript using `date-fns`. For 20 employees this is perfectly adequate:

```typescript
import { getDayOfYear, addDays } from 'date-fns';

const employees = await prisma.employee.findMany({
  where: { employment_status: 'ACTIVE' },
  select: { id: true, first_name: true, last_name: true, date_of_birth: true, date_of_joining: true },
});

const today = new Date();
const windowEnd = addDays(today, 30);

const upcomingBirthdays = employees.filter(e => {
  const bday = new Date(e.date_of_birth);
  const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
  return thisYearBday >= today && thisYearBday <= windowEnd;
});
```

**Confidence:** HIGH - both approaches work. The TypeScript approach is recommended for a 20-person org.

### Pattern 4: Unified Pending Actions API

**What:** Single API endpoint that aggregates counts and items from multiple pending-action sources. Already partially exists in `/api/dashboard/statutory/`.

**Example:**
```typescript
// src/app/api/dashboard/pending-actions/route.ts
export async function GET() {
  const [leaveCount, expenseCount, profileCount, correctionCount] = await Promise.all([
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.expenseClaim.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.profileUpdateRequest.count({ where: { status: 'PENDING' } }),
    prisma.attendanceCorrection.count({ where: { status: 'PENDING' } }),
  ]);

  const leaveItems = await prisma.leaveRequest.findMany({
    where: { status: 'PENDING' },
    take: 5,
    orderBy: { created_at: 'asc' },
    include: { employee: { select: { first_name: true, last_name: true } } },
  });

  // ... similar for expenses ...

  return NextResponse.json({
    summary: { leave: leaveCount, expense: expenseCount, profile: profileCount, correction: correctionCount },
    items: [...leaveItems, ...expenseItems].sort(/* by created_at */),
  });
}
```

### Pattern 5: Org-Wide Email Dispatch via BullMQ

**What:** When an announcement is posted, query all active employees' email addresses and queue one email job per recipient using the existing `addEmailJob` helper.

**Example:**
```typescript
// In POST /api/announcements handler
const employees = await prisma.employee.findMany({
  where: { employment_status: 'ACTIVE' },
  include: { user: { select: { email: true } } },
});

const emailPromises = employees
  .filter(e => e.user?.email)
  .map(e => addEmailJob('announcement-notification', e.user!.email, {
    employeeName: e.first_name,
    title: announcement.title,
    content: announcement.content,
    postedBy: session.user.name,
  }));

await Promise.all(emailPromises);
```

**Confidence:** HIGH - this is exactly how payslip batch emails work in Phase 4 Plan 04-01.

### Pattern 6: Employee Quick Check-In Widget (Reusing Phase 2 API)

**What:** The check-in/check-out button on the employee dashboard calls the same `POST /api/attendance` endpoint used in the attendance page. The widget detects current-day attendance status to show the correct button (Check In vs Check Out).

**Example:**
```typescript
// src/components/dashboard/quick-checkin-widget.tsx
'use client';

import { useState } from 'react';

interface Props {
  todayAttendance: { check_in: string | null; check_out: string | null } | null;
}

export function QuickCheckinWidget({ todayAttendance }: Props) {
  const [status, setStatus] = useState(todayAttendance);

  const handleCheckIn = async () => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ action: 'check-in' }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) setStatus(await res.json());
  };

  if (!status?.check_in) {
    return <button onClick={handleCheckIn}>Check In</button>;
  }
  if (!status?.check_out) {
    return <button onClick={handleCheckOut}>Check Out</button>;
  }
  return <div>Attendance recorded for today</div>;
}
```

Note: The existing `/api/attendance` POST route handles check-in. Verify the exact request body format — the Phase 2 implementation uses `{ action: 'check-in' | 'check-out' }` or may require `date`. Read `src/app/api/attendance/route.ts` POST handler before implementing.

### Anti-Patterns to Avoid

- **Fetching PII in dashboard APIs:** Dashboard must return aggregates only. Never include `pan_encrypted`, `aadhaar_encrypted`, `bank_account_encrypted`, or even decrypted salary amounts in dashboard widgets. Use count queries and first_name/last_name only.
- **Blocking email sends on request:** Always use `addEmailJob` (async BullMQ queue), never `await resend.emails.send()` inside a POST handler. The payslip notification code demonstrates the correct pattern.
- **Loading full employee list for counts:** Use `prisma.model.count()` not `findMany().length` for summary metrics.
- **Multiple polls per employee per vote:** Use Prisma `upsert` with unique constraint on `(poll_id, employee_id)` to prevent duplicate votes.
- **Real-time poll results without polling:** Use `setInterval(fetch, 30000)` for results refresh — this is the same pattern used in the payroll run progress page (`/dashboard/payroll/[runId]`). No WebSocket needed for a 20-person org.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery with retries | Custom retry logic | BullMQ `addEmailJob` with `attempts: 3` | Already built in Phase 4; handles exponential backoff |
| Birthday date math | Custom day-of-year comparison | `date-fns` `getMonth`/`getDate` comparison | Handles leap years, year boundaries |
| Cache invalidation | Manual cache busting via query params | `revalidateTag` + `unstable_cache` | Already established in `src/lib/cache.ts` |
| Poll vote deduplication | Application-level check | Prisma unique constraint on `(poll_id, employee_id)` | Database-level guarantee, survives race conditions |
| Org-wide email list | Custom employee table query | `prisma.employee.findMany({ where: { employment_status: 'ACTIVE' } })` | Already established pattern |
| Role-based UI hiding | Multiple dashboard pages per role | Single page with conditional rendering based on `session.user.role` | Consistent with existing approvals page pattern |

**Key insight:** All infrastructure (email, queuing, caching, auth, RBAC) is fully operational. Phase 14 is almost entirely a database schema + UI layer task.

---

## Common Pitfalls

### Pitfall 1: Birthday Query Wrapping Past December 31

**What goes wrong:** When checking "upcoming birthdays in the next 30 days" and today is December 20, employees born in early January are missed because the birthday hasn't happened "yet" this year.

**Why it happens:** Naive comparison `bday.setFullYear(currentYear) >= today` without year-rollover handling.

**How to avoid:** After setting the birthday to the current year, check if it's already passed. If so, set to next year before comparing.

```typescript
const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
if (thisYearBday < today) {
  thisYearBday.setFullYear(today.getFullYear() + 1);
}
return thisYearBday >= today && thisYearBday <= windowEnd;
```

**Warning signs:** Zero birthday results in December/January months.

---

### Pitfall 2: Org-Wide Email Blocks When Email Worker is Down

**What goes wrong:** If the BullMQ email worker is not running, announcement emails silently queue but never send.

**Why it happens:** The system correctly enqueues via `addEmailJob`, but nobody reads the queue.

**How to avoid:** This is a known operational dependency (documented in STATE.md under "Pending Todos"). The announcement API response should include the queued job count so admins can see the emails were queued. No code fix needed — just document the worker startup requirement in the plan.

---

### Pitfall 3: Pending Actions Widget Shows Wrong Data Per Role

**What goes wrong:** Admins see all pending items; managers should only see their team's pending items. Using a single "admin-only" query exposes org-wide data to HR managers who should only see their reports.

**Why it happens:** Forgetting to apply RBAC filtering (the same `reporting_manager_id` pattern used in attendance and expense APIs).

**How to avoid:** Apply the same RBAC pattern from `/api/attendance` (managers see only `reporting_manager_id` subordinates). Use the `EMPLOYEE` check from Phase 5 expense workflow routing.

---

### Pitfall 4: Poll Results Race Condition on Vote Submit

**What goes wrong:** Two employees vote simultaneously; both see their vote accepted, but the count is only incremented once.

**Why it happens:** Application-level count calculation without database transaction.

**How to avoid:** Use Prisma `upsert` with a unique constraint on `(poll_id, employee_id)`. Calculate results from a COUNT query at read time, not by caching a vote total.

---

### Pitfall 5: Check-In Widget Double-Submits on Slow Networks

**What goes wrong:** Employee taps "Check In" twice on a slow mobile connection; two attendance records are attempted, second one fails with a unique constraint error.

**Why it happens:** No optimistic UI state / loading state.

**How to avoid:** Disable the button immediately on click and show a spinner. The attendance model already has `@@unique([employee_id, date])` so the database will reject duplicates, but the UI should prevent a confusing error state.

---

### Pitfall 6: `unstable_cache` Not Invalidated After Announcement Post

**What goes wrong:** Admin posts announcement; other users see stale dashboard for up to 5 minutes.

**Why it happens:** Forgetting to call `revalidateTag('announcements', { expire: 0 })` in the POST handler.

**How to avoid:** Follow the same pattern as `invalidateDashboard()` in `src/lib/cache.ts`. Add `invalidateAnnouncements()` to cache.ts and call it at the end of the POST announcement handler.

---

## Code Examples

### Prisma Schema: New Models

```prisma
// Announcement model
model Announcement {
  id          String   @id @default(cuid())
  title       String
  content     String   // Plain text or Markdown
  is_archived Boolean  @default(false)

  // Who posted it
  created_by  String
  author      User     @relation("AnnouncementCreatedBy", fields: [created_by], references: [id])

  // Audit
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@map("announcements")
}

// Poll with options and responses
model Poll {
  id          String       @id @default(cuid())
  title       String
  description String?
  is_closed   Boolean      @default(false)
  closes_at   DateTime?    // Optional deadline

  created_by  String
  author      User         @relation("PollCreatedBy", fields: [created_by], references: [id])

  options     PollOption[]
  responses   PollResponse[]

  created_at  DateTime     @default(now())
  updated_at  DateTime     @updatedAt

  @@map("polls")
}

model PollOption {
  id        String         @id @default(cuid())
  poll_id   String
  poll      Poll           @relation(fields: [poll_id], references: [id], onDelete: Cascade)
  label     String
  order     Int            @default(0)

  responses PollResponse[]

  @@map("poll_options")
}

model PollResponse {
  id          String   @id @default(cuid())
  poll_id     String
  poll        Poll     @relation(fields: [poll_id], references: [id], onDelete: Cascade)
  option_id   String
  option      PollOption @relation(fields: [option_id], references: [id])
  employee_id String
  employee    Employee @relation(fields: [employee_id], references: [id])

  created_at  DateTime @default(now())

  @@unique([poll_id, employee_id])  // One vote per employee per poll
  @@map("poll_responses")
}
```

Also add relations on User (`announcements`, `polls`) and Employee (`poll_responses`).

---

### Cache Helper for Dashboard

```typescript
// Extend src/lib/cache.ts

export const getCachedActiveAnnouncements = unstable_cache(
  async () => {
    return prisma.announcement.findMany({
      where: { is_archived: false },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true, title: true, content: true, created_at: true,
        author: { select: { name: true } },
      },
    });
  },
  ['announcements-active'],
  { revalidate: 300, tags: ['announcements'] }
);

export const getCachedActivePolls = unstable_cache(
  async () => {
    return prisma.poll.findMany({
      where: { is_closed: false },
      include: {
        options: { include: { _count: { select: { responses: true } } } },
        _count: { select: { responses: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  },
  ['polls-active'],
  { revalidate: 60, tags: ['polls'] } // 1 min TTL for polls (votes change frequently)
);

export function invalidateAnnouncements() {
  revalidateTag('announcements', { expire: 0 });
}

export function invalidatePolls() {
  revalidateTag('polls', { expire: 0 });
}
```

---

### Announcement Email Template Pattern (following existing template structure)

```typescript
// src/lib/email/templates/announcement-notification.ts
interface AnnouncementNotificationData {
  employeeName: string;
  title: string;
  content: string;
  postedBy: string;
  dashboardUrl: string;
}

export function announcementNotificationTemplate(data: AnnouncementNotificationData): EmailTemplate {
  const { employeeName, title, content, postedBy, dashboardUrl } = data;
  return {
    subject: `[ShreeHR Announcement] ${title}`,
    html: `<!-- styled HTML, following payslip-notification.ts pattern -->`,
    text: `ShreeHR Announcement\n\n${title}\n\n${content}\n\nPosted by: ${postedBy}\n\nView dashboard: ${dashboardUrl}`,
  };
}
```

Register in `src/lib/email/templates/index.ts` under the key `'announcement-notification'`.

---

### Birthday Cron Route Pattern (following existing cron pattern)

```typescript
// src/app/api/cron/birthday-notifications/route.ts
// Called daily at 9 AM via vercel.json cron config

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  // Find employees whose birthday or anniversary is TODAY
  const employees = await prisma.employee.findMany({
    where: { employment_status: 'ACTIVE' },
    select: { id: true, first_name: true, last_name: true,
              date_of_birth: true, date_of_joining: true,
              user: { select: { email: true } } },
  });

  const birthdays = employees.filter(e => {
    const b = new Date(e.date_of_birth);
    return b.getMonth() === today.getMonth() && b.getDate() === today.getDate();
  });

  const anniversaries = employees.filter(e => {
    const j = new Date(e.date_of_joining);
    return j.getMonth() === today.getMonth() && j.getDate() === today.getDate()
      && j.getFullYear() < today.getFullYear(); // not first day
  });

  // Queue org-wide emails for each birthday/anniversary
  // ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Admin dashboard: 3 static cards | Feature-rich dashboard with announcements, polls, inbox | Phase 14 | Replaces near-empty admin home page |
| Employee dashboard: stats + 6 link cards | Stats + check-in widget + announcements feed + polls | Phase 14 | First interactive feature on employee home |
| `getServerSession` | `auth()` from NextAuth v5 | Phase 3 | All new server components must use `auth()` |
| Direct Resend `send` | BullMQ `addEmailJob` | Phase 4 | All org-wide emails must go through queue |
| Per-module approval pages | Unified pending actions inbox | Phase 14 | Replaces navigating to multiple pages for approvals |

**Deprecated/outdated:**
- `getServerSession`: Do not use. The codebase fully uses NextAuth v5 `auth()` function.
- Direct Prisma queries in dashboard page: Cache with `unstable_cache` + `tags` for anything that doesn't change per-user.

---

## Open Questions

1. **Birthday notification: digest vs individual per-employee?**
   - What we know: Payslip notifications send one email per employee. The requirement says "org-wide email" for birthdays.
   - What's unclear: Should the org-wide email notify *everyone* that it's someone's birthday? Or just notify the birthday person? The stakeholder requirement says "dashboard + org-wide email" — this implies broadcasting to all employees.
   - Recommendation: Send a single digest email to all employees listing today's birthdays/anniversaries (e.g., "Today we celebrate: John Doe's birthday and Jane Smith's 3rd work anniversary!"). This is more practical than sending a separate email to everyone for each person.

2. **Announcement: plain text or Markdown?**
   - What we know: Policy documents use plain Markdown textarea (Phase 6, Plan 06-05: "Plain textarea for policy Markdown — no rich editor, keeps bundle small").
   - What's unclear: Whether announcements need rich text (bold, lists, links).
   - Recommendation: Follow Phase 6 pattern — plain Markdown textarea, render with simple `white-space: pre-wrap` or a lightweight Markdown renderer. No new rich text editor needed.

3. **Poll vote change: allowed or locked?**
   - What we know: Prisma `upsert` on `(poll_id, employee_id)` makes re-voting technically possible.
   - What's unclear: Business rule — can employees change their vote before the poll closes?
   - Recommendation: Allow vote changes (upsert replaces old vote). Simpler UX and implementation. Communicate this clearly in the UI ("Your vote: Option A — tap to change").

4. **Quick check-in: what is the exact POST /api/attendance request body?**
   - What we know: The attendance POST route exists at `src/app/api/attendance/route.ts`.
   - What's unclear: The exact shape of the request body for check-in vs check-out needs to be read before implementing the widget.
   - Recommendation: Read `src/app/api/attendance/route.ts` POST handler before implementing `quick-checkin-widget.tsx`. Do not guess the body shape.

5. **Max 5 action buttons: which 5 for admins vs employees?**
   - What we know: REQ-14-06 says "max 5 core action buttons". Employee dashboard already has 6 link cards.
   - What's unclear: Which 5 actions are prioritized for each role.
   - Recommendation: For employees — Apply Leave, Submit Expense, Check In, View Payslip, Ask AI. For admins — Run Payroll, Add Employee, View Pending Actions, Post Announcement, Create Poll. This can be adjusted in the plan without code rework.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) + Vitest (unit) |
| Config file | `playwright.config.ts` / `vitest.config.ts` |
| Quick run command | `pnpm test` (Vitest unit tests) |
| Full suite command | `pnpm test:all` (Vitest + Playwright) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-14-01 | Admin posts announcement, appears on dashboard | E2E smoke | `pnpm test:e2e -- --grep "announcement"` | ❌ Wave 0 |
| REQ-14-01 | Org-wide email queued after announcement creation | Unit (API route) | `pnpm test -- announcements` | ❌ Wave 0 |
| REQ-14-02 | Poll creation and vote submission | E2E smoke | `pnpm test:e2e -- --grep "poll"` | ❌ Wave 0 |
| REQ-14-02 | Poll results show correct vote counts | Unit (Prisma query) | `pnpm test -- polls` | ❌ Wave 0 |
| REQ-14-03 | Birthday window query returns correct employees | Unit (date logic) | `pnpm test -- birthday` | ❌ Wave 0 |
| REQ-14-04 | Pending actions API returns leave + expense counts | Unit (API route) | `pnpm test -- pending-actions` | ❌ Wave 0 |
| REQ-14-05 | Dashboard API never returns PII fields | Unit (API response shape) | `pnpm test -- dashboard-privacy` | ❌ Wave 0 |
| REQ-14-06 | Max 5 action buttons render on employee dashboard | E2E (component count) | `pnpm test:e2e -- --grep "quick actions"` | ❌ Wave 0 |
| REQ-14-07 | Employee can check in from dashboard | E2E smoke | `pnpm test:e2e -- --grep "check-in"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test` (Vitest unit tests, ~5 seconds)
- **Per wave merge:** `pnpm test:all`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/dashboard/birthdays.test.ts` — covers REQ-14-03 (birthday window date math)
- [ ] `src/app/api/announcements/announcements.test.ts` — covers REQ-14-01 API, REQ-14-05 no-PII
- [ ] `src/app/api/polls/polls.test.ts` — covers REQ-14-02 vote counting
- [ ] `e2e/pages/dashboard.spec.ts` — E2E smoke for REQ-14-01, 02, 06, 07
- [ ] Vitest mock for `addEmailJob` in announcement tests (avoid real BullMQ in unit tests)

---

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `prisma/schema.prisma` (all existing models, field names, conventions)
- Codebase analysis: `src/lib/cache.ts` (unstable_cache + revalidateTag patterns)
- Codebase analysis: `src/lib/email/queue.ts`, `src/lib/email/templates/index.ts` (addEmailJob, template registry pattern)
- Codebase analysis: `src/app/api/dashboard/statutory/route.ts` (dashboard API pattern with RBAC)
- Codebase analysis: `src/app/dashboard/approvals/page.tsx` (pending actions query pattern)
- Codebase analysis: `src/app/dashboard/page.tsx` (existing admin dashboard — to be replaced)
- Codebase analysis: `src/app/employee/dashboard/page.tsx` (existing employee dashboard — to be extended)
- Codebase analysis: `src/app/dashboard/layout.tsx`, `src/components/layout/sidebar.tsx` (dashboard route structure and navigation)
- `.planning/STATE.md` — All accumulated decisions from Phases 1-6
- `package.json` — All installed dependencies and versions

### Secondary (MEDIUM confidence)

- Phase 3 decision in STATE.md: "Poll every 3 seconds for PROCESSING status updates instead of WebSocket for simplicity" — informs polling strategy for poll results

### Tertiary (LOW confidence)

- None — all findings are grounded in the project's own codebase.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; no new dependencies required
- Architecture: HIGH — all patterns (BullMQ emails, cache invalidation, server components, RBAC) are already established and operational in Phases 1-6
- Pitfalls: HIGH — birthday date-wrapping and duplicate vote pitfalls are well-understood; operational email-worker pitfall is already documented in STATE.md
- Database schema: HIGH — schema follows existing Prisma conventions (snake_case, cuid IDs, audit fields, soft-delete pattern)
- Test mapping: MEDIUM — Wave 0 gaps are clear, but exact test file structure depends on planner decision

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable stack; all patterns verified against live codebase)
