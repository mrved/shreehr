# Roadmap: ShreeHR

## Overview

ShreeHR transitions from Keka HR to a self-hosted, compliance-first HRMS in six phases. Phase 1 establishes the foundation with employee data, authentication, and audit infrastructure. Phases 2-3 build the operational core: attendance/leave tracking feeding into automated payroll with Indian statutory compliance (PF/ESI/PT/TDS). Phase 4 delivers employee self-service for accessing payslips and managing personal data. Phase 5 adds operational polish with onboarding, expenses, and loan workflows. Phase 6 differentiates with an AI assistant that deflects routine HR queries using local LLM and RAG. Each phase delivers observable capabilities while maintaining zero compliance errors—the non-negotiable core value.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Core data model, authentication, and audit infrastructure
- [ ] **Phase 2: Time & Attendance** - Attendance tracking and leave management workflows
- [ ] **Phase 3: Payroll & Compliance** - Automated payroll with Indian statutory compliance
- [ ] **Phase 4: Employee Self-Service** - Mobile-first portal for employees
- [ ] **Phase 5: Supporting Workflows** - Onboarding, expenses, and loan management
- [ ] **Phase 6: AI Assistant** - Chat interface for HR queries and policy Q&A

## Phase Details

### Phase 1: Foundation
**Goal**: Admin can manage complete employee records with secure authentication and compliance-ready audit infrastructure

**Depends on**: Nothing (first phase)

**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, CORE-10, CORE-11

**Success Criteria** (what must be TRUE):
  1. Admin can create employee record with personal info, bank details, PAN, and Aadhaar (encrypted)
  2. Admin can upload and store employee documents with 8-year retention enforcement
  3. Admin can define departments, designations, and reporting hierarchies
  4. Admin can assign employees to departments with role-based access (Admin/Manager/Employee)
  5. Admin can import full Keka HR data (employees, salary history, leave balances) with validation

**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Project setup, Prisma schema, PII encryption
- [x] 01-02-PLAN.md — NextAuth v5 authentication, protected routes
- [x] 01-03-PLAN.md — Employee CRUD, organization structure (departments/designations)
- [x] 01-04-PLAN.md — Document storage with retention, Keka HR import

### Phase 2: Time & Attendance
**Goal**: Employees can track attendance and managers can approve leave requests with data locked before payroll

**Depends on**: Phase 1

**Requirements**: ATT-01, ATT-02, ATT-03, ATT-04, ATT-05, ATT-06, LVE-01, LVE-02, LVE-03, LVE-04, LVE-05, LVE-06, LVE-07

**Success Criteria** (what must be TRUE):
  1. Employee can check-in and check-out via web interface with automatic work hours calculation
  2. System marks daily attendance status (Present/Absent/Half-day) based on check-in/out times
  3. Manager can view team attendance summary and identify missing punches
  4. Admin can configure leave types (Casual/Sick/Earned) with annual quotas
  5. Employee can view leave balances and apply for leave with validation against available balance
  6. System syncs approved leave to attendance calendar and unapproved absence as LOP
  7. System locks attendance 5 days before payroll processing (with correction approval workflow)

**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Attendance model, check-in/out API, work hours calculation
- [x] 02-02-PLAN.md — LeaveType/LeaveRequest models, leave type CRUD, leave request API with balance validation
- [ ] 02-03-PLAN.md — Leave-to-attendance sync, leave balance APIs
- [ ] 02-04-PLAN.md — Attendance and leave UI pages (employee, manager, admin views)
- [ ] 02-05-PLAN.md — Attendance locking mechanism, correction approval workflow

### Phase 3: Payroll & Compliance
**Goal**: Admin can run monthly payroll with accurate Indian statutory compliance and generate all required reports

**Depends on**: Phase 2

**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, STAT-01, STAT-02, STAT-03, STAT-04, STAT-05, STAT-06, STAT-07, STAT-08, STAT-09, STAT-10

**Success Criteria** (what must be TRUE):
  1. Admin can configure salary structure with automatic validation of 50% Basic Pay Rule (Labour Code 2026)
  2. Admin can run monthly payroll for all employees in <10 minutes with background processing
  3. System calculates gross salary with Loss of Pay (LOP) based on locked attendance/leave data
  4. System calculates all statutory deductions: PF (12%+12% capped at 15K), ESI (when gross ≤21K), PT (state-specific slabs), TDS (regime-based)
  5. System generates PDF payslips with all components, deductions, and digital signatures
  6. System generates PF ECR, ESI challan, Form 24Q (quarterly TDS), and Form 16 (annual TDS) files ready for portal upload
  7. System tracks statutory filing deadlines with 7/3/1 day alerts and prevents late payments

**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Employee Self-Service
**Goal**: Employees can access payslips, apply for leave, and manage personal information via mobile-first portal

**Depends on**: Phase 3

**Requirements**: ESS-01, ESS-02, ESS-03, ESS-04, ESS-05, ESS-06, ESS-07

**Success Criteria** (what must be TRUE):
  1. Employee can view and download monthly payslips and Form 16 from mobile device
  2. Employee can view attendance records with daily punch details and monthly summary
  3. Employee can apply for leave from portal with real-time balance validation
  4. Employee can update personal information (address, emergency contact) with admin approval workflow
  5. Employee can upload documents (investment proofs) and declare investments for TDS calculation (80C/80D/HRA)
  6. Employee receives email/WhatsApp notification when payslip is available
  7. Portal works seamlessly on mobile browsers (responsive design, touch-optimized)

**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Supporting Workflows
**Goal**: HR can onboard new employees digitally, process expense reimbursements, and manage employee loans

**Depends on**: Phase 4

**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, ONB-05, EXP-01, EXP-02, EXP-03, EXP-04, EXP-05, LOAN-01, LOAN-02, LOAN-03, LOAN-04, LOAN-05

**Success Criteria** (what must be TRUE):
  1. HR can create onboarding checklist and send digital offer letter to candidate
  2. Candidate can accept offer and upload required documents before joining date
  3. HR can view onboarding status dashboard showing task completion across IT/Admin/Manager
  4. Employee can submit expense claim with receipt image, categorization, and policy validation
  5. Manager can approve/reject expense claims with amount-based routing (multi-level approval)
  6. Approved expenses sync to payroll for automatic reimbursement in next cycle
  7. Admin can create employee loan with tenure and interest rate, system calculates EMI
  8. System auto-deducts EMI from monthly salary and employee can view loan balance/repayment schedule

**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: AI Assistant
**Goal**: Employees can ask HR queries and policy questions via AI chat that respects role-based access

**Depends on**: Phase 5

**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06

**Success Criteria** (what must be TRUE):
  1. Employee can ask factual HR queries via chat ("What's my leave balance?", "When is payday?")
  2. System retrieves employee-specific data from modules (leave, payroll, attendance) to answer queries
  3. Employee can ask policy questions ("What's the WFH policy?", "How do I claim medical expenses?")
  4. System searches policy documents via RAG (semantic search in Qdrant) to provide accurate answers
  5. AI respects role-based access (employee only sees own data, manager sees team data)
  6. System maintains conversation history for context-aware follow-up questions
  7. Chat deflects 30-60% of routine HR queries without admin intervention

**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-02-04 |
| 2. Time & Attendance | 2/5 | In progress | - |
| 3. Payroll & Compliance | 0/TBD | Not started | - |
| 4. Employee Self-Service | 0/TBD | Not started | - |
| 5. Supporting Workflows | 0/TBD | Not started | - |
| 6. AI Assistant | 0/TBD | Not started | - |
