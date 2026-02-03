import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { prisma } from '@/lib/db';
import { paiseToRupees } from '@/lib/payroll/types';
import { decrypt } from '@/lib/encryption';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 3,
  },
  section: {
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 5,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  col1: {
    width: '60%',
  },
  col2: {
    width: '40%',
    textAlign: 'right',
  },
  boldText: {
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    fontSize: 8,
    color: '#666',
  },
  quarterRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    fontSize: 8,
  },
});

export interface Form16Data {
  // Part A - Employer/Deductor details
  partA: {
    tan: string;
    panDeductor: string;
    deductorName: string;
    deductorAddress: string;
    financialYear: string;
    assessmentYear: string;
    employeePAN: string;
    employeeName: string;
    employeeAddress: string;
    periodFrom: string;
    periodTo: string;
  };

  // Part B - Salary details (all amounts in paise)
  partB: {
    grossSalary: number;
    allowancesExempt: number;
    netSalary: number;
    standardDeduction: number;
    entertainmentAllowance: number;
    professionalTax: number;
    incomeChargeableSalary: number;
    incomeOtherSources: number;
    grossTotalIncome: number;
    deductionsChapterVIA: number;
    totalIncome: number;
    taxPayableOnTotalIncome: number;
    rebate87A: number;
    taxAfterRebate: number;
    surcharge: number;
    healthEducationCess: number;
    totalTaxPayable: number;
    reliefSection89: number;
    netTaxPayable: number;
    totalTDSDeducted: number;
    taxRegime: 'OLD' | 'NEW';
  };

  // Quarter-wise TDS details (amounts in paise)
  quarterlyTDS: Array<{
    quarter: number;
    amountPaid: number;
    tdsDeducted: number;
    dateOfDeposit?: string;
    challanNumber?: string;
  }>;
}

/**
 * Form 16 PDF Document Component
 */
