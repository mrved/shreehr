# ShreeHR

## What This Is

A simple, self-hosted HRMS for a 20-person Indian company, replacing Keka HR. Built to handle Indian statutory compliance (PF, ESI, PT, TDS) without the complexity of enterprise HR software. Includes an AI assistant for employee self-service queries and policy questions.

## Core Value

Automated payroll with accurate Indian statutory compliance — if nothing else works, payroll must run correctly and on time with zero compliance errors.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Import employees and full history from Keka HR (profiles, salary, leave balances, attendance, tax data)
- [ ] Calculate salary with Indian statutory deductions (PF, ESI, PT, TDS)
- [ ] Generate payslips and Form 16/24Q
- [ ] Track attendance with clock-in/out and geofencing
- [ ] Manage leave policies with accrual and LOP sync to payroll
- [ ] Employee self-service portal (view payslips, apply leave, update info)
- [ ] Digital onboarding with document collection
- [ ] Expense submission with receipt capture and approval workflow
- [ ] AI chat for HR queries ("my leave balance") and policy Q&A ("WFH policy")

### Out of Scope

- Native mobile apps — web-first, responsive design sufficient for 20 users
- Multi-tenant SaaS architecture — internal tool only
- Advanced analytics/BI dashboards — simple reports sufficient
- Recruitment/ATS module — not needed for 20-person team
- Performance management — overkill for current size

## Context

**Migration context:**
- Currently using Keka HR — too complex and expensive for team size
- Need full data migration: employee profiles, salary history, leave balances, attendance records, tax declarations
- Keka provides CSV exports for most data

**Indian compliance context:**
- PF (Provident Fund): 12% employer + 12% employee, capped at ₹15,000 basic
- ESI (Employee State Insurance): Applicable if gross ≤ ₹21,000/month
- PT (Professional Tax): State-specific slabs (varies by state)
- TDS: Income tax projection and monthly deduction
- Form 16: Annual tax certificate for employees
- Form 24Q: Quarterly TDS return

**Team context:**
- ~20 employees
- Single admin (founder/office manager) running HR
- Employees need mobile-friendly access for self-service

## Constraints

- **Hosting**: Self-hosted — must run on own infrastructure, no cloud vendor lock-in
- **Stack**: React/Next.js — team's preferred frontend framework
- **Budget**: Minimal ongoing costs — avoid expensive third-party services
- **Compliance**: Must stay current with Indian tax law changes (annual budget updates)
- **Simplicity**: Must be simpler than Keka — if it feels like enterprise software, it's wrong

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Self-hosted over SaaS | Control costs, own data, no vendor dependency | — Pending |
| Web-only, no native apps | 20 users don't justify native app complexity | — Pending |
| AI chat as differentiator | Reduce admin burden, better than Keka's UX | — Pending |
| Full Keka migration | Need historical data for Form 16 and continuity | — Pending |

---
*Last updated: 2026-02-04 after initialization*
