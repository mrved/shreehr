import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { paiseToRupees } from "@/lib/payroll/types";

/**
 * Form 24Q is the quarterly TDS return for salary payments
 *
 * Structure:
 * - Annexure I: Summary of TDS deducted and deposited (all quarters)
 * - Annexure II: Detailed salary breakup for each employee (Q4 only, required for Form 16)
 */

export interface Form24QDeductee {
  employeeId: string;
  pan: string;
  name: string;
  designation: string;
  dateOfPayment: string; // DD/MM/YYYY
  amountPaid: number; // Total gross in paise
  tdsDeducted: number; // In paise
  tdsDeposited: number; // In paise
  dateOfDeposit?: string;
  challanNumber?: string;
  bsrCode?: string;
}

export interface AnnexureI {
  quarter: number;
  financialYear: string;
  deductorTAN: string;
  deductorName: string;
  deductorPAN: string;
  deductorAddress: string;
  responsiblePersonName: string;
  responsiblePersonDesignation: string;
  deductees: Form24QDeductee[];
  totalAmountPaid: number; // In paise
  totalTDSDeducted: number; // In paise
  totalTDSDeposited: number; // In paise
}

export interface AnnexureIIEmployee {
  pan: string;
  name: string;
  employeeCode: string;
  dateOfBirth: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  email: string;

  // Income details (annual, in paise)
  grossSalary: number;
  allowancesExempt: number; // HRA, LTA exemptions
  netSalary: number;
  standardDeduction: number;
  professionalTax: number;
  taxableIncome: number;

  // Deductions under Chapter VI-A (Old Regime only, in paise)
  deduction80C?: number;
  deduction80D?: number;
  deduction80G?: number;
  totalChapterVIA?: number;

  // Tax computation (in paise)
  taxOnTotalIncome: number;
  rebate87A: number;
  surcharge: number;
  healthEducationCess: number;
  totalTaxPayable: number;
  tdsDeducted: number;
  taxRegime: "OLD" | "NEW";
}

export interface AnnexureII {
  financialYear: string;
  deductorTAN: string;
  deductorName: string;
  employees: AnnexureIIEmployee[];
}

export interface Form24QData {
  annexureI: AnnexureI;
  annexureII?: AnnexureII; // Only for Q4
}

/**
 * Generate Form 24Q data for a quarter
 *
 * @param quarter - Quarter number (1-4)
 * @param financialYear - Financial year start (e.g., 2025 for FY 2025-26)
 */
export async function generateForm24Q(
  quarter: number,
  financialYear: number,
  deductorDetails: {
    tan: string;
    name: string;
    pan: string;
    address: string;
    responsiblePerson: string;
    responsibleDesignation: string;
  },
): Promise<Form24QData> {
  // Validate quarter
  if (quarter < 1 || quarter > 4) {
    throw new Error(`Invalid quarter: ${quarter}. Must be 1-4.`);
  }

  // Determine months for the quarter
  // FY runs April to March
  const quarterMonths = getQuarterMonths(quarter);

  // Generate Annexure I
  const annexureI = await generateAnnexureI(quarter, financialYear, quarterMonths, deductorDetails);

  // Generate Annexure II only for Q4
  let annexureII: AnnexureII | undefined;
  if (quarter === 4) {
    annexureII = await generateAnnexureII(financialYear, deductorDetails);
  }

  return { annexureI, annexureII };
}

/**
 * Get months for each quarter in FY
 */
function getQuarterMonths(quarter: number): { month: number; year: number }[] {
  // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
  switch (quarter) {
    case 1:
      return [
        { month: 4, year: 0 }, // 0 = same FY start year
        { month: 5, year: 0 },
        { month: 6, year: 0 },
      ];
    case 2:
      return [
        { month: 7, year: 0 },
        { month: 8, year: 0 },
        { month: 9, year: 0 },
      ];
    case 3:
      return [
        { month: 10, year: 0 },
        { month: 11, year: 0 },
        { month: 12, year: 0 },
      ];
    case 4:
      return [
        { month: 1, year: 1 }, // 1 = next calendar year
        { month: 2, year: 1 },
        { month: 3, year: 1 },
      ];
    default:
      throw new Error(`Invalid quarter: ${quarter}`);
  }
}

