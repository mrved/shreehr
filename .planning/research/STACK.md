# Technology Stack Research

**Project:** ShreeHR - Self-Hosted Indian HRMS
**Researched:** 2026-02-04
**Overall Confidence:** HIGH (verified via official docs and 2026 sources)

---

## Executive Summary

For a 20-person Indian company building a self-hosted HRMS to replace Keka, the recommended stack prioritizes:
- **Simplicity over enterprise complexity** (React/Next.js over heavyweight Java stacks)
- **Type safety** (TypeScript, Zod, tRPC/Server Actions)
- **Modern DX** (Biome, pnpm, Vitest)
- **Self-hosting ease** (Docker Compose, PostgreSQL, standalone output)
- **Indian compliance** (Custom calculations for PF/ESI/PT/TDS)
- **AI-first architecture** (Vercel AI SDK + local LLM via Ollama + RAG)

This stack represents the **2026 standard** for greenfield Next.js applications with AI capabilities.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Next.js** | `^16.1.6` | Full-stack React framework | Industry standard for React apps in 2026. App Router with Server Components provides optimal performance. Standalone output mode perfect for self-hosting. | **HIGH** |
| **React** | `^19.2.4` | UI library | React 19 includes Server Components, improved hooks, and compiler optimizations. Pairs perfectly with Next.js 16. | **HIGH** |
| **TypeScript** | `^5.9.2` | Type system | Essential for type safety across full stack. Required for tRPC, Zod, and modern development. | **HIGH** |
| **Node.js** | `>=20.9.0` | Runtime | Required by Next.js 16. LTS version ensures stability for self-hosted deployments. | **HIGH** |

**Why Next.js over alternatives:**
- Vercel maintains Next.js actively (v16.1.6 released January 2026)
- App Router with Server Components reduces client bundle size
- Built-in API routes eliminate need for separate backend
- Excellent Docker support via standalone output mode
- Strong Indian developer community and resources

**What NOT to use:**
- ❌ **Create React App** - Deprecated, no longer maintained
- ❌ **Remix** - Solid but smaller ecosystem than Next.js
- ❌ **Gatsby** - Better for static sites, overkill for HRMS

### Database & ORM

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **PostgreSQL** | `^16.x` | Primary database | Superior for HRMS due to JSON support (for employee metadata), robust transaction handling (payroll), and complex queries (reporting). Better data integrity than MySQL. | **HIGH** |
| **Prisma** | `^6.x` | ORM & migrations | Most mature TypeScript ORM. Excellent migrations, type safety, and Studio GUI. Better ecosystem than Drizzle for greenfield projects. | **MEDIUM** |
| **Redis** | `^7.x` (optional) | Caching & sessions | For session management and caching computed payroll. Optional initially. | **MEDIUM** |

**PostgreSQL over MySQL:**
- Better JSON/JSONB support for flexible employee metadata
- Superior handling of concurrent transactions (critical for payroll)
- More robust for complex reporting queries
- ACID compliance superior for financial data
- Native full-text search capabilities

**Prisma over Drizzle:**
- More mature ecosystem and community (since 2019)
- Prisma Studio GUI for database inspection
- Better migration tooling and documentation
- Larger Indian developer community
- Trade-off: Slightly larger bundle, but worth it for DX

**What NOT to use:**
- ❌ **MongoDB** - Relational data model (employees → attendance → payroll) doesn't suit NoSQL
- ❌ **MySQL** - Weaker JSON support, less suitable for HRMS reporting needs
- ❌ **TypeORM** - Declining community, Prisma has better TypeScript support

### UI Components & Styling

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **shadcn/ui** | Latest | Component library | Copy-paste components built on Radix/Base UI. Full ownership, no npm bloat. Now supports both Radix and Base UI primitives. | **HIGH** |
| **Tailwind CSS** | `^4.x` | Styling | Industry standard for utility-first CSS. Excellent with Next.js. v4 released late 2025 with performance improvements. | **HIGH** |
| **Radix UI / Base UI** | Latest | Unstyled primitives | shadcn/ui now supports both. Base UI recommended (maintained by MUI team, future-proof after Radix uncertainty). | **MEDIUM** |
| **Lucide React** | Latest | Icons | Clean, consistent icon set. Default with shadcn/ui. | **HIGH** |

**shadcn/ui philosophy:**
- Components copied into `components/ui/` - you own the code
- No npm dependency hell, no version conflicts
- Customize freely without fighting library constraints
- Built on accessible Radix/Base UI primitives

**Important 2026 update:**
- Radix UI's future uncertain (team pivoted to Base UI)
- shadcn/ui now supports both Radix and Base UI
- **Recommendation:** Use Base UI variant for new projects (better long-term support)

