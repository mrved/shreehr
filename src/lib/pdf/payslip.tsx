import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
} from '@react-pdf/renderer';
import {
  pdfStyles,
  InfoRow,
  TotalRow,
  SectionTitle,
} from './components';
import {
  formatCurrencyPDF,
  maskPAN,
  getMonthName,
  formatNetPayInWords,
} from './utils';

export interface PayslipData {
  // Company info
  company: {
    name: string;
    address: string;
    pfCode?: string;
    esiCode?: string;
  };

  // Employee info
  employee: {
    id: string;
    code: string;
    name: string;
    designation: string;
    department: string;
    pan?: string;
    uan?: string;
    esicNumber?: string;
    bankAccount?: string;
    bankName?: string;
  };

  // Period info
  period: {
    month: number;
    year: number;
    workingDays: number;
    paidDays: number;
    lopDays: number;
  };

  // Earnings (in paise)
  earnings: {
    basic: number;
    hra: number;
    specialAllowance: number;
    lta: number;
    medical: number;
    conveyance: number;
    otherAllowances: number;
  };

  // Deductions (in paise)
  deductions: {
    pf: number;
    esi: number;
    pt: number;
    tds: number;
    otherDeductions: number;
    lopDeduction: number;
  };

  // Totals (in paise)
  grossBeforeLOP: number;
  grossSalary: number;
  totalDeductions: number;
  netPay: number;

  // Employer contributions (for info)
  employerPF: number;
  employerESI: number;
}

export function PayslipDocument({ data }: { data: PayslipData }) {
  const { company, employee, period, earnings, deductions } = data;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.companyName}>{company.name}</Text>
          <Text style={pdfStyles.companyAddress}>{company.address}</Text>
          {company.pfCode && (
            <Text style={pdfStyles.companyAddress}>PF Code: {company.pfCode}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={pdfStyles.title}>Salary Slip</Text>
        <Text style={pdfStyles.periodText}>
          For the month of {getMonthName(period.month)} {period.year}
        </Text>

        {/* Employee Details */}
        <View style={pdfStyles.section}>
          <SectionTitle title="Employee Details" />
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <InfoRow label="Employee Code" value={employee.code} />
              <InfoRow label="Name" value={employee.name} />
              <InfoRow label="Department" value={employee.department} />
              <InfoRow label="Designation" value={employee.designation} />
            </View>
            <View style={pdfStyles.column}>
              <InfoRow label="PAN" value={maskPAN(employee.pan || null)} />
              <InfoRow label="UAN" value={employee.uan || 'N/A'} />
              <InfoRow label="Bank" value={employee.bankName || 'N/A'} />
              <InfoRow label="ESIC No" value={employee.esicNumber || 'N/A'} />
            </View>
          </View>
        </View>

        {/* Attendance Summary */}
        <View style={pdfStyles.section}>
          <SectionTitle title="Attendance Summary" />
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <InfoRow label="Working Days" value={period.workingDays.toString()} />
              <InfoRow label="Paid Days" value={period.paidDays.toString()} />
            </View>
            <View style={pdfStyles.column}>
              <InfoRow label="LOP Days" value={period.lopDays.toString()} />
            </View>
          </View>
        </View>

        {/* Earnings and Deductions */}
        <View style={pdfStyles.twoColumn}>
          {/* Earnings Column */}
          <View style={pdfStyles.column}>
            <SectionTitle title="Earnings" />
            <InfoRow label="Basic Salary" value={formatCurrencyPDF(earnings.basic)} />
            <InfoRow label="HRA" value={formatCurrencyPDF(earnings.hra)} />
            <InfoRow label="Special Allowance" value={formatCurrencyPDF(earnings.specialAllowance)} />
            {earnings.lta > 0 && (
              <InfoRow label="LTA" value={formatCurrencyPDF(earnings.lta)} />
            )}
            {earnings.medical > 0 && (
              <InfoRow label="Medical Allowance" value={formatCurrencyPDF(earnings.medical)} />
            )}
            {earnings.conveyance > 0 && (
              <InfoRow label="Conveyance" value={formatCurrencyPDF(earnings.conveyance)} />
            )}
            {earnings.otherAllowances > 0 && (
              <InfoRow label="Other Allowances" value={formatCurrencyPDF(earnings.otherAllowances)} />
            )}
            <TotalRow label="Gross Earnings" value={formatCurrencyPDF(data.grossBeforeLOP)} />
          </View>

          {/* Deductions Column */}
          <View style={pdfStyles.column}>
            <SectionTitle title="Deductions" />
            {deductions.pf > 0 && (
              <InfoRow label="Provident Fund" value={formatCurrencyPDF(deductions.pf)} />
            )}
            {deductions.esi > 0 && (
              <InfoRow label="ESI" value={formatCurrencyPDF(deductions.esi)} />
            )}
            {deductions.pt > 0 && (
              <InfoRow label="Professional Tax" value={formatCurrencyPDF(deductions.pt)} />
            )}
            {deductions.tds > 0 && (
              <InfoRow label="Income Tax (TDS)" value={formatCurrencyPDF(deductions.tds)} />
            )}
            {deductions.lopDeduction > 0 && (
              <InfoRow label="Loss of Pay" value={formatCurrencyPDF(deductions.lopDeduction)} />
            )}
            {deductions.otherDeductions > 0 && (
              <InfoRow label="Other Deductions" value={formatCurrencyPDF(deductions.otherDeductions)} />
            )}
            <TotalRow label="Total Deductions" value={formatCurrencyPDF(data.totalDeductions + deductions.lopDeduction)} />
          </View>
        </View>

        {/* Net Pay */}
        <View style={pdfStyles.netPaySection}>
          <View style={pdfStyles.netPayRow}>
            <Text style={pdfStyles.netPayLabel}>Net Pay</Text>
            <Text style={pdfStyles.netPayValue}>{formatCurrencyPDF(data.netPay)}</Text>
          </View>
          <Text style={pdfStyles.netPayWords}>{formatNetPayInWords(data.netPay)}</Text>
        </View>

        {/* Employer Contributions (Info Only) */}
        <View style={[pdfStyles.section, { marginTop: 15 }]}>
          <SectionTitle title="Employer Contributions (For Your Information)" />
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <InfoRow label="Employer PF Contribution" value={formatCurrencyPDF(data.employerPF)} />
            </View>
            <View style={pdfStyles.column}>
              <InfoRow label="Employer ESI Contribution" value={formatCurrencyPDF(data.employerESI)} />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text>This is a system-generated payslip and does not require a signature.</Text>
          <Text>Generated on: {new Date().toLocaleDateString('en-IN')}</Text>
          <Text>For queries, contact HR department.</Text>
        </View>
      </Page>
    </Document>
  );
}
