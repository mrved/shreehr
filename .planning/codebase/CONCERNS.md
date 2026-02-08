# Codebase Concerns

**Analysis Date:** 2026-02-08

## Tech Debt

**Incomplete Statutory Processing Implementation:**
- Issue: Tax calculation and statutory file generation partially implemented - only validation and calculation stages working, statutory stage stub returns empty
- Files: `src/lib/queues/workers/payroll.worker.ts` (line 391), `src/app/api/payroll/[runId]/statutory/ecr/route.ts` (line 51), `src/app/api/payroll/tds/form16/[employeeId]/route.tsx` (line 8), `src/app/api/payroll/tds/form24q/route.ts` (line 6)
- Impact: ECR and ESI challan generation blocked; hardcoded company settings prevent multi-company deployment; Form16/Form24Q company details must be updated manually
- Fix approach: Move company settings to database; implement ECR/ESI generation in payroll.worker.ts; extract company details from database during form generation

**Large Component Files:**
- Issue: Multiple files exceed 400+ lines of code with mixed concerns (form logic, validation, API calls)
- Files: `src/components/employee/investment-declaration-form.tsx` (685 lines), `src/components/employees/employee-form.tsx` (559 lines), `src/components/onboarding/onboarding-form.tsx` (429 lines), `src/components/attendance/attendance-lock-manager.tsx` (429 lines), `src/components/expenses/expense-form.tsx` (428 lines), `src/lib/payroll/calculator.ts` (343 lines)
- Impact: Difficult to test; hard to reuse logic; high maintenance burden; increased bug risk
- Fix approach: Extract validation schemas to separate files; split forms into smaller controlled components; extract calculator logic into pure functions

**TypeScript Type Safety Issues:**
- Issue: 17+ instances of `any` type usage; 10+ uses of `@ts-expect-error` and `@ts-ignore` comments
- Files: `src/app/api/attendance/route.ts`, `src/app/api/attendance/sync/route.ts`, `src/app/api/chat/route.ts`, `src/lib/queues/workers/payroll.worker.ts` (as any), `src/lib/ai/tools/index.ts` (multiple @ts-expect-error), `src/app/api/employees/[id]/route.ts`, `src/app/api/documents/route.ts`, `src/app/api/expenses/[id]/route.ts`, `src/app/api/onboarding/route.ts`, `src/app/api/payroll/payslips/[id]/download/route.tsx`
- Impact: IDE autocomplete unreliable; runtime errors possible at compile time; harder to refactor
- Fix approach: Create proper TypeScript interfaces for all entity types (SalaryStructure, AttendanceRecord, etc.); fix AI SDK v6 tool typing by using generics properly; avoid casting as any

**Error Handling Not Type Safe:**
- Issue: 15+ catch blocks using `catch (error: any)` pattern, losing type information
- Files: `src/app/api/cron/statutory-alerts/route.ts`, `src/app/api/payroll/tds/form16/[employeeId]/route.tsx`, `src/app/api/payroll/[runId]/payslips/download-all/route.tsx`, and many others in `/src/app/api/`
- Impact: Cannot safely access error properties; error discrimination impossible; inconsistent error handling
- Fix approach: Create custom error types; use error boundary pattern; implement typed error handler utilities

## Known Bugs

**AI Chat Tool Execution Logging Race Condition:**
- Symptoms: Tool execution may not be logged if fire-and-forget promise rejects before saving
- Files: `src/app/api/chat/route.ts` (lines 131-139)
- Trigger: Tool execution completes quickly before database save finishes
- Workaround: Check audit_logs table for missing entries; re-run tool manually
- Fix approach: Await logging or use async queue for audit trails

**Database Connection Pool Not Gracefully Closed:**
- Symptoms: Server shutdown may leave hanging connections; database pool not explicitly cleaned up
- Files: `src/lib/db.ts` (lines 27-37)
- Trigger: Server process termination without proper pool.end()
- Workaround: Database automatically closes idle connections after timeout
- Fix approach: Add process.on('SIGTERM') handler to call prisma.$disconnect() and pool.end()

**Mock AI Provider Returns `any` Type:**
- Symptoms: Type errors in development when AI provider falls back to mock
- Files: `src/lib/ai/model-client.ts` (line 40)
- Trigger: Production without ANTHROPIC_API_KEY or development without Ollama
- Workaround: Set ANTHROPIC_API_KEY or OLLAMA_BASE_URL in env
- Fix approach: Create mock model matching full language model interface

## Security Considerations