**What NOT to use:**
- ❌ **Material-UI (MUI)** - Heavy bundle, Indian HRMS needs custom brand, not Material Design
- ❌ **Ant Design** - Good but opinionated, harder to customize
- ❌ **Chakra UI** - Solid but shadcn/ui preferred in 2026 for ownership model

### State Management & Data Fetching

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **TanStack Query** | `^5.90.19` | Server state | Industry standard for async state. Excellent caching, mutations, optimistic updates. Works perfectly with Server Actions and tRPC. | **HIGH** |
| **Zustand** | `^5.x` | Client state | Lightweight global state. Use sparingly - prefer Server Components and TanStack Query. | **MEDIUM** |
| **Server Actions** | Native to Next.js | Mutations | Next.js 16 built-in. Type-safe mutations without API routes. Simpler than tRPC for small teams. | **HIGH** |

**Data fetching architecture:**
- **Server Components** (default) - Fetch on server, zero JS for that component
- **TanStack Query** - Client-side needs (infinite scroll, real-time updates, optimistic UI)
- **Server Actions** - Mutations (save employee, submit leave, calculate payroll)

**Server Actions vs tRPC:**
For 20-person company replacing Keka:
- ✅ **Server Actions** - Simpler, built-in, zero setup, perfect for small team
- ❌ **tRPC** - More powerful but overkill unless you need complex API with external consumers

**If you grow beyond 50 employees or need mobile app:**
- Consider tRPC for type-safe API shared between web/mobile
- tRPC + TanStack Query is powerful combo for complex apps

**What NOT to use:**
- ❌ **Redux** - Overkill for HRMS, Server Components + TanStack Query replace most needs
- ❌ **Recoil** - Facebook project with uncertain future
- ❌ **SWR** - Good but TanStack Query is more feature-complete

### Form Handling & Validation

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **React Hook Form** | `^7.x` | Form library | Best performance, minimal re-renders. Perfect for HRMS forms (employee data, payroll inputs). | **HIGH** |
| **Zod** | `^4.3.6` | Schema validation | Zero dependencies, 2kb gzipped. Type-safe validation. Works perfectly with React Hook Form via `@hookform/resolvers/zod`. | **HIGH** |

**Why this combo:**
- React Hook Form handles form state with minimal re-renders
- Zod provides runtime validation + TypeScript types via `z.infer<>`
- `zodResolver` connects them seamlessly
- Perfect for complex HRMS forms (employee details, salary structures, leave policies)

**Pattern:**
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/),
  salary: z.number().positive(),
});

type Employee = z.infer<typeof employeeSchema>;

