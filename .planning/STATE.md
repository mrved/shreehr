# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Automated payroll with accurate Indian statutory compliance — if nothing else works, payroll must run correctly and on time with zero compliance errors.

**Current focus:** Phase 1 - Foundation

## Current Position

Phase: 1 of 6 (Foundation)
Plan: 4 of TBD
Status: In progress
Last activity: 2026-02-03 — Completed 01-04-PLAN.md (document storage and Keka import)

Progress: [████░░░░░░] ~40%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 7 min
- Total execution time: 0.48 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | 29min | 7min |

**Recent Trend:**
- Last 5 plans: 01-01 (10min), 01-02 (6min), 01-03 (7min), 01-04 (6min)
- Trend: Stable (~6-7min average for last 3)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Self-hosted over SaaS (control costs, own data, no vendor dependency)
- Web-only, no native apps (20 users don't justify native app complexity)
- AI chat as differentiator (reduce admin burden, better than Keka's UX)
- Full Keka migration (need historical data for Form 16 and continuity)

**From 01-01 execution:**
- Use Prisma 7 with datasource config in prisma.config.ts (new architecture)
- Use Biome instead of ESLint for 50x faster linting
- Store PII encrypted at rest with separate fields (pan_encrypted, aadhaar_encrypted, bank_account_encrypted)
- Use pnpm for package management (faster, disk-efficient)
- Audit fields on all entities (created_at, created_by, updated_at, updated_by)

**From 01-02 execution:**
- Use NextAuth v5 (beta) for future-proof authentication
- JWT session strategy over database sessions for simplicity
- Role stored in JWT token for efficient authorization checks
- Route groups for layout separation ((auth) vs (dashboard))
- Middleware-based route protection with redirect logic

**From 01-03 execution:**
- Use snake_case for Prisma field names to match database schema conventions
- Mask PII in list responses, provide full decrypted values only to admins in _sensitive field
- Soft delete for employees (set employment_status to TERMINATED) rather than hard delete
- Allow HR_MANAGER role same permissions as ADMIN for employee management
- Zod validation schemas with Indian-specific regex (PAN, Aadhaar, IFSC)

**From 01-04 execution:**
- Store documents on local filesystem (./uploads/employees/{id}/) rather than cloud storage
- Use integers (paise) for salary amounts instead of Decimal for precision
- Store leave types as flexible strings instead of enum to support Keka's various types
- Auto-create departments and designations during employee import
- Two-pass employee import: first create employees, then assign managers
- Track import errors in JSON field without failing entire batch
- Soft delete documents with retention_until field for 8-year compliance

### Pending Todos

**User setup required before login works:**
1. Install PostgreSQL or run Docker container
2. Generate encryption key: `openssl rand -hex 32`
3. Configure .env file with DATABASE_URL and ENCRYPTION_KEY
4. Run `pnpm db:push` to create database schema
5. Run `pnpm db:seed` to create admin user (admin@shreehr.local / admin123)

### Blockers/Concerns

**Phase 3 Planning:**
- Will require deep research on Indian tax calculation edge cases (HRA formula, LTA rules, arrears taxation)
- Form 24Q/16 generation specifications need latest FVU file format from TRACES portal
- State-specific Professional Tax slabs and filing formats need validation

**Phase 6 Planning:**
- Will require deep research on RAG implementation patterns (Vercel AI SDK + Ollama + Qdrant)
- Embedding model selection and chunking strategies for HR policy documents
- Permission-aware data access in RAG queries (RBAC enforcement)

## Session Continuity

Last session: 2026-02-03 19:47 - Completed 01-04 document storage and Keka import
Stopped at: Completed 01-04-PLAN.md, created SUMMARY.md, updated STATE.md
Resume file: None
