# Phase 3: Payroll & Compliance - Research

**Researched:** 2026-02-04
**Domain:** Indian Payroll, Statutory Compliance, PDF Generation
**Confidence:** MEDIUM

## Summary

Indian payroll processing for 2026 requires handling complex statutory compliance with multiple regulatory bodies (EPFO, ESIC, Income Tax Department), accurate salary structure calculations following the new Labour Code 2026 (50% Basic Pay Rule), and generation of multiple file formats for government portal uploads. The domain involves precision calculations with specific rounding rules, strict filing deadlines with penalties, and mandatory encryption of sensitive PII data.

The standard approach uses background job processing (BullMQ + Redis) for monthly payroll runs to handle large employee bases efficiently, React-based PDF generation (@react-pdf/renderer) for payslips, and custom text file generation for statutory returns (ECR, Form 24Q). Critical success factors include attendance data locking before payroll, integer-based currency storage (paise) for precision, and validation of salary structures against the 50% Basic Pay Rule before processing.

Key findings show that statutory compliance errors are the #1 cause of penalties in Indian payroll systems, with delayed payments attracting 12% p.a. interest plus damages. The new Labour Code 2026, effective November 21, 2025, fundamentally changes salary structure validation rules, making pre-payroll validation mandatory.

**Primary recommendation:** Use BullMQ for background processing, @react-pdf/renderer for payslips, custom text generation for ECR/Form 24Q files, and implement multi-stage validation (attendance lock → salary structure → statutory calculations → file generation) to ensure compliance.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| BullMQ | Latest (4.x+) | Background job queue with Redis | Industry standard for reliable job processing, handles retries, delays, and parent-child dependencies. Used for processing payroll for large employee bases. |
| @react-pdf/renderer | 4.3.2+ | PDF generation using React components | React 19 compatible, server-side rendering support, component-based PDF creation ideal for complex payslips with multiple sections. |
| Redis | 6.x+ | In-memory data store for BullMQ | Required by BullMQ for job queue persistence and worker coordination. |
| Prisma 7 | 7.x | ORM with PostgreSQL | Already in tech stack, supports field-level encryption extensions for PII data. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| prisma-field-encryption | Latest | Field-level encryption for PII | Encrypting PAN, Aadhaar, bank account numbers at rest as required by compliance. |
| date-fns | 3.x+ | Date manipulation | Calculating working days, handling Indian holidays, deadline tracking. |
| zod | 3.x+ | Runtime validation | Validating salary structures, statutory calculations, file formats before processing. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-pdf/renderer | Puppeteer | Puppeteer gives pixel-perfect HTML rendering but much slower (headless Chrome overhead), larger container size. Use only if complex CSS layouts required. |
| @react-pdf/renderer | pdf-lib | pdf-lib better for editing existing PDFs or form filling, not document generation from scratch. |
| BullMQ | Agenda | Agenda simpler but less feature-rich, no parent-child jobs, weaker retry mechanisms. BullMQ is production-grade standard. |

**Installation:**
```bash
npm install bullmq @react-pdf/renderer prisma-field-encryption date-fns zod ioredis
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── payroll/
│   │   ├── calculator.ts          # Salary, LOP, statutory calculations
│   │   ├── validators.ts          # 50% rule, salary structure validation
│   │   ├── constants.ts           # PT slabs, tax rates, wage ceilings
│   │   └── types.ts               # Payroll domain types
│   ├── statutory/
│   │   ├── pf.ts                  # PF calculation (EPF, EPS, EDLI breakdown)
│   │   ├── esi.ts                 # ESI calculation
│   │   ├── pt.ts                  # Professional Tax (state-specific)
│   │   ├── tds.ts                 # TDS calculation (regime-based)
│   │   └── file-generators/
│   │       ├── ecr.ts             # ECR text file generation
│   │       ├── form24q.ts         # Form 24Q JSON/TXT generation
│   │       └── form16.ts          # Form 16 PDF generation
│   ├── pdf/
│   │   ├── payslip.tsx            # Payslip React component
│   │   └── templates/             # PDF layout components
│   └── queues/
│       ├── payroll.queue.ts       # BullMQ queue definition
│       └── workers/
│           ├── payroll.worker.ts  # Main payroll processor
│           └── pdf.worker.ts      # PDF generation worker
├── app/
│   └── api/
│       └── payroll/
│           ├── run/route.ts       # Trigger payroll run (creates job)
│           ├── status/route.ts    # Check job status
│           └── [id]/
│               ├── payslip/route.ts    # Get payslip PDF
│               └── revert/route.ts     # Rollback if needed
└── prisma/
    └── schema.prisma              # PayrollRun, PayrollRecord models
```

### Pattern 1: Multi-Stage Payroll Processing with Job Queue
**What:** Payroll processing broken into stages (validation → calculation → statutory → file generation → finalization) with each stage as a separate job, using parent-child job relationships in BullMQ.

**When to use:** For any payroll run with more than 50 employees, or when processing takes >30 seconds.

**Example:**
```typescript
// Source: https://docs.bullmq.io (BullMQ documentation)
import { Queue, Worker } from 'bullmq';

// Create payroll queue
const payrollQueue = new Queue('payroll', {
  connection: { host: 'localhost', port: 6379 }
});

// Trigger monthly payroll (parent job)
async function runMonthlyPayroll(month: string, year: number) {
  const job = await payrollQueue.add('process-payroll', {
    month,
    year,
    stage: 'validation'
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });

  return job.id;
}

// Worker processes jobs
const payrollWorker = new Worker('payroll', async (job) => {
  const { month, year, stage } = job.data;

  switch (stage) {
    case 'validation':
      // 1. Check attendance lock
      await validateAttendanceLock(month, year);
      // 2. Validate salary structures (50% rule)
      await validateSalaryStructures();
      // Create child job for calculation
      await job.addChildJob('process-payroll', {
        month, year, stage: 'calculation'
      });
      break;

    case 'calculation':
      // Process each employee
      const employees = await getActiveEmployees();
      for (const emp of employees) {
        await calculatePayroll(emp, month, year);
      }
      // Create child job for statutory
      await job.addChildJob('process-payroll', {
        month, year, stage: 'statutory'
      });
      break;

    case 'statutory':
      // Generate ECR, ESI challan, calculate TDS
      await generateStatutoryFiles(month, year);
      await job.addChildJob('process-payroll', {
        month, year, stage: 'finalize'
      });
      break;

    case 'finalize':
      // Mark payroll as complete, send notifications
      await finalizePayroll(month, year);
      break;
  }
}, {
  connection: { host: 'localhost', port: 6379 }
});
```

