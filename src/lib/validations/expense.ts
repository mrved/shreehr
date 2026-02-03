/**
 * Expense Management Validation Schemas
 * Zod schemas for expense policy and claim validation
 */

import { z } from "zod";

// ============================================================================
// EXPENSE POLICY SCHEMAS
// ============================================================================

export const CreateExpensePolicySchema = z.object({
  name: z.string().min(2, "Policy name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must not exceed 20 characters")
    .regex(/^[A-Z_]+$/, "Code must be uppercase letters and underscores only")
    .transform((val) => val.toUpperCase()),
  description: z.string().optional(),
  max_amount_paise: z
    .number()
    .int()
    .positive("Maximum amount must be positive")
    .nullable()
    .optional(),
  requires_receipt: z.boolean().default(true),
  requires_approval: z.boolean().default(true),
  auto_approve_below_paise: z
    .number()
    .int()
    .positive("Auto-approve threshold must be positive")
    .nullable()
    .optional(),
});

export const UpdateExpensePolicySchema = CreateExpensePolicySchema.partial();

export type CreateExpensePolicyInput = z.infer<
  typeof CreateExpensePolicySchema
>;
export type UpdateExpensePolicyInput = z.infer<
  typeof UpdateExpensePolicySchema
>;

// ============================================================================
// EXPENSE CLAIM SCHEMAS
// ============================================================================

export const CreateExpenseClaimSchema = z.object({
  policy_id: z.string().cuid("Invalid policy ID"),
  amount_paise: z
    .number()
    .int()
    .positive("Amount must be positive")
    .min(1, "Amount must be at least 1 paise"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  expense_date: z
    .string()
    .or(z.date())
    .transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    })
    .refine((date) => date <= new Date(), {
      message: "Expense date cannot be in the future",
    }),
});

export const SubmitExpenseClaimSchema = z.object({
  action: z.literal("submit"),
});

export const ApproveRejectExpenseSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    comments: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.action === "reject") {
        return !!data.comments && data.comments.length > 0;
      }
      return true;
    },
    {
      message: "Comments are required when rejecting an expense",
      path: ["comments"],
    }
  );

export type CreateExpenseClaimInput = z.infer<
  typeof CreateExpenseClaimSchema
>;
export type SubmitExpenseClaimInput = z.infer<
  typeof SubmitExpenseClaimSchema
>;
export type ApproveRejectExpenseInput = z.infer<
  typeof ApproveRejectExpenseSchema
>;
