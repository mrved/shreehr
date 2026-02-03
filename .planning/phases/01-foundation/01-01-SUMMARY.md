---
phase: 01-foundation
plan: 01
subsystem: database
tags: [nextjs, prisma, postgresql, encryption, aes-gcm, biome, vitest]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project initialization
provides:
  - Next.js 16 project with TypeScript and Tailwind CSS
  - Complete Prisma schema with 8 core models
  - PII encryption infrastructure using AES-256-GCM
  - Audit trail columns on all entities
  - Development tooling (Biome linter, Vitest tests)
affects: [02-auth, 03-employee-mgmt, 04-payroll, 05-keka-migration]

# Tech tracking
tech-stack:
  added:
    - Next.js 16.1.6 (App Router, Turbopack)
    - React 19.2.4
    - Prisma 7.3.0 with PostgreSQL
    - Biome 2.3.14 (linter/formatter)
    - Vitest 4.0.18 with Testing Library
    - Tailwind CSS 4.1.18
  patterns:
    - Prisma client singleton pattern for edge compatibility
    - AES-256-GCM encryption for PII fields with random IV per encryption
    - Audit fields pattern (created_at, created_by, updated_at, updated_by) on all models
    - Type-safe PII validation and masking utilities

key-files:
  created:
    - prisma/schema.prisma (complete HR domain schema)
    - src/lib/db.ts (Prisma singleton)
    - src/lib/encryption.ts (PII encryption utilities)
    - src/types/index.ts (shared type definitions)
    - vitest.config.ts (test infrastructure)
  modified: []

key-decisions:
  - "Use Prisma 7 with datasource config in prisma.config.ts (new architecture)"
  - "Use Biome instead of ESLint for 50x faster linting"
  - "Store PII encrypted at rest with separate fields (pan_encrypted, aadhaar_encrypted, bank_account_encrypted)"
  - "Use pnpm for package management (faster, disk-efficient)"

patterns-established:
  - "Audit fields on all entities: created_at, created_by, updated_at, updated_by with User relations"
  - "Encrypted PII pattern: encrypt on write, decrypt on read, never store plaintext"
  - "Validation before encryption: isValidPAN/Aadhaar/BankAccount functions"
  - "Masking for display: mask functions show last 4 digits only"

# Metrics
duration: 10min
completed: 2026-02-04
---

# Phase 01 Plan 01: Foundation Summary

**Next.js 16 project with complete Prisma schema covering 8 HR models, AES-256-GCM PII encryption, and comprehensive test suite**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-03T19:16:54Z
- **Completed:** 2026-02-03T19:26:29Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments
- Complete HR database schema with User, Employee, Department, Designation, Document, SalaryRecord, LeaveBalance, and ImportBatch models
- PII encryption infrastructure ready for PAN, Aadhaar, and bank account data with 30 passing tests
- Development environment configured with Next.js 16, TypeScript, Biome linting, and Vitest testing
- Audit trail columns established on all models for compliance tracking

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js 16 project with tooling** - `c161dbf` (chore)
2. **Task 2: Create complete Prisma schema with audit infrastructure** - `eac7b02` (feat)
3. **Task 3: Create PII encryption utilities with tests** - `00075a6` (feat)

## Files Created/Modified
- `package.json` - Project dependencies and scripts (dev, build, lint, test, db commands)
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration with path aliases
- `biome.json` - Biome linter and formatter configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `vitest.config.ts` - Vitest test configuration with jsdom environment
- `.env.example` - Environment variable template (DATABASE_URL, ENCRYPTION_KEY)
- `.gitignore` - Git ignore patterns for node_modules, .next, .env
- `src/app/layout.tsx` - Root layout with metadata
- `src/app/page.tsx` - Homepage placeholder
- `src/app/globals.css` - Global styles with Tailwind directives
- `prisma/schema.prisma` - Complete database schema with 8 models
- `prisma.config.ts` - Prisma 7 configuration
- `src/lib/db.ts` - Prisma client singleton with development logging
- `src/lib/encryption.ts` - AES-256-GCM encryption utilities for PII
- `src/lib/encryption.test.ts` - Comprehensive test suite (30 tests)
- `src/types/index.ts` - Shared TypeScript type definitions

## Decisions Made

**1. Prisma 7 with new configuration architecture**
- Prisma 7 moved datasource URL from schema.prisma to prisma.config.ts
- Enables better separation of schema definition from environment configuration

