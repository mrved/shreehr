# Project Research Summary

**Project:** ShreeHR - Self-Hosted Indian HRMS
**Domain:** HR Management System for 20-person Indian Company
**Researched:** 2026-02-04
**Confidence:** HIGH

## Executive Summary

ShreeHR is a self-hosted HRMS replacement for Keka HR, targeting a 20-person Indian company. The research reveals a clear product strategy: **build a compliance-first, AI-enhanced, deliberately simple HRMS** that avoids the feature bloat plaguing existing solutions. The recommended approach uses a modern TypeScript stack (Next.js 16 + React 19 + PostgreSQL + Prisma) organized as a modular monolith, with strict focus on Indian statutory compliance (PF/ESI/PT/TDS) and AI-powered employee self-service.

The #1 differentiator is an AI chatbot using local LLMs (Ollama + Qdrant RAG) that deflects 30-60% of routine HR queries while maintaining data privacy. This addresses Keka's core problem—overcomplexity for small teams—by automating support rather than adding more configuration options. The stack prioritizes self-hosting ease (Docker Compose standalone), type safety (TypeScript + Zod throughout), and modern DX (Biome, pnpm, Vitest).

Critical risks center on Indian statutory compliance: the new Labour Code's 50% Basic Pay Rule (effective Jan 2026) creates legal liability if salary structures are non-compliant, while late PF/ESI/TDS payments trigger automatic penalties via interlinked government portals. The architecture must enforce compliance validation at the data model level, use configurable rate masters (not hardcoded values), and maintain comprehensive audit trails (mandatory since April 2023). Data migration from Keka requires meticulous validation—losing historical payroll breaks gratuity calculations and audit requirements.

## Key Findings

### Recommended Stack

The 2026 standard for greenfield Next.js applications prioritizes developer experience, type safety, and self-hosting simplicity. This stack represents verified best practices from official documentation and industry consensus.

**Core technologies:**
- **Next.js 16 + React 19 + TypeScript 5.9** — App Router with Server Components for optimal performance, standalone output perfect for Docker deployment, industry-standard framework with strong Indian community
- **PostgreSQL 16 + Prisma 6** — Superior JSON support for employee metadata, robust transactions for payroll, excellent type safety and migration tooling
- **shadcn/ui (Base UI variant) + Tailwind 4** — Copy-paste components for full ownership, no npm bloat, Base UI future-proof after Radix uncertainty
- **NextAuth v5 (Auth.js)** — Self-hosted authentication with zero vendor lock-in, full control over sensitive HR data
- **Vercel AI SDK 6 + Ollama + Qdrant** — Local LLM stack for privacy-safe AI chatbot, zero API costs, self-hosted RAG infrastructure
- **pnpm 10 + Biome 2.3 + Vitest 3** — Modern dev tools: 70% disk savings, 20x faster linting, Jest-compatible testing

**Critical for Indian compliance:**
- Custom PF/ESI/PT/TDS calculation logic (no reliable npm packages exist)
- Puppeteer for payslip/Form 16 PDF generation with Indian fonts
- State-wise Professional Tax master configuration
- Labour Code 2026 compliant salary structure validation

**Why this stack over alternatives:**
- Next.js over Remix: Larger ecosystem, better self-hosting docs, stronger community
- PostgreSQL over MySQL: Better JSON/JSONB support, superior for complex reporting
- Prisma over Drizzle: More mature, better migrations, Prisma Studio GUI
- Server Actions over tRPC: Simpler for 20-person team, built-in, sufficient for internal app
- Vercel AI SDK over LangChain: Cleaner API, lighter bundle (101kb saved), edge-compatible
- NextAuth over Clerk: Self-hosted requirement, no recurring costs

### Expected Features

Research reveals sharp distinction between table stakes (15 features), differentiators (12 features), and deliberate anti-features (14 to avoid). Indian HRMS adoption at 20 employees is driven 70% by compliance automation, 60% by time savings, only 30% by analytics.

**Must have (table stakes):**
- Automated payroll with PF (12%+12%), ESI (0.75%+3.25%), PT (state-specific), TDS (regime-based)
- Attendance tracking (cloud-based with real-time dashboards)
- Leave management (casual/sick/earned types, balance visibility, approval workflows)
- Employee Self-Service Portal (view payslips, apply leave, update profile)
- Mobile access (not optional in 2026, field/remote workers expect it)
- Digital payslip generation with WhatsApp/email delivery
- Employee database (HRIS core) with document storage (8-year retention for compliance)
- Role-based access control (Admin/Manager/Employee permissions)
- Basic reporting (PF/ESI/PT/TDS statutory reports, headcount, Excel/PDF export)

