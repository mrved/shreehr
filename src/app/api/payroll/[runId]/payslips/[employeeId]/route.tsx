import { renderToStream } from "@react-pdf/renderer";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { type PayslipData, PayslipDocument } from "@/lib/pdf/payslip";

// Company info - could be moved to config/database
const COMPANY_INFO = {
  name: "ShreeHR Demo Company",
  address: "Bangalore, Karnataka 560001",
  pfCode: "KN/BLR/0000000",
  esiCode: "KA00000000",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string; employeeId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId, employeeId } = await params;

  // Check permissions
  // Employees can only download their own payslip
  // Admin/HR/Payroll can download any
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(
    session.user.role,
  );

  if (!isAdmin) {
    // Get user's employee ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { employee_id: true },
    });

    if (user?.employee_id !== employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Get payroll record with employee details
  const record = await prisma.payrollRecord.findFirst({
    where: {
      payroll_run_id: runId,
      employee_id: employeeId,
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

  if (!record) {
    return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
  }

  // Build payslip data
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

  try {
    // Generate PDF
    const stream = await renderToStream(<PayslipDocument data={payslipData} />);

    // Convert stream to response
    const filename = `payslip-${record.employee.employee_code}-${record.year}-${String(record.month).padStart(2, "0")}.pdf`;

    return new Response(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate payslip" }, { status: 500 });
  }
}