/**
 * Generate Annexure I - Quarterly TDS summary
 */
export async function generateAnnexureI(
  quarter: number,
  financialYear: number,
  quarterMonths: { month: number; year: number }[],
  deductorDetails: {
    tan: string;
    name: string;
    pan: string;
    address: string;
    responsiblePerson: string;
    responsibleDesignation: string;
  },
): Promise<AnnexureI> {
  // Get payroll records for the quarter
  const records = await prisma.payrollRecord.findMany({
    where: {
      OR: quarterMonths.map((qm) => ({
        month: qm.month,
        year: financialYear + qm.year,
      })),
      tds_paise: { gt: 0 },
      status: { in: ["CALCULATED", "VERIFIED", "PAID"] },
    },
    include: {
      employee: {
        include: {
          designation: true,
        },
      },
    },
  });

  // Group by employee and aggregate
  const employeeMap = new Map<string, Form24QDeductee>();

  for (const record of records) {
    const existing = employeeMap.get(record.employee_id);
    if (existing) {
      existing.amountPaid += record.gross_salary_paise;
      existing.tdsDeducted += record.tds_paise;
      existing.tdsDeposited += record.tds_paise; // Assume deposited
    } else {
      // Decrypt PAN
      const pan = record.employee.pan_encrypted ? decrypt(record.employee.pan_encrypted) : "";

      employeeMap.set(record.employee_id, {
        employeeId: record.employee_id,
        pan,
        name: `${record.employee.first_name} ${record.employee.last_name}`,
        designation: record.employee.designation?.title || "N/A",
        dateOfPayment: formatDateDMY(new Date(record.year, record.month - 1)),
        amountPaid: record.gross_salary_paise,
        tdsDeducted: record.tds_paise,
        tdsDeposited: record.tds_paise, // Assume deposited
      });
    }
  }

  const deductees = Array.from(employeeMap.values());
  const totalAmountPaid = deductees.reduce((sum, d) => sum + d.amountPaid, 0);
  const totalTDSDeducted = deductees.reduce((sum, d) => sum + d.tdsDeducted, 0);

  return {
    quarter,
    financialYear: `${financialYear}-${(financialYear + 1).toString().slice(-2)}`,
    deductorTAN: deductorDetails.tan,
    deductorName: deductorDetails.name,
    deductorPAN: deductorDetails.pan,
    deductorAddress: deductorDetails.address,
    responsiblePersonName: deductorDetails.responsiblePerson,
    responsiblePersonDesignation: deductorDetails.responsibleDesignation,
    deductees,
    totalAmountPaid,
    totalTDSDeducted,
    totalTDSDeposited: totalTDSDeducted,
  };
}

/**
 * Generate Annexure II - Annual salary details (Q4 only)
 * This data is required for Form 16 generation
 */