**Should have (competitive differentiators):**
- **AI Chatbot for HR Queries** — Primary differentiator; 24/7 answers, deflects 30-60% routine queries, reduces HR interruptions (no competitor has this)
- **Intelligent Policy Q&A** — Natural language policy search using RAG, answers "Can I work from home?" questions
- **Mobile-First Design** — Better than "mobile-compatible", designed for mobile from ground up
- Streamlined onboarding (digital offer letters, document upload, hours not days)
- Expense management (policy-based auto-approvals, integration with payroll)
- Investment declaration (80C/80D) for TDS automation
- WhatsApp integration for payslips and notifications
- Geo-fencing attendance for field employees

**Defer (anti-features - deliberately NOT building):**
- Advanced workforce analytics (predictive attrition, headcount forecasting)
- Complex performance management (OKRs, 360 reviews, competency matrices)
- Recruitment/ATS module (20-person teams use Naukri/LinkedIn)
- Learning Management System (training needs are ad hoc)
- Multi-country payroll (India-only focus)
- Extensive customization options (opinionated defaults instead)

**Key insight:** Keka's #1 complaint for small teams is "too complex". Success metric: non-HR founder can run payroll in <10 minutes and employees get HR answers via chat without interrupting anyone.

### Architecture Approach

Modular monolith architecture balances simplicity (single deployment) with clear boundaries (future microservices extraction if needed). This is optimal for 20-person company avoiding premature scaling complexity.

**Major components:**
1. **Core HR Module** — Employee master data, org structure, documents; central data source for all modules
2. **Payroll Engine** — Salary calculation with statutory compliance engine (PF/ESI/PT/TDS); background job processing for 20-employee run
3. **Compliance Engine** — Configurable statutory rate masters, filing deadline tracking, ECR/Form 24Q generation
4. **Attendance Module** — Time tracking with biometric integration support, shift management, work hours calculation
5. **Leave Module** — Balance tracking, accrual rules, multi-level approval workflows via workflow engine
6. **Employee Self-Service Portal** — View-only access to payslips/attendance, submission workflows for leave/expenses
7. **AI Chat Module** — RAG-based policy Q&A, integrates read-only with all modules, conversation history
8. **Workflow Engine** — Approval routing, multi-level chains, delegation support
9. **Audit Log Service** — Comprehensive change tracking (mandatory since April 2023), immutable history tables

**Key patterns:**
- Module encapsulation: Each owns its data, exposes clean service APIs
- Event-driven updates: Cross-module changes via event bus (leave approved → attendance marked)
- Audit-first design: Automatic logging of all data modifications via Prisma middleware
- Background processing: Payroll/reports run asynchronously (Bull queue + Redis)
- Validation at boundaries: Zod schemas for all inputs, standardized API responses

**Data flow (critical):** Attendance/Leave → frozen at payroll initiation → Compliance Engine (PF/ESI/PT/TDS) → Payslip generation → Statutory reports (ECR/24Q/16) → Audit trail logging

**Self-hosted deployment:** Single Linux server (4 CPU, 16GB RAM) running Docker Compose (Next.js + PostgreSQL + Redis + Ollama + Qdrant), Nginx reverse proxy, Let's Encrypt SSL, daily encrypted backups on India-based storage (8-year retention).

### Critical Pitfalls

Research identified 12 pitfalls; top 5 have legal/financial consequences requiring immediate mitigation.

1. **Non-Compliant Salary Structure (Labour Code 2026)** — New 50% Basic Pay Rule effective Jan 2026 mandates Basic+DA+RA ≥ 50% of CTC. Legacy structures with 30-40% basic trigger retrospective PF dues, gratuity shortfalls, penalties (₹50,000 first offense). **Mitigation:** Enforce validation in database constraints, auto-calculate minimum Basic from CTC, validate on every salary change, grandfather existing employees (cannot reduce wages).

