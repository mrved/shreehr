/**
 * Professional Tax (PT) Calculation Utility
 *
 * Handles state-specific PT calculation with support for:
 * - State-wise PT slabs
 * - Month-specific rates (Karnataka February = Rs.300)
 * - Gender-based exemptions
 * - Frequency (monthly/yearly)
 */

import type { Gender } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface PTCalculationInput {
  stateCode: string;
  grossSalaryPaise: number;
  month: number; // 1-12
  gender: Gender;
}

export interface PTCalculationResult {
  ptAmountPaise: number;
  slabId: string | null;
  isExempt: boolean;
  reason?: string;
}

/**
 * Calculate Professional Tax for a given salary and state
 *
 * @param input - Calculation parameters
 * @returns PT amount in paise
 */
export async function calculatePT(input: PTCalculationInput): Promise<PTCalculationResult> {
  const { stateCode, grossSalaryPaise, month, gender } = input;

  // Check if state has PT
  const exemptStates = ["DL", "HR", "HP", "JH", "KL", "PB", "RJ", "UP", "UT"];
  if (exemptStates.includes(stateCode)) {
    return {
      ptAmountPaise: 0,
      slabId: null,
      isExempt: true,
      reason: `State ${stateCode} has no Professional Tax`,
    };
  }

  // Try to find month-specific slab first
  let slab = await prisma.professionalTaxSlab.findFirst({
    where: {
      state_code: stateCode,
      is_active: true,
      month, // Month-specific (e.g., February in Karnataka)
      salary_from: { lte: grossSalaryPaise },
      AND: [
        { OR: [{ salary_to: null }, { salary_to: { gte: grossSalaryPaise } }] },
        { OR: [{ applies_to_gender: null }, { applies_to_gender: gender }] },
      ],
    },
    orderBy: [{ month: "desc" }, { salary_from: "desc" }], // Prefer month-specific, then highest slab
  });

  // If no month-specific slab, find general slab (month = null)
  if (!slab) {
    slab = await prisma.professionalTaxSlab.findFirst({
      where: {
        state_code: stateCode,
        is_active: true,
        month: null, // General slab applies to all months
        salary_from: { lte: grossSalaryPaise },
        AND: [
          { OR: [{ salary_to: null }, { salary_to: { gte: grossSalaryPaise } }] },
          { OR: [{ applies_to_gender: null }, { applies_to_gender: gender }] },
        ],
      },
      orderBy: { salary_from: "desc" }, // Highest matching slab
    });
  }

  if (!slab) {
    // No slab found means salary is below PT threshold
    return {
      ptAmountPaise: 0,
      slabId: null,
      isExempt: true,
      reason: "Salary below PT threshold",
    };
  }

  return {
    ptAmountPaise: slab.tax_amount,
    slabId: slab.id,
    isExempt: false,
  };
}

/**
 * Get all PT slabs for a state
 *
 * @param stateCode - Two-letter state code
 * @returns Array of PT slabs
 */
export async function getPTSlabsForState(stateCode: string) {
  const slabs = await prisma.professionalTaxSlab.findMany({
    where: {
      state_code: stateCode,
      is_active: true,
    },
    orderBy: [{ month: "asc" }, { salary_from: "asc" }],
  });

  return slabs;
}

/**
 * Get all states with PT configuration
 *
 * @returns Array of unique state codes
 */
export async function getPTStates() {
  const states = await prisma.professionalTaxSlab.findMany({
    where: { is_active: true },
    select: { state_code: true },
    distinct: ["state_code"],
    orderBy: { state_code: "asc" },
  });

  return states.map((s) => s.state_code);
}

/**
 * Calculate annual PT for a state
 * Useful for Form 16 and annual salary statements
 *
 * @param stateCode - Two-letter state code
 * @param grossMonthlySalaryPaise - Gross monthly salary in paise
 * @param gender - Employee gender
 * @returns Annual PT amount in paise
 */
export async function calculateAnnualPT(
  stateCode: string,
  grossMonthlySalaryPaise: number,
  gender: Gender,
): Promise<number> {
  let annualPT = 0;

  // Calculate PT for each month
  for (let month = 1; month <= 12; month++) {
    const result = await calculatePT({
      stateCode,
      grossSalaryPaise: grossMonthlySalaryPaise,
      month,
      gender,
    });
    annualPT += result.ptAmountPaise;
  }

  return annualPT;
}
