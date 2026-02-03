/**
 * Statutory Compliance Constants for Indian Payroll
 *
 * All rates are as per latest government notifications.
 * Update these when regulations change.
 */

// ============================================================================
// PROVIDENT FUND (PF) - EPFO
// ============================================================================

/**
 * PF wage ceiling per month (in rupees)
 * Employee + Employer contributions are calculated on basic+DA, capped at this limit.
 */
export const PF_WAGE_CEILING = 15000;

/**
 * Employee PF contribution rate
 * 12% of (Basic + DA) or wage ceiling, whichever is lower
 */
export const PF_EMPLOYEE_RATE = 0.12;

/**
 * Employer PF contribution rate
 * 12% to EPF (3.67% to EPF + 8.33% to EPS)
 */
export const PF_EMPLOYER_RATE = 0.12;

/**
 * Employer contribution split:
 * - 3.67% goes to EPF (Employee Provident Fund)
 * - 8.33% goes to EPS (Employee Pension Scheme)
 */
export const PF_EPF_RATE = 0.0367;
export const PF_EPS_RATE = 0.0833;

/**
 * EPS wage ceiling per month (in rupees)
 * 8.33% EPS contribution is calculated on basic+DA, capped at Rs.15,000
 */
export const EPS_WAGE_CEILING = 15000;

/**
 * EDLI (Employee Deposit Linked Insurance) contribution rate
 * 0.5% on wage ceiling, max Rs.75
 */
export const EDLI_RATE = 0.005;
export const EDLI_MAX = 7500; // in paise (Rs.75)

/**
 * Administrative charges on PF
 * 0.85% on wage ceiling for EPFO admin
 */
export const PF_ADMIN_RATE = 0.0085;

// ============================================================================
// EMPLOYEE STATE INSURANCE (ESI) - ESIC
// ============================================================================

/**
 * ESI applicability threshold per month (in rupees)
 * Applicable if gross salary <= Rs.21,000/month
 */
export const ESI_WAGE_CEILING = 21000;

/**
 * Employee ESI contribution rate
 * 0.75% of gross salary
 */
export const ESI_EMPLOYEE_RATE = 0.0075;

/**
 * Employer ESI contribution rate
 * 3.25% of gross salary
 */
export const ESI_EMPLOYER_RATE = 0.0325;

// ============================================================================
// PROFESSIONAL TAX (PT)
// ============================================================================

/**
 * State codes for Professional Tax
 */
export const PT_STATES = {
  KARNATAKA: 'KA',
  MAHARASHTRA: 'MH',
  TAMIL_NADU: 'TN',
  TELANGANA: 'TS',
  WEST_BENGAL: 'WB',
  ANDHRA_PRADESH: 'AP',
  ASSAM: 'AS',
  CHHATTISGARH: 'CG',
  GUJARAT: 'GJ',
  MADHYA_PRADESH: 'MP',
  MEGHALAYA: 'ML',
  ODISHA: 'OR',
  TRIPURA: 'TR',
} as const;

/**
 * States with no Professional Tax
 */
export const PT_EXEMPT_STATES = [
  'DL', // Delhi
  'HR', // Haryana
  'HP', // Himachal Pradesh
  'JH', // Jharkhand
  'KL', // Kerala
  'PB', // Punjab
  'RJ', // Rajasthan
  'UP', // Uttar Pradesh
  'UT', // Uttarakhand
];

/**
 * Maximum PT per year (Karnataka specific)
 * Karnataka: Rs.2,400 per year (Rs.200 x 11 months + Rs.300 in February)
 */
export const PT_MAX_ANNUAL_KA = 240000; // in paise

// ============================================================================
// TAX DEDUCTED AT SOURCE (TDS)
// ============================================================================

/**
 * Standard deduction under new tax regime
 * Rs.50,000 for salaried employees (FY 2023-24 onwards)
 */
export const STANDARD_DEDUCTION = 5000000; // in paise (Rs.50,000)

/**
 * Basic exemption limit (new tax regime FY 2023-24)
 * Income up to Rs.3,00,000 is tax-free
 */
export const BASIC_EXEMPTION_NEW = 30000000; // in paise (Rs.3,00,000)

/**
 * Basic exemption limit (old tax regime)
 * Income up to Rs.2,50,000 is tax-free
 */
export const BASIC_EXEMPTION_OLD = 25000000; // in paise (Rs.2,50,000)

/**
 * HRA calculation constants
 */
export const HRA_METRO_RATE = 0.5; // 50% of basic for metro cities
export const HRA_NON_METRO_RATE = 0.4; // 40% of basic for non-metro cities

/**
 * Metro cities for HRA calculation
 */
export const METRO_CITIES = ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'];

/**
 * LTA (Leave Travel Allowance) exemption limit
 * Twice in a block of 4 years
 */
export const LTA_EXEMPTION_BLOCKS = [
  { start: 2022, end: 2025 },
  { start: 2026, end: 2029 },
];

/**
 * Section 80C limit (old tax regime)
 * Rs.1,50,000 per year
 */
export const SECTION_80C_LIMIT = 15000000; // in paise (Rs.1,50,000)

/**
 * Health insurance premium limit under 80D (old tax regime)
 * Rs.25,000 for self/family, Rs.50,000 for senior citizens
 */
export const SECTION_80D_LIMIT = 2500000; // in paise (Rs.25,000)
export const SECTION_80D_LIMIT_SENIOR = 5000000; // in paise (Rs.50,000)

// ============================================================================
// GRATUITY
// ============================================================================

/**
 * Gratuity eligibility period in years
 * Payable after 5 years of continuous service
 */
export const GRATUITY_MIN_YEARS = 5;

/**
 * Gratuity calculation formula
 * (Last drawn salary × 15/26 × years of service)
 */
export const GRATUITY_DAYS = 15;
export const GRATUITY_MONTH_DAYS = 26;

/**
 * Maximum gratuity amount (in rupees)
 * Rs.20,00,000 as per latest notification
 */
export const GRATUITY_MAX = 2000000000; // in paise (Rs.20,00,000)

// ============================================================================
// BONUS
// ============================================================================

/**
 * Bonus eligibility criteria
 * Applicable for employees earning up to Rs.21,000/month
 */
export const BONUS_WAGE_CEILING = 21000;

/**
 * Minimum bonus percentage
 * 8.33% of salary or Rs.100/month, whichever is higher
 */
export const BONUS_MIN_RATE = 0.0833;
export const BONUS_MIN_AMOUNT = 10000; // in paise (Rs.100/month)

/**
 * Maximum bonus percentage
 * 20% of salary
 */
export const BONUS_MAX_RATE = 0.2;

// ============================================================================
// LEAVE ENCASHMENT
// ============================================================================

/**
 * Leave encashment calculation
 * (Salary/30) × days encashed
 * Tax-free up to Rs.3,00,000 on retirement
 */
export const LEAVE_ENCASHMENT_TAX_FREE = 30000000; // in paise (Rs.3,00,000)

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert rupees to paise
 */
export function rupeeToRupee(paise: number): number {
  return Math.round(paise / 100);
}

/**
 * Convert paise to rupees
 */
export function rupeeToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Format paise as currency string
 */
export function formatCurrency(paise: number): string {
  const rupees = rupeeToRupee(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}