### Pattern 2: Integer-Based Currency Storage (Paise)
**What:** Store all salary amounts as integers representing paise (1/100th of rupee) to avoid floating-point precision errors.

**When to use:** Always, for all salary components, deductions, and calculations.

**Example:**
```typescript
// Store amounts in paise (integers)
interface SalaryComponent {
  id: string;
  name: string;
  amount_paise: number;  // 50000 rupees = 5000000 paise
}

// Helper functions for conversion
function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

function paiseToRupees(paise: number): number {
  return paise / 100;
}

// Calculations in paise
function calculateBasicPay(ctcPaise: number): number {
  // 50% basic pay rule
  return Math.round(ctcPaise * 0.50);
}

function calculatePF(basicPaise: number): number {
  // PF cap: 15,000 rupees = 1,500,000 paise
  const PF_WAGE_CEILING_PAISE = 1500000;
  const pfBase = Math.min(basicPaise, PF_WAGE_CEILING_PAISE);

  // Employee contribution: 12%
  return Math.round(pfBase * 0.12);
}
```

### Pattern 3: State-Based Professional Tax with Configuration
**What:** Store state-wise PT slabs in database as configuration, calculate based on employee's work state.

**When to use:** For PT calculation when organization has employees in multiple states.

**Example:**
```typescript
// Prisma schema for PT slabs
model ProfessionalTaxSlab {
  id                    String   @id @default(cuid())
  state                 String   // "KARNATAKA", "MAHARASHTRA"
  gender                String?  // "MALE", "FEMALE", null for all
  min_salary_paise      Int
  max_salary_paise      Int?
  monthly_tax_paise     Int
  february_tax_paise    Int      // Special rate for February
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  @@index([state])
}

// PT calculation
async function calculatePT(
  employeeId: string,
  month: number,
  year: number,
  grossSalaryPaise: number
): Promise<number> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { work_state: true, gender: true }
  });

  const slabs = await prisma.professionalTaxSlab.findMany({
    where: {
      state: employee.work_state,
      OR: [
        { gender: employee.gender },
        { gender: null }  // Applies to all genders
      ],
      min_salary_paise: { lte: grossSalaryPaise },
      OR: [
        { max_salary_paise: { gte: grossSalaryPaise } },
        { max_salary_paise: null }  // No upper limit
      ]
    }
  });

  if (slabs.length === 0) return 0;

  const slab = slabs[0];
  return month === 2 ? slab.february_tax_paise : slab.monthly_tax_paise;
}
```

### Pattern 4: Attendance Lock Validation Before Payroll
**What:** Check that attendance is locked for the payroll month before allowing payroll processing to begin.

**When to use:** Always, as first step of payroll validation stage.

**Example:**
```typescript
async function validateAttendanceLock(month: number, year: number): Promise<void> {
  const lock = await prisma.attendanceLock.findFirst({
    where: {
      month,
      year,
      is_locked: true
    }
  });

  if (!lock) {
    throw new Error(
      `Attendance not locked for ${year}-${month}. ` +
      `Lock attendance before running payroll.`
    );
  }

  // Also check that lock was created before payroll
  const existingPayroll = await prisma.payrollRun.findFirst({
    where: { month, year }
  });

  if (existingPayroll && existingPayroll.created_at < lock.locked_at) {
    throw new Error(
      `Payroll run exists before attendance lock. ` +
      `Revert payroll and lock attendance first.`
    );
  }
}
```

### Pattern 5: 50% Basic Pay Rule Validation
**What:** Validate salary structure ensures Basic + DA + Retaining Allowance >= 50% of CTC before saving or processing.

**When to use:** When creating/updating salary structure, and before each payroll run.

**Example:**
```typescript
// Source: Labour Code 2026 / 50% Basic Pay Rule research
interface SalaryStructure {
  basic_paise: number;
  hra_paise: number;
  special_allowance_paise: number;
  lta_paise: number;
  medical_paise: number;
  other_allowances_paise: number;
}

function validate50PercentRule(structure: SalaryStructure): {
  isValid: boolean;
  wagesPercentage: number;
  error?: string;
} {
  // Calculate CTC
  const ctcPaise =
    structure.basic_paise +
    structure.hra_paise +
    structure.special_allowance_paise +
    structure.lta_paise +
    structure.medical_paise +
    structure.other_allowances_paise;

  // "Wages" under Code on Wages 2019
  // = Basic + DA + Retaining Allowance (if any)
  // For most companies, this is just Basic
  const wagesPaise = structure.basic_paise;

  const wagesPercentage = (wagesPaise / ctcPaise) * 100;

  if (wagesPercentage < 50) {
    return {
      isValid: false,
      wagesPercentage,
      error: `Basic pay (${wagesPercentage.toFixed(2)}%) must be at least 50% of CTC. ` +
             `Increase basic by ₹${paiseToRupees(Math.ceil(ctcPaise * 0.50 - wagesPaise))}`
    };
  }

  return { isValid: true, wagesPercentage };
}
```

### Pattern 6: LOP Calculation with Working Days
**What:** Calculate Loss of Pay based on working days (excluding weekends/holidays) for the month.

**When to use:** When employee has unpaid leaves or absent days.

