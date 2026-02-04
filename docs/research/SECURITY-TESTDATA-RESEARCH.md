# Security & Test Data Research

**Date:** 2026-02-04  
**Researcher:** GSD Research Agent  
**Project:** ShreeHR HRMS

---

## 1. Current Data Model

### 1.1 Schema Analysis

The Prisma schema (`prisma/schema.prisma`) is comprehensive with **38 models** covering:

| Category | Models |
|----------|--------|
| **Core Auth** | User, UserRole (enum) |
| **Organization** | Department, Designation |
| **Employee Data** | Employee (with PII encryption), Document |
| **Leave Management** | LeaveType, LeaveRequest, LeaveBalance |
| **Attendance** | Attendance, AttendanceLock, AttendanceCorrection |
| **Payroll** | SalaryRecord, SalaryStructure, PayrollRun, PayrollRecord |
| **Statutory** | ProfessionalTaxSlab, StatutoryFile, StatutoryDeadline, InvestmentDeclaration |
| **Finance** | ExpensePolicy, ExpenseClaim, ExpenseApproval, EmployeeLoan, LoanDeduction |
| **Onboarding** | OnboardingRecord |
| **AI Assistant** | Conversation, Message, PolicyDocument |

### 1.2 Existing Roles (UserRole Enum)

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  HR_MANAGER
  PAYROLL_MANAGER
  EMPLOYEE
}
```

### 1.3 Key Relationships

```
User ─────────────────┐
  │                   │
  ├── has one ────── Employee
  │                   │
  │                   ├── belongs to → Department
  │                   ├── belongs to → Designation
  │                   ├── reports to → Employee (self-referencing)
  │                   │
  │                   ├── has many → Documents
  │                   ├── has many → SalaryRecords
  │                   ├── has many → SalaryStructures
  │                   ├── has many → LeaveBalances
  │                   ├── has many → LeaveRequests
  │                   ├── has many → Attendances
  │                   ├── has many → PayrollRecords
  │                   ├── has many → ExpenseClaims
  │                   └── has many → Loans
```

### 1.4 Existing Seed Data

Found in `prisma/seed-test-employees.ts`:

**Departments (5):**
- Management
- Human Resources
- Finance
- Engineering
- Design

**Designations (8):**
| Title | Level |
|-------|-------|
| Chief Executive Officer | 10 |
| HR Director | 8 |
| HR Manager | 6 |
| Payroll Manager | 6 |
| Senior Software Engineer | 5 |
| Software Engineer | 4 |
| QA Engineer | 4 |
| UI/UX Designer | 4 |

**Leave Types (7):**
| Name | Code | Annual Quota | Is Paid |
|------|------|--------------|---------|
| Casual Leave | CL | 12 | ✅ |
| Sick Leave | SL | 12 | ✅ |
| Earned Leave | EL | 15 | ✅ |
| Maternity Leave | ML | 182 | ✅ |
| Paternity Leave | PL | 5 | ✅ |
| Compensatory Off | CO | 0 | ✅ |
| Loss of Pay | LOP | 0 | ❌ |

**Test Employees (8):**
| Code | Name | Role | Department | Salary (Monthly) |
|------|------|------|------------|------------------|
| SHR001 | Vijay Sharma | SUPER_ADMIN | Management | ₹5,00,000 |
| SHR002 | Priya Reddy | ADMIN | Human Resources | ₹3,00,000 |
| SHR003 | Amit Patel | HR_MANAGER | Human Resources | ₹1,60,000 |
| SHR004 | Sunita Nair | PAYROLL_MANAGER | Finance | ₹1,80,000 |
| SHR005 | Rahul Kumar | EMPLOYEE | Engineering | ₹1,00,000 |
| SHR006 | Neha Singh | EMPLOYEE | Engineering | ₹1,40,000 |
| SHR007 | Deepak Joshi | EMPLOYEE | Engineering | ₹90,000 |
| SHR008 | Kavitha Menon | EMPLOYEE | Design | ₹1,10,000 |

**Reporting Structure:**
```
Vijay Sharma (CEO)
  └── Priya Reddy (HR Director)
        ├── Amit Patel (HR Manager)
        │     ├── Rahul Kumar
        │     ├── Neha Singh
        │     ├── Deepak Joshi
        │     └── Kavitha Menon
        └── Sunita Nair (Payroll Manager)