const form = useForm<Employee>({
  resolver: zodResolver(employeeSchema),
});
```

**What NOT to use:**
- ❌ **Formik** - Heavier, more re-renders than React Hook Form
- ❌ **Yup** - Zod is lighter, better TypeScript integration
- ❌ **Manual validation** - Error-prone, no type safety

### AI & RAG Stack

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Vercel AI SDK** | `^6.x` | AI framework | Best DX for React/Next.js. Native streaming, edge support, 25+ provider integrations. Cleaner API than LangChain for simple use cases. | **HIGH** |
| **Ollama** | Latest | Local LLM server | Self-hosted LLM inference. OpenAI-compatible API. Run Llama, Mistral, Phi locally. Perfect for privacy-sensitive HR data. | **HIGH** |
| **Qdrant** | `^1.x` | Vector database | Rust-based, open-source, excellent for self-hosted RAG. Fastest for small-medium datasets (20 employees = small). Easier to self-host than Weaviate. | **HIGH** |
| **Transformers.js** | `^3.x` | Embeddings | Generate embeddings client-side or server-side. Zero API costs. Works offline. | **MEDIUM** |

**AI Architecture for HR chatbot:**

1. **Document Ingestion:**
   - HR policies, employee handbook, company SOPs → chunked
   - Generate embeddings via Transformers.js or Ollama's embedding models
   - Store in Qdrant vector database

2. **Query Flow:**
   - User asks "What is my leave balance?"
   - Retrieve relevant policy chunks from Qdrant (semantic search)
   - Fetch user's leave data from PostgreSQL
   - Pass to Ollama LLM with context
   - Stream response via Vercel AI SDK

3. **Self-Hosted Stack:**
   - **Ollama** runs locally (CPU sufficient for 20 users, GPU optional)
   - **Qdrant** runs in Docker (lightweight, <100MB RAM for small data)
   - No external API calls = full data privacy

**Vercel AI SDK vs LangChain:**
- ✅ **Vercel AI SDK** - Cleaner API, native streaming, edge-compatible, better for Next.js
- ❌ **LangChain** - Powerful but complex (101kB gzipped), blocks edge runtime, overkill for simple RAG

**Use LangChain only if:**
- You need complex agent workflows (multi-step reasoning)
- LangGraph for human-in-the-loop workflows
- Otherwise, Vercel AI SDK is simpler and sufficient

**Ollama Model Recommendations:**
- **Llama 3.3 70B** - Best quality, requires GPU (16GB+ VRAM)
- **Mistral 7B** - Good balance, runs on CPU
- **Phi-4 (14B)** - Microsoft model, excellent for coding/reasoning
- **Gemma 2 (9B)** - Google model, good for general queries

**What NOT to use:**
- ❌ **OpenAI API** - Violates self-hosted requirement, data privacy concerns
- ❌ **Pinecone/Chroma cloud** - Not self-hosted, Qdrant is open-source alternative
- ❌ **LangChain for simple RAG** - Overkill, Vercel AI SDK simpler

### Authentication & Authorization

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **NextAuth.js v5** | `^5.x` (Auth.js) | Authentication | Open-source, self-hosted, zero cost. Full control over user data. Universal `auth()` function for App Router. | **HIGH** |
| **JWT** | Native to NextAuth | Sessions | Stateless sessions, works with self-hosted setup. No Redis needed initially. | **HIGH** |

**NextAuth.js v5 (Auth.js):**
- Rewritten for Next.js App Router (v15/16)
- Universal `auth()` works in Server Components, Actions, Routes
- Self-hosted = full control over sensitive HR data
- Zero vendor lock-in, no per-user pricing

**Authentication patterns for HRMS:**
- **Credentials provider** - Email/password for employees
- **Role-based access** - Admin, HR Manager, Employee roles
- **JWT sessions** - Stateless, no session store needed initially

**NextAuth vs Clerk:**
- ✅ **NextAuth** - Self-hosted, free, full control, perfect for HRMS
- ❌ **Clerk** - Managed service ($25/month after 10K MAUs), vendor lock-in, not self-hosted

**What NOT to use:**
- ❌ **Clerk/Auth0** - Not self-hosted, recurring costs, overkill for 20 users
- ❌ **Passport.js** - More complex, NextAuth is Next.js-native
- ❌ **Firebase Auth** - Google service, not self-hosted

### Development Tools

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **pnpm** | `^10.x` | Package manager | 70% less disk space than npm. Strict dependency resolution prevents phantom dependencies. Industry standard for monorepos and professional projects in 2026. | **HIGH** |
| **Biome** | `^2.3` | Linter + Formatter | Replaces ESLint + Prettier. 20x faster linting, unified tool (one config). Rust-based. 80%+ ESLint rule compatibility. | **HIGH** |
| **Vitest** | `^3.x` | Testing framework | Jest-compatible API but faster. Native ESM, HMR for tests. Perfect for Vite/Next.js projects. | **HIGH** |
| **Playwright** | `^1.51.x` | E2E testing | Best E2E framework in 2026. Parallel execution, multiple browsers. Test critical flows (payroll calculation, leave approval). | **HIGH** |

**pnpm over npm/yarn/bun:**
- Disk efficiency: Global content-addressable store (70% space savings)
- Strict: Prevents accidental dependencies (important for production apps)
- Fast: 3-5x faster than npm, nearly as fast as bun
- Mature: Production-ready, used by Microsoft, Shopify, TikTok

**Bun consideration:**
- ⚡ Fastest installs (10-30x faster than npm)
- ⚠️ Slightly less compatible (98% vs pnpm's 99.9%)
- 🤔 **Verdict:** Try bun for speed, fall back to pnpm if issues arise

**Biome vs ESLint + Prettier:**
- ✅ **Biome** - 20x faster, single tool, Rust-powered, future-proof
- ⚠️ Ecosystem younger (80%+ ESLint rules covered, improving monthly)
- 🤔 **Verdict:** Use Biome for new projects, ESLint if you need rare plugins

**What NOT to use:**
- ❌ **npm** - Slower, less disk-efficient than pnpm
- ❌ **ESLint + Prettier** - Slower, two tools to configure vs Biome's one
- ❌ **Jest** - Slower than Vitest, especially for TypeScript

### Deployment & Infrastructure

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Docker** | Latest | Containerization | Standard for self-hosted deployments. Next.js supports standalone output mode (optimized Docker builds). | **HIGH** |
| **Docker Compose** | Latest | Multi-container | Orchestrate Next.js + PostgreSQL + Redis + Ollama + Qdrant. Simple for single-server deployments. | **HIGH** |
| **Nginx** (optional) | Latest | Reverse proxy | Optional: SSL termination, load balancing if scaling beyond one server. | **MEDIUM** |

**Next.js Docker setup:**
```dockerfile
# Use standalone output mode in next.config.js
output: 'standalone'