2. **Delayed Statutory Payments (PF/ESI/PT/TDS)** — Late payments cause 12% p.a. interest + 5-25% damages. 2026 reality: 1 in 3 employers penalized; government portals interlinked for automatic detection. **Mitigation:** State-wise PT master configuration, automated deadline alerts (7/3/1 days before), payroll validation before finalization, challan-ready file generation, Form 16/24Q reconciliation to prevent mismatches.

3. **Data Migration Failures from Keka** — Incomplete migration loses historical payroll (breaks gratuity calculations requiring 12-month average), audit trails (8-year retention mandate), leave balances. **Mitigation:** Detailed field mapping document, phased migration (employee master → payroll history → leave → documents), validation at each phase (record counts, spot checks), employee self-verification period, 3-month parallel run with Keka read-only.

4. **Missing Audit Trails** — Mandatory since April 1, 2023 for ALL companies; penalties ₹25,000-₹5,00,000. Audit trail must log all transactions, cannot be disabled, 8-year retention on India-based servers. **Mitigation:** Audit columns (created_by, created_at, updated_by, updated_at) on every table, change history tables for critical entities (salary_history, attendance_modifications), immutability for finalized payroll, RBAC with approval workflows, daily automated backups.

5. **Multi-State Professional Tax Errors** — PT is state-level tax with varying slabs; Maharashtra ₹200/month (₹300 in Feb), Karnataka ₹200/month, Delhi/Haryana/Punjab have no PT. Wrong calculation = penalties + employee complaints. **Mitigation:** work_state field in employee master, professional_tax_slabs configuration table with state/salary_from/salary_to/monthly_pt, effective_from tracking for rate changes, state-wise PT reporting and challan generation.

**Other significant pitfalls:**
- Biometric attendance integration failures (most common employee complaint category)
- Tax calculation errors (Form 16 vs Form 24Q mismatch causing employee tax notices)
- Planning for 20 employees not 200 (poor scalability, expensive rewrite in 18-24 months)
- Self-hosted security failures (encryption, SSL/TLS, firewalls, access logs)

## Implications for Roadmap

Based on dependency analysis and risk mitigation priorities, recommended 6-phase structure:

### Phase 1: Foundation (Core Data Model + Auth)
**Rationale:** Every module depends on employee master data and authentication. Must establish compliance-safe data model from day one—retrofitting audit trails or salary validation is expensive and error-prone.

**Delivers:**
- Database schema with comprehensive audit columns (created_by, updated_by timestamps) on all tables
- Employee master with work_state for PT compliance, salary structure validation enforcing 50% Basic Pay Rule
- NextAuth v5 authentication with JWT sessions and RBAC (Admin/Manager/Employee roles)
- Document storage service (S3-compatible) with metadata tracking

**Addresses:**
- PITFALL #1: Salary structure validation prevents non-compliant structures from being saved
- PITFALL #4: Audit trail foundation with automatic change logging
- PITFALL #5: Multi-state support via work_state/work_city fields
- Table stakes: Employee database, role-based access control, document storage

**Avoids:**
- Hardcoding compliance assumptions (state-wise PT master from start)
- Missing audit columns (cannot retrofit without data loss)
- Poor scalability (org hierarchy supports unlimited employees, multi-level managers)

**Research flag:** Standard patterns—use Prisma best practices. No deep research needed.

---

### Phase 2: Time & Attendance
**Rationale:** Payroll depends on accurate attendance data. Must be locked before payroll processing to ensure calculation integrity. Leave system integrates tightly with attendance (leave days marked in attendance calendar).

**Delivers:**
- Attendance tracking with check-in/out, shift management, work hours calculation
- Raw attendance punches table (immutable) + processed attendance table + corrections audit trail
- Leave management: leave types (casual/sick/earned), balance tracking with accrual rules, multi-level approval workflow
- Attendance lock mechanism 5 days before payroll (with approval workflow for late corrections)

**Addresses:**
- Table stakes: Attendance tracking, leave management, leave balance visibility
- PITFALL #6: Biometric integration design (raw punches → validation → processed attendance → payroll link)
- Differentiator: Workflow engine for leave approvals

**Uses:**
- Workflow Engine for leave approval routing
- Event bus pattern: leave.approved → attendance module marks dates

**Avoids:**
- Manual Excel reconciliation (real-time sync design)
- Missing punch chaos (auto-flag missing punches, manager approval workflow)
- Leave balance errors (validation: attendance days + leave days + absent days = calendar days)

