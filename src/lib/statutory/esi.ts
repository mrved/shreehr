import {
  ESI_EMPLOYEE_RATE,
  ESI_EMPLOYER_RATE,
  ESI_WAGE_CEILING_PAISE,
} from "@/lib/payroll/constants";

export interface ESICalculationResult {
  applicable: boolean;
  employeeESI: number; // 0.75% of gross
  employerESI: number; // 3.25% of gross
  grossUsed: number; // Gross salary used for calculation
  reason?: string;
}

/**
 * Check if ESI is applicable for the employee
 * ESI applies when gross salary <= Rs.21,000/month
 */
export function isESIApplicable(grossSalaryPaise: number): boolean {
  return grossSalaryPaise <= ESI_WAGE_CEILING_PAISE;
}

/**
 * Calculate ESI contributions
 *
 * @param grossSalaryPaise - Monthly gross salary in paise
 * @returns ESI calculation result
 */
export function calculateESI(grossSalaryPaise: number): ESICalculationResult {
  if (!isESIApplicable(grossSalaryPaise)) {
    return {
      applicable: false,
      employeeESI: 0,
      employerESI: 0,
      grossUsed: grossSalaryPaise,
      reason: `Gross salary Rs.${(grossSalaryPaise / 100).toLocaleString("en-IN")} exceeds ESI ceiling of Rs.21,000`,
    };
  }

  const employeeESI = Math.round(grossSalaryPaise * ESI_EMPLOYEE_RATE);
  const employerESI = Math.round(grossSalaryPaise * ESI_EMPLOYER_RATE);

  return {
    applicable: true,
    employeeESI,
    employerESI,
    grossUsed: grossSalaryPaise,
  };
}

/**
 * Check if employee was ESI-covered in previous period
 * Once covered, employee remains covered for the contribution period
 * even if salary exceeds limit
 *
 * ESI contribution periods:
 * - April - September (contribution period 1)
 * - October - March (contribution period 2)
 */
export function getESIContributionPeriod(
  month: number,
  year: number,
): {
  periodStartMonth: number;
  periodStartYear: number;
  periodEndMonth: number;
  periodEndYear: number;
} {
  if (month >= 4 && month <= 9) {
    // Period 1: April-September
    return {
      periodStartMonth: 4,
      periodStartYear: year,
      periodEndMonth: 9,
      periodEndYear: year,
    };
  } else if (month >= 10) {
    // Period 2: October-March (Oct-Dec)
    return {
      periodStartMonth: 10,
      periodStartYear: year,
      periodEndMonth: 3,
      periodEndYear: year + 1,
    };
  } else {
    // Period 2: October-March (Jan-Mar)
    return {
      periodStartMonth: 10,
      periodStartYear: year - 1,
      periodEndMonth: 3,
      periodEndYear: year,
    };
  }
}
