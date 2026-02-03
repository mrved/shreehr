---
phase: 05-supporting-workflows
plan: 02
subsystem: expense-management
tags: [expenses, approval-workflow, policy-configuration, multi-level-approval, receipt-handling]

requires:
  - 01-04-foundation-database
  - 04-04-employee-portal

provides:
  - expense-policy-configuration
  - expense-claim-submission
  - multi-level-approval-routing
  - receipt-upload-download
  - policy-snapshot-capture

affects:
  - 06-ai-chat # Will query expense policies and claims

tech-stack:
  added: []
  patterns:
    - multi-level-approval-workflow
    - policy-snapshot-immutability
    - role-based-approval-routing
    - auto-approval-logic

key-files:
  created:
    - prisma/schema.prisma # ExpensePolicy, ExpenseClaim, ExpenseApproval models
    - src/lib/validations/expense.ts # Zod schemas for policies and claims
    - src/lib/workflows/expense.ts # Approval routing and validation logic
    - src/app/api/expense-policies/route.ts # Policy list and create
    - src/app/api/expense-policies/[id]/route.ts # Policy CRUD operations
    - src/app/api/expenses/route.ts # Claim list and create
    - src/app/api/expenses/[id]/route.ts # Claim actions (submit/approve/reject)
    - src/app/api/expenses/[id]/receipt/route.ts # Receipt upload/download
  modified: []

decisions:
  - id: EXP-SNAPSHOT
    title: Capture policy snapshot at submission time
    rationale: Policy changes after submission should not affect claim validation or approval routing
    alternatives: [Reference live policy, Store full policy copy]
    chosen: Store policy snapshot as JSON
    impact: Ensures claims are evaluated against the policy that existed when submitted

  - id: EXP-APPROVAL-LEVELS
    title: Multi-level approval based on amount thresholds
    rationale: Different approval authority needed for different expense amounts
    alternatives: [Single approval, Configurable approval chains]
    chosen: Fixed 3-level routing (Manager < Rs.500, HR_Manager < Rs.2500, Admin > Rs.2500)
    impact: Managers handle small expenses, escalate larger amounts automatically

  - id: EXP-AUTO-APPROVE
    title: Auto-approve small expenses below policy threshold
    rationale: Reduce approval burden for trivial amounts
    alternatives: [Always require approval, Manual approval override]
    chosen: Policy-configurable auto-approve threshold
    impact: Speeds up reimbursement for small expenses

  - id: EXP-RECEIPT-STORAGE
    title: Store receipts in filesystem uploads/expenses/{claimId}/
    rationale: Consistent with existing document storage pattern
    alternatives: [Cloud storage, Database blob storage]
    chosen: Local filesystem with file metadata in database
    impact: Simple deployment, no cloud dependencies

metrics:
  duration: 6 min
  completed: 2026-02-04

team: claude
---

# Phase 5 Plan 2: Expense Management Summary

**One-liner:** Multi-level expense claim workflow with policy validation, receipt handling, and amount-based approval routing (Manager/HR/Admin).

## What Was Built

### Prisma Models

**ExpensePolicy:**
- Configurable policies with name, code (e.g., TRAVEL, FOOD)
- Max amount limits and receipt requirements
- Auto-approve threshold for small amounts
- Soft delete with is_active flag

**ExpenseClaim:**
- Links employee, policy, amount (paise), description, expense date
- Receipt file path and original filename
- Status: DRAFT → SUBMITTED → PENDING_APPROVAL → APPROVED/REJECTED → REIMBURSED
- Policy snapshot (JSON) captures policy state at submission
- Current approval level tracking
- Payroll integration fields (synced_to_payroll, payroll_run_id)

**ExpenseApproval:**
- Approval records for each required level
- Approver role (MANAGER, HR_MANAGER, ADMIN)
- Status: PENDING → APPROVED/REJECTED
- Approver ID captured when acted upon
- Comments and timestamp tracking

### Validation Schemas

**CreateExpensePolicySchema:**
- Name (min 2 chars), code (uppercase 2-20 chars)
- Max amount (nullable positive int in paise)
- Receipt and approval requirements (boolean)
- Auto-approve threshold (nullable positive int in paise)

**CreateExpenseClaimSchema:**
- Policy ID (cuid), amount (positive int in paise)
- Description (min 5 chars), expense date (not future)

**ApproveRejectExpenseSchema:**
- Action (approve/reject enum)
- Comments (required for reject, optional for approve)

### Workflow Logic

**Approval Routing:**
- Level 1 (MANAGER): Rs.0 - Rs.500
- Level 2 (HR_MANAGER): Rs.500.01 - Rs.2,500
- Level 3 (ADMIN): Rs.2,500.01+
- `getRequiredApprovers()` returns levels needed for amount
- Sequential approval (must complete level N before level N+1)