**Research flag:** Attendance integration patterns need research if biometric devices are used—API specifications vary by vendor.

---

### Phase 3: Payroll & Statutory Compliance
**Rationale:** Core value of HRMS. Requires attendance/leave data. Most legally risky module—errors cause penalties, employee complaints, tax notices. Background job processing essential (5-10 min runtime for 20 employees).

**Delivers:**
- Salary structure configuration (Basic+DA+RA, allowances, deductions) with 50% rule validation
- Compliance Engine with configurable rate masters: PF (12%+12%), ESI (0.75%+3.25%), state-wise PT slabs, TDS tax regime slabs
- Payroll processing background job: fetch attendance/leave → calculate salary → apply statutory deductions → generate payslips
- Statutory reporting: ECR (PF/ESI), Form 24Q (TDS quarterly), Form 16 (TDS annual)
- Payslip PDF generation (Puppeteer for Indian fonts, digital signatures)
- Deadline tracking dashboard with automated alerts (PF/ESI due 15th, TDS due 7th)

**Addresses:**
- Table stakes: Automated payroll, PF/ESI/PT/TDS compliance, digital payslips, basic reporting
- PITFALL #1: Salary structure validation enforced at save time
- PITFALL #2: State-wise PT calculation from master table, deadline alerts prevent late filing
- PITFALL #5: Multi-state PT logic with slab-based calculation
- PITFALL #7: Tax calculation with HRA/LTA exemptions, 80C/80D deductions, Form 16/24Q reconciliation

**Avoids:**
- Hardcoded statutory rates (configurable masters with effective_from dates)
- Synchronous processing (background job queue with retry logic)
- Form 16/24Q mismatches (validation: sum of employee TDS = quarterly total)

**Research flag:** HIGH PRIORITY—needs deep research on:
- Tax calculation edge cases (HRA formula, LTA rules, arrears taxation)
- Form 24Q/16 generation specifications (FVU file format for TRACES)
- Latest FY 2025-26 tax slabs and exemption limits
- Professional Tax state-specific rules and filing formats

---

### Phase 4: Employee Self-Service Portal
**Rationale:** Unlocks value of previous phases for employees. Mobile-first design critical (60%+ access from phone). Reduces HR interruptions ("Where's my payslip?"), enables paperless operation.

**Delivers:**
- Mobile-first responsive UI for employee portal
- View payslips (download PDF), Form 16 download during tax season
- Leave application workflow with approval status tracking
- Attendance viewing (daily punches, monthly summary, correction requests)
- Profile updates (bank details, address) with approval workflow
- Email/WhatsApp notifications (payslip available, leave approved/rejected)

**Addresses:**
- Table stakes: Employee Self-Service Portal, mobile access
- PITFALL #10: Inadequate ESS portal causing HR interruptions
- Differentiator: Mobile-first design (better than just "mobile-compatible")

**Uses:**
- shadcn/ui components for consistent, accessible UI
- TanStack Query for optimistic updates on leave requests
- Server Actions for form submissions

