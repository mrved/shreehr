# External Integrations

**Analysis Date:** 2026-02-08

## APIs & External Services

**AI & Language Models:**
- Anthropic Claude API - AI assistant for chat and policy search
  - SDK: @ai-sdk/anthropic 3.0.36
  - Model: claude-sonnet-4-20250514
  - Auth: ANTHROPIC_API_KEY env var
  - Client: `src/lib/ai/model-client.ts`
  - Auto-detection: If ANTHROPIC_API_KEY is set, Claude is used automatically
  - Fallback: Ollama (local) when API key not present

**Local LLM Inference:**
- Ollama - Self-hosted language model inference
  - SDK: ollama-ai-provider 1.2.0
  - Models: llama3.2:3b (chat), nomic-embed-text (embeddings)
  - Base URL: OLLAMA_BASE_URL (default: http://localhost:11434/api)
  - Usage: Chat when ANTHROPIC_API_KEY missing, embeddings always

**Email Service:**
- Resend - Transactional email delivery
  - SDK: resend 6.9.1
  - Auth: RESEND_API_KEY env var
  - Sender: EMAIL_FROM env var
  - Client: `src/lib/email/resend.ts`
  - Integration: BullMQ async queue (`src/lib/email/queue.ts`)
  - Use cases: Onboarding offer letters, payroll notifications, policy updates

## Data Storage

**Databases:**
- PostgreSQL 16+
  - Connection: DATABASE_URL env var
  - Client: @prisma/client 7.3.0
  - Driver: pg 8.18.0
  - Adapter: @prisma/adapter-pg 7.3.0 (connection pooling)
  - Schema: `prisma/schema.prisma` (1500+ lines)
  - Entities: Users, Employees, Payroll, Leave, Attendance, Loans, Expenses, etc.
  - Generated client: `npm run db:generate` or auto on postinstall

**Vector Database:**
- Qdrant - Vector similarity search for policy documents (RAG)
  - Connection: QDRANT_URL env var (default: http://localhost:6333)
  - Client: @qdrant/js-client-rest 1.16.2
  - Collection: hr_policies
  - Vector size: 768 dimensions (nomic-embed-text)
  - Distance metric: Cosine similarity
  - Setup: `src/lib/qdrant/client.ts` → ensureCollection()
  - Usage: Policy document embedding and retrieval for AI chat

**File Storage:**
- Local filesystem only
  - Document types: Employee documents, PDFs, receipts, investment proofs
  - Storage paths: Configured in `storage_path` field of Document models
  - Retention: 8 years from upload
  - No S3 or cloud storage integration (AWS commented out in `.env.example`)

**Caching:**
- Redis 7+
  - Connection: REDIS_URL env var (default: redis://localhost:6379)
  - Client: ioredis 5.9.2
  - Primary use: BullMQ job queue backing store
  - No session caching (NextAuth uses JWT)

## Authentication & Identity

**Auth Provider:**
- Custom NextAuth.js - Credentials-based authentication
  - Framework: next-auth 5.0.0-beta.30 (beta)
  - Strategy: JWT (no sessions)
  - Provider: Credentials (email + password)
  - Flow: `src/lib/auth-options.ts` (credentials verify → bcrypt check → JWT issue)
  - Database: PostgreSQL via Prisma
  - Adapter: @auth/prisma-adapter 2.11.1
  - Session: 24-hour max age
  - Configuration: `src/lib/auth.ts` exports handlers, auth, signIn, signOut

**Password Security:**
- bcrypt 6.0.0 - Hash function for password storage
  - Hash verification: `src/lib/auth-options.ts` → bcrypt.compare()
  - Configuration: Default bcrypt cost factor (typically 10-12 rounds)

**PII Encryption:**
- AES-256-GCM - Encryption for sensitive employee data
  - Key: ENCRYPTION_KEY env var (32 bytes for 256-bit)
  - Fields encrypted: PAN, Aadhaar, bank account number
  - Implementation: Expected in encryption utility (not explicitly shown in sampled files)

## Monitoring & Observability

**Error Tracking:**
- Internal error logging - ErrorLog model for application errors
  - Storage: PostgreSQL (`error_logs` table)
  - Fields: fingerprint, error_type, severity, message, stack, route, user_id
  - No external service (Sentry/Rollbar) integration
  - Types: API, CLIENT, AI_CHAT, AUTH, PAYROLL

**Logs:**
- Console logs - Development only
  - Server-side: Node.js console.log/console.error
  - Client-side: Browser console
  - Log levels: debug (connection events), warn (provider fallback), error (critical failures)
  - No centralized logging service (Datadog, CloudWatch, etc.)

**Audit Logging:**
- Internal audit trail - AuditLog model for compliance
  - Storage: PostgreSQL (`audit_logs` table)
  - Tracked actions: LOGIN, LOGOUT, VIEW_PII, TOOL_EXEC, etc.
  - Fields: user_id, action, resource, resource_id, ip_address, user_agent, timestamp

## CI/CD & Deployment

**Hosting:**
- Vercel - Serverless deployment platform
  - Config: `.vercel/project.json` (present)
  - Framework: Next.js native support
  - Build: `next build`, Start: `next start`
  - Environment variables: Vercel dashboard configuration

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other CI config
  - Build/test must be run manually or configured in Vercel settings
  - Suggested: Add CI workflow for tests, linting, type checking

## Environment Configuration

**Required env vars:**
- `NEXTAUTH_SECRET` - JWT signing key (critical)
- `DATABASE_URL` - PostgreSQL connection string (critical)
- `REDIS_URL` - Redis connection (required for BullMQ)
- `ENCRYPTION_KEY` - AES-256-GCM for PII (required if using encrypted fields)

**Optional env vars (with defaults):**
- `ANTHROPIC_API_KEY` - Claude API key (auto-detection if set)
- `AI_PROVIDER` - Override: 'anthropic' or 'ollama' (auto-detected)
- `OLLAMA_BASE_URL` - Ollama endpoint (default: http://localhost:11434/api)
- `OLLAMA_MODEL` - Chat model (default: llama3.2:3b)
- `QDRANT_URL` - Vector DB endpoint (default: http://localhost:6333)
- `EMBEDDING_MODEL` - Embedding model (default: nomic-embed-text)
- `RESEND_API_KEY` - Email service key
- `EMAIL_FROM` - Sender address (default: noreply@shreehr.local)
- `NEXTAUTH_URL` - Base URL for NextAuth callbacks

**Secrets location:**
- Environment variables: `.env.local` (development), Vercel dashboard (production)
- No hardcoded secrets detected
- Template: `.env.example` provided

## Webhooks & Callbacks

**Incoming:**
- Not detected - No webhook endpoints for external service callbacks
- Health check: Optional cron endpoint at `/api/cron/statutory-alerts`

**Outgoing:**
- Email notifications - Async via BullMQ → Resend
  - Onboarding offer letters
  - Payroll processing notifications
  - Statutory deadline alerts
  - Investment declaration requests
  - No external API calls for business logic (payments, integrations)

**Internal Async Processing:**
- BullMQ job queue backed by Redis
  - Email queue: `src/lib/email/queue.ts`
  - Workers: `src/lib/queues/workers/email.worker.ts`, `embedding.worker.ts`
  - Payroll job queueing: `src/app/api/payroll/run/route.ts`
  - Embedding job queueing: `src/app/api/policies/route.ts`

---

*Integration audit: 2026-02-08*