export async function generateAnnexureII(
  financialYear: number,
  deductorDetails: {
    tan: string;
    name: string;
  },
): Promise<AnnexureII> {
  // Get all payroll records for the financial year
  const startYear = financialYear;
  const endYear = financialYear + 1;

  const records = await prisma.payrollRecord.findMany({
    where: {
      OR: [
        // Apr-Dec of start year
        { year: startYear, month: { gte: 4 } },
        // Jan-Mar of end year
        { year: endYear, month: { lte: 3 } },
      ],
      status: { in: ["CALCULATED", "VERIFIED", "PAID"] },
    },
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
        },
      },
    },
    orderBy: [{ employee_id: "asc" }, { month: "asc" }],
  });

  // Aggregate annual data per employee
  const employeeAnnuals = new Map<
    string,
    {
      employee: (typeof records)[0]["employee"];
      grossSalary: number;
      hra: number;
      tdsDeducted: number;
      professionalTax: number;
      taxRegime: "OLD" | "NEW";
    }
  >();

  for (const record of records) {
    const existing = employeeAnnuals.get(record.employee_id);
    if (existing) {
      existing.grossSalary += record.gross_salary_paise;
      existing.hra += record.hra_paise;
      existing.tdsDeducted += record.tds_paise;
      existing.professionalTax += record.pt_paise;
    } else {
      employeeAnnuals.set(record.employee_id, {
        employee: record.employee,
        grossSalary: record.gross_salary_paise,
        hra: record.hra_paise,
        tdsDeducted: record.tds_paise,
        professionalTax: record.pt_paise,
        taxRegime: (record.tax_regime as "OLD" | "NEW") || "NEW",
      });
    }
  }

  // Build Annexure II employees
  const employees: AnnexureIIEmployee[] = [];

  for (const data of Array.from(employeeAnnuals.values())) {
    const emp = data.employee;

    // Calculate standard deduction (Rs.75,000 for new regime, Rs.50,000 for old)
    const standardDeduction = data.taxRegime === "NEW" ? 7500000 : 5000000;

    // For now, assume no HRA exemption (would need actual rent data)
    const allowancesExempt = 0;

    const netSalary = data.grossSalary - allowancesExempt;
    const taxableIncome = Math.max(0, netSalary - standardDeduction - data.professionalTax);

    // Calculate tax (simplified, actual would use full slab logic)
    const taxOnTotalIncome = calculateTaxForAnnexure(taxableIncome, data.taxRegime);

    // Rebate 87A: Up to Rs. 25,000 for income <= 7L (new regime only)
    const rebate87A =
      taxableIncome <= 70000000 && data.taxRegime === "NEW"
        ? Math.min(taxOnTotalIncome, 2500000)
        : 0;

    const taxAfterRebate = taxOnTotalIncome - rebate87A;
    const cess = Math.round(taxAfterRebate * 0.04);

    // Decrypt PAN
    const pan = emp.pan_encrypted ? decrypt(emp.pan_encrypted) : "";

    employees.push({
      pan,
      name: `${emp.first_name} ${emp.last_name}`,
      employeeCode: emp.employee_code,
      dateOfBirth: formatDateDMY(emp.date_of_birth),
      addressLine1: emp.address_line1,
      city: emp.city,
      state: emp.state,
      pincode: emp.postal_code,
      email: emp.personal_email || "",

      grossSalary: data.grossSalary,
      allowancesExempt,
      netSalary,
      standardDeduction,
      professionalTax: data.professionalTax,
      taxableIncome,

      taxOnTotalIncome,
      rebate87A,
      surcharge: 0, // For incomes > 50L
      healthEducationCess: cess,
      totalTaxPayable: taxAfterRebate + cess,
      tdsDeducted: data.tdsDeducted,
      taxRegime: data.taxRegime,
    });
  }

  return {
    financialYear: `${financialYear}-${(financialYear + 1).toString().slice(-2)}`,
    deductorTAN: deductorDetails.tan,
    deductorName: deductorDetails.name,
    employees,
  };
}

function formatDateDMY(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function calculateTaxForAnnexure(taxableIncomePaise: number, regime: "OLD" | "NEW"): number {
  const income = paiseToRupees(taxableIncomePaise);

  if (regime === "NEW") {
    // New regime slabs (Budget 2024)
    if (income <= 300000) return 0;
    if (income <= 700000) return Math.round((income - 300000) * 0.05) * 100;
    if (income <= 1000000) return Math.round(20000 + (income - 700000) * 0.1) * 100;
    if (income <= 1200000) return Math.round(50000 + (income - 1000000) * 0.15) * 100;
    if (income <= 1500000) return Math.round(80000 + (income - 1200000) * 0.2) * 100;
    return Math.round(140000 + (income - 1500000) * 0.3) * 100;
  }

  // Old regime
  if (income <= 250000) return 0;
  if (income <= 500000) return Math.round((income - 250000) * 0.05) * 100;
  if (income <= 1000000) return Math.round(12500 + (income - 500000) * 0.2) * 100;
  return Math.round(112500 + (income - 1000000) * 0.3) * 100;
}

/**
 * Generate Form 24Q JSON for portal upload preparation
 */
export function generateForm24QJSON(data: Form24QData): string {
  return JSON.stringify(data, null, 2);
}
