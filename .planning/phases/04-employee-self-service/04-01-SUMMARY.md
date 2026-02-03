---
phase: 04-employee-self-service
plan: 01
subsystem: infra
tags: [resend, bullmq, email, notifications, queue, worker]

# Dependency graph
requires:
  - phase: 03-payroll-compliance
    provides: BullMQ infrastructure (connection, queue pattern)
provides:
  - Email notification infrastructure with Resend SDK
  - BullMQ email queue with async processing and retry logic
  - Payslip notification template with ShreeHR branding
  - Template registry for dynamic email generation
affects: [04-02-employee-portal-backend, payroll-notifications]

# Tech tracking
tech-stack:
  added: [resend@6.9.1]
  patterns:
    - Email queue pattern with template registry
    - Worker concurrency (5 emails at a time)
    - Exponential backoff retry (2s, 4s, 8s)

key-files:
  created:
    - src/lib/email/resend.ts
    - src/lib/email/queue.ts
    - src/lib/email/worker.ts
    - src/lib/email/templates/payslip-notification.ts
    - src/lib/email/templates/index.ts
  modified:
    - .env.example
    - package.json

key-decisions:
  - "Use Resend SDK over Nodemailer for better DX and webhook tracking"
  - "Worker concurrency of 5 for email sending (balance between throughput and rate limits)"
  - "24h retention for completed jobs, 7 days for failed jobs"
  - "Template registry pattern with dynamic lookup for extensibility"

patterns-established:
  - "Email templates return { subject, html, text } structure"
  - "addEmailJob helper for queue operations instead of direct queue.add"
  - "Template data passed as generic Record<string, any> for flexibility"

# Metrics
duration: 3min
completed: 2026-02-04
---

# Phase 04 Plan 01: Email Notification Infrastructure Summary

**Resend SDK integrated with BullMQ for async email delivery with retry logic and payslip notification template**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-02-04 (epoch: 1770157395)
- **Completed:** 2026-02-04 (epoch: 1770157584)
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Resend SDK integrated for transactional email delivery
- Email queue created with BullMQ using existing Redis connection
- Email worker processing 5 emails concurrently with 3 retry attempts
- Payslip notification template with responsive HTML and plain text
- Template registry for dynamic email generation by template name

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Resend email service** - `3ffabde` (feat)
2. **Task 2: Create email queue and worker** - `f98a69a` (feat)

## Files Created/Modified
- `src/lib/email/resend.ts` - Resend SDK wrapper with sendEmail function
- `src/lib/email/queue.ts` - BullMQ email queue with addEmailJob helper
- `src/lib/email/worker.ts` - Email worker with concurrency and retry configuration
- `src/lib/email/templates/payslip-notification.ts` - Payslip notification email template
- `src/lib/email/templates/index.ts` - Template registry with getTemplate lookup
- `.env.example` - Added RESEND_API_KEY and EMAIL_FROM environment variables
- `package.json` - Added resend@6.9.1 dependency

## Decisions Made

**1. Resend over Nodemailer**
- Rationale: Better TypeScript support, webhook tracking, simpler API

**2. Worker concurrency of 5**
- Rationale: Balance between throughput and avoiding rate limits
- Can be adjusted based on Resend plan limits

**3. Template registry pattern**
- Rationale: Centralized template management, easier to add new templates
- Dynamic lookup enables runtime template selection

**4. Job retention policy**
- Rationale: 24h for completed (debugging recent sends), 7 days for failed (troubleshooting)
- Prevents Redis memory bloat while maintaining useful history

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** User must:

1. **Create Resend account:**
   - Sign up at https://resend.com
   - Verify sending domain in Dashboard → Domains

2. **Add to `.env` file:**
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=noreply@shreehr.local
   ```

3. **Get API key:**
   - Resend Dashboard → API Keys → Create API Key
   - Copy key to .env file

4. **Verify configuration:**
   - Start email worker: `createEmailWorker()` in application startup
   - Send test email via `addEmailJob('payslip-notification', 'test@example.com', {...})`
   - Check Resend Dashboard → Logs for delivery status

## Next Phase Readiness

**Ready for:**
- Payslip notification sending (04-02 employee portal backend)
- Leave approval notifications (future enhancement)
- System alert emails (future enhancement)

**Pattern established:**
- Other email templates can follow payslip-notification.ts structure
- Add to templates/index.ts registry for automatic lookup
- Worker handles all retry and error logging automatically

**Dependencies satisfied:**
- BullMQ infrastructure from Phase 3 reused successfully
- Redis connection shared with payroll queue
- Email service ready for integration

---
*Phase: 04-employee-self-service*
*Completed: 2026-02-04*