```

---

## 2. Security Requirements

### 2.1 RBAC Analysis

**Current Implementation:** Inline role checks in API routes

```typescript
// Pattern found throughout codebase
if (
  session.user.role !== "ADMIN" &&
  session.user.role !== "SUPER_ADMIN" &&
  session.user.role !== "HR_MANAGER"
) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Existing Security Policy** (`docs/SECURITY-POLICY.md`) defines a comprehensive access matrix:

| Data/Action | EMPLOYEE | HR_MANAGER | PAYROLL_MANAGER | ADMIN | SUPER_ADMIN |
|-------------|----------|------------|-----------------|-------|-------------|
| Own Profile | Read | Read | Read | Read/Write | Full |
| Own Salary | Read | ❌ | Read | Full | Full |
| Team Data | ❌ | Subordinates | ❌ | All | All |
| Create Employee | ❌ | ✅ | ❌ | ✅ | ✅ |
| Run Payroll | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approve Leave | ❌ | Team | ❌ | All | All |
| System Config | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | Read | Full |

### 2.2 PII Fields Identified

**Critical PII (Encrypted with AES-256-GCM):**
| Field | Model | Storage | Protection |
|-------|-------|---------|------------|
| `pan_encrypted` | Employee | AES-256-GCM | Encrypted at rest |
| `aadhaar_encrypted` | Employee | AES-256-GCM | Encrypted at rest |
| `bank_account_encrypted` | Employee | AES-256-GCM | Encrypted at rest |

**Sensitive PII (Plaintext, role-restricted):**
| Field | Model | Notes |
|-------|-------|-------|
| `date_of_birth` | Employee | Age discrimination risk |
| `personal_phone` | Employee | Contact info |
| `personal_email` | Employee | Contact info |
| `address_*` | Employee | Location data |
| All salary fields | SalaryRecord, SalaryStructure | Compensation data |
| `bank_name`, `bank_branch`, `bank_ifsc` | Employee | Banking metadata |
| `uan`, `esic_number` | Employee | Government IDs |
| `hra_landlord_pan` | InvestmentDeclaration | Third-party PII |

**Encryption Implementation:**
```typescript
// lib/encryption.ts
- Uses AES-256-GCM algorithm
- Key from ENCRYPTION_KEY env variable (32 bytes hex)
- Includes salt (64 bytes), IV (16 bytes), auth tag (16 bytes)
- Validation functions for PAN, Aadhaar, Bank Account formats
- Masking functions for display (maskPAN, maskAadhaar, maskBankAccount)
```

### 2.3 Audit Requirements

**Current Implementation:**
- All entities have `created_at`, `created_by`, `updated_at`, `updated_by` fields
- AI tool calls logged in `messages.tool_calls` JSON field
- No dedicated `AuditLog` table yet (mentioned in SECURITY-POLICY.md but not in schema)

**Recommended Audit Events:**
| Event Type | Priority | Notes |
|------------|----------|-------|
| Login/Logout | High | Track failed attempts |
| PII Access | Critical | Log decryption events |
| Salary View/Modify | High | Compensation sensitivity |
| Role Changes | Critical | Privilege escalation risk |
| Payroll Runs | High | Financial impact |
| Data Export | High | Bulk data access |
| Profile Updates | Medium | Change tracking |

### 2.4 Security Gaps Identified

