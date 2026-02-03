import type { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paiseToRupees } from "@/lib/payroll/types";
import { CreateLoanSchema, LoanFilterSchema } from "@/lib/validations/loan";
import {
  calculateEMI,
  calculateEndDate,
  calculateTotalInterest,
  generateAmortizationSchedule,
} from "@/lib/workflows/loan";

/**
 * GET /api/loans
 * List loans with RBAC filtering
 * - Employees see own loans
 * - ADMIN/HR_MANAGER/PAYROLL_MANAGER see all
 * Supports ?employee_id and ?status filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filterInput = {
      employee_id: searchParams.get("employee_id") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const validation = LoanFilterSchema.safeParse(filterInput);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid filters", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const filters = validation.data;

    // RBAC: Check permissions
    const isAdmin = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "SUPER_ADMIN"].includes(
      session.user.role,
    );

    // Build where clause
    const where: Prisma.EmployeeLoanWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.employee_id) {
      where.employee_id = filters.employee_id;
    } else if (!isAdmin) {
      // Regular employees only see their own loans
      if (!session.user.employeeId) {
        return NextResponse.json({ error: "Employee record not found" }, { status: 403 });
      }
      where.employee_id = session.user.employeeId;
    }

    // Fetch loans with employee details
    const loans = await prisma.employeeLoan.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            middle_name: true,
            last_name: true,
          },
        },
        _count: {
          select: {
            deductions: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Format response with calculated fields
    const formatted = loans.map((loan) => ({
      id: loan.id,
      employee: {
        id: loan.employee.id,
        code: loan.employee.employee_code,
        name: `${loan.employee.first_name} ${loan.employee.middle_name || ""} ${loan.employee.last_name}`.trim(),
      },
      loan_type: loan.loan_type,
      principal: paiseToRupees(loan.principal_paise),
      annual_interest_rate: loan.annual_interest_rate,
      tenure_months: loan.tenure_months,
      emi: paiseToRupees(loan.emi_paise),
      total_interest: paiseToRupees(loan.total_interest_paise),
      total_repayment: paiseToRupees(loan.total_repayment_paise),
      disbursed: paiseToRupees(loan.disbursed_paise),
      remaining_balance: paiseToRupees(loan.remaining_balance_paise),
      start_date: loan.start_date.toISOString().split("T")[0],
      end_date: loan.end_date.toISOString().split("T")[0],
      status: loan.status,
      disbursement_date: loan.disbursement_date
        ? loan.disbursement_date.toISOString().split("T")[0]
        : null,
      closed_at: loan.closed_at ? loan.closed_at.toISOString().split("T")[0] : null,
      closure_reason: loan.closure_reason,
      total_deductions: loan._count.deductions,
      created_at: loan.created_at.toISOString(),
    }));

    return NextResponse.json({ loans: formatted }, { status: 200 });
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
  }
}

/**
 * POST /api/loans
 * Create new loan with EMI calculation
 * RBAC: ADMIN, HR_MANAGER, PAYROLL_MANAGER only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only admins can create loans
    const isAdmin = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "SUPER_ADMIN"].includes(
      session.user.role,
    );
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = CreateLoanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      select: { id: true, employment_status: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (employee.employment_status !== "ACTIVE") {
      return NextResponse.json({ error: "Employee is not active" }, { status: 400 });
    }

    // Calculate EMI and other fields
    const loanParams = {
      principalPaise: data.principal_paise,
      annualInterestRate: data.annual_interest_rate,
      tenureMonths: data.tenure_months,
    };

    const emi = calculateEMI(loanParams);
    const totalInterest = calculateTotalInterest(loanParams);
    const totalRepayment = data.principal_paise + totalInterest;
    const endDate = calculateEndDate(data.start_date, data.tenure_months);

    // Generate amortization schedule
    const schedule = generateAmortizationSchedule(loanParams);

    // Create loan in transaction (loan + deductions)
    const loan = await prisma.$transaction(async (tx) => {
      // Create loan
      const newLoan = await tx.employeeLoan.create({
        data: {
          employee_id: data.employee_id,
          loan_type: data.loan_type,
          principal_paise: data.principal_paise,
          annual_interest_rate: data.annual_interest_rate,
          tenure_months: data.tenure_months,
          emi_paise: emi,
          total_interest_paise: totalInterest,
          total_repayment_paise: totalRepayment,
          remaining_balance_paise: data.principal_paise,
          start_date: data.start_date,
          end_date: endDate,
          status: "PENDING",
          created_by: session.user.id,
          updated_by: session.user.id,
        },
      });

      // Pre-create LoanDeduction records (SCHEDULED) for each month
      const deductions = [];
      const currentDate = new Date(data.start_date);

      for (const scheduleEntry of schedule) {
        const month = currentDate.getMonth() + 1; // 1-12
        const year = currentDate.getFullYear();

        deductions.push({
          loan_id: newLoan.id,
          month,
          year,
          emi_amount_paise: scheduleEntry.emiPaise,
          principal_paise: scheduleEntry.principalPaise,
          interest_paise: scheduleEntry.interestPaise,
          balance_after_paise: scheduleEntry.balanceAfterPaise,
          status: "SCHEDULED" as const,
        });

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Batch create deductions
      await tx.loanDeduction.createMany({
        data: deductions,
      });

      return newLoan;
    });

    return NextResponse.json(
      {
        loan: {
          id: loan.id,
          employee_id: loan.employee_id,
          loan_type: loan.loan_type,
          principal: paiseToRupees(loan.principal_paise),
          annual_interest_rate: loan.annual_interest_rate,
          tenure_months: loan.tenure_months,
          emi: paiseToRupees(loan.emi_paise),
          total_interest: paiseToRupees(loan.total_interest_paise),
          total_repayment: paiseToRupees(loan.total_repayment_paise),
          remaining_balance: paiseToRupees(loan.remaining_balance_paise),
          start_date: loan.start_date.toISOString().split("T")[0],
          end_date: loan.end_date.toISOString().split("T")[0],
          status: loan.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 });
  }
}
