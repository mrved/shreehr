import { z } from "zod";

/**
 * Onboarding validation schemas
 */

// Checklist item category enum
export const checklistCategories = ["IT", "ADMIN", "MANAGER", "HR"] as const;
export type ChecklistCategory = (typeof checklistCategories)[number];

// Checklist item schema
export const checklistItemSchema = z.object({
  id: z.string(),
  category: z.enum(checklistCategories),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  assignedTo: z.string(), // User ID
  dueDate: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional().nullable(),
  completedBy: z.string().optional().nullable(),
  required: z.boolean().default(true),
});

export type ChecklistItem = z.infer<typeof checklistItemSchema>;

// Phone number validation (Indian format)
const PHONE_REGEX = /^\d{10}$/;

// Create onboarding schema
export const createOnboardingSchema = z
  .object({
    candidate_email: z.string().email("Invalid email format"),
    candidate_name: z.string().min(2).max(200),
    candidate_phone: z.string().regex(PHONE_REGEX, "Phone number must be 10 digits"),
    position: z.string().min(1).max(200),
    department_id: z.string().cuid("Invalid department ID"),
    designation_id: z.string().cuid("Invalid designation ID"),
    offered_salary_paise: z.number().int().positive("Salary must be positive"),
    joining_date: z.coerce.date(),
    checklist: z
      .array(checklistItemSchema)
      .min(1, "At least one checklist item is required")
      .optional(),
  })
  .refine(
    (data) => {
      // Joining date must be in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return data.joining_date >= today;
    },
    {
      message: "Joining date must be today or in the future",
      path: ["joining_date"],
    },
  );

export type CreateOnboardingInput = z.infer<typeof createOnboardingSchema>;

// Update onboarding status schema
export const updateOnboardingStatusSchema = z
  .object({
    action: z.enum(["accept", "start_tasks", "complete", "cancel"]),
    cancellation_reason: z.string().min(1).max(500).optional(),
    offer_token: z.string().optional(), // Required for accept action
  })
  .refine(
    (data) => {
      if (data.action === "cancel" && !data.cancellation_reason) {
        return false;
      }
      return true;
    },
    {
      message: "Cancellation reason is required when cancelling",
      path: ["cancellation_reason"],
    },
  )
  .refine(
    (data) => {
      if (data.action === "accept" && !data.offer_token) {
        return false;
      }
      return true;
    },
    {
      message: "Offer token is required for acceptance",
      path: ["offer_token"],
    },
  );

export type UpdateOnboardingStatusInput = z.infer<typeof updateOnboardingStatusSchema>;

// Update checklist schema
export const updateChecklistSchema = z.object({
  item_id: z.string(),
  completed: z.boolean(),
});

export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;