# Dockerfile produces ~150MB image (vs 1GB+ without standalone)
# Perfect for self-hosted on modest hardware
```

**Docker Compose stack:**
- **nextjs** - Main app (port 3000)
- **postgres** - Database (port 5432)
- **redis** - Sessions/cache (port 6379)
- **ollama** - LLM server (port 11434)
- **qdrant** - Vector DB (port 6333)

**Hardware requirements (20 employees):**
- **Minimum:** 4 CPU cores, 8GB RAM, 100GB SSD
- **Recommended:** 8 CPU cores, 16GB RAM (for Ollama), 200GB SSD
- **With GPU:** Nvidia GPU (8GB+ VRAM) for faster LLM inference (optional)

**What NOT to use:**
- ❌ **Kubernetes** - Overkill for 20 employees, Docker Compose sufficient
- ❌ **Vercel/Netlify hosting** - Not self-hosted (contradicts requirements)
- ❌ **VM without Docker** - Harder to reproduce, Docker is standard

### Indian Compliance (Critical)

| Requirement | Implementation | Library/Approach | Confidence |
|------------|----------------|------------------|------------|
| **PF Calculation** | Custom logic | No npm library exists - build in-house with Zod validation | **HIGH** |
| **ESI Calculation** | Custom logic | Same as PF - threshold checks, rate calculations | **HIGH** |
| **PT (Prof Tax)** | State-wise logic | Config file per state (Maharashtra, Karnataka, etc.) | **HIGH** |
| **TDS Calculation** | Tax slab logic | FY-aware, HRA/80C exemptions, Form 16 generation | **MEDIUM** |
| **PDF Generation** | Payslips, Form 16 | `@react-pdf/renderer` or Puppeteer for HTML→PDF | **HIGH** |

**Critical insight: No reliable npm library for Indian payroll compliance.**

You MUST build custom:

1. **PF (Provident Fund):**
   - Employee: 12% of basic + DA (capped at ₹15,000 basic)
   - Employer: 12% (split: 3.67% to PF, 8.33% to Pension)
   - Validation: Zod schema for salary components

2. **ESI (Employee State Insurance):**
   - Applicable if gross ≤ ₹21,000/month
   - Employee: 0.75%, Employer: 3.25%

3. **Professional Tax:**
   - State-wise slabs (Maharashtra: ₹200-2,500/month based on gross)
   - Config-driven approach for multi-state companies

4. **TDS (Tax Deducted at Source):**
   - FY 2025-26 slabs (new regime vs old regime)
   - Exemptions: HRA, 80C (ELSS, PPF), 80D (insurance)
   - Form 16 generation (PDF with digital signature)

**PDF Generation for Payslips:**
- **Option 1:** `@react-pdf/renderer` - React components → PDF
- **Option 2:** Puppeteer - HTML template → PDF (more flexible styling)
- **Recommendation:** Puppeteer for custom brand, better fonts, Indian languages

**Data source for tax rules:**
- Income Tax Department (incometax.gov.in)
- EPFO portal (epfindia.gov.in)
- ESIC portal (esic.gov.in)
- Update annually (budget announcements in February)

**What NOT to do:**
- ❌ Don't rely on npm packages for Indian compliance (none are maintained/accurate)
- ❌ Don't hardcode rates (make them config-driven for annual updates)
- ❌ Don't skip validations (use Zod for salary component validation)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| **Framework** | Next.js 16 | Remix | Smaller ecosystem, less Indian community support |
| **Database** | PostgreSQL | MySQL | Weaker JSON support, less suitable for complex reporting |
| **ORM** | Prisma | Drizzle | Drizzle newer, less mature ecosystem despite better performance |
| **UI** | shadcn/ui | MUI | MUI heavier (300kb+), harder to customize, Material Design not needed |
| **State** | TanStack Query | Redux | Redux overkill, Server Components reduce client state needs |
| **Forms** | React Hook Form | Formik | Formik causes more re-renders, heavier bundle |
| **Validation** | Zod | Yup | Yup larger, Zod has better TS integration |
| **AI** | Vercel AI SDK | LangChain | LangChain 101kb bundle, overkill for simple RAG |
| **LLM** | Ollama | OpenAI API | OpenAI violates self-hosted requirement, data privacy risk |
| **Vector DB** | Qdrant | Weaviate | Qdrant simpler to self-host, faster for small datasets |
| **Auth** | NextAuth v5 | Clerk | Clerk not self-hosted, $25/month cost, vendor lock-in |
| **Package Mgr** | pnpm | npm | npm slower, less disk-efficient, no strict mode |
| **Linter** | Biome | ESLint+Prettier | Biome 20x faster, single tool, future-proof |
| **Testing** | Vitest | Jest | Jest slower, especially with TypeScript |

---

## Installation & Setup

### 1. Initialize Project

```bash
# Create Next.js app with recommended settings
npx create-next-app@latest shreehr --typescript --tailwind --app --src-dir --import-alias "@/*"