1. **No centralized RBAC middleware** - Role checks are scattered across routes
2. **No AuditLog table** - Policy mentions it but schema doesn't have it
3. **No rate limiting** - API routes lack throttling
4. **No IP logging** - `last_login_at` exists but not IP address
5. **Session handling** - 24-hour JWT expiry, no refresh token rotation
6. **Password policy** - No complexity requirements enforced in schema

---

## 3. Test Data Plan

### 3.1 Employee Profiles Needed

**Current gap:** Only 8 employees, all in Bengaluru, Karnataka

**Recommended additions for realistic testing:**

#### By State (for PT testing):
| State | Count | Notes |
|-------|-------|-------|
| Karnataka (KA) | 8 | Existing |
| Maharashtra (MH) | 5 | Different PT rules |
| Tamil Nadu (TN) | 3 | Different PT rules |
| Telangana (TS) | 2 | Different PT rules |
| Delhi (DL) | 2 | No PT |

#### By Salary Range (for statutory testing):
| Range (Monthly Gross) | Count | Tests |
|-----------------------|-------|-------|
| < ₹15,000 | 2 | PT exemption, ESI eligible |
| ₹15,000 - ₹21,000 | 3 | ESI eligible |
| ₹21,001 - ₹50,000 | 5 | Standard statutory |
| ₹50,001 - ₹1,00,000 | 5 | Mid-range |
| > ₹1,00,000 | 5 | High earners, TDS testing |

#### By Gender:
- Male: 12
- Female: 7 (includes maternity leave testing)
- Other: 1

#### By Employment Status:
- ACTIVE: 18
- ON_LEAVE: 1
- RESIGNED: 1

### 3.2 Departments & Designations to Add

**New Departments:**
| Name | Code | Rationale |
|------|------|-----------|
| Sales | SAL | Common in Indian companies |
| Marketing | MKT | Common in Indian companies |
| Operations | OPS | Common in Indian companies |
| Customer Support | SUP | Testing team hierarchies |
| Legal & Compliance | LEG | For policy documents |

**New Designations:**
| Title | Level | Department Focus |
|-------|-------|------------------|
| Sales Manager | 6 | Sales |
| Business Development Executive | 3 | Sales |
| Marketing Manager | 6 | Marketing |
| Content Writer | 3 | Marketing |
| Operations Manager | 6 | Operations |
| Support Lead | 5 | Customer Support |
| Support Executive | 2 | Customer Support |
| Legal Counsel | 7 | Legal |
| Intern | 1 | Cross-department |

### 3.3 Realistic Indian Salary Structures

Based on industry standards (2025-26):

**Entry Level (0-2 years):**
| Component | % of CTC | Amount (₹/month) |
|-----------|----------|------------------|
| Basic | 50% | 20,000 - 30,000 |
| HRA | 20% | 8,000 - 12,000 |
| Special Allowance | 25% | 10,000 - 15,000 |
| Conveyance | 5% | 2,000 - 3,000 |
| **Total CTC** | | ₹40,000 - 60,000 |

**Mid Level (3-7 years):**
| Component | % of CTC | Amount (₹/month) |
|-----------|----------|------------------|
| Basic | 50% | 40,000 - 75,000 |
| HRA | 20% | 16,000 - 30,000 |
| Special Allowance | 20% | 16,000 - 30,000 |
| LTA | 5% | 4,000 - 7,500 |
| Medical | 5% | 4,000 - 7,500 |
| **Total CTC** | | ₹80,000 - 1,50,000 |

**Senior Level (8+ years):**
| Component | % of CTC | Amount (₹/month) |
|-----------|----------|------------------|
| Basic | 40-50% | 80,000 - 2,00,000 |
| HRA | 15-20% | 30,000 - 80,000 |
| Special Allowance | 15-20% | 30,000 - 80,000 |
| LTA | 5% | 10,000 - 20,000 |
| Medical/Other | 10% | 20,000 - 40,000 |
| **Total CTC** | | ₹2,00,000 - 5,00,000+ |

### 3.4 Test Data for Specific Scenarios

