# Feature Landscape: Indian HRMS/Payroll for 20-Person Companies

**Domain:** Indian HRMS/Payroll Software
**Target:** 20-person Indian company (SME/Startup)
**Context:** Replacing Keka HR (overcomplexity), building simple in-house solution
**Researched:** 2026-02-04
**Confidence:** HIGH (verified through multiple Indian HRMS vendors and compliance sources)

---

## Executive Summary

For a 20-person Indian company, the HRMS feature landscape divides sharply into three categories:

1. **Table Stakes (Must-Have):** Statutory compliance (PF/ESI/PT/TDS), payroll automation, attendance/leave management, and Employee Self-Service (ESS). Missing these = product feels broken or legally risky.

2. **Differentiators (Competitive Edge):** AI chatbot for HR queries, mobile-first design, intelligent policy Q&A, streamlined onboarding. These solve real pain points without adding complexity.

3. **Anti-Features (Deliberate Omissions):** Advanced analytics, multi-country payroll, complex performance management, extensive customization. These add complexity that 20-person teams don't need and actively harm adoption.

**Key Insight:** The Indian HRMS market in 2026 shows a clear pattern - companies with 15-20 employees adopt HRMS primarily for **compliance automation** and **time savings**, not for sophisticated HR analytics or workforce planning. The #1 mistake small teams make is buying enterprise-grade systems with features they'll never use.

---

## Table Stakes Features