cd shreehr

# Switch to pnpm (or bun)
pnpm install

# Or use bun for faster installs
bun install
```

### 2. Install Core Dependencies

```bash
# Database & ORM
pnpm add prisma @prisma/client
pnpm add -D prisma

# State & Data Fetching
pnpm add @tanstack/react-query zustand

# Forms & Validation
pnpm add react-hook-form zod @hookform/resolvers

# UI Components
pnpm add @radix-ui/react-* lucide-react class-variance-authority clsx tailwind-merge
# (or use shadcn/ui CLI to add components)

# Authentication
pnpm add next-auth@beta # v5 is in beta as of Feb 2026

# AI & RAG
pnpm add ai @ai-sdk/openai # Vercel AI SDK (works with Ollama via OpenAI-compatible API)
pnpm add @qdrant/js-client-rest # Qdrant vector DB client
```

### 3. Install Dev Dependencies

```bash
# Development tools
pnpm add -D @biomejs/biome vitest @vitejs/plugin-react
pnpm add -D @playwright/test

# TypeScript & Types
pnpm add -D @types/node @types/react @types/react-dom

# Docker (create files manually)
# - Dockerfile
# - docker-compose.yml
# - .dockerignore
```

### 4. Setup Biome (Linter + Formatter)

```bash
pnpm add -D @biomejs/biome
pnpm biome init # Creates biome.json

# Add to package.json scripts:
# "lint": "biome check .",
# "format": "biome format --write .",
```

### 5. Setup Prisma

```bash
pnpm prisma init # Creates prisma/schema.prisma

# Define schema, then:
pnpm prisma migrate dev --name init
pnpm prisma generate
```

### 6. Setup shadcn/ui

```bash
# Install shadcn/ui CLI
pnpm dlx shadcn@latest init

# Add components as needed
pnpm dlx shadcn@latest add button form input
```

### 7. Docker Setup

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: shreehr
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"

  qdrant:
    image: qdrant/qdrant:latest
    volumes:
      - qdrant_data:/qdrant/storage
    ports:
      - "6333:6333"

volumes:
  postgres_data:
  ollama_data:
  qdrant_data:
```

Run: `docker-compose up -d`

---

## Version Management

| Dependency | Current (Feb 2026) | Update Strategy | Breaking Change Risk |
|------------|-------------------|----------------|---------------------|
| Next.js | 16.1.6 | Patch updates safe, minor updates review, major updates (17.x) plan carefully | Medium (App Router stable but evolving) |
| React | 19.2.4 | Patch updates safe, minor updates safe, major updates rare | Low (19.x is stable) |
| Prisma | 6.x | Minor updates safe, major updates review schema | Low-Medium |
| TanStack Query | 5.90.19 | Patch/minor safe, major (6.x) review breaking changes | Medium (v5→v6 will have changes) |
| Zod | 4.3.6 | Patch/minor safe, major updates rare | Low |
| shadcn/ui | N/A (copy-paste) | Update components manually by re-copying | Low (you control the code) |
| Biome | 2.3 | Frequent updates, usually backwards compatible | Low-Medium |
| pnpm | 10.x | Minor/patch safe, major updates review | Low |

**Update policy:**
- **Weekly:** Check `pnpm outdated` for patches
- **Monthly:** Review minor updates, test in dev
- **Quarterly:** Plan major updates with testing

---

## Architecture Decision Records (ADRs)

### ADR-001: Why Next.js over Remix/Astro?
**Decision:** Next.js 16 with App Router
**Reason:** Largest ecosystem, best for full-stack apps, excellent Docker support, strong Indian community
**Trade-off:** Vercel-centric docs, but self-hosting well-documented

### ADR-002: Why PostgreSQL over MySQL?
**Decision:** PostgreSQL 16
**Reason:** Superior JSON support (employee metadata), better for complex queries (reports), ACID compliance for payroll
**Trade-off:** Slightly more complex setup than MySQL, but worth it

### ADR-003: Why Prisma over Drizzle?
**Decision:** Prisma 6.x
**Reason:** More mature, better migrations, Prisma Studio GUI, larger ecosystem
**Trade-off:** Slightly slower than Drizzle, but DX > performance for 20 employees

