# Technology Stack

**Analysis Date:** 2026-02-08

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code, type-safe development
- JSX/TSX - React components with type safety

**Secondary:**
- JavaScript - Transpiled output, configuration files

## Runtime

**Environment:**
- Node.js - JavaScript runtime (version managed by `.nvmrc` or package manager)

**Package Manager:**
- pnpm 10.28.2 - Declared in `package.json` packageManager field
- Lockfile: pnpm-lock.yaml (present)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack framework, React-based
  - Config: `next.config.ts`
  - Features: App Router, API routes, server components
  - Build: Turbopack (`next dev --turbopack`)

**Frontend:**
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering
- React Hook Form 7.71.1 - Form state management
- Zod 4.3.6 - Schema validation

**Styling & Components:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
  - Config: `tailwindcss.config.ts` (auto-included via Next.js)
- @tailwindcss/postcss 4.1.18 - PostCSS support
- Radix UI - Headless component library
  - @radix-ui/react-dialog 1.1.15
  - @radix-ui/react-label 2.1.8
  - @radix-ui/react-select 2.2.6
  - @radix-ui/react-separator 1.1.8
  - @radix-ui/react-slot 1.2.4
- Lucide React 0.563.0 - Icon library
- class-variance-authority 0.7.1 - CSS class composition
- tailwind-merge 3.4.0 - Tailwind class merging
- clsx 2.1.1 - Class name utilities

**Testing:**
- Vitest 4.0.18 - Unit/integration test runner
  - Config: `vitest.config.ts`
  - Run: `pnpm test`, `pnpm test:ui`
- @testing-library/react 16.3.2 - Component testing utilities
- Playwright 1.58.2 - E2E testing framework
  - Config: `playwright.config.ts`
  - Run: `pnpm test:e2e`, `pnpm test:e2e:ui`
- jsdom 28.0.0 - DOM simulation

**Build/Dev:**
- TypeScript 5.9.3 - Type checking
- Biome 2.3.14 - Linter and formatter (unified tool)
  - Config: `biome.json`
  - Commands: `pnpm lint`, `pnpm format`, `pnpm lint:check`
- ESLint 9.39.2 - JavaScript linting
- eslint-config-next 16.1.6 - Next.js ESLint config
- PostCSS 8.5.6 - CSS processing
- Autoprefixer 10.4.24 - CSS vendor prefixing
- tsx 4.21.0 - TypeScript execution for scripts

## Key Dependencies

**Critical:**
- @prisma/client 7.3.0 - Database ORM
  - Config: `prisma/schema.prisma`
  - Adapter: @prisma/adapter-pg 7.3.0 (PostgreSQL)
  - Commands: `pnpm db:generate`, `pnpm db:push`, `pnpm db:studio`
- pg 8.18.0 - PostgreSQL driver for Node.js
- next-auth 5.0.0-beta.30 - Authentication framework
  - Config: `src/lib/auth-options.ts`, `src/lib/auth.ts`
  - Session strategy: JWT
  - Adapter: @auth/prisma-adapter 2.11.1

**AI & LLM:**
- @ai-sdk/anthropic 3.0.36 - Anthropic Claude API client
  - Model: claude-sonnet-4-20250514
  - Config: `src/lib/ai/model-client.ts`
- @ai-sdk/react 3.0.71 - React bindings for AI SDK
- ai 6.0.69 - Vercel AI SDK core
- ollama-ai-provider 1.2.0 - Local Ollama provider
  - Fallback model: llama3.2:3b
  - Embeddings: nomic-embed-text

**Job Queue & Async:**
- bullmq 5.67.2 - Redis-backed job queue
  - Email queue: `src/lib/email/queue.ts`
  - Workers: `src/lib/queues/workers/`
- ioredis 5.9.2 - Redis client
  - Connection: `src/lib/queues/connection.ts`
  - Config: REDIS_URL env var

**Vector Database:**
- @qdrant/js-client-rest 1.16.2 - Qdrant vector search client
  - Config: `src/lib/qdrant/client.ts`
  - Collection: hr_policies (768-dim, cosine distance)

**Email:**
- resend 6.9.1 - Email service SDK
  - Config: `src/lib/email/resend.ts`
  - Queue integration: BullMQ

**PDF Processing:**
- @react-pdf/renderer 4.3.2 - PDF generation
- @react-pdf-viewer/core 3.12.0 - PDF viewer component
- @react-pdf-viewer/default-layout 3.12.0 - PDF viewer layout
- react-pdf 10.3.0 - PDF rendering
- pdfjs-dist 5.4.624 - PDF.js library

**Utilities:**
- bcrypt 6.0.0 - Password hashing
- date-fns 4.1.0 - Date manipulation
- csv-parse 6.1.0 - CSV parsing
- jszip 3.10.1 - ZIP file handling
- dotenv 17.2.3 - Environment variable loading
- @hookform/resolvers 5.2.2 - Form validation resolvers
- tw-animate-css 1.4.0 - Tailwind animations

**Security:**
- bcrypt 6.0.0 - Password hashing (Argon2 alternative)
  - Used in: `src/lib/auth-options.ts`
- NextAuth.js 5.0.0-beta.30 - Session management
  - Session strategy: JWT with 24-hour maxAge

## Configuration

**Environment:**
- `NEXTAUTH_URL` - NextAuth base URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - JWT signing secret (required)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (BullMQ)
- `ANTHROPIC_API_KEY` - Claude API key (auto-detected)
- `AI_PROVIDER` - Optional override: 'anthropic' or 'ollama'
- `OLLAMA_BASE_URL` - Local Ollama endpoint (default: http://localhost:11434/api)
- `OLLAMA_MODEL` - Ollama model name (default: llama3.2:3b)
- `QDRANT_URL` - Qdrant vector DB endpoint (default: http://localhost:6333)
- `EMBEDDING_MODEL` - Embedding model for Qdrant (default: nomic-embed-text)
- `RESEND_API_KEY` - Email service API key
- `EMAIL_FROM` - Sender email address
- `ENCRYPTION_KEY` - AES-256-GCM key for PII encryption

**Build:**
- `tsconfig.json` - TypeScript configuration
  - Path alias: `@/*` → `./src/*`
  - Target: ES2017
  - Module: esnext
  - JSX: react-jsx
- `biome.json` - Linter/formatter config
  - 2-space indent, 100-character line width
  - Double quotes, always semicolons
- `next.config.ts` - Next.js configuration (minimal)
- `.eslintrc.*` - ESLint overrides (if present)

## Platform Requirements

**Development:**
- Node.js + pnpm
- PostgreSQL 16+ (Docker available via `docker-compose.yml`)
- Redis 7+ (Docker available)
- Qdrant (Docker available)
- Optional: Ollama for local LLM
- Optional: Anthropic API key for Claude

**Production:**
- Deployment: Vercel (detected via `.vercel/project.json`)
- PostgreSQL database (managed or self-hosted)
- Redis instance (for BullMQ job queue)
- Qdrant instance (for policy document embeddings)
- Anthropic API account (or Ollama instance)
- Resend API account (or alternative email service)

**Database:**
- PostgreSQL 16+ with specific adapters
  - @prisma/adapter-pg for connection pooling
  - Primary datasource in `prisma/schema.prisma`

---

*Stack analysis: 2026-02-08*