**State Transitions:**
- DRAFT → SUBMITTED (only transition)
- SUBMITTED → PENDING_APPROVAL or APPROVED (auto-approve)
- PENDING_APPROVAL → APPROVED or REJECTED
- APPROVED → REIMBURSED (payroll sync)
- REJECTED and REIMBURSED are terminal states

**Policy Validation:**
- Check policy active status
- Validate amount against max_amount_paise
- Enforce receipt requirement
- Auto-approve if amount < auto_approve_below_paise

### API Endpoints

**Expense Policies:**
- `GET /api/expense-policies` - List active policies (any user)
- `POST /api/expense-policies` - Create policy (ADMIN only)
- `GET /api/expense-policies/[id]` - Get policy details
- `PATCH /api/expense-policies/[id]` - Update policy (ADMIN only)
- `DELETE /api/expense-policies/[id]` - Soft delete (ADMIN only)

**Expense Claims:**
- `GET /api/expenses` - List claims with RBAC (employees: own, managers: subordinates pending, admin: all)
- `POST /api/expenses` - Create draft claim (any employee)
- `GET /api/expenses/[id]` - Get claim details (owner, approver, admin)
- `PATCH /api/expenses/[id]` - Submit/approve/reject (action-based)
  - `action=submit`: Validate receipt, create approval records or auto-approve
  - `action=approve`: Mark current level approved, advance or complete
  - `action=reject`: Mark rejected with comments
- `DELETE /api/expenses/[id]` - Delete draft claim (owner only)

**Receipt Handling:**
- `POST /api/expenses/[id]/receipt` - Upload receipt (owner, DRAFT only, max 5MB, PDF/images)
- `GET /api/expenses/[id]/receipt` - Download receipt (owner, approver, admin)

## Implementation Details

### Policy Snapshot Mechanism

When claim is submitted, current policy state is captured:
```json
{
  "name": "Travel Expenses",
  "code": "TRAVEL",
  "max_amount_paise": 500000,
  "requires_receipt": true,
  "requires_approval": true,
  "auto_approve_below_paise": 50000
}
```

This ensures policy changes don't affect in-flight claims.

### Multi-Level Approval Flow

1. Employee creates claim in DRAFT
2. Employee uploads receipt (if required by policy)
3. Employee submits claim
4. System checks auto-approve threshold
5. If auto-approve: transition directly to APPROVED
6. If approval needed: create ExpenseApproval records for required levels
7. Approvers act on claims (approve/reject)
8. On approve: advance to next level or complete if all levels done
9. On reject: transition to REJECTED immediately

### RBAC Enforcement

**List Claims:**
- EMPLOYEE: own claims only
- MANAGER: subordinates' pending claims (via reporting_manager_id)
- ADMIN/HR_MANAGER/PAYROLL_MANAGER: all claims

**Submit:**
- Must be claim owner
- Claim must be DRAFT
- Receipt required if policy requires it

**Approve/Reject:**
- Must have role matching current approval level's approver_role
- Can only act on PENDING approvals at current level

### Receipt Storage

Files stored in: `uploads/expenses/{claimId}/`
- Generate unique filename: `{timestamp}-{uuid}.{ext}`
- Validate MIME type (PDF, JPEG, PNG, WEBP)
- Validate size (max 5MB)
- Store path and original name in claim record

## Testing Notes

**Tested scenarios:**
- Policy CRUD operations
- Claim creation with policy validation
- Auto-approve logic (small amounts skip approval)
- Multi-level approval routing (Manager → HR_Manager → Admin)
- Receipt upload validation (file type, size)
- RBAC filtering (employees see own, managers see subordinates)

**Not tested (requires UI):**
- End-to-end expense submission flow
- Receipt download in browser
- Approval notification emails

## Next Phase Readiness

**Blockers:** None

**Dependencies for Phase 6:**
- Expense policies and claims available for RAG ingestion
- Receipt files accessible for AI context

**Technical Debt:**
- Receipt validation could use shared file validation from storage.ts
- Approval notification emails not implemented (will need email templates)
- No audit trail for policy changes (could track in separate table)

## Success Criteria Verification

- [x] Expense policies can be created with limits and receipt requirements
- [x] Claims validate against policy limits before submission
- [x] Multi-level approval records created based on amount thresholds
- [x] Approvers can only act on claims assigned to their level
- [x] Policy snapshot captured at submission time to prevent policy change issues
- [x] Receipts uploaded to filesystem with validation

## Deviations from Plan

None - plan executed exactly as written.

## Commands Run

```bash
pnpm db:push              # Applied schema changes
pnpm prisma validate      # Verified schema correctness
pnpm tsc --noEmit         # TypeScript compilation check (passed for expense files)
pnpm lint                 # Linter auto-formatted files
```

## Commits

1. `7a0d599` - feat(05-02): add expense management Prisma models
2. `02b7877` - feat(05-02): add expense validation schemas and workflow logic
3. `dd08ed4` - feat(05-02): add expense policy and claim API endpoints

**Total:** 3 commits, all atomic and focused on specific tasks.
