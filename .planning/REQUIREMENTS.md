# Requirements: ShreeHR

**Defined:** 2026-02-04
**Core Value:** Automated payroll with accurate Indian statutory compliance — payroll must run correctly and on time with zero compliance errors.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core HR

- [ ] **CORE-01**: Admin can create employee record with personal info (name, DOB, gender, contact)
- [ ] **CORE-02**: Admin can store employee bank details for salary disbursement
- [ ] **CORE-03**: Admin can store employee PAN and Aadhaar numbers (encrypted)
- [ ] **CORE-04**: Admin can upload and store employee documents (offer letter, ID proofs, certificates)
- [ ] **CORE-05**: System retains documents for 8 years (compliance mandate)
- [ ] **CORE-06**: Admin can define departments and designations
- [ ] **CORE-07**: Admin can assign employee to department, designation, and reporting manager
- [ ] **CORE-08**: System supports role-based access (Admin, Manager, Employee roles)
- [ ] **CORE-09**: Admin can import employees from Keka HR export (full migration)
- [ ] **CORE-10**: Admin can import salary history from Keka for Form 16 continuity
- [ ] **CORE-11**: Admin can import leave balances from Keka

### Payroll

- [ ] **PAY-01**: Admin can configure salary structure (Basic, HRA, Special Allowance, LTA, etc.)
- [ ] **PAY-02**: System validates salary structure meets 50% Basic Pay Rule (Labour Code 2026)
- [ ] **PAY-03**: Admin can run monthly payroll for all employees
- [ ] **PAY-04**: System calculates gross salary from salary structure and attendance
- [ ] **PAY-05**: System generates PDF payslips with all components and deductions
- [ ] **PAY-06**: System calculates Loss of Pay (LOP) based on attendance/leave data

### Statutory Compliance

- [ ] **STAT-01**: System calculates PF deduction (12% employee + 12% employer, capped at ₹15,000 basic)
- [ ] **STAT-02**: System calculates ESI deduction when gross ≤ ₹21,000/month
- [ ] **STAT-03**: System calculates Professional Tax based on work state (configurable slabs)
- [ ] **STAT-04**: Admin can configure state-wise PT slabs
- [ ] **STAT-05**: System calculates TDS based on projected annual income and tax regime
- [ ] **STAT-06**: System generates PF ECR file for EPFO portal upload
- [ ] **STAT-07**: System generates ESI challan file
- [ ] **STAT-08**: System generates Form 24Q (quarterly TDS return)
- [ ] **STAT-09**: System generates Form 16 (annual TDS certificate for employees)
- [ ] **STAT-10**: System tracks statutory filing deadlines with alerts

### Attendance

- [ ] **ATT-01**: Employee can check-in via web interface
- [ ] **ATT-02**: Employee can check-out via web interface
- [ ] **ATT-03**: System calculates daily work hours from check-in/out times
- [ ] **ATT-04**: System marks attendance status (Present, Absent, Half-day)
- [ ] **ATT-05**: Manager can view team attendance summary
- [ ] **ATT-06**: System locks attendance before payroll processing

### Leave

- [ ] **LVE-01**: Admin can configure leave types (Casual, Sick, Earned/Privilege)
- [ ] **LVE-02**: Admin can set annual leave quota per leave type
- [ ] **LVE-03**: Employee can view current leave balances
- [ ] **LVE-04**: Employee can apply for leave specifying type and dates
- [ ] **LVE-05**: System validates leave application against available balance
- [ ] **LVE-06**: System syncs approved leave to attendance (marks leave days)
- [ ] **LVE-07**: System syncs unapproved absence as LOP to payroll

### Employee Self-Service

- [ ] **ESS-01**: Employee can view and download monthly payslips
- [ ] **ESS-02**: Employee can view and download Form 16
- [ ] **ESS-03**: Employee can view attendance records
- [ ] **ESS-04**: Employee can apply for leave from portal
- [ ] **ESS-05**: Employee can update personal information (address, emergency contact)
- [ ] **ESS-06**: Employee can upload documents (investment proofs)
- [ ] **ESS-07**: Employee can declare investments for TDS calculation (80C, 80D, HRA)

### Onboarding

- [ ] **ONB-01**: HR can create onboarding checklist for new joiners
- [ ] **ONB-02**: HR can send digital offer letter to candidate
- [ ] **ONB-03**: Candidate can accept offer and upload required documents before joining
- [ ] **ONB-04**: System tracks onboarding task completion (IT setup, ID card, etc.)
- [ ] **ONB-05**: HR can view onboarding status dashboard

### Expense Management

- [ ] **EXP-01**: Employee can submit expense claim with receipt image
- [ ] **EXP-02**: Employee can categorize expense (travel, food, supplies, etc.)
- [ ] **EXP-03**: Manager can approve or reject expense claims
- [ ] **EXP-04**: Admin can configure expense policies and limits
- [ ] **EXP-05**: Approved expenses sync to payroll for reimbursement

### Employee Loans

- [ ] **LOAN-01**: Admin can create loan for employee (amount, tenure, interest rate)
- [ ] **LOAN-02**: System calculates EMI based on loan parameters
- [ ] **LOAN-03**: System auto-deducts EMI from monthly salary
- [ ] **LOAN-04**: Employee can view loan balance and repayment schedule
- [ ] **LOAN-05**: System tracks loan status (active, closed)

### AI Assistant

- [ ] **AI-01**: Employee can ask HR queries via chat ("What's my leave balance?")
- [ ] **AI-02**: System retrieves employee-specific data to answer queries
- [ ] **AI-03**: Employee can ask policy questions ("What's the WFH policy?")
- [ ] **AI-04**: System searches policy documents to provide answers
- [ ] **AI-05**: AI respects role-based access (employee only sees own data)
- [ ] **AI-06**: System maintains conversation history for context

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Attendance

