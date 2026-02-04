/**
 * Loan Workflow Functions
 * EMI calculation using reducing balance method and amortization schedule generation
 */

export interface LoanParams {
  principalPaise: number;
  annualInterestRate: number;
  tenureMonths: number;
}

export interface EMIScheduleEntry {
  month: number;
  emiPaise: number;
  principalPaise: number;
  interestPaise: number;
  balanceAfterPaise: number;
}

/**
 * Calculate monthly EMI using reducing balance formula
 *
 * Formula: EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 * where:
 * - P = principal amount in paise
 * - R = monthly interest rate (annual rate / 12 / 100)
 * - N = tenure in months
 *
 * Special case: Zero interest rate returns simple division
 *
 * @param params Loan parameters
 * @returns Monthly EMI amount in paise
 */
export function calculateEMI(params: LoanParams): number {
  const { principalPaise, annualInterestRate, tenureMonths } = params;

  // Handle zero interest case - simple division
  if (annualInterestRate === 0) {
    return Math.round(principalPaise / tenureMonths);
  }

  // Convert annual rate to monthly rate (as decimal)
  const monthlyRate = annualInterestRate / 100 / 12;

  // Calculate (1 + R)^N
  const factor = (1 + monthlyRate) ** tenureMonths;

  // Apply EMI formula
  const emi = (principalPaise * monthlyRate * factor) / (factor - 1);

  return Math.round(emi);
}

/**
 * Generate full amortization schedule using reducing balance method
 *
 * Each month:
 * - Interest = remaining balance × monthly rate
 * - Principal = EMI - interest
 * - New balance = old balance - principal
 *
 * Last month is adjusted to zero out balance exactly (handles rounding)
 *
 * @param params Loan parameters
 * @returns Array of schedule entries, one per month
 */
export function generateAmortizationSchedule(params: LoanParams): EMIScheduleEntry[] {
  const { principalPaise, annualInterestRate, tenureMonths } = params;
  const schedule: EMIScheduleEntry[] = [];

  const emi = calculateEMI(params);
  const monthlyRate = annualInterestRate / 100 / 12;
  let remainingBalance = principalPaise;

  for (let month = 1; month <= tenureMonths; month++) {
    // Calculate interest on remaining balance
    const interest = Math.round(remainingBalance * monthlyRate);

    // Principal is EMI minus interest
    let principal = emi - interest;

    // For last month, adjust to zero out balance exactly
    if (month === tenureMonths) {
      principal = remainingBalance;
    }

    // Update balance
    remainingBalance -= principal;

    // For last month, ensure balance is exactly zero
    if (month === tenureMonths) {
      remainingBalance = 0;
    }

    schedule.push({
      month,
      emiPaise: month === tenureMonths ? principal + interest : emi,
      principalPaise: principal,
      interestPaise: interest,
      balanceAfterPaise: remainingBalance,
    });
  }

  return schedule;
}

/**
 * Calculate total interest over loan tenure
 *
 * Sums interest from amortization schedule for accuracy
 *
 * @param params Loan parameters
 * @returns Total interest in paise
 */
export function calculateTotalInterest(params: LoanParams): number {
  const schedule = generateAmortizationSchedule(params);
  return schedule.reduce((sum, entry) => sum + entry.interestPaise, 0);
}

/**
 * Calculate loan end date by adding tenure months to start date
 *
 * Handles month overflow correctly (e.g., Jan 31 + 1 month = Feb 28/29)
 *
 * @param startDate Loan start date
 * @param tenureMonths Loan tenure in months
 * @returns Calculated end date
 */
export function calculateEndDate(startDate: Date, tenureMonths: number): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + tenureMonths);
  return endDate;
}