### ADR-004: Why Server Actions over tRPC?
**Decision:** Next.js Server Actions
**Reason:** Simpler for small team (20 employees), built-in, zero setup, type-safe
**Trade-off:** Less powerful than tRPC for complex APIs, but sufficient for HRMS

### ADR-005: Why Vercel AI SDK over LangChain?
**Decision:** Vercel AI SDK 6.x
**Reason:** Cleaner API, native streaming, edge-compatible, better for Next.js, sufficient for RAG
**Trade-off:** LangChain more powerful for complex agents, but overkill here

### ADR-006: Why Ollama over OpenAI API?
**Decision:** Ollama for local LLM
**Reason:** Self-hosted requirement, data privacy (HR data sensitive), zero API costs
**Trade-off:** Requires GPU for best performance, but CPU sufficient for 20 users

### ADR-007: Why Qdrant over Weaviate?
**Decision:** Qdrant vector database
**Reason:** Simpler to self-host, faster for small datasets (<10K vectors), Rust-based (performance)
**Trade-off:** Weaviate has more features (GraphQL), but Qdrant sufficient for HRMS

### ADR-008: Why NextAuth v5 over Clerk?
**Decision:** NextAuth.js v5 (Auth.js)
**Reason:** Self-hosted, zero cost, full control over HR data, no vendor lock-in
**Trade-off:** More setup than Clerk, but worth it for self-hosting

### ADR-009: Why pnpm over npm/bun?
**Decision:** pnpm 10.x
**Reason:** 70% disk savings, strict dependency resolution (prevents bugs), fast, production-ready
**Trade-off:** Bun faster (10-30x) but less mature, pnpm is safe choice

### ADR-010: Why Biome over ESLint+Prettier?
**Decision:** Biome 2.3
**Reason:** 20x faster, single tool (vs two), Rust-based, future-proof, 80%+ rule coverage
**Trade-off:** Younger ecosystem, but growing fast, sufficient for greenfield project

---

## Special Considerations for Indian HRMS

### 1. Statutory Compliance (Critical)
- **No npm libraries exist** - Must build PF/ESI/PT/TDS logic in-house
- Make configurable (rates change annually in budget)
- Use Zod schemas for salary component validation
- Store audit logs (compliance requirement)

### 2. Financial Year Handling
- Indian FY: April 1 - March 31 (not Jan-Dec)
- Tax calculations, Form 16, reports must respect FY
- Store FY in database schema (not just year)

### 3. Multi-State Support
- Professional Tax varies by state (Maharashtra, Karnataka, etc.)
- Store employee's state in schema
- Config-driven PT slabs per state

### 4. Document Generation
- Payslips, Form 16, appointment letters in PDF
- Support Indian languages (Devanagari fonts for Hindi)
- Digital signatures (e-sign) for official documents

### 5. Data Privacy
- HR data is sensitive (PAN, Aadhaar, salary, bank details)
- Encrypt PII in database (Prisma field-level encryption or db-level)
- Audit logs for data access (compliance requirement)
- Self-hosted = no third-party data exposure

### 6. Holidays & Leave Rules
- Indian holidays (national + state-specific)
- Leave types: Casual, Sick, Earned, Maternity, Paternity
- Different leave policies per company (configurable)

### 7. Attendance Patterns
- Flexible hours, shift work, WFH tracking
- Half-day, late arrival, early departure rules
- Integration with biometric devices (optional, via APIs)

---

## Migration from Keka

### Data Export from Keka
1. Export employees, attendance, leave, payroll data (CSV/Excel)
2. Map to your Prisma schema
3. Write migration scripts (Prisma seed or custom Node script)

### Key data to migrate:
- Employee master (name, email, PAN, bank, salary structure)
- Historical attendance (last 2-3 months minimum)
- Leave balances (opening balance for current year)
- Payroll history (last 12 months for Form 16)

### Validation:
- Cross-check employee count
- Verify leave balances sum up correctly
- Test payroll calculation against Keka's last payslip

---

## Cost Analysis (Self-Hosted)

