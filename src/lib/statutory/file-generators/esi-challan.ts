/**
 * ESI Challan Generator for ESIC
 *
 * Format: CSV file with employee details and contributions
 * Columns: ESIC Number, Employee Name, Gross Wages, Employee Contribution, Employer Contribution, Total Contribution, IP Days
 */

import { prisma } from '@/lib/db';

export interface ESIChallanRecord {
  esicNumber: string;
  employeeName: string;
  grossWages: number; // in paise
  employeeContribution: number; // in paise (0.75%)
  employerContribution: number; // in paise (3.25%)
  totalContribution: number; // in paise
  ipDays: number; // Insured Person days (working days)
}

/**
 * Generate ESI challan in CSV format
 */
export function generateESIChallan(
  records: ESIChallanRecord[],
  month: number,
  year: number
): string {
  const lines: string[] = [];

  // Helper to convert paise to rupees with 2 decimals
  const toRupees = (paise: number): string => {
    return (paise / 100).toFixed(2);
  };

  // CSV Header
  lines.push(
    'ESIC Number,Employee Name,Gross Wages (Rs),Employee Contribution (Rs),Employer Contribution (Rs),Total Contribution (Rs),IP Days'
  );

  // Employee records
  for (const record of records) {
    const row = [
      record.esicNumber,
      `"${record.employeeName}"`, // Quote name to handle commas
      toRupees(record.grossWages),
      toRupees(record.employeeContribution),
      toRupees(record.employerContribution),
      toRupees(record.totalContribution),
      record.ipDays.toString(),
    ].join(',');

    lines.push(row);
  }

  // Summary totals
  const totalGrossWages = records.reduce((sum, r) => sum + r.grossWages, 0);
  const totalEmployeeContribution = records.reduce(
    (sum, r) => sum + r.employeeContribution,
    0
  );
  const totalEmployerContribution = records.reduce(
    (sum, r) => sum + r.employerContribution,
    0
  );
  const totalContribution = records.reduce(
    (sum, r) => sum + r.totalContribution,
    0
  );

  // Add blank line
  lines.push('');

  // Summary row
  lines.push(
    `"TOTAL (${records.length} employees)",${toRupees(totalGrossWages)},${toRupees(totalEmployeeContribution)},${toRupees(totalEmployerContribution)},${toRupees(totalContribution)},`
  );

  // Month/Year footer
  lines.push('');
  lines.push(`Month/Year,${month.toString().padStart(2, '0')}/${year}`);

  return lines.join('\n');
}

/**
 * Generate ESI challan for a completed payroll run
 */
export async function generateESIChallanForPayrollRun(
  payrollRunId: string
): Promise<string> {
  // Get payroll run with records
  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      records: {
        where: {
          status: { in: ['CALCULATED', 'VERIFIED', 'PAID'] },
          esi_applicable: true, // Only include ESI-applicable employees
        },
        include: {
          employee: {
            select: {
              esic_number: true,
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

  // Build ESI records
  const esiRecords: ESIChallanRecord[] = [];

  for (const record of payrollRun.records) {
    // Skip employees without ESIC number
    if (!record.employee.esic_number) {
      continue;
    }

    // Build employee name
    const nameParts = [
      record.employee.first_name,
      record.employee.middle_name,
      record.employee.last_name,
    ].filter(Boolean);
    const employeeName = nameParts.join(' ');

    // Calculate IP Days (working days - LOP days)
    const ipDays = record.working_days - record.lop_days;

    esiRecords.push({
      esicNumber: record.employee.esic_number,
      employeeName,
      grossWages: record.gross_salary_paise,
      employeeContribution: record.esi_employee_paise,
      employerContribution: record.esi_employer_paise,
      totalContribution: record.esi_employee_paise + record.esi_employer_paise,
      ipDays,
    });
  }

  return generateESIChallan(esiRecords, payrollRun.month, payrollRun.year);
}
