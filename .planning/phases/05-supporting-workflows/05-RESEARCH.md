# Phase 5: Supporting Workflows - Research

**Researched:** 2026-02-04
**Domain:** Workflow Management, Approval Systems, Document Processing, Financial Operations
**Confidence:** HIGH

## Summary

Phase 5 implements three supporting workflows for HR operations: employee onboarding with digital offer letters and task tracking, expense management with multi-level approvals and receipt handling, and employee loans with EMI calculation and auto-deduction. The research focused on workflow state management, approval routing patterns, document handling, and recurring financial deduction systems.

The standard approach uses workflow state machines for status transitions, database-driven policy engines for configurable expense limits, checklist-based task tracking for onboarding, and mathematical EMI calculation with payroll integration for loans. The existing infrastructure (Prisma, BullMQ, React Hook Form, document storage) provides most needed capabilities without requiring new core libraries.

Key architectural decisions center on using status enums with state machine validation, JSON fields for flexible checklist/policy storage validated with Zod, multi-level approval routing with threshold-based triggers, and integration with the existing payroll system for expense reimbursement and loan deductions.

**Primary recommendation:** Leverage existing infrastructure (Prisma JSON fields + Zod, BullMQ for notifications, React Hook Form for complex forms) rather than adding workflow libraries. Use status enums with explicit transition validation for state management, and integrate tightly with existing payroll processing for financial operations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.x | Data models for workflows, policies, and checklists | Already in use, supports JSON fields for flexible configuration |
| Zod | Latest | Runtime validation for policies, checklist items, and JSON fields | Already in use, essential for validating unstructured workflow data |
| React Hook Form | Latest | Dynamic forms with useFieldArray for checklists and expense items | Already in use, handles nested arrays and conditional fields |
| BullMQ | Latest | Background jobs for notifications and scheduled tasks | Already in use, proven for payroll, supports parent-child jobs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-pdf/renderer | Latest | Generate offer letters and loan schedules | Already in use for payslips, reuse for onboarding documents |
| date-fns | Latest | Date calculations for loan tenure and onboarding milestones | Lightweight, no timezone complexity needed |
| Resend | Latest | Email delivery for offer letters and notifications | Already configured, use existing email queue |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Status enums | XState library | XState is powerful but adds complexity; status enums with validation functions are simpler for linear workflows |
| JSON fields | Separate tables | JSON fields enable flexible checklists/policies without schema migrations; use Zod validation for type safety |
| Manual routing | Workflow engine (Temporal, n8n) | Overkill for 15 requirements; routing logic in application code is more maintainable for this scale |

**Installation:**
```bash
# No new core dependencies needed
# Optional utilities:
pnpm add date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── workflows/
│   │   ├── onboarding.ts         # Onboarding state machine and helpers
│   │   ├── expense.ts            # Expense approval routing logic
│   │   ├── loan.ts               # EMI calculation and amortization
│   │   └── validators.ts         # Workflow-specific Zod schemas
│   ├── validations/
│   │   ├── onboarding.ts         # Onboarding checklist schemas
│   │   ├── expense.ts            # Expense claim schemas
│   │   └── loan.ts               # Loan creation schemas
├── app/
│   ├── api/
│   │   ├── onboarding/           # Onboarding CRUD and status transitions
│   │   ├── expenses/             # Expense claims and approvals
│   │   ├── expense-policies/     # Policy configuration (admin)
│   │   └── loans/                # Loan management
│   ├── (dashboard)/
│   │   ├── onboarding/           # HR onboarding management
│   │   ├── expenses/             # Manager expense approvals
│   │   └── loans/                # Admin loan management
│   ├── (employee)/
│   │   ├── onboarding/           # Candidate onboarding portal
│   │   ├── expenses/             # Employee expense claims
│   │   └── loans/                # Employee loan view
└── components/
    ├── onboarding/               # Checklist, offer letter, status tracker
    ├── expenses/                 # Expense form, receipt upload, approval list
    └── loans/                    # Loan calculator, schedule viewer
```

