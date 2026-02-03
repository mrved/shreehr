import { prisma } from '@/lib/db';
import { type SalaryComponents } from './types';
import { calculatePF, type EmployerPFBreakdown } from '@/lib/statutory/pf';
import { calculateESI } from '@/lib/statutory/esi';
import { calculatePT } from '@/lib/statutory/pt';
import { calculateMonthlyTDS } from '@/lib/statutory/tds';
import type { Gender } from '@prisma/client';

export interface PayrollCalculationInput {
  employeeId: string;
  month: number;
  year: number;
  salaryStructure: {
    basic_paise: number;
    hra_paise: number;
    special_allowance_paise: number;
    lta_paise: number;
    medical_paise: number;
    conveyance_paise: number;
    other_allowances_paise: number;
    tax_regime: 'OLD' | 'NEW';
  };
  attendance: {
    workingDays: number;
    paidDays: number;
    lopDays: number;
  };
  workState: string;
  gender?: Gender;
}

export interface PayrollCalculationResult {
  // Gross calculation
  grossBeforeLOP: number;
  lopDeduction: number;
  grossSalary: number;

  // Statutory deductions
  pfEmployee: number;
  pfEmployerBreakdown: EmployerPFBreakdown;
  pfBase: number;

  esiEmployee: number;
  esiEmployer: number;
  esiApplicable: boolean;

  ptAmount: number;

  tdsAmount: number;
  projectedAnnualIncome: number;
  taxRegime: 'OLD' | 'NEW';

  // Totals
  totalDeductions: number;
  netSalary: number;
  employerCost: number;
}

/**
 * Calculate gross salary from components
 */
export function calculateGrossSalary(components: SalaryComponents): number {
  return (
    components.basic_paise +
    components.hra_paise +
    components.special_allowance_paise +
    components.lta_paise +
    components.medical_paise +
    components.conveyance_paise +
    components.other_allowances_paise
  );
}

/**
 * Calculate LOP (Loss of Pay) deduction
 *
 * LOP = (Monthly Gross / Working Days) * LOP Days
 */
export function calculateLOP(
  grossMonthlyPaise: number,
  workingDays: number,
  lopDays: number
): number {
  if (workingDays <= 0 || lopDays <= 0) return 0;

  const perDayPaise = Math.round(grossMonthlyPaise / workingDays);
  return perDayPaise * lopDays;
}

/**
 * Calculate complete payroll for an employee
 */
export async function calculatePayroll(
  input: PayrollCalculationInput
): Promise<PayrollCalculationResult> {
  const { salaryStructure, attendance, workState, gender, month } = input;

  // 1. Calculate gross before LOP
  const grossBeforeLOP = calculateGrossSalary(salaryStructure);

  // 2. Calculate LOP deduction
  const lopDeduction = calculateLOP(
    grossBeforeLOP,
    attendance.workingDays,
    attendance.lopDays
  );

  // 3. Gross after LOP
  const grossSalary = grossBeforeLOP - lopDeduction;

  // 4. Calculate PF (on basic, not gross)
  const pfResult = calculatePF(salaryStructure.basic_paise);

  // 5. Calculate ESI (on gross)
  const esiResult = calculateESI(grossSalary);

  // 6. Calculate PT
  const ptResult = await calculatePT({
    stateCode: workState,
    grossSalaryPaise: grossSalary,
    month,
    gender: gender || 'MALE', // Default to MALE if not specified
  });
  const ptAmount = ptResult.isExempt ? 0 : ptResult.ptAmountPaise;

  // 7. Calculate TDS
  const tdsResult = calculateMonthlyTDS(
    grossSalary,
    month,
    salaryStructure.tax_regime
  );

  // 8. Total deductions (employee side)
  const totalDeductions =
    pfResult.employeePF +
    esiResult.employeeESI +
    ptAmount +
    tdsResult.monthlyTDS;

  // 9. Net salary
  const netSalary = grossSalary - totalDeductions;

  // 10. Employer cost
  const employerCost =
    grossSalary +
    pfResult.employerTotal +
    esiResult.employerESI;

  return {
    grossBeforeLOP,
    lopDeduction,
    grossSalary,

    pfEmployee: pfResult.employeePF,
    pfEmployerBreakdown: pfResult.breakdown,
    pfBase: pfResult.pfBase,

    esiEmployee: esiResult.employeeESI,
    esiEmployer: esiResult.employerESI,
    esiApplicable: esiResult.applicable,

    ptAmount,

    tdsAmount: tdsResult.monthlyTDS,
    projectedAnnualIncome: tdsResult.projectedAnnualIncome,
    taxRegime: salaryStructure.tax_regime,

    totalDeductions,
    netSalary,
    employerCost,
  };
}

/**
 * Get attendance summary for payroll
 */
export async function getAttendanceSummary(
  employeeId: string,
  month: number,
  year: number
): Promise<{
  workingDays: number;
  presentDays: number;
  lopDays: number;
  paidDays: number;
}> {
  // Get attendance records for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendances = await prisma.attendance.findMany({
    where: {
      employee_id: employeeId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Calculate working days (exclude weekends)
  let workingDays = 0;
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Count attendance statuses
  let presentDays = 0;
  let lopDays = 0;

  for (const att of attendances) {
    if (att.status === 'PRESENT') {
      presentDays += 1;
    } else if (att.status === 'HALF_DAY') {
      presentDays += 0.5;
    } else if (att.status === 'ON_LEAVE') {
      // Check if paid leave
      // For now, count as present (paid)
      presentDays += 1;
    } else if (att.status === 'ABSENT') {
      lopDays += 1;
    }
    // HOLIDAY and WEEKEND don't count either way
  }

  // Paid days = Present days + any paid leave
  const paidDays = workingDays - lopDays;

  return {
    workingDays,
    presentDays: Math.round(presentDays),
    lopDays,
    paidDays: Math.max(0, paidDays),
  };
}
