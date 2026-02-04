# 07-01 Summary: Test Data Seeding

**Status:** ✅ COMPLETED  
**Executed:** 2026-02-04 12:50 IST

## Overview

Seeded comprehensive test data covering all user roles, multi-state employees (for PT testing), ESI salary ranges, and historical payroll runs.

## Tasks Completed

### Task 1: Employee Seed Script ✅

**File:** `prisma/seed-employees.ts`

Created/verified 5 test employees covering all roles:

| Code | Name | Role | State | Salary | Purpose |
|------|------|------|-------|--------|---------|
| SHR001 | Priya Sharma | ADMIN | Karnataka | ₹85,000 | HR admin |
| SHR002 | Rajesh Kumar | HR_MANAGER | Maharashtra | ₹65,000 | Leave approvals |
| SHR003 | Anita Patel | PAYROLL_MANAGER | Gujarat | ₹55,000 | Payroll processing |
| SHR004 | Vikram Singh | EMPLOYEE | Tamil Nadu | ₹18,000 | ESI eligible |
| SHR005 | Meera Reddy | EMPLOYEE | Karnataka | ₹42,000 | Standard employee |

Plus 3 additional employees (SHR006-008) from previous seeding.

### Task 2: Leave Balances & History ✅

**File:** `prisma/seed-employees.ts` (extended)

Created:
- **Leave Balances:** 24 records (for year 2026)
  - CL: 8-12 days based on tenure
  - SL: 6-10 days
  - EL: 5-14 days

- **Leave Requests:** 6 historical requests
  - Mix of APPROVED and PENDING statuses
  - Covers CL, SL, EL leave types
  - Date range: Oct 2025 - Feb 2026

- **Attendance Records:** 110 records
  - Past 30 days for all employees
  - ~90% present, ~10% absent (realistic pattern)
  - Excludes weekends

### Task 3: Historical Payroll ✅

**File:** `prisma/seed-payroll.ts`

Created 3 months of payroll history:

| Period | Employees | Status | Notes |
|--------|-----------|--------|-------|
| Nov 2025 | 8 | COMPLETED | Full payroll |
| Dec 2025 | 8 | COMPLETED | SHR004 has 2 LOP days |
| Jan 2026 | 8 | COMPLETED | Full payroll |

**Payroll Features:**
- Correct PF calculations (12% employee, employer breakdown)
- ESI deductions where applicable (SHR004 - salary ≤₹21K)
- PT by state (Karnataka, Maharashtra, Gujarat, Tamil Nadu)
- LOP deductions demonstrated (Dec 2025)

**Employee Loan:**
- Created for SHR004 (Vikram Singh)
- Principal: ₹50,000 @ 10% annual interest
- Tenure: 12 months
- EMI: ₹4,395.79/month
- 3 deduction records created (Nov, Dec, Jan)

## Final Database Counts

| Table | Count |
|-------|-------|
| Employees | 8 |
| Leave Balances | 24 |
| Leave Requests | 6 |
| Attendance Records | 110 |
| Payroll Runs | 3 |
| Payroll Records | 24 |
| Employee Loans | 1 |
| Loan Deductions | 3 |

## Success Criteria - All Met ✅

1. ✅ 5+ employees with different roles seeded (8 total)
2. ✅ Multi-state coverage (Karnataka, Maharashtra, Gujarat, Tamil Nadu)
3. ✅ At least one ESI-eligible employee (SHR004 - ₹18K salary)
4. ✅ 3 months historical payroll with correct calculations
5. ✅ Leave balances and attendance history populated

## Files Created

- `prisma/seed-employees.ts` - Employee, leave, and attendance seeding
- `prisma/seed-payroll.ts` - Payroll and loan seeding
- `prisma/check-db.ts` - Utility script for checking DB state

## How to Re-Run

```bash
# Seed employees, leave balances, and attendance
npx tsx prisma/seed-employees.ts

# Seed payroll history and loans
npx tsx prisma/seed-payroll.ts
```

Scripts are idempotent - they skip existing records.

## Test Credentials

All seeded employees use password: `employee123`

| Email | Role |
|-------|------|
| priya.sharma@shreehr.local | ADMIN |
| rajesh.kumar@shreehr.local | HR_MANAGER |
| anita.patel@shreehr.local | PAYROLL_MANAGER |
| vikram.singh@shreehr.local | EMPLOYEE |
| meera.reddy@shreehr.local | EMPLOYEE |