### Pattern 1: Workflow State Machine with Status Enums
**What:** Define allowed status transitions explicitly and validate transitions at runtime
**When to use:** For workflows with clear status progressions (onboarding, expense approval, loan lifecycle)
**Example:**
```typescript
// Source: Community best practices from Medium article on state machines
// https://medium.com/@raultotocayo/simplifying-complex-workflows-the-power-of-state-machines-in-backend-development-8c09ef877aab

enum OnboardingStatus {
  PENDING = "PENDING",           // Offer sent, awaiting acceptance
  ACCEPTED = "ACCEPTED",         // Candidate accepted, documents pending
  IN_PROGRESS = "IN_PROGRESS",   // Onboarding tasks being completed
  COMPLETED = "COMPLETED",       // All tasks done
  CANCELLED = "CANCELLED"        // Offer withdrawn or candidate declined
}

const ALLOWED_TRANSITIONS: Record<OnboardingStatus, OnboardingStatus[]> = {
  PENDING: [OnboardingStatus.ACCEPTED, OnboardingStatus.CANCELLED],
  ACCEPTED: [OnboardingStatus.IN_PROGRESS, OnboardingStatus.CANCELLED],
  IN_PROGRESS: [OnboardingStatus.COMPLETED, OnboardingStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: []
};

function canTransition(from: OnboardingStatus, to: OnboardingStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) || false;
}

// Use in API handler:
if (!canTransition(currentStatus, newStatus)) {
  return NextResponse.json(
    { error: `Cannot transition from ${currentStatus} to ${newStatus}` },
    { status: 400 }
  );
}
```

### Pattern 2: Multi-Level Approval Routing
**What:** Route expense claims to appropriate approvers based on amount thresholds and organizational hierarchy
**When to use:** For expense approval workflow (EXP-03)
**Example:**
```typescript
// Source: Best practices from Cflow article on approval workflow design patterns
// https://www.cflowapps.com/approval-workflow-design-patterns/

interface ApprovalLevel {
  level: number;
  approverRole: "MANAGER" | "HR_MANAGER" | "ADMIN";
  minAmount: number;
  maxAmount: number | null;
}

const APPROVAL_LEVELS: ApprovalLevel[] = [
  { level: 1, approverRole: "MANAGER", minAmount: 0, maxAmount: 500000 }, // Up to Rs.5,000
  { level: 2, approverRole: "HR_MANAGER", minAmount: 500001, maxAmount: 2500000 }, // Rs.5K-25K
  { level: 3, approverRole: "ADMIN", minAmount: 2500001, maxAmount: null } // Above Rs.25K
];

function getRequiredApprovers(amountInPaise: number): ApprovalLevel[] {
  return APPROVAL_LEVELS.filter(level => {
    const meetsMin = amountInPaise >= level.minAmount;
    const meetsMax = level.maxAmount === null || amountInPaise <= level.maxAmount;
    return meetsMin && meetsMax;
  }).sort((a, b) => a.level - b.level);
}

// For sequential approval: require all levels in order
// For parallel approval: require any level that matches
```

### Pattern 3: Checklist with Progress Tracking
**What:** Store checklist as JSON array with task completion tracking
**When to use:** For onboarding task management (ONB-01, ONB-04, ONB-05)
**Example:**
```typescript
// Source: HR onboarding best practices from Asana and HiBob
// https://www.hibob.com/hr-tools/employee-onboarding-checklist/

interface ChecklistItem {
  id: string;
  category: "IT" | "ADMIN" | "MANAGER" | "HR";
  title: string;
  description?: string;
  assignedTo: string; // user ID or role
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  required: boolean;
}

const ChecklistItemSchema = z.object({
  id: z.string(),
  category: z.enum(["IT", "ADMIN", "MANAGER", "HR"]),
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string(),
  dueDate: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  completedBy: z.string().optional(),
  required: z.boolean()
});

// Prisma model:
// model OnboardingChecklist {
//   id          String   @id @default(cuid())
//   employeeId  String
//   items       Json     // Validated with ChecklistItemSchema array
//   status      OnboardingStatus
//   ...
// }

// Calculate progress:
function calculateProgress(items: ChecklistItem[]) {
  const required = items.filter(item => item.required);
  const completed = required.filter(item => item.completedAt);
  return {
    total: required.length,
    completed: completed.length,
    percentage: Math.round((completed.length / required.length) * 100)
  };
}
```

