import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { renderToStream } from '@react-pdf/renderer';
import { PayslipDocument, type PayslipData } from '@/lib/pdf/payslip';
import { decrypt } from '@/lib/encryption';
import JSZip from 'jszip';

const COMPANY_INFO = {
  name: 'ShreeHR Demo Company',
  address: 'Bangalore, Karnataka 560001',
  pfCode: 'KN/BLR/0000000',
  esiCode: 'KA00000000',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admin roles can bulk download
  if (!['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { runId } = await params;

  // Get all payroll records for this run
  const records = await prisma.payrollRecord.findMany({
    where: {
      payroll_run_id: runId,
      status: { in: ['CALCULATED', 'VERIFIED', 'PAID'] },
    },
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
        },
      },
      payroll_run: true,
    },
  });

  if (records.length === 0) {
    return NextResponse.json(
      { error: 'No payroll records found' },
      { status: 404 }
    );
  }

  try {
    const zip = new JSZip();
    const month = records[0].month;
    const year = records[0].year;

    // Generate PDF for each employee
    for (const record of records) {
      const payslipData: PayslipData = {
        company: COMPANY_INFO,
        employee: {
          id: record.employee.id,
          code: record.employee.employee_code,
          name: `${record.employee.first_name} ${record.employee.last_name}`,
          designation: record.employee.designation.title,
          department: record.employee.department.name,
          pan: record.employee.pan_encrypted ? decrypt(record.employee.pan_encrypted) : undefined,
          uan: record.employee.uan || undefined,
          esicNumber: record.employee.esic_number || undefined,
          bankName: record.employee.bank_name || undefined,
        },
        period: {
          month: record.month,
          year: record.year,
          workingDays: record.working_days,
          paidDays: record.paid_days,
          lopDays: record.lop_days,
        },
        earnings: {
          basic: record.basic_paise,
          hra: record.hra_paise,
          specialAllowance: record.special_allowance_paise,
          lta: record.lta_paise,
          medical: record.medical_paise,
          conveyance: record.conveyance_paise,
          otherAllowances: record.other_allowances_paise,
        },
        deductions: {
          pf: record.pf_employee_paise,
          esi: record.esi_employee_paise,
          pt: record.pt_paise,
          tds: record.tds_paise,
          otherDeductions: record.other_deductions_paise,
          lopDeduction: record.lop_deduction_paise,
        },
        grossBeforeLOP: record.gross_before_lop_paise,
        grossSalary: record.gross_salary_paise,
        totalDeductions: record.total_deductions_paise,
        netPay: record.net_salary_paise,
        employerPF: record.pf_total_employer_paise,
        employerESI: record.esi_employer_paise,
      };

      // Generate PDF as buffer
      const stream = await renderToStream(
        <PayslipDocument data={payslipData} />
      );

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = (stream as any).getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const pdfBuffer = Buffer.concat(chunks);
      const filename = `${record.employee.employee_code}_${record.employee.first_name}_${record.employee.last_name}.pdf`;

      zip.file(filename, pdfBuffer);
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFilename = `payslips-${year}-${String(month).padStart(2, '0')}.zip`;

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
      },
    });
  } catch (error: any) {
    console.error('Bulk PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate payslips' },
      { status: 500 }
    );
  }
}
