import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const designationSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  level: z.number().int().min(1).max(10).default(1),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type DesignationInput = z.infer<typeof designationSchema>;