### Pattern 4: EMI Calculation and Amortization Schedule
**What:** Calculate EMI using standard formula and generate full amortization schedule
**When to use:** For employee loan creation (LOAN-02, LOAN-04)
**Example:**
```typescript
// Source: Standard EMI formula from GeeksforGeeks and DEV Community
// https://www.geeksforgeeks.org/design-a-loan-calculator-using-javascript/
// https://dev.to/foxcalculator/how-a-smart-home-loan-emi-calculator-is-built-using-javascript-1o46

interface LoanParams {
  principalInPaise: number;
  annualInterestRate: number; // percentage (e.g., 12.5)
  tenureInMonths: number;
}

interface EMIScheduleEntry {
  month: number;
  emiAmount: number; // in paise
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

function calculateEMI(params: LoanParams): number {
  const { principalInPaise, annualInterestRate, tenureInMonths } = params;

  // Convert annual rate to monthly decimal
  const monthlyRate = (annualInterestRate / 100) / 12;

  // EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
  const numerator = principalInPaise * monthlyRate * Math.pow(1 + monthlyRate, tenureInMonths);
  const denominator = Math.pow(1 + monthlyRate, tenureInMonths) - 1;

  return Math.round(numerator / denominator);
}

function generateAmortizationSchedule(params: LoanParams): EMIScheduleEntry[] {
  const emi = calculateEMI(params);
  const monthlyRate = (params.annualInterestRate / 100) / 12;
  let balance = params.principalInPaise;
  const schedule: EMIScheduleEntry[] = [];

  for (let month = 1; month <= params.tenureInMonths; month++) {
    const interestPaid = Math.round(balance * monthlyRate);
    const principalPaid = emi - interestPaid;
    balance -= principalPaid;

    schedule.push({
      month,
      emiAmount: emi,
      principalPaid,
      interestPaid,
      remainingBalance: Math.max(0, balance) // Prevent negative due to rounding
    });
  }

  return schedule;
}
```

### Pattern 5: Database-Driven Policy Configuration
**What:** Store expense policies in database for runtime configuration without code deployment
**When to use:** For configurable expense limits and categories (EXP-04)
**Example:**
```typescript
// Source: Policy engine patterns from Brex and expense management best practices
// https://www.brex.com/support/policy-engine

interface ExpensePolicy {
  id: string;
  category: string; // "TRAVEL", "FOOD", "SUPPLIES", "ENTERTAINMENT", etc.
  maxAmountInPaise: number | null; // null = no limit
  requiresReceipt: boolean;
  requiresApproval: boolean;
  autoApproveBelow: number | null; // Auto-approve if amount < this (in paise)
  description?: string;
  active: boolean;
}

// Validate expense against policy:
async function validateExpenseAgainstPolicy(
  categoryId: string,
  amountInPaise: number,
  hasReceipt: boolean
) {
  const policy = await prisma.expensePolicy.findUnique({
    where: { id: categoryId, active: true }
  });

  if (!policy) {
    return { valid: false, error: "Invalid expense category" };
  }

  if (policy.maxAmountInPaise && amountInPaise > policy.maxAmountInPaise) {
    return {
      valid: false,
      error: `Amount exceeds category limit of ${formatCurrency(policy.maxAmountInPaise)}`
    };
  }

  if (policy.requiresReceipt && !hasReceipt) {
    return { valid: false, error: "Receipt required for this category" };
  }

  const needsApproval = policy.requiresApproval &&
    (!policy.autoApproveBelow || amountInPaise >= policy.autoApproveBelow);

  return { valid: true, needsApproval };
}
```