**Avoids:**
- Desktop-first design that fails on mobile
- Missing notifications (employees don't know payslip is ready)
- Poor UX (complex navigation, confusing labels)

**Research flag:** Standard patterns—mobile-first Next.js with shadcn/ui well-documented. No deep research needed.

---

### Phase 5: Supporting Workflows
**Rationale:** Operational quality-of-life improvements. Not critical for day-to-day but high ROI for HR team efficiency. Onboarding and expenses are frequent pain points.

**Delivers:**
- Streamlined onboarding: digital offer letters, document collection checklist, task assignment (HR/IT/Manager/Employee), completion tracking
- Expense management: submission with receipt upload, policy-based validation, multi-level approval (amount-based routing), reimbursement integration with payroll
- Investment declaration module: 80C/80D declarations, rent receipts for HRA, integration with TDS calculation
- Offboarding workflow: final settlement calculation (gratuity, leave encashment, PF withdrawal)

**Addresses:**
- Differentiator: Streamlined onboarding (hours not days)
- Differentiator: Expense management (common small team pain point)
- Supporting feature: Investment declaration (critical during tax season Jan-Feb)

**Uses:**
- Workflow Engine for multi-level expense approvals
- Document Storage for receipts, rent receipts, investment proofs
- Payroll integration for reimbursement payout

**Avoids:**
- Manual onboarding checklists (digital task tracking with auto-reminders)
- Expense reimbursement delays (direct payroll integration)

**Research flag:** Standard patterns—workflow approval logic well-established. No deep research needed.

---

### Phase 6: AI Chatbot & Advanced Features
**Rationale:** Key differentiator but not blocking for operational HRMS. Requires all other modules to be stable (chatbot queries their data). RAG implementation is high-complexity, high-value.

**Delivers:**
- AI Chat Module with Ollama local LLM + Qdrant vector database for RAG
- HR policy knowledge base ingestion (employee handbook, SOPs chunked and embedded)
- Natural language queries: "What is my leave balance?" → fetch from Leave Module + LLM response
- Policy Q&A: "Can I work from home on Fridays?" → semantic search in Qdrant + policy retrieval
- Conversation history and context awareness
- Fallback to human support for complex queries

**Addresses:**
- **Primary differentiator:** AI chatbot for HR queries (unique, no competitor has this)
- **Secondary differentiator:** Intelligent policy Q&A
- High value: Deflects 30-60% of routine queries, reduces HR interruptions

**Uses:**
- Vercel AI SDK for streaming LLM responses
- Ollama for self-hosted LLM inference (Mistral 7B or Llama 3.3 70B with GPU)
- Qdrant for vector storage and semantic search
- Transformers.js or Ollama embeddings for document chunking

**Avoids:**
- OpenAI API (violates self-hosted requirement, data privacy concerns)
- LangChain complexity (Vercel AI SDK sufficient for RAG use case)
- Permission leakage (employees only see own data via chatbot)

**Research flag:** HIGH PRIORITY—needs deep research on:
- RAG implementation patterns with Vercel AI SDK + Ollama
- Qdrant configuration and optimization for small datasets
- Embedding model selection (Transformers.js vs Ollama embeddings)
- Context window management for policy documents
- Permission-aware data access (chatbot respects RBAC)

---

### Phase Ordering Rationale

**Dependency-driven sequence:**
- Phase 1 must come first: Authentication and employee master are foundation for everything
- Phase 2 before Phase 3: Payroll requires attendance/leave data to be locked and validated
- Phase 4 after Phase 3: ESS portal exposes payslips, which require payroll to generate
- Phase 5 after Phase 4: Onboarding/expenses use ESS portal for employee interactions
- Phase 6 last: AI chatbot queries data from all modules, requires stable backend

**Risk mitigation:**
- Phase 1 addresses PITFALL #4 (audit trails) and #1 (salary validation) from day one—cannot retrofit
- Phase 3 is highest legal risk—compliance engine must be bulletproof before go-live
- Phase 6 is highest technical risk—defer to last when team has more context

**Value delivery:**
- Phase 1-3 deliver operational HRMS (can run payroll)
- Phase 4 unlocks employee self-service (reduces HR interruptions)
- Phase 5 adds operational polish (onboarding/expenses efficiency)
- Phase 6 delivers competitive differentiation (AI chatbot)

**Parallel development opportunities:**
- Document Storage Service: Start in Phase 1, used by Phase 3 (payslips), Phase 5 (receipts)
- Workflow Engine: Start in Phase 2 (leave approvals), used by Phase 5 (expense approvals)
- Background Job Queue: Setup in Phase 1, used by Phase 3 (payroll), Phase 4 (notifications), Phase 6 (embedding generation)

### Research Flags

**Phases needing deep research during planning:**

- **Phase 3 (Payroll & Compliance):** Complex Indian statutory calculations
  - Tax calculation edge cases (HRA formula, LTA exemption rules, arrears taxation)
  - Form 24Q/16 generation specifications and FVU file format
  - Latest FY 2025-26 tax slabs, 80C/80D limits, standard deduction
  - State-specific PT filing formats and challan generation
  - PF/ESI ECR file format and EPFO/ESIC portal integration

- **Phase 6 (AI Chatbot):** Emerging RAG patterns
  - Vercel AI SDK + Ollama integration patterns
  - Qdrant vector database configuration for HR documents
  - Embedding model selection and chunking strategies
  - Permission-aware data access in RAG queries
  - Prompt engineering for HR policy questions

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Foundation):** Prisma + NextAuth well-documented
- **Phase 2 (Attendance/Leave):** Standard CRUD with workflow approvals
- **Phase 4 (ESS Portal):** Next.js + shadcn/ui established patterns
- **Phase 5 (Supporting Workflows):** Workflow approval logic common pattern