**Encryption Key Not Validated on Startup:**
- Risk: ENCRYPTION_KEY env var could be empty/invalid; PII encryption silently fails
- Files: `src/lib/encryption.ts` (entire module depends on process.env.ENCRYPTION_KEY)
- Current mitigation: None - no validation that key meets requirements
- Recommendations: (1) Validate ENCRYPTION_KEY length (32+ chars for AES-256); (2) Fail startup if key invalid; (3) Add key rotation mechanism

**Default Seed Credentials Logged to Console:**
- Risk: Admin password exposed in seed output and potentially in CI/CD logs
- Files: `src/lib/seed-admin.ts` (lines 6, 30)
- Current mitigation: Script warns "Change in production!" but no enforcement
- Recommendations: (1) Remove password from console.log; (2) Only output email; (3) Require env var override for seed password

**PII Masking Applied at Query Level, Not Storage:**
- Risk: Full PII (PAN, Aadhaar, bank account) stored unencrypted in columns marked `_encrypted`
- Files: `src/app/api/employees/[id]/route.ts` (encryption happens on write but no validation that it's encrypted), `src/app/api/profile/route.ts` (maskedAadhaar fallback returns "XXXX XXXX ERROR")
- Current mitigation: Encryption on write; role-based decrypt on read
- Recommendations: (1) Add NOT NULL constraint on encrypted columns; (2) Decrypt only for authorized roles (non-employee); (3) Log all decryption events; (4) Add encryption field type check

**No CSRF Protection on State-Changing Operations:**
- Risk: All API endpoints accept JSON without origin validation for POST/PUT/DELETE
- Files: All routes in `src/app/api/**` (attendance, payroll, leave, etc.)
- Current mitigation: NextAuth session validation (partial protection)
- Recommendations: (1) Use next-safe-action or similar CSRF library; (2) Validate Origin/Referer headers; (3) Implement POST-Redirect-GET pattern for critical operations

**Console Logging Contains Sensitive Context:**
- Risk: Debug logs may expose provider info, user IDs, or operation details in production
- Files: `src/app/api/chat/route.ts` (line 114), `src/lib/queues/workers/payroll.worker.ts` (lines 15, 79, 83)
- Current mitigation: Logs removed in production build (NODE_ENV check)
- Recommendations: (1) Use structured logging (pino, winston); (2) Redact sensitive fields; (3) Add log level filtering

**Hardcoded Company Info in Statutory Generators:**
- Risk: Form16, Form24Q, ECR generated with hardcoded company registration numbers
- Files: `src/app/api/payroll/[runId]/statutory/ecr/route.ts` (line 51), `src/app/api/payroll/tds/form16/[employeeId]/route.tsx` (line 8), `src/app/api/payroll/tds/form24q/route.ts` (line 6)
- Current mitigation: None - manual update required per deployment
- Recommendations: Move to database settings; implement company configuration UI

## Performance Bottlenecks

**No Query Result Pagination in Some Endpoints:**
- Problem: Endpoints like `/api/policies`, `/api/documents` load all matching records without limit
- Files: `src/app/api/policies/route.ts`, `src/app/api/documents/route.ts`
- Cause: Missing `take` and `skip` parameters in Prisma queries
- Improvement path: (1) Add `limit`/`offset` query params; (2) Default to 50 items; (3) Return total count for UI pagination

**Conversation Cleanup Uses deleteMany Without Limit:**
- Problem: Bulk delete all old conversations in single query without pagination
- Files: `src/lib/ai/conversation.ts` (line 133)
- Cause: No batching or limit on deleteMany operation
- Improvement path: (1) Batch delete in chunks (e.g., 1000 at a time); (2) Add cron schedule; (3) Archive instead of delete

**Missing Database Indexes on Common Filters:**
- Problem: Queries filter by status, date ranges frequently but some lack indexes
- Files: All endpoints filtering by `date`, `status`, `employee_id` combinations
- Cause: Schema has indexes on individual columns but not compound indexes for common filter combinations
- Improvement path: (1) Add composite indexes for `employee_id + date` queries; (2) Profile slow queries; (3) Add index on `(employee_id, date DESC)` for recent records

**Prisma Logging Enabled in Development:**
- Problem: All queries logged to console, massive output even with select usage
- Files: `src/lib/db.ts` (line 31)
- Cause: `log: ["query", "error", "warn"]` in development
- Improvement path: (1) Change to `["error", "warn"]` only; (2) Use Prisma Studio for debugging; (3) Conditional verbose logging via env var

**No Result Caching for Static Data:**
- Problem: Leave types, departments, designations fetched fresh on every request
- Files: `src/lib/cache.ts` has cache utility but not used everywhere
- Cause: Inconsistent use of cache helper across components
- Improvement path: (1) Use cache for lookups in all list endpoints; (2) Add 1-hour TTL; (3) Implement cache invalidation on update

## Fragile Areas

**AI Chat Tool Parameter Binding:**
- Files: `src/lib/ai/tools/index.ts` (lines 48-154)
- Why fragile: Tool `execute` functions use `@ts-expect-error` and cast `{employeeId, month, year}: any` - types not validated; parameter name mismatch breaks silently
- Safe modification: (1) Define proper tool schemas with parameters property; (2) Use type-safe tool definitions; (3) Add validation of tool params before execute
- Test coverage: No unit tests for tool execution; tools tested only through integration tests

**Payroll Calculator Arithmetic:**
- Files: `src/lib/payroll/calculator.ts`, `src/lib/statutory/pf.ts`, `src/lib/statutory/esi.ts`, `src/lib/statutory/tds.ts`
- Why fragile: Financial calculations use floating point; rounding done at multiple levels; no comprehensive tests for edge cases (salary 0, leap year, state boundaries)
- Safe modification: (1) Add test cases for boundary conditions; (2) Validate calculation results against known tax tables; (3) Use fixed-point arithmetic (paise) throughout
- Test coverage: Limited - only `src/lib/encryption.test.ts` exists; payroll logic untested

**Attendance Lock State Management:**
- Files: `src/app/api/attendance/lock/route.ts`, `src/components/attendance/attendance-lock-manager.tsx`
- Why fragile: Lock state has multiple paths (locked, unlock_requested, unlock_approved, re-locked); no state machine; correctionss can override locks; concurrent unlock requests possible
- Safe modification: (1) Implement state machine (locked | unlock_pending | unlocked); (2) Add pessimistic locking on updates; (3) Make unlock approval idempotent
- Test coverage: No tests; manual integration testing only

**Profile Update Request Approval:**
- Files: `src/app/api/profile/[id]/approval/route.ts`, `src/components/admin/profile-approval-list.tsx` (322 lines)
- Why fragile: No version control of updates - old approvals can't be referenced; approval doesn't validate against current employee state; no rollback mechanism
- Safe modification: (1) Store version hash of approved changes; (2) Validate approval data hasn't changed since request; (3) Add audit trail for approval changes
- Test coverage: None

**Leave Request Approval Flow:**
- Files: `src/app/api/leave-requests/[id]/approve/route.ts`, `src/app/api/leave-requests/[id]/reject/route.ts`
- Why fragile: No transactional guarantee between approval and balance update; concurrent approvals possible; no idempotency
- Safe modification: (1) Use database transactions; (2) Add idempotency key to requests; (3) Add approval timestamp validation
- Test coverage: None

## Scaling Limits

**Job Queue Single Concurrency:**
- Current capacity: 1 payroll job at a time (`concurrency: 1` in `src/lib/queues/workers/payroll.worker.ts` line 74)
- Limit: Each payroll run takes 5-10+ minutes for 100 employees; batch processing not possible
- Scaling path: (1) Increase concurrency to 5-10 (with connection pool tuning); (2) Split payroll into employee chunks; (3) Add priority queue for month-end payroll

**No Read Replicas Configuration:**
- Current capacity: Single PostgreSQL connection, all reads and writes same database
- Limit: High concurrency reads block writes; dashboard heavy queries block payroll operations
- Scaling path: (1) Add read replica configuration in Prisma; (2) Route dashboard queries to replica; (3) Implement eventual consistency handling

**Session Storage in Prisma:**
- Current capacity: All sessions stored in single `sessions` table, no cleanup
- Limit: Table grows unbounded; NextAuth doesn't implement auto-expiry
- Scaling path: (1) Implement session table cleanup job (30-day retention); (2) Consider Redis for sessions; (3) Monitor table size monthly

**Conversation History Not Pruned:**
- Current capacity: All messages kept forever in `messages` table
- Limit: Each conversation accumulates indefinitely; disk space grows linear with usage; chat retrieval gets slower
- Scaling path: (1) Add conversation archive after 90 days; (2) Implement soft delete of old messages; (3) Add cron job for cleanup

**No Rate Limiting on APIs:**
- Current capacity: All endpoints can be called unlimited times
- Limit: Batch operations (employee import, payroll) can overload; no protection against abuse
- Scaling path: (1) Implement rate limiter middleware (e.g., next-rate-limit); (2) Different limits per endpoint (1 req/min for payroll, 100 req/min for GET); (3) Use Redis for distributed rate limiting

## Dependencies at Risk

**NextAuth Beta Version:**
- Risk: Using `next-auth 5.0.0-beta.30` in production - breaking changes possible before v5 release
- Impact: Type changes; API surface changes; security fixes may require major updates
- Migration plan: (1) Track NextAuth v5 release; (2) Test upgrade in staging; (3) Plan migration before maintenance window

**Ollama AI Provider Not Production-Ready:**
- Risk: Local Ollama fallback requires infrastructure; no fallback if Ollama down
- Impact: AI chat completely unavailable if Ollama container crashes
- Migration plan: (1) Prefer Anthropic for production; (2) Add health checks for Ollama; (3) Implement graceful degradation

**React 19 Experimental Features:**
- Risk: Using `react 19.2.4` which may still have stability issues
- Impact: Hydration mismatches; hook updates in components with streaming
- Migration plan: (1) Monitor React issues; (2) Test thoroughly with Playwright; (3) Keep up with minor releases

## Missing Critical Features

**No Audit Trail for Data Changes:**
- Problem: Who changed what and when not tracked for sensitive data (salary, deductions, leave balances)
- Blocks: Compliance requirements; forensic investigation; rollback capability
- Current state: Error logs tracked but not data change logs

**No Soft Delete Pattern:**
- Problem: Hard deletes used everywhere; no recoverability; no historical analysis
- Blocks: Data recovery requests; cascading deletions lose relationships; archive requirements
- Current state: `is_deleted` flag in some tables but not enforced via soft delete middleware

**No Role-Based Access Control Beyond Basic Roles:**
- Problem: Role system has 5 types but no permission matrix; can't restrict specific employee data access by department
- Blocks: Multi-department companies; self-service limitations; compliance (GDPR data isolation)
- Current state: Role checked in endpoints but no granular permission checks

**No Webhook System for External Integration:**
- Problem: No way to notify external HR systems of events (employee joined, payroll run completed, etc.)
- Blocks: Third-party integrations; API-driven workflows; audit system integration
- Current state: Internal audit logs only

## Test Coverage Gaps

**No Unit Tests for Payroll Calculations:**
- What's not tested: Tax calculations (PF, ESI, TDS, PT); LOP deduction logic; statutory slabs
- Files: `src/lib/payroll/calculator.ts`, `src/lib/statutory/*.ts`
- Risk: Incorrect tax payouts; compliance violations; employee disputes
- Priority: High - financial correctness critical

**No Tests for Attendance Lock State Transitions:**
- What's not tested: Lock → unlock_requested → unlock_approved sequence; concurrent requests; lock expiry
- Files: `src/app/api/attendance/lock/route.ts`, `src/components/attendance/attendance-lock-manager.tsx`
- Risk: Attendance data integrity; false lock states; approval race conditions
- Priority: High - data integrity critical

**No Tests for Leave Request Approval:**
- What's not tested: Approval → balance update; concurrent approvals; balance recalculation
- Files: `src/app/api/leave-requests/[id]/approve/route.ts`
- Risk: Leave balances incorrect; double-counting of leaves; approval idempotency
- Priority: High - affects payroll

**No Tests for Profile Update Approval:**
- What's not tested: Update request creation; approval with data validation; rejection flow; multiple pending requests
- Files: `src/app/api/profile/[id]/approval/route.ts`, `src/components/admin/profile-approval-list.tsx`
- Risk: Invalid data approved; employee data inconsistency
- Priority: Medium - less critical than financial flows

**No E2E Tests for Payroll Run:**
- What's not tested: Full payroll pipeline (validation → calculation → statutory → finalization); edge cases (first month, salary change mid-month)
- Files: `src/lib/queues/workers/payroll.worker.ts`
- Risk: Entire payroll pipeline failure discovered in production
- Priority: Critical - revenue-impacting process

**No Tests for Encryption/Decryption:**
- What's not tested: Edge cases in PAN/Aadhaar masking; decryption failures; missing encryption key
- Files: `src/lib/encryption.ts` has one test file `encryption.test.ts` (174 lines) but doesn't cover all scenarios
- Risk: PII exposure; decryption failures; security violations
- Priority: High - security critical

---

*Concerns audit: 2026-02-08*
