import { TDS_STANDARD_DEDUCTION_PAISE } from '@/lib/payroll/constants';

export interface TDSCalculationResult {
  monthlyTDS: number;           // Monthly TDS to deduct
  projectedAnnualIncome: number; // Projected annual taxable income
  projectedAnnualTax: number;   // Projected annual tax
  regime: 'OLD' | 'NEW';
  breakdown?: {
    grossIncome: number;
    standardDeduction: number;
    taxableIncome: number;
    taxBeforeCess: number;
    cessPaise: number;
  };
}

// New Tax Regime Slabs FY 2024-25 (Budget 2024)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },           // Up to 3L - Nil
  { min: 300000, max: 700000, rate: 0.05 },   // 3L - 7L - 5%
  { min: 700000, max: 1000000, rate: 0.10 },  // 7L - 10L - 10%
  { min: 1000000, max: 1200000, rate: 0.15 }, // 10L - 12L - 15%
  { min: 1200000, max: 1500000, rate: 0.20 }, // 12L - 15L - 20%
  { min: 1500000, max: Infinity, rate: 0.30 }, // Above 15L - 30%
];

// Old Tax Regime Slabs
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },           // Up to 2.5L - Nil
  { min: 250000, max: 500000, rate: 0.05 },   // 2.5L - 5L - 5%
  { min: 500000, max: 1000000, rate: 0.20 },  // 5L - 10L - 20%
  { min: 1000000, max: Infinity, rate: 0.30 }, // Above 10L - 30%
];

// Standard deduction: Rs.75,000 for new regime (Budget 2024), Rs.50,000 for old regime
const STANDARD_DEDUCTION_NEW_REGIME = 7500000; // In paise (Rs.75,000)
const STANDARD_DEDUCTION_OLD_REGIME = 5000000; // Rs.50,000 for old regime

// New regime rebate: Full tax rebate if income <= Rs.7L
const NEW_REGIME_REBATE_LIMIT = 700000; // Rs.7L (in rupees for comparison)

/**
 * Calculate monthly TDS based on projected annual income
 *
 * @param monthlyGrossPaise - Monthly gross salary in paise
 * @param currentMonth - Current month (1-12)
 * @param regime - Tax regime ('OLD' or 'NEW')
 * @param yearToDateTDS - TDS already deducted this FY (optional)
 * @returns TDS calculation result
 */
export function calculateMonthlyTDS(
  monthlyGrossPaise: number,
  currentMonth: number,
  regime: 'OLD' | 'NEW' = 'NEW',
  yearToDateTDS: number = 0
): TDSCalculationResult {
  // Calculate remaining months in FY
  // FY runs April (month 4) to March (month 3)
  const fyStartMonth = 4;
  const currentFYMonth = currentMonth >= fyStartMonth
    ? currentMonth - fyStartMonth + 1  // Apr=1, May=2, ..., Dec=9
    : currentMonth + (12 - fyStartMonth + 1);  // Jan=10, Feb=11, Mar=12

  const remainingMonths = 12 - currentFYMonth + 1;
  const pastMonths = currentFYMonth - 1;

  // Project annual income
  const projectedAnnualIncome = monthlyGrossPaise * 12;

  // Apply standard deduction based on regime
  const standardDeduction = regime === 'NEW'
    ? STANDARD_DEDUCTION_NEW_REGIME
    : STANDARD_DEDUCTION_OLD_REGIME;

  const taxableIncome = Math.max(0, projectedAnnualIncome - standardDeduction);

  // Calculate annual tax
  const taxBeforeCess = calculateTaxFromSlabs(
    taxableIncome / 100, // Convert to rupees for slab comparison
    regime === 'NEW' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS
  ) * 100; // Convert back to paise

  // Check for rebate (new regime only)
  let finalTax = taxBeforeCess;
  if (regime === 'NEW' && (projectedAnnualIncome / 100) <= NEW_REGIME_REBATE_LIMIT) {
    finalTax = 0;
  }

  // Add 4% health and education cess
  const cessPaise = Math.round(finalTax * 0.04);
  const projectedAnnualTax = finalTax + cessPaise;

  // Calculate monthly TDS
  // Spread remaining tax over remaining months
  const remainingTax = Math.max(0, projectedAnnualTax - yearToDateTDS);
  const monthlyTDS = remainingMonths > 0
    ? Math.round(remainingTax / remainingMonths)
    : 0;

  return {
    monthlyTDS,
    projectedAnnualIncome,
    projectedAnnualTax,
    regime,
    breakdown: {
      grossIncome: projectedAnnualIncome,
      standardDeduction,
      taxableIncome,
      taxBeforeCess: finalTax,
      cessPaise,
    },
  };
}

/**
 * Calculate tax from slab rates
 */
function calculateTaxFromSlabs(
  incomeRupees: number,
  slabs: typeof NEW_REGIME_SLABS
): number {
  let tax = 0;
  let remainingIncome = incomeRupees;

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    const slabWidth = slab.max === Infinity
      ? remainingIncome
      : Math.min(remainingIncome, slab.max - slab.min);

    if (slabWidth > 0) {
      tax += slabWidth * slab.rate;
      remainingIncome -= slabWidth;
    }
  }

  return Math.round(tax);
}

/**
 * Calculate annual tax for a given income (for planning purposes)
 */
export function calculateAnnualTax(
  annualIncomePaise: number,
  regime: 'OLD' | 'NEW' = 'NEW'
): number {
  const standardDeduction = regime === 'NEW'
    ? STANDARD_DEDUCTION_NEW_REGIME
    : STANDARD_DEDUCTION_OLD_REGIME;

  const taxableIncome = Math.max(0, annualIncomePaise - standardDeduction);

  const taxBeforeCess = calculateTaxFromSlabs(
    taxableIncome / 100,
    regime === 'NEW' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS
  ) * 100;

  // Check for rebate
  let finalTax = taxBeforeCess;
  if (regime === 'NEW' && (annualIncomePaise / 100) <= NEW_REGIME_REBATE_LIMIT) {
    finalTax = 0;
  }

  // Add cess
  const cess = Math.round(finalTax * 0.04);

  return finalTax + cess;
}