### Pattern 6: Integration with Payroll for Financial Operations
**What:** Link approved expenses and loan deductions to payroll processing
**When to use:** For expense reimbursement (EXP-05) and EMI deduction (LOAN-03)
**Example:**
```typescript
// Source: Existing payroll integration patterns from Phase 3
// Extension of src/lib/payroll/calculator.ts

// Add to PayrollRecord model:
// reimbursements: number (in paise, added to net pay)
// loanDeductions: number (in paise, deducted from net pay)

// During payroll calculation:
async function calculateEmployeePayroll(employeeId: string, month: number, year: number) {
  // ... existing gross, deductions calculation ...

  // Get approved expenses for reimbursement
  const approvedExpenses = await prisma.expenseClaim.findMany({
    where: {
      employeeId,
      status: "APPROVED",
      claimDate: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1)
      },
      syncedToPayroll: false
    }
  });

  const reimbursements = approvedExpenses.reduce(
    (sum, claim) => sum + claim.amountInPaise,
    0
  );

  // Get active loans with EMI deduction
  const activeLoans = await prisma.employeeLoan.findMany({
    where: {
      employeeId,
      status: "ACTIVE",
      startDate: { lte: new Date(year, month - 1, 1) }
    }
  });

  const loanDeductions = activeLoans.reduce(
    (sum, loan) => sum + loan.emiAmountInPaise,
    0
  );

  // Calculate final net pay
  const netPay = grossPay - totalDeductions + reimbursements - loanDeductions;

  // Mark expenses as synced
  await prisma.expenseClaim.updateMany({
    where: { id: { in: approvedExpenses.map(e => e.id) } },
    data: { syncedToPayroll: true, payrollRunId }
  });

  return {
    ...calculatedPayroll,
    reimbursements,
    loanDeductions,
    netPay
  };
}
```

### Anti-Patterns to Avoid
- **Hard-coded approvers:** Use role-based routing, not individual user IDs, to handle organizational changes
- **Tight coupling:** Don't embed payroll logic in workflow code; use events/jobs to trigger payroll updates
- **Missing audit trail:** Always track who approved/rejected, when, and why (store rejection reasons)
- **Synchronous processing:** Use BullMQ jobs for notifications and status changes that don't need immediate response
- **Unvalidated JSON:** Always validate JSON fields (checklists, policies) with Zod before saving/reading

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation for offer letters | Custom HTML-to-PDF converter | @react-pdf/renderer | Already in use, handles complex layouts, React component API |
| File upload with validation | Raw multipart parsing | Next.js formData() + existing storage.ts | Built-in support, existing validateFile() handles MIME and size |
| EMI calculation | Custom financial library | Standard formula implementation | EMI formula is well-established, implement directly with tests |
| Email sending | Direct SMTP | Resend via existing queue | Already configured, handles retry and tracking |
| Date manipulation | Manual date math | date-fns | Handles edge cases (month boundaries, leap years) correctly |
| Form arrays | Manual state management | React Hook Form useFieldArray | Handles add/remove/validation for dynamic checklists and expense items |
| JSON validation | Runtime type checks | Zod schemas | Type-safe, composable, generates TypeScript types |
| Workflow state | Custom FSM library (XState) | Status enums + validation functions | Simpler for linear workflows, less abstraction overhead |

**Key insight:** This phase extends existing infrastructure rather than introducing new architectural patterns. The risk is over-engineering with workflow engines or state machine libraries when status enums with explicit validation provide sufficient structure for these straightforward workflows.

## Common Pitfalls

### Pitfall 1: Forgetting to Sync Financial Operations to Payroll
**What goes wrong:** Expenses marked as "approved" but never reimbursed; loan EMI not deducted from salary
**Why it happens:** Workflows and payroll are separate systems without explicit integration points
**How to avoid:**
- Add `syncedToPayroll` boolean and `payrollRunId` foreign key to ExpenseClaim and EmployeeLoan models
- Query unsyncronized expenses/loans during payroll calculation stage
- Mark as synced in transaction with PayrollRecord creation
- Verify in payslip PDF that reimbursements and deductions appear correctly
**Warning signs:** Employees asking "where's my expense reimbursement?" after approval, loan balance not decreasing

### Pitfall 2: Approval Deadlock in Multi-Level Workflows
**What goes wrong:** Expense stuck waiting for approval from user who left the company or is on leave
**Why it happens:** Hard-coded approver IDs, no escalation mechanism
**How to avoid:**
- Use role-based approver selection (`reporting_manager_id` relationship)
- Add `escalatedAt` timestamp and auto-escalate after N days
- Allow HR/Admin to reassign stuck approvals
- Track approval attempts in JSON field for audit
**Warning signs:** Old expenses with status PENDING_APPROVAL, employee complaints about stuck claims

### Pitfall 3: Incomplete Onboarding Tracking
**What goes wrong:** New employee starts but IT hasn't set up laptop, or manager didn't assign first task
**Why it happens:** Checklist items lack clear ownership and due dates
**How to avoid:**
- Require `assignedTo` field for every checklist item (user ID or role)
- Calculate due dates based on join date (e.g., "IT setup 2 days before join")
- Send reminder notifications via BullMQ 1 day before due date
- Dashboard shows overdue items by category for HR escalation
**Warning signs:** New hires reporting missing equipment or access on day 1