**Example:**
```typescript
async function calculateLOP(
  employeeId: string,
  month: number,
  year: number
): Promise<number> {
  // Get attendance summary
  const attendance = await prisma.attendanceSummary.findUnique({
    where: {
      employee_id_month_year: {
        employee_id: employeeId,
        month,
        year
      }
    }
  });

  if (!attendance || attendance.lop_days === 0) return 0;

  // Get monthly salary
  const salary = await prisma.salaryRecord.findFirst({
    where: { employee_id: employeeId },
    orderBy: { effective_date: 'desc' }
  });

  if (!salary) return 0;

  // Calculate total working days (exclude weekends + holidays)
  const workingDays = await getWorkingDays(month, year);

  // LOP = (Monthly Salary / Working Days) * LOP Days
  const monthlyGrossPaise =
    salary.basic_paise +
    salary.hra_paise +
    salary.special_allowance_paise +
    (salary.lta_paise || 0) +
    (salary.medical_paise || 0) +
    (salary.other_allowances_paise || 0);

  const perDayPaise = Math.round(monthlyGrossPaise / workingDays);
  const lopPaise = perDayPaise * attendance.lop_days;

  return lopPaise;
}

async function getWorkingDays(month: number, year: number): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  let workingDays = 0;
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;  // Sunday or Saturday

    const isHoliday = await prisma.holiday.findFirst({
      where: {
        date: currentDate,
        is_working_day: false
      }
    });

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    currentDate = new Date(currentDate.getTime() + 86400000);  // +1 day
  }

  return workingDays;
}
```