export function Form16Document({ data }: { data: Form16Data }) {
  const { partA, partB, quarterlyTDS } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FORM NO. 16</Text>
          <Text style={styles.subtitle}>
            Certificate under Section 203 of the Income-tax Act, 1961
          </Text>
          <Text style={styles.subtitle}>
            for Tax Deducted at Source on Salary
          </Text>
        </View>

        {/* Part A - Deductor Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PART A</Text>

          <View style={styles.row}>
            <Text style={styles.col1}>Name of Deductor:</Text>
            <Text style={styles.col2}>{partA.deductorName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>TAN of Deductor:</Text>
            <Text style={styles.col2}>{partA.tan}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>PAN of Deductor:</Text>
            <Text style={styles.col2}>{partA.panDeductor}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>Address:</Text>
            <Text style={styles.col2}>{partA.deductorAddress}</Text>
          </View>

          <View style={{ marginTop: 10 }} />

          <View style={styles.row}>
            <Text style={styles.col1}>Name of Employee:</Text>
            <Text style={[styles.col2, styles.boldText]}>{partA.employeeName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>PAN of Employee:</Text>
            <Text style={styles.col2}>{partA.employeePAN}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>Address:</Text>
            <Text style={styles.col2}>{partA.employeeAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>Financial Year:</Text>
            <Text style={styles.col2}>{partA.financialYear}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>Assessment Year:</Text>
            <Text style={styles.col2}>{partA.assessmentYear}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>Period:</Text>
            <Text style={styles.col2}>{partA.periodFrom} to {partA.periodTo}</Text>
          </View>
        </View>

        {/* Part B - Income Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            PART B - Details of Salary Paid and Tax Deducted ({partB.taxRegime} Regime)
          </Text>

          <View style={styles.row}>
            <Text style={styles.col1}>1. Gross Salary (a+b+c)</Text>
            <Text style={styles.col2}>{formatCurrency(partB.grossSalary)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>2. Less: Allowances exempt u/s 10</Text>
            <Text style={styles.col2}>{formatCurrency(partB.allowancesExempt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>3. Balance (1-2)</Text>
            <Text style={styles.col2}>{formatCurrency(partB.netSalary)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>4. Deductions:</Text>
            <Text style={styles.col2}></Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>   (a) Standard Deduction u/s 16(ia)</Text>
            <Text style={styles.col2}>{formatCurrency(partB.standardDeduction)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>   (b) Professional Tax u/s 16(iii)</Text>
            <Text style={styles.col2}>{formatCurrency(partB.professionalTax)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.col1, styles.boldText]}>5. Income Chargeable under Salary</Text>
            <Text style={[styles.col2, styles.boldText]}>{formatCurrency(partB.incomeChargeableSalary)}</Text>
          </View>

          <View style={{ marginTop: 10 }} />

          <View style={styles.row}>
            <Text style={styles.col1}>6. Gross Total Income</Text>
            <Text style={styles.col2}>{formatCurrency(partB.grossTotalIncome)}</Text>
          </View>
          {partB.taxRegime === 'OLD' && (
            <View style={styles.row}>
              <Text style={styles.col1}>7. Deductions under Chapter VI-A</Text>
              <Text style={styles.col2}>{formatCurrency(partB.deductionsChapterVIA)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={[styles.col1, styles.boldText]}>8. Total Income</Text>
            <Text style={[styles.col2, styles.boldText]}>{formatCurrency(partB.totalIncome)}</Text>
          </View>

          <View style={{ marginTop: 10 }} />

          <View style={styles.row}>
            <Text style={styles.col1}>9. Tax on Total Income</Text>
            <Text style={styles.col2}>{formatCurrency(partB.taxPayableOnTotalIncome)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>10. Rebate u/s 87A</Text>
            <Text style={styles.col2}>{formatCurrency(partB.rebate87A)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>11. Tax after Rebate</Text>
            <Text style={styles.col2}>{formatCurrency(partB.taxAfterRebate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>12. Surcharge</Text>
            <Text style={styles.col2}>{formatCurrency(partB.surcharge)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col1}>13. Health & Education Cess (4%)</Text>
            <Text style={styles.col2}>{formatCurrency(partB.healthEducationCess)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.col1, styles.boldText]}>14. Total Tax Payable</Text>
            <Text style={[styles.col2, styles.boldText]}>{formatCurrency(partB.totalTaxPayable)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.col1, styles.boldText]}>15. Total TDS Deducted</Text>
            <Text style={[styles.col2, styles.boldText]}>{formatCurrency(partB.totalTDSDeducted)}</Text>
          </View>
        </View>

        {/* Quarterly TDS Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quarter-wise TDS Summary</Text>

          {quarterlyTDS.map((q) => (
            <View key={q.quarter} style={styles.quarterRow}>
              <Text style={styles.col1}>Q{q.quarter} - Amount: {formatCurrency(q.amountPaid)}</Text>
              <Text style={styles.col2}>TDS: {formatCurrency(q.tdsDeducted)}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Verified and certified that the amount of tax deducted is correct.</Text>
          <Text>This is a computer-generated Form 16 and does not require signature.</Text>
          <Text>Generated on: {new Date().toLocaleDateString('en-IN')}</Text>
        </View>
      </Page>
    </Document>
  );
}

function formatCurrency(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paiseToRupees(paise));
}

/**
 * Generate Form 16 data for an employee
 */
export async function generateForm16Data(
  employeeId: string,
  financialYear: number,
  deductorDetails: {
    tan: string;
    pan: string;
    name: string;
    address: string;
  }
): Promise<Form16Data> {
  const startYear = financialYear;
  const endYear = financialYear + 1;

  // Get employee details
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      designation: true,
      department: true,
    },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Get all payroll records for the FY
  const records = await prisma.payrollRecord.findMany({
    where: {
      employee_id: employeeId,
      OR: [
        { year: startYear, month: { gte: 4 } },
        { year: endYear, month: { lte: 3 } },
      ],
      status: { in: ['CALCULATED', 'VERIFIED', 'PAID'] },
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  });

  if (records.length === 0) {
    throw new Error('No payroll records found for this financial year');
  }

  // Aggregate annual totals
  let grossSalary = 0;
  let hra = 0;
  let tdsDeducted = 0;
  let professionalTax = 0;
  let taxRegime: 'OLD' | 'NEW' = 'NEW';

  for (const r of records) {
    grossSalary += r.gross_salary_paise;
    hra += r.hra_paise;
    tdsDeducted += r.tds_paise;
    professionalTax += r.pt_paise;
    taxRegime = (r.tax_regime as 'OLD' | 'NEW') || 'NEW';
  }

  // Calculate components
  const standardDeduction = taxRegime === 'NEW' ? 7500000 : 5000000;
  const allowancesExempt = 0; // Would calculate HRA exemption if rent data available
  const netSalary = grossSalary - allowancesExempt;
  const incomeChargeableSalary = netSalary - standardDeduction - professionalTax;
  const grossTotalIncome = Math.max(0, incomeChargeableSalary);
  const deductionsChapterVIA = 0; // Would need investment declarations
  const totalIncome = grossTotalIncome - deductionsChapterVIA;

  // Tax calculation
  const taxPayableOnTotalIncome = calculateAnnualTax(totalIncome, taxRegime);
  const rebate87A =
    totalIncome <= 70000000 && taxRegime === 'NEW'
      ? Math.min(taxPayableOnTotalIncome, 2500000)
      : 0;
  const taxAfterRebate = taxPayableOnTotalIncome - rebate87A;
  const surcharge = 0; // For incomes > 50L
  const healthEducationCess = Math.round(taxAfterRebate * 0.04);
  const totalTaxPayable = taxAfterRebate + healthEducationCess;

  // Quarter-wise TDS
  const quarterlyTDS = calculateQuarterlyTDS(records, startYear);

  // Decrypt PAN
  const employeePAN = employee.pan_encrypted
    ? decrypt(employee.pan_encrypted)
    : 'N/A';

  return {
    partA: {
      tan: deductorDetails.tan,
      panDeductor: deductorDetails.pan,
      deductorName: deductorDetails.name,
      deductorAddress: deductorDetails.address,
      financialYear: `${startYear}-${endYear.toString().slice(-2)}`,
      assessmentYear: `${endYear}-${(endYear + 1).toString().slice(-2)}`,
      employeePAN,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      employeeAddress: `${employee.address_line1}, ${employee.city}, ${employee.state} - ${employee.postal_code}`,
      periodFrom: `01/04/${startYear}`,
      periodTo: `31/03/${endYear}`,
    },
    partB: {
      grossSalary,
      allowancesExempt,
      netSalary,
      standardDeduction,
      entertainmentAllowance: 0,
      professionalTax,
      incomeChargeableSalary,
      incomeOtherSources: 0,
      grossTotalIncome,
      deductionsChapterVIA,
      totalIncome,
      taxPayableOnTotalIncome,
      rebate87A,
      taxAfterRebate,
      surcharge,
      healthEducationCess,
      totalTaxPayable,
      reliefSection89: 0,
      netTaxPayable: totalTaxPayable,
      totalTDSDeducted: tdsDeducted,
      taxRegime,
    },
    quarterlyTDS,
  };
}

function calculateAnnualTax(
  taxableIncomePaise: number,
  regime: 'OLD' | 'NEW'
): number {
  const income = paiseToRupees(taxableIncomePaise);

  if (regime === 'NEW') {
    if (income <= 300000) return 0;
    if (income <= 700000) return Math.round((income - 300000) * 0.05) * 100;
    if (income <= 1000000)
      return Math.round(20000 + (income - 700000) * 0.1) * 100;
    if (income <= 1200000)
      return Math.round(50000 + (income - 1000000) * 0.15) * 100;
    if (income <= 1500000)
      return Math.round(80000 + (income - 1200000) * 0.2) * 100;
    return Math.round(140000 + (income - 1500000) * 0.3) * 100;
  }

  // Old regime
  if (income <= 250000) return 0;
  if (income <= 500000) return Math.round((income - 250000) * 0.05) * 100;
  if (income <= 1000000)
    return Math.round(12500 + (income - 500000) * 0.2) * 100;
  return Math.round(112500 + (income - 1000000) * 0.3) * 100;
}

function calculateQuarterlyTDS(
  records: any[],
  startYear: number
): Form16Data['quarterlyTDS'] {
  const quarters = [
    { quarter: 1, months: [4, 5, 6], year: startYear },
    { quarter: 2, months: [7, 8, 9], year: startYear },
    { quarter: 3, months: [10, 11, 12], year: startYear },
    { quarter: 4, months: [1, 2, 3], year: startYear + 1 },
  ];

  return quarters.map((q) => {
    const qRecords = records.filter(
      (r) => q.months.includes(r.month) && r.year === q.year
    );

    return {
      quarter: q.quarter,
      amountPaid: qRecords.reduce((sum, r) => sum + r.gross_salary_paise, 0),
      tdsDeducted: qRecords.reduce((sum, r) => sum + r.tds_paise, 0),
    };
  });
}
