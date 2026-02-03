/**
 * Expense Workflow Logic
 * Approval routing and status transition validation
 */

import { ExpenseStatus, ApprovalStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

// ============================================================================
// APPROVAL ROUTING LEVELS
// ============================================================================

export interface ApprovalLevel {
  level: number;
  role: string;
  minAmount: number; // In paise (inclusive)
  maxAmount: number | null; // In paise (inclusive), null means no upper limit
}

export const APPROVAL_LEVELS: ApprovalLevel[] = [
  {
    level: 1,
    role: "MANAGER",
    minAmount: 0,
    maxAmount: 50000 * 100, // Rs.500
  },
  {
    level: 2,
    role: "HR_MANAGER",
    minAmount: 50000 * 100 + 1, // Rs.500.01
    maxAmount: 250000 * 100, // Rs.2,500
  },
  {
    level: 3,
    role: "ADMIN",
    minAmount: 250000 * 100 + 1, // Rs.2,500.01
    maxAmount: null, // No upper limit
  },
];

/**
 * Get required approval levels for an expense amount
 * Returns array of levels needed (sequential approval)
 */
export function getRequiredApprovers(amountPaise: number): ApprovalLevel[] {
  const requiredLevels: ApprovalLevel[] = [];

  for (const level of APPROVAL_LEVELS) {
    // Check if amount falls within this level's range
    if (amountPaise >= level.minAmount) {
      if (level.maxAmount === null || amountPaise <= level.maxAmount) {
        requiredLevels.push(level);
        break; // Found the appropriate level
      }
    }
  }

  // If amount exceeds all levels, it needs highest level approval
  if (requiredLevels.length === 0) {
    requiredLevels.push(APPROVAL_LEVELS[APPROVAL_LEVELS.length - 1]);
  }

  return requiredLevels;
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

/**
 * Valid state transitions for expense claims
 */
export const EXPENSE_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["PENDING_APPROVAL", "APPROVED"], // Can go to APPROVED if auto-approve
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["REIMBURSED"],
  REJECTED: [], // Terminal state
  REIMBURSED: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function canTransitionExpense(
  from: ExpenseStatus,
  to: ExpenseStatus
): boolean {
  const validTransitions = EXPENSE_TRANSITIONS[from] || [];
  return validTransitions.includes(to);
}

// ============================================================================
// POLICY VALIDATION
// ============================================================================

export interface PolicyValidationResult {
  valid: boolean;
  error?: string;
  needsApproval: boolean;
}

/**
 * Validate expense against policy limits and requirements
 */
export async function validateExpenseAgainstPolicy(
  policyId: string,
  amountPaise: number,
  hasReceipt: boolean
): Promise<PolicyValidationResult> {
  const policy = await prisma.expensePolicy.findUnique({
    where: { id: policyId },
  });

  if (!policy) {
    return {
      valid: false,
      error: "Policy not found",
      needsApproval: false,
    };
  }

  if (!policy.is_active) {
    return {
      valid: false,
      error: "Policy is not active",
      needsApproval: false,
    };
  }

  // Check amount against policy limit
  if (policy.max_amount_paise !== null) {
    if (amountPaise > policy.max_amount_paise) {
      return {
        valid: false,
        error: `Amount exceeds policy limit of Rs.${(policy.max_amount_paise / 100).toFixed(2)}`,
        needsApproval: false,
      };
    }
  }

  // Check receipt requirement
  if (policy.requires_receipt && !hasReceipt) {
    return {
      valid: false,
      error: "Receipt is required for this policy",
      needsApproval: false,
    };
  }

  return {
    valid: true,
    needsApproval: policy.requires_approval,
  };
}

/**
 * Check if expense should be auto-approved based on policy
 */
export function shouldAutoApprove(
  policy: { auto_approve_below_paise: number | null; requires_approval: boolean },
  amountPaise: number
): boolean {
  // If policy doesn't require approval at all
  if (!policy.requires_approval) {
    return true;
  }

  // If auto-approve threshold is set and amount is below it
  if (
    policy.auto_approve_below_paise !== null &&
    amountPaise < policy.auto_approve_below_paise
  ) {
    return true;
  }

  return false;
}