- **ATT-V2-01**: Geofencing for location-based check-in verification
- **ATT-V2-02**: Biometric device integration (fingerprint, face recognition)
- **ATT-V2-03**: Shift management with multiple shift patterns

### Advanced Leave

- **LVE-V2-01**: Multi-level leave approval workflows
- **LVE-V2-02**: Leave accrual rules (monthly/quarterly accumulation)
- **LVE-V2-03**: Leave encashment at year-end or exit

### Notifications

- **NOTF-01**: WhatsApp integration for payslip delivery
- **NOTF-02**: Email notifications for leave approval/rejection
- **NOTF-03**: Push notifications for mobile app

### Reporting

- **RPT-01**: Headcount and attrition reports
- **RPT-02**: Payroll cost analysis dashboards
- **RPT-03**: Compliance status dashboard

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native mobile apps | Web-first sufficient for 20 users; responsive design covers mobile |
| Multi-tenant SaaS | Internal tool only; no need for tenant isolation |
| Recruitment/ATS | 20-person teams use Naukri/LinkedIn; not enough hiring volume |
| Performance management | OKRs, 360 reviews are overkill for team size |
| Learning Management | Training needs are ad hoc, not systematic |
| Advanced analytics | Predictive attrition, forecasting unnecessary for 20 employees |
| Multi-country payroll | India-only focus |
| Complex workflows | Keep it simple — avoid Keka's complexity trap |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| CORE-05 | Phase 1 | Complete |
| CORE-06 | Phase 1 | Complete |
| CORE-07 | Phase 1 | Complete |
| CORE-08 | Phase 1 | Complete |
| CORE-09 | Phase 1 | Complete |
| CORE-10 | Phase 1 | Complete |
| CORE-11 | Phase 1 | Complete |
| PAY-01 | Phase 3 | Complete |
| PAY-02 | Phase 3 | Complete |
| PAY-03 | Phase 3 | Complete |
| PAY-04 | Phase 3 | Complete |
| PAY-05 | Phase 3 | Complete |
| PAY-06 | Phase 3 | Complete |
| STAT-01 | Phase 3 | Complete |
| STAT-02 | Phase 3 | Complete |
| STAT-03 | Phase 3 | Complete |
| STAT-04 | Phase 3 | Complete |
| STAT-05 | Phase 3 | Complete |
| STAT-06 | Phase 3 | Complete |
| STAT-07 | Phase 3 | Complete |
| STAT-08 | Phase 3 | Complete |
| STAT-09 | Phase 3 | Complete |
| STAT-10 | Phase 3 | Complete |
| ATT-01 | Phase 2 | Complete |
| ATT-02 | Phase 2 | Complete |
| ATT-03 | Phase 2 | Complete |
| ATT-04 | Phase 2 | Complete |
| ATT-05 | Phase 2 | Complete |
| ATT-06 | Phase 2 | Complete |
| LVE-01 | Phase 2 | Complete |
| LVE-02 | Phase 2 | Complete |
| LVE-03 | Phase 2 | Complete |
| LVE-04 | Phase 2 | Complete |
| LVE-05 | Phase 2 | Complete |
| LVE-06 | Phase 2 | Complete |
| LVE-07 | Phase 2 | Complete |
| ESS-01 | Phase 4 | Pending |
| ESS-02 | Phase 4 | Pending |
| ESS-03 | Phase 4 | Pending |
| ESS-04 | Phase 4 | Pending |
| ESS-05 | Phase 4 | Pending |
| ESS-06 | Phase 4 | Pending |
| ESS-07 | Phase 4 | Pending |
| ONB-01 | Phase 5 | Pending |
| ONB-02 | Phase 5 | Pending |
| ONB-03 | Phase 5 | Pending |
| ONB-04 | Phase 5 | Pending |
| ONB-05 | Phase 5 | Pending |
| EXP-01 | Phase 5 | Pending |
| EXP-02 | Phase 5 | Pending |
| EXP-03 | Phase 5 | Pending |
| EXP-04 | Phase 5 | Pending |
| EXP-05 | Phase 5 | Pending |
| LOAN-01 | Phase 5 | Pending |
| LOAN-02 | Phase 5 | Pending |
| LOAN-03 | Phase 5 | Pending |
| LOAN-04 | Phase 5 | Pending |
| LOAN-05 | Phase 5 | Pending |
| AI-01 | Phase 6 | Pending |
| AI-02 | Phase 6 | Pending |
| AI-03 | Phase 6 | Pending |
| AI-04 | Phase 6 | Pending |
| AI-05 | Phase 6 | Pending |
| AI-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 68 total
- Mapped to phases: 68
- Unmapped: 0 ✓

**Requirements by category:**
- Core HR: 11 requirements
- Payroll: 6 requirements
- Statutory Compliance: 10 requirements
- Attendance: 6 requirements
- Leave: 7 requirements
- Employee Self-Service: 7 requirements
- Onboarding: 5 requirements
- Expense Management: 5 requirements
- Employee Loans: 5 requirements
- AI Assistant: 6 requirements

**Requirements by phase:**
- Phase 1 (Foundation): 11 requirements
- Phase 2 (Time & Attendance): 13 requirements
- Phase 3 (Payroll & Compliance): 16 requirements
- Phase 4 (Employee Self-Service): 7 requirements
- Phase 5 (Supporting Workflows): 15 requirements
- Phase 6 (AI Assistant): 6 requirements

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-04 after roadmap creation*
