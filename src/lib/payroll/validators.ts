// ShreeHR Payroll Validators
// Labour Code 2026 compliance validation for salary structures

import { z } from "zod";
import type { SalaryComponents, ValidationResult } from "./types";

// Minimum basic pay percentage per Labour Code 2026
const MIN_BASIC_PERCENTAGE = 50;

/**
 * Validates salary structure meets 50% Basic Pay Rule
 * Labour Code 2026 (effective Nov 21, 2025) requires:
 * Basic + DA + Retaining Allowance >= 50% of gross wages
 * For most companies without DA, this means Basic >= 50% of gross
 */
export function validate50PercentRule(components: SalaryComponents): ValidationResult {
  const grossMonthlyPaise =
    components.basic_paise +
    components.hra_paise +
    components.special_allowance_paise +
    components.lta_paise +
    components.medical_paise +
    components.conveyance_paise +
    components.other_allowances_paise;

  if (grossMonthlyPaise <= 0) {
    return {
      isValid: false,
      basicPercentage: 0,
      grossMonthlyPaise: 0,
      error: "Total salary must be greater than zero",
    };
  }

  const basicPercentage = (components.basic_paise / grossMonthlyPaise) * 100;

  if (basicPercentage < MIN_BASIC_PERCENTAGE) {
    const requiredBasicPaise = Math.ceil(grossMonthlyPaise * (MIN_BASIC_PERCENTAGE / 100));
    const shortfallPaise = requiredBasicPaise - components.basic_paise;

    return {
      isValid: false,
      basicPercentage: Math.round(basicPercentage * 100) / 100,
      grossMonthlyPaise,
      error:
        `Basic pay (${basicPercentage.toFixed(2)}%) must be at least 50% of gross salary per Labour Code 2026. ` +
        `Increase basic by ${formatCurrencyShort(shortfallPaise)} or reduce allowances.`,
    };
  }

  return {
    isValid: true,
    basicPercentage: Math.round(basicPercentage * 100) / 100,
    grossMonthlyPaise,
  };
}

function formatCurrencyShort(paise: number): string {
  return `Rs.${(paise / 100).toLocaleString("en-IN")}`;
}

/**
 * Calculates annual CTC including employer contributions
 */
export function calculateAnnualCTC(grossMonthlyPaise: number, basicPaise: number): number {
  // Employer PF contribution (12% of basic, capped at Rs.15,000 basic)
  const PF_WAGE_CEILING_PAISE = 1500000; // Rs.15,000
  const pfBasePaise = Math.min(basicPaise, PF_WAGE_CEILING_PAISE);
  const employerPFMonthly = Math.round(pfBasePaise * 0.12);

  // Employer ESI contribution (3.25% if gross <= Rs.21,000)
  const ESI_WAGE_CEILING_PAISE = 2100000; // Rs.21,000
  const employerESIMonthly =
    grossMonthlyPaise <= ESI_WAGE_CEILING_PAISE ? Math.round(grossMonthlyPaise * 0.0325) : 0;

  // Annual CTC = (Gross + Employer PF + Employer ESI) * 12
  return (grossMonthlyPaise + employerPFMonthly + employerESIMonthly) * 12;
}

// Base Zod schema for API validation (without refinement)
const salaryStructureBaseSchema = z.object({
  employee_id: z.string().min(1), // Allow any string ID (not just CUID)
  effective_from: z.coerce.date(),
  effective_to: z.coerce.date().optional().nullable(),

  // All amounts in paise (integers)
  basic_paise: z.number().int().positive("Basic pay must be positive"),
  hra_paise: z.number().int().min(0).default(0),
  special_allowance_paise: z.number().int().min(0).default(0),
  lta_paise: z.number().int().min(0).default(0),
  medical_paise: z.number().int().min(0).default(0),
  conveyance_paise: z.number().int().min(0).default(0),
  other_allowances_paise: z.number().int().min(0).default(0),

  tax_regime: z.enum(["OLD", "NEW"]).default("NEW"),
});

// Schema with 50% rule validation for creation
export const salaryStructureSchema = salaryStructureBaseSchema.refine(
  (data) => {
    // Validate 50% rule
    const result = validate50PercentRule(data);
    return result.isValid;
  },
  {
    message: "Salary structure does not meet 50% Basic Pay Rule (Labour Code 2026)",
    path: ["basic_paise"],
  },
);

// Update schema - partial without the refinement (validation done in route handler)
export const salaryStructureUpdateSchema = salaryStructureBaseSchema
  .partial()
  .omit({ employee_id: true });