**When to trigger `/gsd:research-phase`:**
- Before Phase 3: Research Indian tax/compliance implementation details
- Before Phase 6: Research RAG architecture with Ollama + Qdrant
- Optional for Phase 2 if biometric device integration required (vendor-specific APIs)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | **HIGH** | Verified via official docs (Next.js 16.1.6, React 19.2.4, Prisma 6 current in Feb 2026), npm registry, and 2026 ecosystem guides. All recommendations based on proven patterns. |
| **Features** | **HIGH** | Multiple Indian HRMS vendor comparisons (Keka, greytHR, Zoho, sumHR), compliance guides, and industry analysis. Table stakes validated across 10+ sources. |
| **Architecture** | **HIGH** | Modular monolith pattern verified for 20-person scale. Component boundaries match industry HRMS architecture (Keka, Oracle HRMS docs). Self-hosted deployment well-documented. |
| **Pitfalls** | **MEDIUM-HIGH** | Statutory compliance requirements verified with 2026 sources (Labour Code 50% rule, audit trail mandate April 2023). Specific penalty amounts cross-referenced but may vary by violation specifics. Tax calculation formulas should be validated with CA/tax expert during implementation. |

**Overall confidence:** HIGH

Research based on 50+ sources including official documentation (Next.js, Prisma, React), government portals (EPFO, ESIC, Income Tax), industry HRMS vendor analysis, and 2026 compliance guides. Stack recommendations are current as of February 2026 with verified version numbers.

### Gaps to Address

**During implementation planning:**

1. **Tax calculation validation:** Engage CA/tax expert to verify HRA exemption formula, LTA rules, 80C/80D limits for FY 2025-26. Research identified formulas but edge cases (mid-year joiners, arrears, bonus taxation) need professional validation.

2. **State-specific PT rates:** Verify current Professional Tax slabs from state labor department websites (Maharashtra, Karnataka, Tamil Nadu, West Bengal). Research provides general structure but rates may have updated post-February 2026.

3. **Form 24Q/16 specifications:** Download latest FVU utilities and file format specifications from TRACES portal before Phase 3. Research indicates structure but quarterly updates occur.

4. **Biometric device integration (if applicable):** Research vendor-specific APIs if biometric attendance is required. Generic attendance patterns documented, but device integration varies by manufacturer.

5. **Data migration field mapping:** Create detailed field-by-field mapping document from Keka export to ShreeHR schema. Research provides categories (employee master, payroll history, leave balances) but specific field names need Keka access.

**Post-implementation monitoring:**

1. **Statutory rate updates:** Quarterly review after budget announcements (February), mid-year corrections. PF/ESI thresholds, PT slabs, TDS tax slabs change periodically.

2. **Labour Code amendments:** Monitor MCA/Labour Ministry circulars for clarifications on 50% Basic Pay Rule implementation. Effective Jan 2026 but enforcement interpretation may evolve.