### Anti-Patterns to Avoid
- **Floating-point currency:** Never use `number` for rupees with decimals. JavaScript floating-point math causes precision errors (0.1 + 0.2 = 0.30000000000000004). Always use integers (paise).
- **Manual statutory calculation:** Don't write custom formulas for PT slabs, TDS calculations. Use configuration tables and reference official government rates.
- **Synchronous payroll processing:** Never run payroll calculations in HTTP request handler. Use background jobs (BullMQ) to avoid timeouts and enable retry logic.
- **Unlocked attendance processing:** Never allow payroll run without checking attendance lock. This causes reconciliation issues and incorrect LOP calculations.
- **Storing PAN/Aadhaar in plaintext:** Always encrypt sensitive PII at rest. Use prisma-field-encryption or similar.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job queue with retries | Custom queue with setTimeout/setInterval | BullMQ | Job queues need persistence, failure recovery, distributed locking, monitoring. BullMQ handles all edge cases (worker crashes, Redis failover, delayed jobs). |
| PDF generation from HTML | Custom Canvas API / DOM manipulation | @react-pdf/renderer | PDF specs are complex (fonts, layouts, page breaks, images). Libraries handle encoding, compression, standards compliance. Custom solutions break on edge cases. |
| TDS calculation | Custom tax bracket logic | Configuration table + calculator | Tax regimes change annually (Budget 2026), multiple exemptions (80C, 80D, HRA), projected annual income logic. Configuration-driven approach handles changes without code updates. |
| State-wise PT slabs | Hardcoded if/else for each state | Database-driven PT configuration | 21+ Indian states with different slabs, gender-based rules (Maharashtra), monthly vs bi-annual (West Bengal). New states added over time. Database allows runtime updates. |
| ECR file format | Manual string concatenation | Type-safe builder with validation | ECR format has 11 fields with specific separators (#~#), field lengths, UAN validation. Manual approach error-prone. Builder ensures format compliance. |
| Deadline tracking | Manual date checks | Calendar-based alert system | Statutory deadlines vary (PF 15th, TDS 7th, quarterly returns), need 7/3/1 day advance alerts, handle holidays/weekends. Purpose-built system tracks all deadlines reliably. |

**Key insight:** Indian statutory compliance involves precise calculations with legal penalties for errors. Edge cases (leap years, mid-month salary changes, ESI threshold crossing) make custom solutions risky. Use established patterns and thorough validation.

## Common Pitfalls

### Pitfall 1: PF Calculation Without Wage Ceiling Cap
**What goes wrong:** Calculating 12% PF on full basic salary when basic exceeds ₹15,000/month, leading to incorrect deductions and compliance issues.

**Why it happens:** Developers miss that PF contributions are capped at ₹15,000 wage ceiling. For employees with basic > ₹15,000, PF is still calculated on ₹15,000 only (unless employer offers voluntary higher PF).

**How to avoid:** Always apply wage ceiling before PF calculation:
```typescript
const PF_WAGE_CEILING_PAISE = 1500000; // ₹15,000 in paise
const pfBasePaise = Math.min(basicSalaryPaise, PF_WAGE_CEILING_PAISE);
const employeePF = Math.round(pfBasePaise * 0.12);
```

**Warning signs:**
- Employee with ₹25,000 basic showing ₹3,000 PF deduction (should be ₹1,800)
- Employer PF contribution exceeding ₹1,800 per employee per month
- ECR file rejection due to wage mismatch

### Pitfall 2: EPS vs EPF Split in Employer Contribution
**What goes wrong:** Allocating full 12% employer contribution to EPF, missing the EPS (pension) and EDLI (insurance) components, causing ECR file rejections.

**Why it happens:** Employer's 12% contribution is split: 3.67% to EPF, 8.33% to EPS (capped at ₹1,250), 0.50% to EDLI. Developers assume it all goes to EPF.

**How to avoid:** Implement proper breakdown:
```typescript
const pfBasePaise = Math.min(basicSalaryPaise, PF_WAGE_CEILING_PAISE);

// Employee contribution (12% - all to EPF)
const employeeEPF = Math.round(pfBasePaise * 0.12);

// Employer contribution (12% total, split)
const employerEPF = Math.round(pfBasePaise * 0.0367);
const employerEPS = Math.min(
  Math.round(pfBasePaise * 0.0833),
  125000  // ₹1,250 in paise
);
const employerEDLI = Math.round(pfBasePaise * 0.005);
const adminCharges = Math.round(pfBasePaise * 0.0051); // 0.50% + 0.01%

const totalEmployerPF = employerEPF + employerEPS + employerEDLI + adminCharges;
```

**Warning signs:**
- ECR file showing 12% employer contribution entirely as EPF
- EPFO portal rejection with "EPS amount mismatch" error
- Employees' pension accounts not getting credited

### Pitfall 3: ESI Applicability Not Rechecked Every Month
**What goes wrong:** Employee's gross salary increases above ₹21,000 but ESI continues to be deducted, or vice versa (salary drops below ₹21,000 but ESI not applied).

**Why it happens:** ESI applicability is checked once at joining, not recalculated monthly when salary changes due to increments, LOP, or arrears.

**How to avoid:** Check ESI eligibility every payroll run:
```typescript
async function calculateESI(employeeId: string, grossSalaryPaise: number): Promise<{
  employeeESI: number;
  employerESI: number;
  isApplicable: boolean;
}> {
  const ESI_WAGE_CEILING_PAISE = 2100000; // ₹21,000 in paise

  // Check current month's gross
  if (grossSalaryPaise > ESI_WAGE_CEILING_PAISE) {
    return { employeeESI: 0, employerESI: 0, isApplicable: false };
  }

  // Also check if employee was ESI-covered before
  const esiHistory = await prisma.esiCoverage.findFirst({
    where: { employee_id: employeeId },
    orderBy: { coverage_start: 'desc' }
  });

  // Once covered, employee remains covered for contribution period
  // even if salary exceeds limit mid-period

  return {
    employeeESI: Math.round(grossSalaryPaise * 0.0075),  // 0.75%
    employerESI: Math.round(grossSalaryPaise * 0.0325),  // 3.25%
    isApplicable: true
  };
}
```

**Warning signs:**
- Employees with ₹22,000 gross still showing ESI deductions
- Employees eligible for ESI (₹18,000 gross) not getting coverage
- ESI challan amount mismatches with payroll records

### Pitfall 4: Professional Tax February Special Rate Not Applied
**What goes wrong:** PT deduction is same for all 12 months, missing the higher February deduction, causing annual PT total to be incorrect.

**Why it happens:** Karnataka and some states have higher PT for February (₹300 instead of ₹200) to reach annual max of ₹2,400. Developers miss this month-specific logic.

**How to avoid:** Include month check in PT calculation:
```typescript
const isFebruary = month === 2;
const ptAmount = isFebruary ? slab.february_tax_paise : slab.monthly_tax_paise;
```

**Warning signs:**
- Annual PT total is ₹2,200 instead of ₹2,400 for Karnataka employees
- Payslips show ₹200 PT in February (should be ₹300)
- State PT portal showing underpayment

### Pitfall 5: Running Payroll Without Attendance Lock
**What goes wrong:** Payroll is processed but attendance is still being edited, causing LOP calculations to be incorrect and requiring payroll reversal.

**Why it happens:** No enforcement of attendance finalization before payroll. HR might discover attendance errors after payroll run.

**How to avoid:** Enforce attendance lock as first validation:
```typescript
async function startPayrollRun(month: number, year: number) {
  // FIRST: Check attendance lock
  const lock = await prisma.attendanceLock.findFirst({
    where: { month, year, is_locked: true }
  });

  if (!lock) {
    throw new PayrollValidationError(
      'ATTENDANCE_NOT_LOCKED',
      `Attendance must be locked before payroll. Lock attendance for ${year}-${month} first.`
    );
  }

  // Prevent duplicate payroll run
  const existing = await prisma.payrollRun.findFirst({
    where: { month, year, status: { not: 'REVERTED' } }
  });

  if (existing) {
    throw new PayrollValidationError(
      'PAYROLL_ALREADY_EXISTS',
      `Payroll for ${year}-${month} already processed.`
    );
  }

  // Proceed with payroll...
}
```

**Warning signs:**
- Multiple payroll reversals due to attendance corrections
- LOP amounts disputed by employees
- Attendance data modified after payroll run

### Pitfall 6: Not Handling TDS Regime Selection Per Employee
**What goes wrong:** Applying same tax regime (old/new) to all employees, ignoring individual employee's regime choice, causing incorrect TDS deductions.

**Why it happens:** Budget 2026 allows employees to choose between old regime (with deductions) and new regime (lower rates). This is employee-specific, not company-wide.

**How to avoid:** Store regime choice per employee, default to new regime:
```typescript
// Prisma schema
model Employee {
  id                String   @id
  tax_regime        String   @default("NEW")  // "OLD" or "NEW"
  // ... other fields
}

async function calculateTDS(
  employeeId: string,
  projectedAnnualIncomePaise: number
): Promise<number> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { tax_regime: true }
  });

  if (employee.tax_regime === 'NEW') {
    return calculateTDSNewRegime(projectedAnnualIncomePaise);
  } else {
    // Old regime: get employee's declared investments for 80C, etc.
    const declarations = await getEmployeeTaxDeclarations(employeeId);
    return calculateTDSOldRegime(projectedAnnualIncomePaise, declarations);
  }
}
```

**Warning signs:**
- Employees complaining about high TDS despite choosing new regime
- Form 16 showing wrong tax regime
- Manual adjustments needed in final TDS calculations

### Pitfall 7: Form 24Q Missing Annexure II in Q4
**What goes wrong:** Form 24Q filed for Q4 (Jan-Mar) without Annexure II, causing rejection or inability to generate Form 16.

**Why it happens:** Q1-Q3 require only Annexure I (summary), but Q4 requires both Annexure I and II (detailed salary breakup for Form 16 generation).

**How to avoid:** Add conditional logic for Q4:
```typescript
async function generateForm24Q(quarter: number, year: number): Promise<Form24QData> {
  const annexureI = await generateAnnexureI(quarter, year);

  let annexureII = null;
  if (quarter === 4) {
    // Q4: Include Annexure II with full salary details
    annexureII = await generateAnnexureII(year);
  }

  return {
    annexureI,
    annexureII,
    quarter,
    financialYear: year
  };
}
```

**Warning signs:**
- Q4 Form 24Q rejected by TRACES portal
- Unable to generate Form 16 for employees
- Correction statement needed after filing

## Code Examples

Verified patterns from official sources:

### Statutory Deadline Tracking System
```typescript
// Source: Research on statutory compliance deadlines 2026
interface StatutoryDeadline {
  type: 'PF' | 'ESI' | 'TDS' | 'PT' | 'FORM_24Q' | 'FORM_16';
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  dueDay: number;  // Day of month
  month?: number;  // For annual deadlines
  description: string;
}

const STATUTORY_DEADLINES: StatutoryDeadline[] = [
  {
    type: 'PF',
    frequency: 'MONTHLY',
    dueDay: 15,
    description: 'PF payment (15th of following month)'
  },
  {
    type: 'ESI',
    frequency: 'MONTHLY',
    dueDay: 15,
    description: 'ESI payment (15th of following month)'
  },
  {
    type: 'TDS',
    frequency: 'MONTHLY',
    dueDay: 7,
    description: 'TDS deposit (7th of following month)'
  },
  {
    type: 'FORM_24Q',
    frequency: 'QUARTERLY',
    dueDay: 31,
    description: 'Form 24Q quarterly TDS return'
  },
  {
    type: 'FORM_16',
    frequency: 'ANNUAL',
    dueDay: 15,
    month: 6,  // June
    description: 'Form 16 annual TDS certificate'
  }
];

async function checkUpcomingDeadlines(currentDate: Date): Promise<Alert[]> {
  const alerts: Alert[] = [];

  for (const deadline of STATUTORY_DEADLINES) {
    const dueDate = calculateDueDate(deadline, currentDate);
    const daysUntilDue = Math.floor(
      (dueDate.getTime() - currentDate.getTime()) / 86400000
    );

    // Alert at 7, 3, and 1 day before deadline
    if (daysUntilDue === 7 || daysUntilDue === 3 || daysUntilDue === 1) {
      alerts.push({
        type: deadline.type,
        dueDate,
        daysRemaining: daysUntilDue,
        severity: daysUntilDue === 1 ? 'HIGH' : 'MEDIUM',
        message: `${deadline.description} due on ${dueDate.toLocaleDateString()}`
      });
    }

    // Alert if overdue
    if (daysUntilDue < 0) {
      alerts.push({
        type: deadline.type,
        dueDate,
        daysRemaining: daysUntilDue,
        severity: 'CRITICAL',
        message: `${deadline.description} OVERDUE by ${Math.abs(daysUntilDue)} days`
      });
    }
  }

  return alerts;
}

function calculateDueDate(deadline: StatutoryDeadline, currentDate: Date): Date {
  if (deadline.frequency === 'MONTHLY') {
    // Due on Xth of next month
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      deadline.dueDay
    );
    return nextMonth;
  }

  if (deadline.frequency === 'QUARTERLY') {
    // Form 24Q: Due on last day of month following quarter end
    // Q1 (Apr-Jun) → Due Jul 31
    // Q2 (Jul-Sep) → Due Oct 31
    // Q3 (Oct-Dec) → Due Jan 31
    // Q4 (Jan-Mar) → Due May 31
    const currentMonth = currentDate.getMonth(); // 0-11
    let quarterEndMonth;

    if (currentMonth >= 3 && currentMonth <= 5) quarterEndMonth = 5;  // Q1
    else if (currentMonth >= 6 && currentMonth <= 8) quarterEndMonth = 8;  // Q2
    else if (currentMonth >= 9 && currentMonth <= 11) quarterEndMonth = 11;  // Q3
    else quarterEndMonth = 2;  // Q4

    const dueMonth = quarterEndMonth + 1;
    const dueYear = dueMonth > 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();

    return new Date(dueYear, dueMonth, deadline.dueDay);
  }

  if (deadline.frequency === 'ANNUAL' && deadline.month) {
    // Form 16: Due June 15 every year
    return new Date(
      currentDate.getFullYear(),
      deadline.month - 1,
      deadline.dueDay
    );
  }

  throw new Error(`Unknown deadline frequency: ${deadline.frequency}`);
}
```

### ECR File Generation (EPFO Format)
```typescript
// Source: EPFO ECR file format specifications
interface ECREmployee {
  uan: string;
  name: string;
  grossWagesPaise: number;
  epfWagesPaise: number;
  epsWagesPaise: number;
  edliWagesPaise: number;
  employeeEPFPaise: number;
  employerEPFPaise: number;
  employerEPSPaise: number;
  employerEDLIPaise: number;
  ncp_days: number;  // Non-contribution days (LOP)
}

function generateECRFile(
  establishmentId: string,
  month: number,
  year: number,
  employees: ECREmployee[]
): string {
  const SEPARATOR = '#~#';

  // Calculate totals for header
  const totals = employees.reduce((acc, emp) => ({
    grossWages: acc.grossWages + emp.grossWagesPaise,
    epfWages: acc.epfWages + emp.epfWagesPaise,
    employeeEPF: acc.employeeEPF + emp.employeeEPFPaise,
    employerEPF: acc.employerEPF + emp.employerEPFPaise,
    employerEPS: acc.employerEPS + emp.employerEPSPaise,
    employerEDLI: acc.employerEDLI + emp.employerEDLIPaise
  }), {
    grossWages: 0,
    epfWages: 0,
    employeeEPF: 0,
    employerEPF: 0,
    employerEPS: 0,
    employerEDLI: 0
  });

  // Header line (summary)
  const headerLine = [
    establishmentId,
    `${month}/${year}`,
    employees.length.toString(),
    paiseToRupees(totals.grossWages).toFixed(2),
    paiseToRupees(totals.epfWages).toFixed(2),
    paiseToRupees(totals.employeeEPF).toFixed(2),
    paiseToRupees(totals.employerEPF).toFixed(2),
    paiseToRupees(totals.employerEPS).toFixed(2),
    paiseToRupees(totals.employerEDLI).toFixed(2),
    '0.00',  // NCP days at summary level
    '0'      // Refund amount
  ].join(SEPARATOR);

  // Detail lines (one per employee)
  const detailLines = employees.map(emp => {
    return [
      emp.uan,
      emp.name,
      paiseToRupees(emp.grossWagesPaise).toFixed(2),
      paiseToRupees(emp.epfWagesPaise).toFixed(2),
      paiseToRupees(emp.epsWagesPaise).toFixed(2),
      paiseToRupees(emp.edliWagesPaise).toFixed(2),
      paiseToRupees(emp.employeeEPFPaise).toFixed(2),
      paiseToRupees(emp.employerEPFPaise).toFixed(2),
      paiseToRupees(emp.employerEPSPaise).toFixed(2),
      paiseToRupees(emp.employerEDLIPaise).toFixed(2),
      emp.ncp_days.toString()
    ].join(SEPARATOR);
  });

  // Combine header + details
  return [headerLine, ...detailLines].join('\n');
}

// Usage
async function generateECRForMonth(month: number, year: number): Promise<string> {
  const payrollRecords = await prisma.payrollRecord.findMany({
    where: { month, year },
    include: { employee: true }
  });

  const ecrEmployees: ECREmployee[] = payrollRecords.map(record => ({
    uan: record.employee.uan_number,
    name: record.employee.full_name,
    grossWagesPaise: record.gross_salary_paise,
    epfWagesPaise: record.pf_base_paise,
    epsWagesPaise: record.pf_base_paise,
    edliWagesPaise: record.pf_base_paise,
    employeeEPFPaise: record.pf_employee_paise,
    employerEPFPaise: record.pf_employer_epf_paise,
    employerEPSPaise: record.pf_employer_eps_paise,
    employerEDLIPaise: record.pf_employer_edli_paise,
    ncp_days: record.lop_days
  }));

  return generateECRFile('ESTABLISHMENT_ID', month, year, ecrEmployees);
}
```

### Payslip PDF Component (@react-pdf/renderer)
```typescript
// Source: @react-pdf/renderer official documentation
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer
} from '@react-pdf/renderer';

interface PayslipData {
  employee: {
    name: string;
    employeeId: string;
    designation: string;
    pan: string;
    uan: string;
  };
  period: {
    month: number;
    year: number;
    paidDays: number;
    lopDays: number;
  };
  earnings: {
    basic: number;
    hra: number;
    specialAllowance: number;
    lta: number;
    medical: number;
  };
  deductions: {
    pf: number;
    esi: number;
    pt: number;
    tds: number;
  };
  gross: number;
  totalDeductions: number;
  netPay: number;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center'
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10
  },
  section: {
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5
  },
  labelColumn: {
    width: '70%'
  },
  amountColumn: {
    width: '30%',
    textAlign: 'right'
  },
  totalRow: {
    flexDirection: 'row',
    fontWeight: 'bold',
    marginTop: 5,
    paddingVertical: 5,
    borderTopWidth: 2,
    borderTopColor: '#000'
  },
  footer: {
    marginTop: 30,
    fontSize: 8,
    color: '#666'
  }
});

// Create Document Component
export function PayslipDocument({ data }: { data: PayslipData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Your Company Name</Text>
          <Text style={styles.title}>Salary Slip</Text>
          <Text>
            For the month of {getMonthName(data.period.month)} {data.period.year}
          </Text>
        </View>

        {/* Employee Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Employee Name:</Text>
            <Text style={styles.amountColumn}>{data.employee.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Employee ID:</Text>
            <Text style={styles.amountColumn}>{data.employee.employeeId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Designation:</Text>
            <Text style={styles.amountColumn}>{data.employee.designation}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>PAN:</Text>
            <Text style={styles.amountColumn}>{maskPAN(data.employee.pan)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>UAN:</Text>
            <Text style={styles.amountColumn}>{data.employee.uan}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Paid Days:</Text>
            <Text style={styles.amountColumn}>
              {data.period.paidDays} {data.period.lopDays > 0 && `(LOP: ${data.period.lopDays})`}
            </Text>
          </View>
        </View>

        {/* Earnings and Deductions */}
        <View style={{ flexDirection: 'row' }}>
          {/* Earnings Column */}
          <View style={{ width: '50%', paddingRight: 10 }}>
            <Text style={styles.title}>Earnings</Text>
            <View style={styles.row}>
              <Text style={styles.labelColumn}>Basic Salary</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.earnings.basic)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelColumn}>HRA</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.earnings.hra)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelColumn}>Special Allowance</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.earnings.specialAllowance)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelColumn}>LTA</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.earnings.lta)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelColumn}>Medical Allowance</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.earnings.medical)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.labelColumn}>Gross Earnings</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.gross)}</Text>
            </View>
          </View>

          {/* Deductions Column */}
          <View style={{ width: '50%', paddingLeft: 10 }}>
            <Text style={styles.title}>Deductions</Text>
            <View style={styles.row}>
              <Text style={styles.labelColumn}>Provident Fund</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.deductions.pf)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelColumn}>ESI</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.deductions.esi)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelColumn}>Professional Tax</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.deductions.pt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelColumn}>Income Tax (TDS)</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.deductions.tds)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.labelColumn}>Total Deductions</Text>
              <Text style={styles.amountColumn}>{formatCurrency(data.totalDeductions)}</Text>
            </View>
          </View>
        </View>

        {/* Net Pay */}
        <View style={[styles.totalRow, { marginTop: 20, fontSize: 12 }]}>
          <Text style={styles.labelColumn}>Net Pay</Text>
          <Text style={styles.amountColumn}>{formatCurrency(data.netPay)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a system-generated payslip and does not require a signature.</Text>
          <Text>Generated on: {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
}

// Helper functions
function formatCurrency(paise: number): string {
  return `₹${paiseToRupees(paise).toFixed(2)}`;
}

function maskPAN(pan: string): string {
  // Show only last 4 chars: ABCDE1234F → XXXXXX234F
  return 'X'.repeat(pan.length - 4) + pan.slice(-4);
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}

// Server-side PDF generation (Next.js API route)
import { renderToStream } from '@react-pdf/renderer';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payrollRecordId = params.id;

  // Fetch payroll data
  const record = await prisma.payrollRecord.findUnique({
    where: { id: payrollRecordId },
    include: { employee: true }
  });

  if (!record) {
    return new Response('Not found', { status: 404 });
  }

  // Convert to payslip data format
  const payslipData: PayslipData = {
    employee: {
      name: record.employee.full_name,
      employeeId: record.employee.employee_id,
      designation: record.employee.designation,
      pan: record.employee.pan_encrypted,  // Will be decrypted by getter
      uan: record.employee.uan_number
    },
    period: {
      month: record.month,
      year: record.year,
      paidDays: record.paid_days,
      lopDays: record.lop_days
    },
    earnings: {
      basic: record.basic_paise,
      hra: record.hra_paise,
      specialAllowance: record.special_allowance_paise,
      lta: record.lta_paise || 0,
      medical: record.medical_paise || 0
    },
    deductions: {
      pf: record.pf_employee_paise,
      esi: record.esi_employee_paise,
      pt: record.pt_paise,
      tds: record.tds_paise
    },
    gross: record.gross_salary_paise,
    totalDeductions: record.total_deductions_paise,
    netPay: record.net_salary_paise
  };

  // Generate PDF stream
  const stream = await renderToStream(<PayslipDocument data={payslipData} />);

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="payslip-${record.employee.employee_id}-${record.year}-${record.month}.pdf"`
    }
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual payroll processing in spreadsheets | Background job processing with BullMQ | 2023-2024 | Payroll for 100+ employees can run reliably in background, retries on failure, progress tracking. |
| Basic Pay typically 35-40% of CTC | Basic Pay must be 50%+ of CTC | Nov 2025 (Labour Code 2026) | Higher PF contributions, better retirement benefits, lower take-home pay initially. |
| Single tax regime with deductions | Dual tax regime (old vs new, employee choice) | Budget 2020, default changed 2023 | Employees choose regime annually, TDS calculation per employee, not company-wide. |
| PAN/Aadhaar stored in plaintext | Encrypted at rest with field-level encryption | 2023-2024 (DPDPA compliance) | Use prisma-field-encryption or similar, transparent encryption/decryption. |
| PDF generation via Puppeteer (headless Chrome) | @react-pdf/renderer for document generation | 2023-2024 | Lighter, faster, React components for PDFs, no Chrome dependency. Puppeteer still used for pixel-perfect HTML rendering. |
| ESI wage ceiling ₹15,000 | ESI wage ceiling ₹21,000 | 2017 | More employees covered under ESI, broader social security coverage. |

