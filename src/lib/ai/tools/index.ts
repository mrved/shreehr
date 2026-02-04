import { tool } from 'ai';
import { z } from 'zod';
import {
  getEmployeeLeaveBalance,
  getEmployeeAttendance,
  getEmployeeSalary,
  getEmployeeLoans,
  getTeamSummary,
} from './employee-data';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Tool context type (passed from chat route)
 * Contains user identity and role for RBAC enforcement
 */
export interface ToolContext {
  userId: string;
  employeeId: string | null;
  role: string;
}

/**
 * Factory function to create tools with injected context
 * This ensures security - context comes from verified session, not AI prompts
 */
export function createEmployeeDataTools(context: ToolContext) {
  return {
    getLeaveBalance: tool({
      description:
        'Get leave balance for current user or specified employee (managers only). Shows available leave days by type and any pending requests.',
      parameters: z.object({
        employeeId: z
          .string()
          .optional()
          .describe('Employee ID (managers only, omit for own data)'),
        year: z
          .number()
          .optional()
          .describe('Year for balance (defaults to current year)'),
      }),
      // @ts-expect-error - AI SDK v6 tool typing issue with execute parameter
      execute: async ({employeeId, year}: any) => {
        return getEmployeeLeaveBalance(context, employeeId, year);
      },
    }),

    getAttendance: tool({
      description:
        'Get attendance summary for current user or specified employee. Shows present/absent days and recent check-in/out times.',
      parameters: z.object({
        employeeId: z
          .string()
          .optional()
          .describe('Employee ID (managers only, omit for own data)'),
        month: z
          .number()
          .min(1)
          .max(12)
          .optional()
          .describe('Month (1-12, defaults to current)'),
        year: z
          .number()
          .optional()
          .describe('Year (defaults to current)'),
      }),
      // @ts-expect-error - AI SDK v6 tool typing issue with execute parameter
      execute: async ({employeeId, month, year}: any) => {
        return getEmployeeAttendance(context, employeeId, month, year);
      },
    }),

    getSalary: tool({
      description:
        'Get salary details for current user or specified employee. Shows earnings, deductions, and net salary.',
      parameters: z.object({
        employeeId: z
          .string()
          .optional()
          .describe('Employee ID (managers only, omit for own data)'),
        month: z
          .number()
          .min(1)
          .max(12)
          .optional()
          .describe('Month (1-12, defaults to previous month)'),
        year: z
          .number()
          .optional()
          .describe('Year (defaults to current)'),
      }),
      // @ts-expect-error - AI SDK v6 tool typing issue with execute parameter
      execute: async ({employeeId, month, year}: any) => {
        return getEmployeeSalary(context, employeeId, month, year);
      },
    }),

    getLoans: tool({
      description:
        'Get active loan information for current user or specified employee. Shows outstanding balance and upcoming EMI deductions.',
      parameters: z.object({
        employeeId: z
          .string()
          .optional()
          .describe('Employee ID (managers only, omit for own data)'),
      }),
      // @ts-expect-error - AI SDK v6 tool typing issue with execute parameter
      execute: async ({employeeId}: any) => {
        return getEmployeeLoans(context, employeeId);
      },
    }),

    getTeamSummary: tool({
      description:
        'Get team summary including attendance and pending approvals. Only available for managers.',
      parameters: z.object({}),
      // @ts-expect-error - AI SDK v6 tool typing issue with execute parameter
      execute: async () => {
        return getTeamSummary(context);
      },
    }),
  };
}

/**
 * Export type for use in chat route
 * Allows TypeScript to infer tool types from factory function
 */
export type EmployeeDataTools = ReturnType<typeof createEmployeeDataTools>;

/**
 * Helper function to extract tool context from current session
 * Call this at the start of your AI chat route handler
 */
export async function getToolContext(): Promise<ToolContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Get employee ID for the user
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { employee_id: true, role: true },
  });

  if (!user) return null;

  return {
    userId: session.user.id,
    employeeId: user.employee_id,
    role: user.role,
  };
}
