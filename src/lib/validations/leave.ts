import { z } from 'zod';

export const leaveTypeCreateSchema = z.object({
  name: z.string().min(2).max(50),
  code: z.string().min(1).max(10).toUpperCase(),
  description: z.string().max(500).optional(),
  annualQuota: z.number().min(0).max(365).default(0),
  maxCarryForward: z.number().min(0).max(365).default(0),
  isPaid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  minDaysNotice: z.number().int().min(0).default(0),
});

export const leaveTypeUpdateSchema = leaveTypeCreateSchema.partial();

export const leaveRequestCreateSchema = z.object({
  leaveTypeId: z.string().cuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
  reason: z.string().min(3).max(1000),
}).refine((data) => {
  // If half day, start and end date must be same
  if (data.isHalfDay) {
    const start = new Date(data.startDate).setHours(0, 0, 0, 0);
    const end = new Date(data.endDate).setHours(0, 0, 0, 0);
    return start === end;
  }
  return true;
}, { message: 'Half-day leave must be for a single day' }).refine((data) => {
  // If half day, period must be specified
  if (data.isHalfDay && !data.halfDayPeriod) {
    return false;
  }
  return true;
}, { message: 'Half-day period must be specified for half-day leave' }).refine((data) => {
  // End date must be >= start date
  return new Date(data.endDate) >= new Date(data.startDate);
}, { message: 'End date must be on or after start date' });

export const leaveRequestActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel']),
  reason: z.string().max(500).optional(),
});

// Helper to calculate leave days between two dates
export function calculateLeaveDays(startDate: Date, endDate: Date, isHalfDay: boolean): number {
  if (isHalfDay) return 0.5;

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let days = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Skip weekends (Saturday=6, Sunday=0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}
