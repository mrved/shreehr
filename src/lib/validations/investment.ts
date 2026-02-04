import { z } from "zod";

// Tax limit constants (in paise)
export const MAX_80C_PAISE = 15000000; // Rs.1,50,000
export const MAX_80D_SELF_PAISE = 2500000; // Rs.25,000
export const MAX_80D_PARENTS_PAISE = 5000000; // Rs.50,000 (for senior citizens)
export const MAX_80D_CHECKUP_PAISE = 500000; // Rs.5,000
export const MAX_24_HOME_LOAN_INTEREST_PAISE = 20000000; // Rs.2,00,000

// PAN regex for landlord validation
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// Section 80C validation schema
export const investment80CSchema = z
  .object({
    section_80c_ppf: z.number().int().min(0).default(0),
    section_80c_elss: z.number().int().min(0).default(0),
    section_80c_life_insurance: z.number().int().min(0).default(0),
    section_80c_tuition_fees: z.number().int().min(0).default(0),
    section_80c_nps: z.number().int().min(0).default(0),
    section_80c_home_loan_principal: z.number().int().min(0).default(0),
    section_80c_sukanya: z.number().int().min(0).default(0),
    section_80c_other: z.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      const total =
        data.section_80c_ppf +
        data.section_80c_elss +
        data.section_80c_life_insurance +
        data.section_80c_tuition_fees +
        data.section_80c_nps +
        data.section_80c_home_loan_principal +
        data.section_80c_sukanya +
        data.section_80c_other;
      return total <= MAX_80C_PAISE;
    },
    {
      message: `Total Section 80C investments cannot exceed Rs.1,50,000 (${MAX_80C_PAISE} paise)`,
      path: ["section_80c_total"],
    },
  );

// Section 80D validation schema
export const investment80DSchema = z
  .object({
    section_80d_self: z.number().int().min(0).default(0),
    section_80d_parents: z.number().int().min(0).default(0),
    section_80d_checkup: z.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      return data.section_80d_self <= MAX_80D_SELF_PAISE;
    },
    {
      message: `Section 80D self health insurance cannot exceed Rs.25,000 (${MAX_80D_SELF_PAISE} paise)`,
      path: ["section_80d_self"],
    },
  )
  .refine(
    (data) => {
      return data.section_80d_parents <= MAX_80D_PARENTS_PAISE;
    },
    {
      message: `Section 80D parents health insurance cannot exceed Rs.50,000 (${MAX_80D_PARENTS_PAISE} paise)`,
      path: ["section_80d_parents"],
    },
  )
  .refine(
    (data) => {
      return data.section_80d_checkup <= MAX_80D_CHECKUP_PAISE;
    },
    {
      message: `Preventive health checkup cannot exceed Rs.5,000 (${MAX_80D_CHECKUP_PAISE} paise)`,
      path: ["section_80d_checkup"],
    },
  );

// HRA validation schema
export const hraSchema = z
  .object({
    hra_monthly_rent: z.number().int().min(0).default(0),
    hra_landlord_name: z.string().max(200).optional(),
    hra_landlord_pan: z
      .string()
      .regex(PAN_REGEX, "Invalid PAN format")
      .optional()
      .or(z.literal("")),
    hra_rental_address: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // If annual rent > Rs.1,00,000, landlord PAN is required
      const annualRent = data.hra_monthly_rent * 12;
      if (annualRent > 10000000) {
        // Rs.1,00,000 = 10000000 paise
        return !!data.hra_landlord_pan && data.hra_landlord_pan.length > 0;
      }
      return true;
    },
    {
      message: "Landlord PAN is required when annual rent exceeds Rs.1,00,000",
      path: ["hra_landlord_pan"],
    },
  );

// Other deductions schema
export const otherDeductionsSchema = z
  .object({
    section_80e_education_loan: z.number().int().min(0).default(0), // No limit
    section_80g_donations: z.number().int().min(0).default(0),
    section_24_home_loan_interest: z.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      return data.section_24_home_loan_interest <= MAX_24_HOME_LOAN_INTEREST_PAISE;
    },
    {
      message: `Section 24 home loan interest cannot exceed Rs.2,00,000 (${MAX_24_HOME_LOAN_INTEREST_PAISE} paise)`,
      path: ["section_24_home_loan_interest"],
    },
  );

// Complete investment declaration schema
export const investmentCreateSchema = z
  .object({
    financial_year: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Financial year must be in format YYYY-YY (e.g., 2025-26)"),
  })
  .merge(investment80CSchema)
  .merge(investment80DSchema)
  .merge(hraSchema)
  .merge(otherDeductionsSchema);

// Update schema - all fields optional except financial_year
export const investmentUpdateSchema = investmentCreateSchema.partial().extend({
  financial_year: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Financial year must be in format YYYY-YY (e.g., 2025-26)")
    .optional(),
});

// Submit action schema
export const investmentSubmitSchema = z.object({
  action: z.literal("submit"),
});

// Verify/Reject action schema (admin only)
export const investmentVerifySchema = z.object({
  action: z.enum(["verify", "reject"]),
  reason: z.string().max(500).optional(),
});

// Helper to calculate total 80C
export function calculate80CTotal(declaration: any): number {
  return (
    (declaration.section_80c_ppf || 0) +
    (declaration.section_80c_elss || 0) +
    (declaration.section_80c_life_insurance || 0) +
    (declaration.section_80c_tuition_fees || 0) +
    (declaration.section_80c_nps || 0) +
    (declaration.section_80c_home_loan_principal || 0) +
    (declaration.section_80c_sukanya || 0) +
    (declaration.section_80c_other || 0)
  );
}

// Helper to calculate total 80D
export function calculate80DTotal(declaration: any): number {
  return (
    (declaration.section_80d_self || 0) +
    (declaration.section_80d_parents || 0) +
    (declaration.section_80d_checkup || 0)
  );
}
