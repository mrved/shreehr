/**
 * ECR (Electronic Challan cum Return) File Generator for EPFO
 *
 * Format: Text file with #~# separator
 * Header line: Establishment info + totals
 * Employee lines: UAN#~#Name#~#Wages#~#Contributions
 *
 * EPFO ECR format has 11 fields per employee line:
 * 1. UAN
 * 2. Member Name
 * 3. Gross Wages
 * 4. EPF Wages (capped at 15000)
 * 5. EPS Wages (capped at 15000)
 * 6. EDLI Wages (capped at 15000)
 * 7. Employee EPF
 * 8. Employer EPF
 * 9. Employer EPS
 * 10. Employer EDLI
 * 11. NCP Days
 * 12. Refund
 */

import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/payroll/constants';

export interface ECREmployeeRecord {
  uan: string;
  name: string;
  grossWages: number; // in paise
  epfWages: number; // in paise (capped at 15000 rupees)
  epsWages: number; // in paise (capped at 15000 rupees)
  edliWages: number; // in paise (capped at 15000 rupees)
  employeeEPF: number; // in paise
  employerEPF: number; // in paise
  employerEPS: number; // in paise
  employerEDLI: number; // in paise
  ncpDays: number; // Non-contribution period (LOP days)
  refund: number; // in paise (usually 0)
}

export interface ECRHeader {
  establishmentCode: string;
  establishmentName: string;
  month: number;
  year: number;
  totalEmployees: number;
  totalWages: number; // in paise
  totalEmployeeContribution: number; // in paise
  totalEmployerContribution: number; // in paise
}

/**
 * Generate ECR file content in EPFO format
 */
export function generateECRFile(
  header: ECRHeader,
  records: ECREmployeeRecord[]
): string {
  const lines: string[] = [];

  // Helper to convert paise to rupees with 2 decimals
  const toRupees = (paise: number): string => {
    return (paise / 100).toFixed(2);
  };

  // Header line format:
  // ESTABLISHMENT_CODE#~#NAME#~#MONTH#~#YEAR#~#EMPLOYEES#~#TOTAL_WAGES#~#TOTAL_EE#~#TOTAL_ER
  const headerLine = [
    header.establishmentCode,
    header.establishmentName,
    header.month.toString().padStart(2, '0'),
    header.year.toString(),
    header.totalEmployees.toString(),
    toRupees(header.totalWages),
    toRupees(header.totalEmployeeContribution),
    toRupees(header.totalEmployerContribution),
  ].join('#~#');

  lines.push(headerLine);

  // Employee lines
  for (const record of records) {
    const employeeLine = [
      record.uan,
      record.name,
      toRupees(record.grossWages),
      toRupees(record.epfWages),
      toRupees(record.epsWages),
      toRupees(record.edliWages),
      toRupees(record.employeeEPF),
      toRupees(record.employerEPF),
      toRupees(record.employerEPS),
      toRupees(record.employerEDLI),
      record.ncpDays.toString(),
      toRupees(record.refund),
    ].join('#~#');

    lines.push(employeeLine);
  }

  return lines.join('\n');
}

/**
 * Generate ECR file for a completed payroll run
 */
export async function generateECRForPayrollRun(
  payrollRunId: string,
  establishmentCode: string,
  establishmentName: string
): Promise<string> {
  // Get payroll run with records
  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      records: {
        where: {
          status: { in: ['CALCULATED', 'VERIFIED', 'PAID'] },
        },
        include: {
          employee: {
            select: {
              uan: true,
              first_name: true,
              middle_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  });

  if (!payrollRun) {
    throw new Error('Payroll run not found');
  }

  // Build employee records
  const ecrRecords: ECREmployeeRecord[] = [];

  for (const record of payrollRun.records) {
    // Skip employees without UAN
    if (!record.employee.uan) {
      continue;
    }

    // Build employee name
    const nameParts = [
      record.employee.first_name,
      record.employee.middle_name,
      record.employee.last_name,
    ].filter(Boolean);
    const name = nameParts.join(' ');

    ecrRecords.push({
      uan: record.employee.uan,
      name,
      grossWages: record.gross_salary_paise,
      epfWages: record.pf_base_paise,
      epsWages: record.pf_base_paise,
      edliWages: record.pf_base_paise,
      employeeEPF: record.pf_employee_paise,
      employerEPF: record.pf_employer_epf_paise,
      employerEPS: record.pf_employer_eps_paise,
      employerEDLI: record.pf_employer_edli_paise,
      ncpDays: record.lop_days,
      refund: 0, // No refunds typically
    });
  }

  // Calculate totals
  const totalWages = ecrRecords.reduce(
    (sum, r) => sum + r.grossWages,
    0
  );
  const totalEmployeeContribution = ecrRecords.reduce(
    (sum, r) => sum + r.employeeEPF,
    0
  );
  const totalEmployerContribution = ecrRecords.reduce(
    (sum, r) => sum + r.employerEPF + r.employerEPS + r.employerEDLI,
    0
  );

  // Build header
  const header: ECRHeader = {
    establishmentCode,
    establishmentName,
    month: payrollRun.month,
    year: payrollRun.year,
    totalEmployees: ecrRecords.length,
    totalWages,
    totalEmployeeContribution,
    totalEmployerContribution,
  };

  return generateECRFile(header, ecrRecords);
}