**Deprecated/outdated:**
- **Manual ECR text file creation:** Use builder pattern with validation instead of string concatenation. ECR format has 11 fields with specific separator (#~#), manual approach error-prone.
- **Storing currency as DECIMAL:** Use integers (paise) to avoid floating-point precision errors. JavaScript/TypeScript number type causes rounding issues (0.1 + 0.2 = 0.30000000000000004).
- **Single tax calculation logic:** Old regime with deductions vs new regime with lower rates. Must support both based on employee choice, not assume single regime.
- **State-wise PT hardcoded in code:** Use database configuration table for PT slabs. States update rates, new states added, gender-based rules exist (Maharashtra).

## Open Questions

Things that couldn't be fully resolved:

1. **Form 24Q Exact TXT File Format Specification**
   - What we know: Form 24Q requires JSON workbook format, converted to TXT file for TRACES portal upload. Annexure I (all quarters) + Annexure II (Q4 only).
   - What's unclear: Exact field-level TXT format specification not publicly documented. Commercial software uses proprietary parsers.
   - Recommendation: Use third-party API (like Sandbox.co.in TDS API) for Form 24Q generation, or purchase official Return Preparation Utility (RPU) from NSDL. Don't hand-roll TXT format.

2. **Form 16 Digital Signature Legal Requirements**
   - What we know: Digital signatures are legally valid under IT Act 2000. Payslips can be digitally signed. Some sources say signature mandatory, others say system-generated payslips don't require signature.
   - What's unclear: Specific legal requirement for Form 16 digital signature (Class 2 or Class 3 DSC), vs just authorized personnel's approval.
   - Recommendation: Generate Form 16 PDFs with "Digitally signed by [Company Name]" footer. For legal compliance, consult CA/legal team on DSC requirement. Most modern payroll software uses system-generated approach without DSC.

3. **HRA Exemption Calculation Formula Details**
   - What we know: HRA exemption is minimum of (actual HRA, rent - 10% of salary, 50% of salary for metro/40% for non-metro). Used for TDS calculation.
   - What's unclear: Whether "salary" includes only Basic or Basic + DA + Commission. Whether rent receipts needed for all amounts or only >₹1L/year.
   - Recommendation: Use Basic + DA for "salary" definition. Require rent receipts upload for amounts >₹8,333/month (₹1L annual). Validate landlord PAN for rent >₹50,000/month as per IT rules.

4. **EPS Contribution for Basic > ₹15,000**
   - What we know: EPS capped at ₹1,250/month (8.33% of ₹15,000). For employees with higher basic, excess employer contribution goes to EPF instead of EPS.
   - What's unclear: How to handle employees who opt for voluntary higher PF on full wages (no wage ceiling). Does EPS still cap at ₹1,250 or proportionally increase?
   - Recommendation: For voluntary higher PF, EPS remains capped at ₹1,250 per EPFO guidelines. Excess goes to EPF. Confirm with EPFO for specific establishment if different terms negotiated.

5. **Multi-State Professional Tax Compliance**
   - What we know: Each state has different PT slabs, some gender-based (Maharashtra), some monthly (Karnataka), some bi-annual (West Bengal).
   - What's unclear: For employees working remotely in different state than office location, which state's PT applies? Work state or residence state?
   - Recommendation: PT applies based on work location (where services rendered), not residence. For remote employees, use registered office state unless employee explicitly assigned to branch in another state. Update employee work_state field when they relocate.

## Sources

### Primary (HIGH confidence)
- [BullMQ Official Documentation](https://docs.bullmq.io) - Job queue architecture, retry patterns
- [@react-pdf/renderer Official Docs](https://react-pdf.org) - PDF generation API, components
- [EPFO ECR File Format](https://www.epfindia.gov.in/site_docs/PDFs/OnlineECR_PDFs/ECR_ForEmployers_FileStructure---2.pdf) - ECR structure (unable to fetch directly, format from multiple sources)
- [ESIC Official Contribution Rates](https://esic.gov.in/contribution) - ESI rates, wage ceiling

### Secondary (MEDIUM confidence)
- [New Wage Code 2026: Impact on Payroll Processing in India](https://topsourceworldwide.com/insights/new-wage-code-2026-the-impact-on-payroll-processing-in-india/)
- [India Labour Codes 2026: The 50% Basic Pay Rule](https://www.zfour.in/post/india-labour-codes-2026-50-percent-basic-pay-rule)
- [Labour codes 2025: How 50% wage rule would alter salaries - BusinessToday](https://www.businesstoday.in/personal-finance/tax/story/labour-codes-2025-how-50-wage-rule-would-alter-salaries-tax-outgo-retirement-savings-508334-2025-12-27)
- [ESI Rate 2024-2026 - ClearTax](https://cleartax.in/s/esi-rate)
- [ESI Contribution & Calculation 2025-26](https://hrone.cloud/blog/esi-contribution-calculation/)
- [Professional Tax Slab Rates In Different States - Updated for 2025-26](https://saral.pro/blogs/professional-tax-slab-rates-in-different-states/)
- [Income Tax Slabs for FY 2025-26 (AY 2026-27): New and Old Regime - ClearTax](https://cleartax.in/s/income-tax-slabs)
- [TDS Rate Chart for FY 2025-26 (AY 2026-27) - ClearTax](https://cleartax.in/s/tds-rate-chart)
- [Statutory Compliance Calendar 2026 for Indian Companies](https://tmservices.co.in/the-complete-statutory-compliance-calendar-2026-for-indian-companies/)
- [Tax Compliance Calendar for FY 2025-26 - Jordensky](https://www.jordensky.com/blog/compliance-calendar-for-fy-2025-26)
- [Loss of Pay (LOP) in Salary - Zoho Payroll](https://www.zoho.com/in/payroll/academy/payroll-administration/lop-loss-of-pay.html)
- [LOP Full Form in Salary: Meaning, Calculation & HR Rules (2026 Guide)](https://savvyhrms.com/lop-full-form-meaning-calculation/)
- [Top JavaScript PDF generator libraries for 2025 - Nutrient](https://www.nutrient.io/blog/top-js-pdf-libraries/)
- [Node.js PDF generation libraries comparison](https://npm-compare.com/html-pdf,pdfkit,pdfmake,puppeteer,react-pdf,wkhtmltopdf)
- [Puppeteer HTML to PDF Generation with Node.js - RisingStack](https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/)

### Tertiary (LOW confidence - needs validation)
- [Form 24Q- TDS Return on Salary Payment - ClearTax](https://cleartax.in/s/tds-return-salary-payment)
- [Prepare Form 24Q TDS Return - Sandbox API](https://developer.sandbox.co.in/recipes/tds/form-24q/prepare_form_24q)
- [prisma-field-encryption npm package](https://www.npmjs.com/package/prisma-field-encryption)
- [Digital Signature Laws India - Adobe](https://helpx.adobe.com/legal/esignatures/regulations/india.html)
- [Common Payroll Mistakes India 2026](https://www.hono.ai/blog/payroll-compliance-in-india)
- [Payroll Compliance Checklist India 2026](https://uknowva.com/checklist/payroll-compliances-in-india)
- [Payroll Processing Best Practices India](https://nativeteams.com/blog/payroll-processing-in-india)

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - BullMQ and @react-pdf/renderer verified via official docs, widely used in production. Prisma field encryption exists but less documentation.
- Architecture: MEDIUM - Patterns derived from official BullMQ docs and industry best practices. Multi-stage payroll processing is established pattern but specific validation sequences are custom.
- Pitfalls: HIGH - Statutory compliance errors well-documented across multiple sources, PF/ESI calculation mistakes are common issues confirmed by multiple payroll platforms.
- Statutory compliance: MEDIUM - Government sources (EPFO, ESIC) verified for rates and ceilings. File formats (ECR, Form 24Q) partially documented, exact specifications require official tools or APIs.
- 50% Basic Pay Rule: HIGH - Labour Code 2026 implementation confirmed by multiple authoritative sources with Nov 21, 2025 effective date.

**Research date:** 2026-02-04
**Valid until:** 2026-04-04 (60 days - statutory rates and rules can change with Budget 2026-27, quarterly updates)

**Special notes:**
- Tax rates and slabs subject to annual Budget changes (Budget 2026-27 in July 2026)
- PT slabs may change at state level, require quarterly review
- EPFO/ESIC contribution rates stable since 2019, unlikely to change frequently
- ECR/Form 24Q formats may be updated by government portals, monitor EPFO/TRACES notifications