### Infrastructure Costs (per month)
| Item | Estimated Cost |
|------|---------------|
| **Server** (AWS EC2 t3.xlarge or bare metal) | ₹5,000 - ₹15,000/month |
| **Storage** (200GB SSD) | Included or minimal |
| **Backup** (S3 or external) | ₹500 - ₹1,000/month |
| **SSL Certificate** (Let's Encrypt free or wildcard) | ₹0 - ₹5,000/year |
| **Maintenance** (DevOps time) | Internal team or ₹10,000/month |
| **Total** | **₹6,000 - ₹20,000/month** |

### Cost Comparison to Keka
- **Keka:** ₹999/user/month = ₹19,980/month for 20 users = ₹2,39,760/year
- **Self-hosted:** ₹1,00,000 - ₹2,00,000/year (server + dev time)
- **Savings:** ₹40,000 - ₹1,40,000/year + full control

### One-Time Costs
| Item | Estimated Cost |
|------|---------------|
| **Development** (if outsourced) | ₹5,00,000 - ₹15,00,000 |
| **Migration** (data + testing) | ₹50,000 - ₹1,00,000 |
| **GPU** (optional, for faster LLM) | ₹50,000 - ₹2,00,000 (one-time) |

**ROI Timeline:**
- If building in-house with existing team: ROI in 1-2 years
- If outsourcing development: ROI in 2-3 years
- Intangible benefits: Full control, custom features, data privacy

---

## Performance Expectations

### Load Times (20 employees)
- **Dashboard:** < 1 second (Server Components)
- **Employee list:** < 500ms (optimized query, indexed)
- **Payroll calculation:** < 2 seconds for 20 employees
- **AI chat response:** 2-5 seconds (Ollama on CPU), <1s on GPU

### Database Size (Year 1)
- **Employees:** 20 rows × 2KB = 40KB
- **Attendance:** 20 × 250 days × 200 bytes = 1MB
- **Leave:** 20 × 50 records × 500 bytes = 500KB
- **Payroll:** 20 × 12 months × 5KB = 1.2MB
- **Total:** ~5MB/year (negligible, PostgreSQL handles GB easily)

### Backup Strategy
- **Daily:** Automated PostgreSQL dumps (pg_dump)
- **Weekly:** Full snapshot (Docker volumes)
- **Monthly:** Offsite backup (AWS S3 or external)

---

## Security Checklist

- [ ] Environment variables (`.env`) not committed to Git
- [ ] Database credentials rotated quarterly
- [ ] HTTPS enforced (Let's Encrypt or corporate cert)
- [ ] Content Security Policy (CSP) headers configured
- [ ] Rate limiting on auth endpoints (prevent brute force)
- [ ] Input validation with Zod on all forms
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] XSS prevented (React auto-escapes, but validate rich text)
- [ ] CSRF tokens (NextAuth handles this)
- [ ] Audit logs for sensitive actions (payroll, data export)
- [ ] PII encryption (PAN, Aadhaar, bank details)
- [ ] Regular backups tested (restore drill quarterly)
- [ ] Dependency updates (pnpm audit weekly)
- [ ] Biome/ESLint security rules enabled
- [ ] Docker images from official sources only
- [ ] Network segmentation (database not exposed to internet)

---

## Sources

### Official Documentation (HIGH Confidence)
- [Next.js Documentation](https://nextjs.org/docs) - Next.js 15/16 features, self-hosting guide
- [React Documentation](https://react.dev/) - React 19 features
- [Prisma Documentation](https://www.prisma.io/docs) - ORM and migrations
- [TanStack Query Documentation](https://tanstack.com/query/latest) - v5 features and Next.js integration
- [Zod GitHub Repository](https://github.com/colinhacks/zod) - v4.3.6 release, features
- [shadcn/ui Documentation](https://ui.shadcn.com/) - Component library, Radix/Base UI support
- [Vercel AI SDK Documentation](https://ai-sdk.dev/) - v6 features, LangChain adapter
- [NextAuth.js Documentation](https://authjs.dev/) - v5 (Auth.js) features

### 2026 Ecosystem Research (MEDIUM-HIGH Confidence)
- [Next.js 15 Self-Hosting Guide (2025)](https://ketan-chavan.medium.com/production-nextjs-15-the-complete-self-hosting-guide-f1ff03f782e7)
- [Modern Full Stack Application Architecture Using Next.js 15+](https://softwaremill.com/modern-full-stack-application-architecture-using-next-js-15/)
- [Complete Guide to RAG and Vector Databases in 2026](https://solvedbycode.ai/blog/complete-guide-rag-vector-databases-2026)
- [Top 6 Vector Database Solutions for RAG Applications: 2026](https://azumo.com/artificial-intelligence/ai-insights/top-vector-database-solutions)
- [React Hook Form with Zod: Complete Guide for 2026](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1)
- [Biome: The ESLint and Prettier Killer? Complete Migration Guide for 2026](https://dev.to/pockit_tools/biome-the-eslint-and-prettier-killer-complete-migration-guide-for-2026-27m)
- [pnpm vs npm vs yarn vs Bun: The 2026 Package Manager Showdown](https://dev.to/pockit_tools/pnpm-vs-npm-vs-yarn-vs-bun-the-2026-package-manager-showdown-51dc)
- [LangChain vs Vercel AI SDK vs OpenAI SDK: 2026 Guide](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide)

### Community Resources (MEDIUM Confidence)
- [tRPC vs Server Actions in Next.js](https://caisy.io/blog/trpc-vs-server-actions)
- [shadcn/ui, Radix, and Base UI Explained](https://certificates.dev/blog/starting-a-react-project-shadcnui-radix-and-base-ui-explained)
- [15 Best React UI Libraries for 2026](https://www.builder.io/blog/react-component-libraries-2026)
- [React Server Components + TanStack Query: The 2026 Data-Fetching Power Duo](https://dev.to/krish_kakadiya_5f0eaf6342/react-server-components-tanstack-query-the-2026-data-fetching-power-duo-you-cant-ignore-21fj)

### npm Registry (HIGH Confidence)
- next@16.1.6 - Published January 2026
- react@19.2.4 - Published January 2026
- @tanstack/react-query@5.90.19 - Published February 2026

### Indian Compliance (MEDIUM Confidence - Manual Implementation Required)
- [Income Tax Department India](https://incometax.gov.in) - TDS slabs, tax rules
- [EPFO Portal](https://epfindia.gov.in) - PF rules and rates
- [ESIC Portal](https://esic.gov.in) - ESI thresholds and rates
- **Note:** No reliable npm packages for Indian payroll compliance exist as of Feb 2026

---

## Confidence Assessment

| Area | Confidence | Reasoning |
|------|-----------|-----------|
| **Core Stack** (Next.js, React, TypeScript) | **HIGH** | Verified via official docs and npm registry. Next.js 16.1.6 and React 19.2.4 current. |
| **Database** (PostgreSQL, Prisma) | **HIGH** | Industry standard, well-documented, proven for HRMS use cases. |
| **UI** (shadcn/ui, Tailwind) | **HIGH** | 2026 standard for Next.js apps. Radix→Base UI transition documented. |
| **State Management** (TanStack Query, Server Actions) | **HIGH** | Official Next.js 16 patterns. TanStack Query v5.90.19 current. |
| **Forms** (React Hook Form, Zod) | **HIGH** | Zod v4.3.6 verified. React Hook Form industry standard. |
| **AI Stack** (Vercel AI SDK, Ollama, Qdrant) | **HIGH** | 2026 guides and official docs confirm this stack for self-hosted RAG. |
| **Auth** (NextAuth v5) | **HIGH** | Official v5 docs for App Router. Self-hosted, zero cost. |
| **Dev Tools** (pnpm, Biome, Vitest) | **HIGH** | 2026 standard. Biome v2.3, pnpm 10.x, performance benchmarks verified. |
| **Indian Compliance** | **MEDIUM** | No npm packages exist - requires custom implementation. Tax rules verified via govt portals. |
| **Deployment** (Docker) | **HIGH** | Next.js standalone mode documented. Docker Compose standard for self-hosting. |

---

## Open Questions / Flags for Phase Research

1. **Biometric Integration:** Does client need fingerprint/RFID attendance? (Would need hardware integration research)
2. **Mobile App:** Future requirement? (Would necessitate tRPC over Server Actions)
3. **Multi-Tenancy:** Plan to sell to other companies? (Would change architecture significantly)
4. **Advanced Reporting:** Need for BI dashboards? (Might consider Metabase/Superset integration)
5. **Existing Systems:** Any existing HR tools to integrate? (Would need API research)

---

## Final Recommendation

**For ShreeHR (20-person Indian company, self-hosted, replacing Keka):**

✅ **Core Stack:**
- Next.js 16 + React 19 + TypeScript 5.9
- PostgreSQL 16 + Prisma 6
- shadcn/ui (Base UI variant) + Tailwind 4

✅ **Features:**
- TanStack Query 5 + Server Actions
- React Hook Form + Zod validation
- NextAuth v5 (self-hosted auth)

✅ **AI:**
- Vercel AI SDK 6 + Ollama + Qdrant
- Self-hosted RAG for HR policy chatbot

✅ **DevOps:**
- pnpm 10 + Biome 2.3 + Vitest 3
- Docker Compose for deployment

✅ **Indian Compliance:**
- Custom PF/ESI/PT/TDS logic (no npm packages)
- Puppeteer for payslip/Form 16 PDFs

**This stack is:**
- ✅ Modern (2026 standards)
- ✅ Type-safe (TypeScript + Zod everywhere)
- ✅ Self-hostable (Docker Compose, no vendor lock-in)
- ✅ Cost-effective (open-source, no per-user fees)
- ✅ Maintainable (20 employees, simple team)
- ✅ AI-ready (local LLM + RAG)

**Confidence:** HIGH for all core decisions, MEDIUM for Indian compliance (requires custom work).

**Ready to proceed to roadmap creation.**