### Pitfall 4: Floating-Point Errors in Loan Calculations
**What goes wrong:** EMI calculated as Rs.4,999.99 instead of Rs.5,000 due to JavaScript float precision
**Why it happens:** Using `number` type with division/multiplication in interest calculations
**How to avoid:**
- Store all amounts in paise (integers) in database
- Perform calculations in paise, round at each step: `Math.round()`
- Use existing `rupeeToPaise` and `formatCurrency` helpers from payroll
- Write unit tests for EMI calculation with known values
- Generate full amortization schedule to verify total interest + principal = loan amount
**Warning signs:** Loan balance not reaching zero after tenure, penny differences in EMI amounts

### Pitfall 5: Missing Receipt Validation
**What goes wrong:** Employees upload PDFs that aren't receipts, or upload corrupted files
**Why it happens:** File upload accepts any MIME type, no content validation
**How to avoid:**
- Use existing `validateFile()` from storage.ts for MIME type and size checks
- Store file metadata (original name, size, MIME type) in ExpenseReceipt model
- Require receipt for expense categories with `requiresReceipt: true` in policy
- Allow managers to request new receipt if uploaded file is invalid
**Warning signs:** Expense approvals delayed due to missing/invalid receipts

### Pitfall 6: Race Conditions in Loan Status Updates
**What goes wrong:** Loan marked as CLOSED prematurely when EMI deduction job runs concurrently with manual payment
**Why it happens:** Multiple processes updating `remainingBalanceInPaise` without transaction isolation
**How to avoid:**
- Use database transaction when deducting EMI: decrement balance and create deduction record atomically
- Check current balance in WHERE clause: `UPDATE ... WHERE id = ? AND remainingBalance >= emi`
- Mark loan as CLOSED only when `remainingBalance = 0` in a separate scheduled job
- Add unique constraint on `(loanId, month, year)` for deduction records to prevent double-deduction
**Warning signs:** Loan balance goes negative, duplicate deduction records for same month

### Pitfall 7: Expense Policy Changes Affecting In-Flight Claims
**What goes wrong:** Admin changes expense policy (e.g., reduces food limit), claims submitted under old policy get rejected
**Why it happens:** Validation uses current policy, not policy at submission time
**How to avoid:**
- Store `policySnapshot` JSON in ExpenseClaim when submitted (capture policy state)
- Validate against snapshot during approval, not current policy
- Show policy version on approval screen ("Submitted under v2, current is v3")
- Allow admin to decide: apply old policy or require resubmission
**Warning signs:** Employee disputes about policy changes, approval confusion

## Code Examples

Verified patterns from official sources:

### Status Transition Validation
```typescript
// Source: TypeScript exhaustive state machines from Medium article
// https://medium.com/@hjparmar1944/typescript-exhaustive-state-machines-compile-time-guarantees-for-business-workflows-656c04cb6ad1

enum ExpenseStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REIMBURSED = "REIMBURSED"
}

type StatusTransition = {
  from: ExpenseStatus;
  to: ExpenseStatus;
  validator?: (claim: ExpenseClaim) => boolean;
};

const EXPENSE_TRANSITIONS: StatusTransition[] = [
  { from: ExpenseStatus.DRAFT, to: ExpenseStatus.SUBMITTED },
  {
    from: ExpenseStatus.SUBMITTED,
    to: ExpenseStatus.PENDING_APPROVAL,
    validator: (claim) => claim.amountInPaise > 0 && !!claim.receiptUrl
  },
  { from: ExpenseStatus.PENDING_APPROVAL, to: ExpenseStatus.APPROVED },
  { from: ExpenseStatus.PENDING_APPROVAL, to: ExpenseStatus.REJECTED },
  { from: ExpenseStatus.APPROVED, to: ExpenseStatus.REIMBURSED },
  { from: ExpenseStatus.REJECTED, to: ExpenseStatus.DRAFT } // Allow resubmit
];

function validateTransition(
  currentStatus: ExpenseStatus,
  newStatus: ExpenseStatus,
  claim: ExpenseClaim
): { valid: boolean; error?: string } {
  const transition = EXPENSE_TRANSITIONS.find(
    t => t.from === currentStatus && t.to === newStatus
  );

  if (!transition) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  if (transition.validator && !transition.validator(claim)) {
    return { valid: false, error: "Transition validation failed" };
  }

  return { valid: true };
}
```

