import { z } from 'zod';

/**
 * Loan Validation Schemas
 * Zod schemas for employee loan creation and management
 */

// Loan types
export const LOAN_TYPES = ['SALARY_ADVANCE', 'PERSONAL', 'EMERGENCY'] as const;

// Loan status values
export const LOAN_STATUSES = ['PENDING', 'ACTIVE', 'CLOSED', 'CANCELLED', 'DEFAULTED'] as const;

/**
 * Create loan schema
 * Validates new loan creation requests
 */
export const CreateLoanSchema = z.object({
  employee_id: z.string().cuid('Invalid employee ID'),
  loan_type: z.enum(LOAN_TYPES, {
    errorMap: () => ({ message: 'Loan type must be SALARY_ADVANCE, PERSONAL, or EMERGENCY' }),
  }),
  principal_paise: z
    .number()
    .int('Principal must be a whole number')
    .min(100000, 'Minimum loan amount is Rs.1,000')
    .positive('Principal must be positive'),
  annual_interest_rate: z
    .number()
    .min(0, 'Interest rate cannot be negative')
    .max(30, 'Interest rate cannot exceed 30%'),
  tenure_months: z
    .number()
    .int('Tenure must be a whole number of months')
    .min(1, 'Minimum tenure is 1 month')
    .max(60, 'Maximum tenure is 60 months'),
  start_date: z.coerce
    .date()
    .refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: 'Start date must be today or in the future' }
    ),
});

export type CreateLoanInput = z.infer<typeof CreateLoanSchema>;

/**
 * Update loan status schema
 * Validates status transition actions
 */
export const UpdateLoanStatusSchema = z
  .object({
    action: z.enum(['disburse', 'close', 'cancel'], {
      errorMap: () => ({ message: 'Action must be disburse, close, or cancel' }),
    }),
    closure_reason: z.string().optional(),
    disbursed_paise: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      // closure_reason required for close and cancel actions
      if ((data.action === 'close' || data.action === 'cancel') && !data.closure_reason) {
        return false;
      }
      return true;
    },
    {
      message: 'Closure reason is required when closing or cancelling a loan',
      path: ['closure_reason'],
    }
  )
  .refine(
    (data) => {
      // disbursed_paise required for disburse action
      if (data.action === 'disburse' && !data.disbursed_paise) {
        return false;
      }
      return true;
    },
    {
      message: 'Disbursed amount is required when disbursing a loan',
      path: ['disbursed_paise'],
    }
  );

export type UpdateLoanStatusInput = z.infer<typeof UpdateLoanStatusSchema>;

/**
 * Loan filter schema
 * Validates query parameters for listing loans
 */
export const LoanFilterSchema = z.object({
  employee_id: z.string().cuid().optional(),
  status: z.enum(LOAN_STATUSES).optional(),
});

export type LoanFilterInput = z.infer<typeof LoanFilterSchema>;
