import { z } from "zod";

export const checkInSchema = z.object({
  remarks: z.string().max(500).optional(),
});

export const checkOutSchema = z.object({
  remarks: z.string().max(500).optional(),
});

export const attendanceQuerySchema = z.object({
  employeeId: z.string().nullable().optional().transform(v => v ?? undefined),
  startDate: z.string().datetime().nullable().optional().transform(v => v ?? undefined),
  endDate: z.string().datetime().nullable().optional().transform(v => v ?? undefined),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY", "WEEKEND"]).nullable().optional().transform(v => v ?? undefined),
  page: z.preprocess(
    (v) => (v === null || v === undefined || v === '') ? undefined : v,
    z.coerce.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (v) => (v === null || v === undefined || v === '') ? undefined : v,
    z.coerce.number().int().positive().max(100).default(20)
  ),
});

export const regularizeSchema = z.object({
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime().optional(),
  remarks: z.string().max(500),
});

// Helper function to calculate attendance status based on work hours
export function calculateAttendanceStatus(workMinutes: number): "PRESENT" | "HALF_DAY" | "ABSENT" {
  // Full day: >= 7.5 hours (450 minutes)
  // Half day: >= 4 hours (240 minutes) and < 7.5 hours
  // Absent: < 4 hours
  if (workMinutes >= 450) return "PRESENT";
  if (workMinutes >= 240) return "HALF_DAY";
  return "ABSENT";
}