**Leave Testing:**
- Employee with 0 leave balance (all used)
- Employee with negative balance (advance leave)
- Employee on maternity leave
- Employee with pending leave request

**Payroll Testing:**
- Employee joined mid-month (pro-rata calculation)
- Employee with LOP days
- Employee with salary revision mid-month
- Employee with loan EMI deductions
- Employee with reimbursements pending

**Attendance Testing:**
- Employee with regularization requests
- Employee with half-day attendance
- Employee with biometric sync issues (IMPORT source)

---

## 4. Recommended Indian Names for Seed Data

### Male Names:
| First | Last | Region |
|-------|------|--------|
| Arjun | Mehta | Gujarat |
| Rajesh | Iyer | Tamil Nadu |
| Mohammed | Khan | Maharashtra |
| Sanjay | Verma | Delhi |
| Vikram | Rao | Telangana |
| Anand | Pillai | Kerala |
| Arun | Sharma | North India |
| Karthik | Subramanian | Tamil Nadu |
| Suresh | Patil | Maharashtra |
| Manish | Agarwal | Delhi |

### Female Names:
| First | Last | Region |
|-------|------|--------|
| Ananya | Sharma | North India |
| Lakshmi | Venkatesh | Karnataka |
| Fatima | Sheikh | Maharashtra |
| Pooja | Gupta | Delhi |
| Meera | Krishnan | Kerala |
| Shreya | Das | West Bengal |
| Divya | Nair | Kerala |

---

## 5. Open Questions for Ved

### Security Decisions:

1. **Centralized RBAC Middleware?**
   - Should we create a shared `withRBAC()` wrapper for API routes?
   - Would reduce code duplication and ensure consistent enforcement

2. **Audit Log Table?**
   - Create dedicated `AuditLog` model as specified in SECURITY-POLICY.md?
   - What events are highest priority to log?

3. **PII Access Logging?**
   - Should we log every decryption event for PAN/Aadhaar/Bank?
   - Performance implications vs. compliance needs

4. **Rate Limiting Strategy?**
   - Per-user limits vs. per-endpoint limits?
   - Redis-based or in-memory?

### Test Data Decisions:

5. **Scale of Test Data?**
   - Current: 8 employees
   - Recommended: 20 employees
   - Alternate: 50+ for stress testing

6. **Historical Data?**
   - Should seed data include past salary records (2024, 2025)?
   - Should seed data include historical leave balances?

7. **Payroll Run History?**
   - Create completed payroll runs for past months?
   - Needed for payslip download testing, statutory file generation

8. **Document Uploads?**
   - Should we seed sample documents (offer letters, ID proofs)?
   - Requires actual file storage setup

9. **Onboarding Records?**
   - Create pending onboarding candidates for testing workflow?

---

## 6. Implementation Recommendations

### Phase 1: Security Hardening
1. Create `lib/rbac.ts` with centralized permission checking
2. Add `AuditLog` model to schema
3. Implement PII access logging
4. Add rate limiting middleware

### Phase 2: Test Data Expansion
1. Add new departments and designations
2. Create 12+ new employees across states
3. Seed historical salary records (6 months)
4. Seed leave balances with varied states
5. Create sample payroll runs

### Phase 3: Edge Case Data
1. Mid-month joiners
2. Employees with loans
3. Pending expense claims
4. Onboarding candidates
5. Terminated employees

---

## Summary

The ShreeHR system has a **solid foundation** with:
- ✅ Comprehensive Prisma schema
- ✅ PII encryption implemented
- ✅ Basic RBAC in API routes
- ✅ Security policy documented
- ✅ Basic test employees seeded

**Key gaps to address:**
- ⚠️ No centralized RBAC middleware
- ⚠️ No audit log table (only entity-level timestamps)
- ⚠️ Limited geographic diversity in test data
- ⚠️ No historical payroll data for testing
- ⚠️ Limited edge cases for statutory testing

**Next steps:** Ved to review this document and make decisions on open questions before proceeding to planning phase.