**2. Biome over ESLint**
- 50x faster linting and formatting than ESLint + Prettier
- Single tool replaces two, simpler configuration

**3. PII encryption strategy**
- Store encrypted fields separately (pan_encrypted vs pan)
- Use AES-256-GCM with random IV for each encryption
- Validate format before encryption to prevent encrypting garbage data
- Provide masking functions for safe display (show last 4 digits only)

**4. Comprehensive audit trail**
- All models have created_at, created_by, updated_at, updated_by
- Relations to User model for audit attribution
- Enables compliance reporting and change tracking

**5. pnpm package manager**
- Installed globally during setup (npm install -g pnpm)
- Faster installs and more disk-efficient than npm/yarn

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed pnpm globally**
- **Found during:** Task 1 (Next.js initialization)
- **Issue:** pnpm command not found, required for project initialization
- **Fix:** Ran `npm install -g pnpm` to install package manager
- **Files modified:** global npm packages
- **Verification:** pnpm command available, project initialization succeeded
- **Committed in:** c161dbf (Task 1 commit)

**2. [Rule 3 - Blocking] Updated Biome configuration for version 2.3.14**
- **Found during:** Task 1 (linting verification)
- **Issue:** Initial biome.json used schema version 1.9.4 and deprecated keys
- **Fix:** Updated to schema 2.3.14, replaced experimentalScannerIgnores with includes pattern, disabled noUnknownAtRules for Tailwind
- **Files modified:** biome.json
- **Verification:** `pnpm lint` executes without errors
- **Committed in:** c161dbf (Task 1 commit)

**3. [Rule 3 - Blocking] Fixed Prisma 7 schema configuration**
- **Found during:** Task 2 (Prisma generate)
- **Issue:** Prisma 7 doesn't support `url` property in datasource, requires prisma.config.ts
- **Fix:** Removed url from schema.prisma, verified prisma.config.ts has datasource configuration, installed dotenv dependency
- **Files modified:** prisma/schema.prisma, package.json
- **Verification:** `pnpm prisma generate` succeeded
- **Committed in:** eac7b02 (Task 2 commit)

**4. [Rule 1 - Bug] Fixed maskBankAccount test assertion**
- **Found during:** Task 3 (test execution)
- **Issue:** Test expected 10 asterisks but function correctly produced 8 (12 digits - 4 shown = 8 masked)
- **Fix:** Updated test assertion to expect correct number of asterisks with explanatory comment
- **Files modified:** src/lib/encryption.test.ts
- **Verification:** All 30 tests pass
- **Committed in:** 00075a6 (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug)
**Impact on plan:** All auto-fixes were necessary to unblock task completion or fix incorrect test assertions. No scope creep - all work aligned with plan objectives.

## Issues Encountered

**Prisma version mismatch**
- Prisma 7 introduced breaking changes to configuration architecture
- Solution: Adapted to new pattern (datasource in prisma.config.ts instead of schema.prisma)
- Benefit: Better separation of concerns, environment-specific config out of schema

**Biome schema versioning**
- Initial configuration used outdated schema version
- Solution: Updated to match installed Biome version 2.3.14
- Benefit: Access to latest linting rules and features

## User Setup Required

Before running the project, users must:

1. **Install PostgreSQL** (or use Docker)
   ```bash
   # Docker option
   docker run -d --name shreehr-db -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16
   ```

2. **Set environment variables** - Copy `.env.example` to `.env` and configure:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/shreehr"
   ENCRYPTION_KEY="<generate with: openssl rand -hex 32>"
   ```

3. **Generate encryption key**
   ```bash
   openssl rand -hex 32
   ```
   Copy output to `.env` as `ENCRYPTION_KEY`

4. **Run database migrations** (when created in later phases)
   ```bash
   pnpm db:push
   ```

5. **Verify setup**
   ```bash
   pnpm dev  # Should start on http://localhost:3000
   pnpm lint # Should run without errors
   pnpm test # Should show 30 tests passing
   ```

## Next Phase Readiness

**Ready for Phase 2 (Authentication):**
- User model exists with password_hash and role fields
- Audit infrastructure ready for tracking auth events
- Type-safe database access via Prisma client
- Test infrastructure ready for auth flow tests

**Foundation complete:**
- Database schema covers all HR domain entities
- PII encryption ready for sensitive employee data
- Development workflow established (lint, test, dev server)
- Git repository initialized with atomic commits

**No blockers** - all planned functionality delivered and verified.

---
*Phase: 01-foundation*
*Completed: 2026-02-04*
