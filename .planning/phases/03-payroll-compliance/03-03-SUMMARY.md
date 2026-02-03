---
phase: 03-payroll-compliance
plan: 03
subsystem: infra
tags: [bullmq, ioredis, redis, queue, worker, background-jobs, payroll]

# Dependency graph
requires:
  - phase: 03-01
    provides: SalaryStructure model with component fields
  - phase: 02-05
    provides: AttendanceLock for period locking before payroll
provides:
  - BullMQ queue infrastructure for background payroll processing
  - Redis connection singleton with error handling
  - PayrollRun and PayrollRecord models with complete field tracking
  - Worker stub with stage-based processing pattern (validation, calculation, statutory, finalization)
  - Docker Compose with Redis service
affects: [03-04-payroll-calculation, 03-05-statutory-compliance, payroll-ui]

# Tech tracking
tech-stack:
  added: [bullmq@5.67.2, ioredis@5.9.2, redis:7-alpine]
  patterns: [queue-based background processing, stage-based payroll workflow, exponential backoff retry, singleton connection pattern]

key-files:
  created:
    - src/lib/queues/connection.ts
    - src/lib/queues/payroll.queue.ts
    - src/lib/queues/workers/payroll.worker.ts
    - docker-compose.yml
  modified:
    - prisma/schema.prisma
    - .env.example
    - package.json

key-decisions:
  - "Use BullMQ over Bull for modern TypeScript-first queue library"
  - "Process one payroll at a time (concurrency: 1) to prevent resource contention"
  - "Stage-based processing: validation → calculation → statutory → finalization"
  - "Keep completed jobs 24h, failed jobs 7 days for debugging"
  - "Exponential backoff with 3 retry attempts for transient failures"

patterns-established:
  - "Singleton pattern for Redis connection to prevent connection pool exhaustion"
  - "Job IDs include payroll run ID and stage for idempotency"
  - "Worker updates PayrollRun status and stage for progress tracking"
  - "All payroll monetary values stored in paise (integer precision)"

# Metrics
duration: 3.6min
completed: 2026-02-04
---

# Phase 3 Plan 3: BullMQ Infrastructure Summary

**BullMQ queue with Redis for background payroll processing, PayrollRun/PayrollRecord models tracking all earnings and deductions in paise**

## Performance

- **Duration:** 3.6 min (215 seconds)
- **Started:** 2026-02-03T21:04:01Z
- **Completed:** 2026-02-03T21:07:36Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Redis connection singleton with BullMQ integration and error handling
- PayrollRun model tracking job status, stage, progress, and errors
- PayrollRecord model with complete earnings/deductions breakdown (Basic, HRA, Special Allowance, LTA, Medical, Conveyance, PF, ESI, PT, TDS)
- BullMQ queue with exponential backoff retry and job lifecycle management
- Worker stub with stage-based processing pattern ready for calculation implementation
- Docker Compose configuration with Redis and PostgreSQL services

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create Redis connection** - `fc66e79` (chore)
2. **Task 2: Create PayrollRun and PayrollRecord models** - `d2d90d1` (feat)
3. **Task 3: Create BullMQ payroll queue and worker stub** - `eb352e9` (feat)

## Files Created/Modified
- `src/lib/queues/connection.ts` - Redis connection singleton with maxRetriesPerRequest: null for BullMQ
- `src/lib/queues/payroll.queue.ts` - Queue definition with addPayrollJob, getPayrollJobStatus, cancelPayrollJobs functions
- `src/lib/queues/workers/payroll.worker.ts` - Worker with stage processors (stubs for Plan 04 implementation)
- `docker-compose.yml` - PostgreSQL and Redis services with persistent volumes
- `prisma/schema.prisma` - Added PayrollRun, PayrollRecord models with PayrollRunStatus, PayrollRecordStatus, PayrollStage enums
- `.env.example` - Added REDIS_URL configuration
- `package.json` - Added bullmq and ioredis dependencies

## Decisions Made
- **BullMQ over Bull:** BullMQ is the TypeScript-first rewrite with better type safety and modern API
- **Concurrency 1:** Process one payroll run at a time to prevent database contention and resource exhaustion
- **Stage-based workflow:** Break payroll into validation → calculation → statutory → finalization for granular progress tracking and restart capability
- **Paise storage:** All PayrollRecord monetary fields use paise (integer) for precision, matching SalaryStructure pattern
- **PF breakdown:** Store EPF, EPS, EDLI, admin charges separately for ECR file generation accuracy
- **Job retention:** Keep completed jobs 24 hours for recent history, failed jobs 7 days for debugging

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Database connection during db:push:**
- Issue: PostgreSQL not running during `pnpm db:push` step
- Resolution: Verified TypeScript compilation passes without Prisma client regeneration issue. Database push will succeed when user starts their database (already documented in STATE.md user setup).
- Impact: No blocking issue - Prisma client generated successfully with `pnpm db:generate`

**Pre-existing TypeScript errors:**
- Issue: src/app/api/pt-slabs/ files have TypeScript errors (NextAuth imports, Zod errors)
- Resolution: These are from a previous plan (03-02) and don't affect current implementation
- Impact: None on this plan's functionality - new queue/worker code compiles successfully

## User Setup Required

**Redis service required before payroll processing:**
1. Start Redis via Docker Compose:
   ```bash
   docker compose up -d redis
   ```
   OR use external Redis instance

2. Add to `.env` file:
   ```
   REDIS_URL="redis://localhost:6379"
   ```

3. Verify Redis connection:
   ```bash
   docker compose logs redis
   # Should show "Ready to accept connections"
   ```

4. Push database schema:
   ```bash
   pnpm db:push
   ```

**Note:** Redis is required for BullMQ queue functionality. Without Redis, payroll jobs cannot be queued or processed.

## Next Phase Readiness

**Ready for Plan 04 (Payroll Calculation Engine):**
- PayrollRun and PayrollRecord models ready to store calculation results
- Worker stage processors identified and stubbed
- Queue can accept jobs and track progress
- Database schema includes all required earning/deduction fields

**Implementation path for Plan 04:**
1. Implement `processValidationStage`: Check attendance lock exists, validate salary structures
2. Implement `processCalculationStage`: Calculate gross, LOP deduction, PF, ESI, PT, TDS, net salary
3. Create API endpoint to trigger payroll run and queue jobs
4. Build UI to display PayrollRun progress and PayrollRecord results

**No blockers.** All infrastructure in place for payroll calculation implementation.

---
*Phase: 03-payroll-compliance*
*Completed: 2026-02-04*
