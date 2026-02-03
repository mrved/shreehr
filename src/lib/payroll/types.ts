// ShreeHR Payroll Types
// TypeScript types for salary structures and payroll calculations

export interface SalaryComponents {
  basic_paise: number;
  hra_paise: number;
  special_allowance_paise: number;
  lta_paise: number;
  medical_paise: number;
  conveyance_paise: number;
  other_allowances_paise: number;
}

export interface SalaryStructureInput extends SalaryComponents {
  employee_id: string;
  effective_from: Date;
  effective_to?: Date;
  tax_regime?: 'OLD' | 'NEW';
}

export interface ValidationResult {
  isValid: boolean;
  basicPercentage: number;
  grossMonthlyPaise: number;
  error?: string;
}

// Utility functions for paise conversion and formatting

/**
 * Convert paise to rupees
 * @param paise Amount in paise (100 paise = 1 rupee)
 * @returns Amount in rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Convert rupees to paise
 * @param rupees Amount in rupees
 * @returns Amount in paise (rounded to nearest paise)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Format paise amount as Indian currency
 * @param paise Amount in paise
 * @returns Formatted currency string (e.g., "₹12,34,567")
 */
export function formatCurrency(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paiseToRupees(paise));
}