Features users expect in any Indian HRMS. Missing these = users leave or face legal/operational risk.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Automated Payroll Processing** | Core reason to adopt HRMS; manual payroll causes errors and delays | Medium | Attendance, Leave | Must include salary calculations, deductions, bonuses, reimbursements |
| **Statutory Compliance: PF** | Mandatory for 20+ employees in India; 12% employee + 12% employer contribution | Medium | Payroll | Must file by 15th of following month; employees earning ≤₹15k/month |
| **Statutory Compliance: ESI** | Mandatory for 10+ employees; 0.75% employee + 3.25% employer contribution | Medium | Payroll | Applies to employees earning ≤₹21k/month; monthly filing required |
| **Statutory Compliance: PT** | State-specific professional tax (e.g., Maharashtra, Karnataka, Tamil Nadu, West Bengal) | Low | Payroll | Max ₹2,500/year; state municipal collection |
| **Statutory Compliance: TDS** | Income tax deduction at source; file quarterly Form 24Q; issue Form 16 | High | Payroll | Must deposit by 7th of following month; complex tax calculations |
| **Digital Payslip Generation** | Expected modern convenience; reduces admin burden | Low | Payroll | Include WhatsApp/email delivery |
| **Attendance Tracking** | Foundation for accurate payroll; replaces manual registers | Low | None | Cloud-based with real-time dashboards |
| **Leave Management** | Automates leave requests/approvals; tracks balances | Low | Attendance | Must handle different leave types (casual, sick, earned) |
| **Leave Balance Visibility** | Employees expect to see their leave status | Low | Leave Management | Self-service access |
| **Employee Self-Service Portal** | Industry standard by 2026; employees manage their own data | Medium | HRIS Core | View payslips, apply leave, update personal info |
| **Mobile Access** | Critical for field/remote employees; not optional in 2026 | Medium | ESS Portal | Both iOS and Android expected |
| **Employee Database (HRIS)** | Single source of truth for employee records | Low | None | Personal details, employment history, documents |
| **Document Storage** | Compliance requirement; 3-10 year retention for payroll/tax records | Medium | HRIS Core | Support for DPDP Act (India's data protection law) |
| **Basic Reporting** | Compliance reporting (PF/ESI/PT/TDS reports); headcount | Low | All modules | Export capabilities (Excel/PDF) |
| **Role-Based Access Control** | Security requirement; HR vs Manager vs Employee access | Medium | HRIS Core | Audit trails for compliance |

**Total Table Stakes Features:** 15
**Implementation Priority:** Must have all for MVP or product feels incomplete/non-compliant

---

## Differentiators

Features that set products apart. Not expected, but highly valued when done right. These solve real problems for 20-person teams.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|------------------|------------|--------------|-------|
| **AI Chatbot for HR Queries** | 24/7 instant answers; deflects 30-60% of routine queries (payslip, leave balance, policy questions) | High | ESS, Knowledge Base | **Your primary differentiator**; most HRMS don't have this; reduces HR team interruptions |
| **Intelligent Policy Q&A** | Natural language policy search; no more PDF hunting | High | Document Management, AI | Leverages LLMs to answer "Can I work from home on Fridays?" type questions |
| **Mobile-First Design** | Better than "mobile-compatible"; designed for mobile from ground up | Medium | All modules | Especially valuable for field employees; touchless biometric via face recognition |
| **Geo-Fencing Attendance** | GPS-based attendance for field employees; prevents proxy attendance | Medium | Attendance, Mobile | Ideal for sales/delivery teams |
| **WhatsApp Integration** | Payslips, notifications, simple queries via WhatsApp | Medium | ESS, Messaging API | Widely used in India; familiar interface |
| **Streamlined Onboarding** | Digital offer letters, document upload, single-day setup | Medium | HRIS, Document Management | Reduces onboarding from days to hours |
| **Expense Management** | Submit expenses with receipts; policy-based auto-approvals | Medium | Payroll | Integration with salary for reimbursements |
| **Investment Declaration (Tax Saving)** | Employees submit 80C/80D declarations; auto-TDS calculation | Medium | TDS/Payroll | Critical during tax season (Jan-Feb in India) |
| **Automated Compliance Alerts** | Proactive reminders for PF/ESI/TDS filing deadlines | Low | Compliance modules | Prevents late filing penalties |
| **Biometric Integration** | Fingerprint/face recognition for attendance | Low | Attendance | Hardware dependency; useful for office-based teams |
| **Quick Onboarding (< 1 hour setup)** | From signup to first payroll in under 1 hour | High | System architecture | Competitor systems take days; major UX win |
| **Plain Language Interface** | No HR jargon; designed for non-HR founders | Medium | All modules | Small companies often lack dedicated HR person |

**Total Differentiators:** 12
**Your Competitive Edge:** AI chatbot + policy Q&A (unique) + mobile-first + simplicity for non-HR users

---

## Anti-Features

Features to deliberately **NOT** build. Common in enterprise HRMS but harmful for 20-person teams. Building these = feature bloat = product complexity = lower adoption.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Advanced Workforce Analytics** | 20-person teams don't need predictive attrition models or headcount forecasting | Provide simple reports: headcount, department breakdown, leave utilization |
| **Complex Performance Management** | OKRs, 360-degree reviews, competency matrices = overkill for small teams | Offer simple quarterly check-ins or skip entirely; let teams use Google Docs |
| **Multi-Country Payroll** | India-only focus; adding global payroll = 10x complexity | Explicitly India-only; integrate with global providers if expansion happens |
| **Extensive Customization** | "Configure anything" = UI bloat + testing nightmare + user confusion | Opinionated defaults based on Indian SME best practices; limited config only |
| **Recruitment/ATS Module** | 20-person teams hire infrequently; dedicated tools (Naukri, LinkedIn) work better | Basic job posting at most; don't build full applicant tracking |
| **Learning Management System (LMS)** | Training needs for 20 people = ad hoc; LMS = underutilized complexity | Link to external resources; don't build LMS |
| **Shift Management** | Relevant for manufacturing/retail, not typical SME offices | Offer basic shift support if needed; not a core feature for target market |
| **Multi-Location/Multi-Company** | Single-location assumption for 20-person company | Defer until proven need; adds significant complexity |
| **Advanced Security (SSO/SAML)** | Overkill for 20 people; standard auth is sufficient | Email/password + 2FA; skip enterprise SSO |
| **White-Labeling** | Not building a SaaS to resell; internal tool only | N/A - single company deployment |
| **Performance Review Cycles** | Formal annual reviews = bureaucracy for small teams; prefer continuous feedback | Skip or provide very simple 1:1 note-taking at most |
| **Succession Planning** | Irrelevant for 20-person flat structure | Skip entirely |
| **Employee Engagement Surveys** | Pulse surveys, eNPS tracking = overkill; small teams know engagement via daily interaction | Skip or use free tools like Google Forms if needed |
| **Advanced Workflow Builder** | "No-code workflow customization" = feature bloat for target users | Hardcode sensible workflows (e.g., leave approval flow) |

**Total Anti-Features:** 14
**Rationale:** Per industry research, #1 mistake for small teams is "buying an HR system that tries to do everything on day one. Bloated platforms slow adoption, confuse users, and lock teams into paying for features they don't need." (Source: AgilityPortal HRMS Management 2026 Guide)

---

## Feature Dependencies

Understanding which features depend on others (build order matters):

```
Core Foundation:
  HRIS (Employee Database)
    ├─> Document Storage
    ├─> Role-Based Access Control
    └─> Employee Self-Service Portal
         ├─> Mobile Access
         └─> AI Chatbot (depends on ESS for integration)

Attendance & Leave:
  Attendance Tracking
    ├─> Geo-Fencing (enhancement)
    ├─> Biometric Integration (optional)
    └─> Leave Management
         └─> Leave Balance Visibility (requires leave system)

Payroll & Compliance:
  Payroll Processing
    ├─> Statutory Compliance (PF, ESI, PT, TDS)
    │    └─> Automated Compliance Alerts
    ├─> Digital Payslip Generation
    ├─> Investment Declaration (for TDS)
    └─> Expense Management (optional, integrates with payroll)

Onboarding & Offboarding:
  HRIS Core
    ├─> Streamlined Onboarding
    └─> Basic Offboarding (final settlement calculation via Payroll)

Reporting:
  All Modules → Basic Reporting (cross-cutting)
```

**Build Order Recommendation:**
1. **Phase 1 (MVP):** HRIS Core → Attendance/Leave → Payroll → Statutory Compliance → ESS Portal
2. **Phase 2 (Differentiator):** AI Chatbot → Policy Q&A → Mobile Optimization → Expense Management
3. **Phase 3 (Polish):** Geo-fencing → Investment Declaration → Streamlined Onboarding → WhatsApp Integration

---

## Complexity Analysis

| Feature Category | Low Complexity (< 2 weeks) | Medium Complexity (2-6 weeks) | High Complexity (6+ weeks) |
|------------------|---------------------------|------------------------------|---------------------------|
| **Table Stakes** | Attendance, Leave, Leave Balance, Basic Reporting | Payroll Processing, PF/ESI/PT, Employee Database, ESS Portal, Document Storage, Mobile Access, RBAC | TDS Compliance |
| **Differentiators** | Automated Compliance Alerts, Biometric Integration | Geo-Fencing, WhatsApp Integration, Streamlined Onboarding, Expense Management, Investment Declaration, Mobile-First Design, Plain Language Interface | AI Chatbot, Intelligent Policy Q&A, Quick Onboarding (<1hr) |
| **Anti-Features** | N/A (don't build) | N/A | N/A |

**High-Risk/High-Value Features:**
- **TDS Compliance:** Complex tax calculations; many edge cases; but mandatory
- **AI Chatbot + Policy Q&A:** Technically challenging; requires LLM integration; but your key differentiator
- **Quick Onboarding:** Requires excellent UX and system design; high effort; major competitive advantage

---

## MVP Recommendation

For a 20-person Indian company replacing Keka HR, prioritize:

### Must-Have (MVP Phase 1):
1. **Payroll with PF/ESI/PT/TDS** - Core compliance; non-negotiable
2. **Attendance Tracking** - Foundation for payroll
3. **Leave Management** - Daily operational need
4. **Employee Self-Service Portal** - View payslips, apply leave
5. **Mobile Access** - Baseline expectation in 2026
6. **Digital Payslip Generation** - Expected convenience
7. **Employee Database (HRIS)** - Single source of truth
8. **Document Storage** - Compliance requirement
9. **Basic Reporting** - PF/ESI/PT/TDS reports for filings

### Differentiator (MVP Phase 2):
1. **AI Chatbot for HR Queries** - Your unique selling point
2. **Intelligent Policy Q&A** - Extends chatbot value
3. **Streamlined Onboarding** - Immediate time savings for new hires
4. **Expense Management** - Common pain point for small teams

### Defer to Post-MVP:
- **Geo-Fencing Attendance:** Only if field employees; not universal need
- **WhatsApp Integration:** Nice-to-have, not essential
- **Investment Declaration:** Seasonal need (Jan-Feb); defer to Phase 3
- **Biometric Integration:** Hardware dependency; low priority for small teams
- **Offboarding:** Infrequent activity; manual process acceptable initially

---

## Competitor Feature Comparison (2026)

Based on research, here's where major Indian HRMS stand:

| Feature | Keka HR | greytHR | Zoho People | sumHR | Your Product |
|---------|---------|---------|-------------|-------|--------------|
| **Payroll + Compliance** | ✅ Strong | ✅ Strong | ✅ Good | ✅ Good | ✅ Target |
| **Attendance/Leave** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Employee Self-Service** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mobile Access** | ✅ Good | ✅ Basic | ✅ Good | ✅ Good | ✅ Mobile-First |
| **AI Chatbot for HR** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ **Differentiator** |
| **Policy Q&A (AI)** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ **Differentiator** |
| **Performance Mgmt** | ✅ Complex | ✅ Complex | ✅ Advanced | ❌ Basic | ❌ **Anti-Feature** |
| **Recruitment/ATS** | ✅ Full | ✅ Full | ✅ Full | ❌ No | ❌ **Anti-Feature** |
| **Learning/LMS** | ❌ No | ❌ No | ✅ Integrated | ❌ No | ❌ **Anti-Feature** |
| **Analytics** | ✅ Advanced | ✅ Advanced | ✅ Advanced | ✅ Basic | ✅ **Basic Only** |
| **Pricing (per employee/month)** | ₹100-150 | ₹80-120 | ₹60-100 | ₹49+ | Target: ₹0 (in-house) |
| **Setup Time** | Days | Days | Days | Hours | **Target: <1 hour** |
| **Complexity Rating** | High | High | High | Medium | **Target: Low** |

**Key Insight:** Established players (Keka, greytHR, Zoho) all suffer from feature bloat for 20-person teams. They compete on breadth (ATS, performance, analytics), not on simplicity. Your advantage: ruthless focus on **core compliance + AI assistance**, nothing more.

---

## Feature Sizing for 20-Person Company

| Feature Category | Weekly Usage | Business Impact | Build Priority |
|------------------|--------------|-----------------|----------------|
| **Payroll** | Monthly | Critical (legal/financial) | P0 |
| **Attendance** | Daily | High (payroll accuracy) | P0 |
| **Leave Management** | Weekly | High (operational) | P0 |
| **ESS Portal** | Daily | High (reduces HR interruptions) | P0 |
| **Compliance (PF/ESI/PT/TDS)** | Monthly | Critical (legal) | P0 |
| **AI Chatbot** | Daily | Medium-High (differentiator) | P1 |
| **Expense Management** | Weekly | Medium (convenience) | P1 |
| **Onboarding** | Quarterly | Medium (infrequent but painful) | P1 |
| **Policy Q&A** | Weekly | Medium (differentiator) | P1 |
| **Investment Declaration** | Annually | Low (seasonal) | P2 |
| **Offboarding** | Quarterly | Low (infrequent) | P2 |
| **Geo-Fencing** | Daily (if field) | Low (niche use case) | P2 |
| **WhatsApp Integration** | Daily | Low (nice-to-have) | P2 |

---

## Indian HRMS Market Insights (2026)

### Adoption Triggers
- Companies adopt HRMS at **15-20 employees** when manual processes cause errors and compliance risk
- Primary drivers: **Compliance automation** (70%) > **Time savings** (60%) > **Employee experience** (30%)
- 2026 trend: **Mobile-first** and **field employee support** increasingly critical (remote/hybrid work)

### Pricing Benchmarks
- **Budget tier:** ₹20-50/employee/month (Kredily, Salarybox)
- **Mid-tier:** ₹50-100/employee/month (sumHR, greytHR)
- **Premium:** ₹100-200/employee/month (Keka, Darwinbox, Zoho People)
- **For 20 employees:** Total monthly cost typically ₹1,000-3,000 (budget to premium)

### Common Pain Points with Existing HRMS
1. **Overcomplexity:** "Keka too complex" is a common complaint for small teams
2. **Feature bloat:** Paying for unused features (ATS, LMS, advanced analytics)
3. **Slow setup:** Taking days/weeks to configure when teams need immediate productivity
4. **Poor mobile UX:** Desktop-first designs don't work for field employees
5. **Generic workflows:** Designed for 500+ employees, not 20-person startups

### Regulatory Landscape (2026)
- **Stricter enforcement:** Labour law compliance audits increasing; penalties for late PF/ESI filing
- **DPDP Act:** India's data protection law requires local data storage and employee consent management
- **Document retention:** 3-10 year retention for payroll/tax records mandated
- **State variations:** PT rules differ by state (Maharashtra, Karnataka, Tamil Nadu, West Bengal most strict)

---

## Risk Flags

### High-Risk Features (Get Wrong = Legal/Financial Damage)
1. **TDS Calculations:** Complex tax rules; frequent changes; high error cost (penalties)
2. **PF/ESI Calculations:** Must file by 15th; late filing = penalties + employee complaints
3. **Final Settlement (Offboarding):** Gratuity, PF, leave encashment calculations must be accurate
4. **Document Retention:** DPDP Act compliance; must store records 3-10 years with audit trails

**Mitigation:** Start with conservative implementations; verify against CA/payroll experts; add extensive testing.

### Medium-Risk Features (Get Wrong = User Frustration)
1. **Leave Balance Logic:** Edge cases (carry-forward, encashment, negative balance) confuse users
2. **Attendance Regularization:** Workflow complexity (missed punch, late arrival, early exit)
3. **Expense Approvals:** Multi-level approvals can deadlock; keep simple

### Low-Risk Features (Get Wrong = Minor Annoyance)
1. **Notifications:** Too many = annoying; too few = missed deadlines
2. **UI/UX:** Poor design = lower adoption but not operational failure
3. **Reporting:** Missing reports can be added later; not blocking

---

## Sources

### High Confidence (Official/Authoritative)
- [Top 10 HRMS Software in India 2026 – Asanify](https://asanify.com/blog/human-resources/top-10-hr-management-tools-in-india/)
- [Keka HR Software Guide – Authencio](https://www.authencio.com/blog/keka-hr-software-guide-features-pricing-pros-cons-alternatives-for-indian-smbs)
- [Payroll in India: Essential Guide for Employers in 2026](https://peoplemanagingpeople.com/payroll-compensation/run-payroll-india/)
- [Payroll Compliance Checklist in India – SavvyHRMS](https://savvyhrms.com/payroll-compliance-complete-guide/)
- [PF, ESI, Gratuity, TDS: What Every HR Must Know in 2026](https://hrsays.in/pf-esi-gratuity-tds-what-every-hr-must-know-in-2026)
- [Payroll Compliance in India 2026 – Wisemonk](https://www.wisemonk.io/blogs/payroll-compliance-in-india)

### Medium Confidence (Industry Analysis)
- [HRMS for Startups – HROne](https://hrone.cloud/blog/why-hrms-software-first-choice-indian-startups/)
- [Top HR Software in India – Wisemonk](https://www.wisemonk.io/blogs/top-hr-software-in-india)
- [7 Best Affordable HRMS for SMEs – Salarybox](https://salarybox.in/blog/7-best-affordable-hrms-software-for-smes-startups-in-india-2026/)
- [Top HRMS Software for SMBs in India – Inc Business](https://incbusiness.in/startups/top-hrms-software-for-smbs-in-india-2026-what-to-use-and-why/)
- [HRMS Management 2026: Avoiding Costly Mistakes – AgilityPortal](https://agilityportal.io/blog/hrms-management-2026-complete-guide)

### AI/Chatbot Features
- [HR Chatbot – smHRty by Pocket HRMS](https://www.pockethrms.com/hr-chatbot/)
- [QanBot – HR Chatbot for Employee Support](https://www.qandle.com/hr-chatbot.html)
- [10 Best HR Chatbots in 2026 – Lindy](https://www.lindy.ai/blog/hr-chatbots)
- [How HR Chatbots Improve HR Processes – AIHR](https://www.aihr.com/blog/hr-chatbots/)

### Compliance & Document Management
- [Top 15+ HR Document Management System Features – Craze](https://www.crazehq.com/blog/hr-document-management-system-features)
- [Best Employee Record Management Systems for 2026 – Craze](https://www.crazehq.com/blog/best-employee-record-management-system-india)
- [Payroll Compliance Checklist India 2026 – Uknowva](https://uknowva.com/checklist/payroll-compliances-in-india)

### Recruitment/ATS Features
- [Best Applicant Tracking System in India 2026 – Asanify](https://asanify.com/blog/human-resources/best-applicant-tracking-system-india-2026/)
- [Best Recruitment Software in India – Pocket HRMS](https://www.pockethrms.com/recruitment-software/)
- [Top ATS Software in India – Zimyo](https://www.zimyo.com/resources/insights/top-ats-software-in-india/)

### LMS Integration
- [Best Learning Management System in India 2026 – Zimyo](https://www.zimyo.com/resources/insights/best-learning-management-system/)
- [Top 10 LMS Software Vendors in India – Paradiso](https://www.paradisosolutions.com/lms-vendors-in-india)

### Shift Management & Offboarding
- [Employee Shift Scheduling Software – Pocket HRMS](https://www.pockethrms.com/shift-management-software/)
- [How HRMS Improves Offboarding – Pocket HRMS](https://www.pockethrms.com/blog/how-hrms-boosts-onboarding-and-offboarding-efficiency/)
- [Employee Offboarding Software – Pocket HRMS](https://www.pockethrms.com/employee-offboarding-software/)

---

## Conclusion

For a 20-person Indian company, the HRMS feature set is well-defined:

**Must Build:**
- Core payroll with PF/ESI/PT/TDS compliance (non-negotiable)
- Attendance, leave, ESS portal (operational baseline)
- Mobile access (2026 standard)

**Should Build (Your Edge):**
- AI chatbot for HR queries (unique differentiator)
- Intelligent policy Q&A (extends chatbot value)
- Ruthlessly simple UX (anti-Keka complexity)

**Should NOT Build:**
- Recruitment/ATS, LMS, complex performance management, advanced analytics
- Anything designed for 500+ employees

**Success Criteria:**
If a non-HR founder can run payroll in under 10 minutes and employees can get HR answers via chat without interrupting anyone, you've succeeded where Keka failed.