### Dynamic Checklist Form with React Hook Form
```typescript
// Source: React Hook Form useFieldArray documentation
// https://www.react-hook-form.com/api/usefieldarray/

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const checklistSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      category: z.enum(["IT", "ADMIN", "MANAGER", "HR"]),
      title: z.string().min(1, "Title required"),
      assignedTo: z.string().min(1, "Assignee required"),
      dueDate: z.coerce.date().optional(),
      required: z.boolean()
    })
  ).min(1, "At least one task required")
});

export function OnboardingChecklistForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      items: [
        {
          id: crypto.randomUUID(),
          category: "IT",
          title: "Provision laptop",
          assignedTo: "IT_TEAM",
          required: true
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...control.register(`items.${index}.title`)} />
          <select {...control.register(`items.${index}.category`)}>
            <option value="IT">IT</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="HR">HR</option>
          </select>
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({
          id: crypto.randomUUID(),
          category: "IT",
          title: "",
          assignedTo: "",
          required: false
        })}
      >
        Add Task
      </button>
      <button type="submit">Save Checklist</button>
    </form>
  );
}
```

### BullMQ Parent-Child Jobs for Onboarding Workflow
```typescript
// Source: BullMQ Flows documentation
// https://docs.bullmq.io/guide/flows

import { FlowProducer } from "bullmq";

const flowProducer = new FlowProducer({ connection: redisConnection });

async function createOnboardingFlow(employeeId: string, joinDate: Date) {
  // Parent job: Complete onboarding
  // Children jobs: Send offer letter, create checklist, notify stakeholders

  const flow = await flowProducer.add({
    name: "complete-onboarding",
    queueName: "onboarding",
    data: { employeeId, joinDate },
    children: [
      {
        name: "send-offer-letter",
        queueName: "email",
        data: {
          employeeId,
          templateId: "offer-letter"
        }
      },
      {
        name: "create-checklist",
        queueName: "onboarding",
        data: {
          employeeId,
          joinDate,
          items: generateDefaultChecklist(joinDate)
        }
      },
      {
        name: "notify-stakeholders",
        queueName: "email",
        data: {
          employeeId,
          recipients: ["IT", "ADMIN", "MANAGER"],
          templateId: "new-hire-notification"
        }
      }
    ]
  });

  return flow;
}

// Parent job only completes when all children succeed
// Use failParentOnFailure: true (default) to fail parent if any child fails
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded workflow states in code | Database-driven status enums with validation | 2025-2026 | Easier to add new states without deployment, better audit trail |
| Manual approval routing via email | Multi-level threshold-based routing in app | 2024-2025 | Faster approvals, clear accountability, automatic escalation |
| Static onboarding checklists (Excel/PDF) | Dynamic JSON-based checklists with tracking | 2025-2026 | Real-time progress visibility, customizable per role/department |
| Cloud storage for receipts (S3, GCS) | Local filesystem for small teams | 2026 (project decision) | Lower costs, no vendor dependency for 20 users |
| Decimal types for financial calculations | Integer paise for precision | 2024-2025 | Eliminates floating-point errors, consistent with industry practice |

**Deprecated/outdated:**
- **Heavy workflow engines (Camunda, Temporal):** Overkill for simple linear workflows; modern approach uses status enums with validation for small-scale HR workflows
- **Third-party onboarding platforms (BambooHR, Workday):** Project chose self-hosted to control costs and own data; build internally for 20-user scale
- **Email-based approval workflows:** Replaced by in-app approval systems with push notifications and mobile access

## Open Questions

Things that couldn't be fully resolved:

1. **Offer Letter Digital Signature**
   - What we know: Adobe Sign API exists, DocuSign has Node.js SDK, but both require paid subscriptions
   - What's unclear: Whether project wants third-party e-signature or simple "I accept" button with timestamp
   - Recommendation: Start with checkbox acceptance ("I accept the terms of this offer") and electronic timestamp. Add e-signature integration later if legally required.

2. **Expense Category Customization**
   - What we know: Standard categories are TRAVEL, FOOD, SUPPLIES, ENTERTAINMENT, but different orgs need different categories
   - What's unclear: Whether to seed standard categories or let admin create all from scratch
   - Recommendation: Seed common Indian expense categories (Travel, Food & Beverage, Accommodation, Fuel, Office Supplies, Client Entertainment) but allow full CRUD for customization.

3. **Loan Interest Calculation Method**
   - What we know: Standard EMI formula uses reducing balance method (interest on remaining principal)
   - What's unclear: Whether organization uses flat interest or reducing balance; tax implications
   - Recommendation: Implement reducing balance (industry standard for employee loans), make interest rate configurable per loan, document in UI that it's reducing balance.

4. **Concurrent Expense Approvals**
   - What we know: Multi-level approvals can be sequential (one after another) or parallel (all at once)
   - What's unclear: Whether higher amounts need sequential approvals or all approvers can act simultaneously
   - Recommendation: Use sequential approvals (manager → HR → admin) to prevent approval conflicts and provide clear escalation path. Add parallel approval support later if needed.

5. **Onboarding Checklist Templates**
   - What we know: Different roles/departments need different onboarding tasks
   - What's unclear: Whether to build template system (copy from template) or always create from scratch
   - Recommendation: Store default checklist JSON in code, copy to new onboarding record on creation, allow HR to edit per employee. Template CRUD can be added in future phase.

## Sources

### Primary (HIGH confidence)
- BullMQ Flows documentation (https://docs.bullmq.io/guide/flows) - Parent-child job dependencies, FlowProducer API
- React Hook Form useFieldArray (https://www.react-hook-form.com/api/usefieldarray/) - Dynamic form arrays for checklists and expense items
- GeeksforGeeks EMI calculator (https://www.geeksforgeeks.org/design-a-loan-calculator-using-javascript/) - Standard EMI formula implementation
- Prisma JSON fields (https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - Working with JSON types

### Secondary (MEDIUM confidence)
- Cflow approval workflow design patterns (https://www.cflowapps.com/approval-workflow-design-patterns/) - Multi-level approval routing, threshold-based rules
- Medium state machines article (https://medium.com/@raultotocayo/simplifying-complex-workflows-the-power-of-state-machines-in-backend-development-8c09ef877aab) - Status enum patterns for workflows
- Medium TypeScript exhaustive state machines (https://medium.com/@hjparmar1944/typescript-exhaustive-state-machines-compile-time-guarantees-for-business-workflows-656c04cb6ad1) - Compile-time workflow validation
- Moxo multi-level approval guide (https://www.moxo.com/blog/multi-level-approval-workflow) - Preventing approval workflow stalls
- HiBob employee onboarding checklist (https://www.hibob.com/hr-tools/employee-onboarding-checklist/) - 2026 onboarding best practices
- Brex policy engine (https://www.brex.com/support/policy-engine) - Database-driven expense policy configuration
- DEV Community EMI calculator (https://dev.to/foxcalculator/how-a-smart-home-loan-emi-calculator-is-built-using-javascript-1o46) - JavaScript loan amortization implementation
- OneUpTime Node.js PDF generation (https://oneuptime.com/blog/post/2026-01-22-nodejs-pdf-generation/view) - Modern PDF generation with Puppeteer
- OneUpTime Multer file uploads (https://oneuptime.com/blog/post/2026-01-22-nodejs-multer-file-uploads/view) - Secure file upload patterns
- Transloadit secure image upload (https://transloadit.com/devtips/secure-image-upload-api-with-node-js-express-and-multer/) - File validation and security

### Tertiary (LOW confidence)
- XState GitHub repository (https://github.com/statelyai/xstate) - Considered but not recommended for this project's simple workflows
- Zenstack JSON typing article (https://zenstack.dev/blog/json-typing) - Alternative to Zod for JSON validation (less mature)
- Adobe Document Generation API (https://developer.adobe.com/document-services/docs/overview/document-generation-api/quickstarts/nodejs/) - Paid service for offer letter generation (not using)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use (Prisma, Zod, React Hook Form, BullMQ, @react-pdf/renderer)
- Architecture: HIGH - Patterns verified from official documentation and established best practices; EMI formula is mathematical standard
- Pitfalls: MEDIUM - Based on common workflow system issues and project's existing codebase patterns; some issues inferred from requirements

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain with established patterns)