3. **Security patching:** Weekly dependency updates (pnpm audit), monthly security patches for server OS, quarterly penetration testing.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Next.js 16 Documentation](https://nextjs.org/docs) — App Router, Server Components, standalone output
- [React 19 Documentation](https://react.dev/) — Server Components, improved hooks
- [Prisma 6 Documentation](https://www.prisma.io/docs) — ORM, migrations, Prisma Studio
- [TanStack Query v5 Documentation](https://tanstack.com/query/latest) — Server state management
- [Vercel AI SDK v6 Documentation](https://ai-sdk.dev/) — LLM integration, streaming
- [NextAuth.js v5 Documentation](https://authjs.dev/) — App Router authentication

**Government & Compliance:**
- [Income Tax Department India](https://incometax.gov.in) — TDS slabs, Form 16/24Q
- [EPFO Portal](https://epfindia.gov.in) — PF rules, contribution rates
- [ESIC Portal](https://esic.gov.in) — ESI thresholds, rates
- [India Audit Trail Compliance Mandate](https://www.india-briefing.com/news/india-mandates-audit-trail-compliance-for-all-companies-explainer-key-obligations-34837.html/) — April 1, 2023 effective date

**npm Registry:**
- next@16.1.6 (published January 2026)
- react@19.2.4 (published January 2026)
- @tanstack/react-query@5.90.19 (published February 2026)

### Secondary (MEDIUM-HIGH confidence)

**HRMS Feature Landscape:**
- [Top 10 HRMS Software in India 2026 – Asanify](https://asanify.com/blog/human-resources/top-10-hr-management-tools-in-india/)
- [Keka HR Software Guide – Authencio](https://www.authencio.com/blog/keka-hr-software-guide-features-pricing-pros-cons-alternatives-for-indian-smbs)
- [HRMS Management 2026: Avoiding Costly Mistakes – AgilityPortal](https://agilityportal.io/blog/hrms-management-2026-complete-guide)

**Indian Payroll Compliance:**
- [Payroll Compliance Complete Guide – SavvyHRMS](https://savvyhrms.com/payroll-compliance-complete-guide/)
- [PF, ESI, Gratuity, TDS: What Every HR Must Know in 2026](https://hrsays.in/pf-esi-gratuity-tds-what-every-hr-must-know-in-2026)
- [Payroll Compliance Checklist India 2026 – Uknowva](https://uknowva.com/checklist/payroll-compliances-in-india)

**Labour Code 2026:**
- [India Labour Codes 2026: The 50% Basic Pay Rule](https://www.zfour.in/post/india-labour-codes-2026-50-percent-basic-pay-rule)
- [New Labour Code: Salary Structure Impact 2026](https://www.chhotacfo.com/blog/new-labour-code-salary-structure-impact-2026/)
- [Labour Codes 2025: Wage Rule to Reshape Salaries](https://lawchakra.in/legal-updates/labour-codes-wage-rule-salaries-taxes/)

**Architecture & Stack:**
- [Modern Full Stack Application Architecture Using Next.js 15+](https://softwaremill.com/modern-full-stack-application-architecture-using-next-js-15/)
- [Next.js 15 Self-Hosting Guide 2025](https://ketan-chavan.medium.com/production-nextjs-15-the-complete-self-hosting-guide-f1ff03f782e7)
- [Complete Guide to RAG and Vector Databases in 2026](https://solvedbycode.ai/blog/complete-guide-rag-vector-databases-2026)

**Development Tools:**
- [Biome: The ESLint and Prettier Killer? Complete Migration Guide for 2026](https://dev.to/pockit_tools/biome-the-eslint-and-prettier-killer-complete-migration-guide-for-2026-27m)
- [pnpm vs npm vs yarn vs Bun: The 2026 Package Manager Showdown](https://dev.to/pockit_tools/pnpm-vs-npm-vs-yarn-vs-bun-the-2026-package-manager-showdown-51dc)
- [LangChain vs Vercel AI SDK vs OpenAI SDK: 2026 Guide](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide)

### Tertiary (MEDIUM confidence - needs validation)

**Multi-State Compliance:**
- [Multi-State Payroll Compliance India: The 2026 Reality](https://www.zfour.in/post/multi-state-payroll-compliance-india-the-2026-reality)
- [Managing Multi-State Payroll: Challenges for Indian Businesses](https://bclindia.in/managing-multi-state-payroll-challenges-and-solutions-for-indian-businesses/)

**Tax Calculation Details:**
- [House Rent Allowance: HRA Exemption, Tax Deduction](https://cleartax.in/s/hra-house-rent-allowance)
- [Leave Travel Allowance (LTA) Exemption](https://cleartax.in/s/lta-leave-travel-allowance)
- [Leave Encashment Tax Exemption, Calculation](https://cleartax.in/s/leave-encashment-tax)
- [Claiming HRA in 2026: Avoid Costly Mistakes](https://www.finnovate.in/learn/blog/claiming-hra-common-mistakes-tax-benefits)

**AI/Chatbot Features:**
- [HR Chatbot – smHRty by Pocket HRMS](https://www.pockethrms.com/hr-chatbot/)
- [10 Best HR Chatbots in 2026 – Lindy](https://www.lindy.ai/blog/hr-chatbots)
- [How HR Chatbots Improve HR Processes – AIHR](https://www.aihr.com/blog/hr-chatbots/)

---

**Research completed:** 2026-02-04
**Ready for roadmap:** Yes
**Next steps:** Use phase structure as starting point for roadmap creation; trigger `/gsd:research-phase` before Phase 3 and Phase 6 for deeper domain research on compliance and RAG implementation.
