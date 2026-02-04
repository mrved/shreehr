import {
  EDLI_RATE,
  EPF_EMPLOYER_RATE,
  EPS_MAX_MONTHLY_PAISE,
  EPS_RATE,
  PF_ADMIN_RATE,
  PF_EMPLOYEE_RATE,
  PF_WAGE_CEILING_PAISE,
} from "@/lib/payroll/constants";

export { PF_WAGE_CEILING_PAISE, EPS_MAX_MONTHLY_PAISE };

export interface EmployerPFBreakdown {
  epf: number; // 3.67%
  eps: number; // 8.33% capped at Rs.1,250
  edli: number; // 0.50%
  adminCharges: number; // 0.51%
  total: number;
}

export interface PFCalculationResult {
  pfBase: number; // min(basic, ceiling) in paise
  employeePF: number; // Employee's 12% contribution
  employerTotal: number; // Total employer contribution
  breakdown: EmployerPFBreakdown;
}

/**
 * Calculate PF contributions for an employee
 *
 * @param basicSalaryPaise - Monthly basic salary in paise
 * @returns PF calculation result with all components
 */
export function calculatePF(basicSalaryPaise: number): PFCalculationResult {
  if (basicSalaryPaise <= 0) {
    return {
      pfBase: 0,
      employeePF: 0,
      employerTotal: 0,
      breakdown: { epf: 0, eps: 0, edli: 0, adminCharges: 0, total: 0 },
    };
  }

  // Apply wage ceiling
  const pfBase = Math.min(basicSalaryPaise, PF_WAGE_CEILING_PAISE);

  // Employee contribution: 12% of PF base
  const employeePF = Math.round(pfBase * PF_EMPLOYEE_RATE);

  // Get employer breakdown
  const breakdown = calculateEmployerPFBreakdown(basicSalaryPaise);

  return {
    pfBase,
    employeePF,
    employerTotal: breakdown.total,
    breakdown,
  };
}

/**
 * Calculate employer PF contribution breakdown
 *
 * Employer's 12% is split into:
 * - 3.67% to Employee Provident Fund (EPF)
 * - 8.33% to Employee Pension Scheme (EPS) - capped at Rs.1,250/month
 * - 0.50% to Employee Deposit Linked Insurance (EDLI)
 * - 0.51% admin charges
 *
 * When EPS caps at Rs.1,250, the difference goes to EPF
 */
export function calculateEmployerPFBreakdown(basicSalaryPaise: number): EmployerPFBreakdown {
  if (basicSalaryPaise <= 0) {
    return { epf: 0, eps: 0, edli: 0, adminCharges: 0, total: 0 };
  }

  // Apply wage ceiling
  const pfBase = Math.min(basicSalaryPaise, PF_WAGE_CEILING_PAISE);

  // Calculate EPS: 8.33% of base, capped at Rs.1,250
  let eps = Math.round(pfBase * EPS_RATE);
  const epsBeforeCap = eps;

  // Cap EPS at Rs.1,250
  if (eps > EPS_MAX_MONTHLY_PAISE) {
    eps = EPS_MAX_MONTHLY_PAISE;
  }

  // EDLI: 0.50%
  const edli = Math.round(pfBase * EDLI_RATE);

  // EPF calculation depends on whether EPS is capped
  let epf: number;
  if (epsBeforeCap > EPS_MAX_MONTHLY_PAISE) {
    // When EPS is capped, excess goes to EPF
    // Total employer PF = 12%, split as: EPS (capped) + EDLI + EPF (gets remainder)
    const totalEmployerPF = Math.round(pfBase * PF_EMPLOYEE_RATE);
    epf = totalEmployerPF - eps - edli;
  } else {
    // When EPS is not capped, EPF is 3.67%
    epf = Math.round(pfBase * EPF_EMPLOYER_RATE);
  }

  // Admin charges: 0.51%
  const adminCharges = Math.round(pfBase * PF_ADMIN_RATE);

  const total = epf + eps + edli + adminCharges;

  return { epf, eps, edli, adminCharges, total };
}

/**
 * Check if employee is eligible for PF
 * All employees with basic >= Rs.15,000 are mandatorily covered
 * Employees with basic < Rs.15,000 can opt out (but most don't)
 */
export function isPFMandatory(basicSalaryPaise: number): boolean {
  return basicSalaryPaise >= PF_WAGE_CEILING_PAISE;
}
