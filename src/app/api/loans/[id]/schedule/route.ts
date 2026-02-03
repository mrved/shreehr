import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paiseToRupees } from "@/lib/payroll/types";
import { generateAmortizationSchedule } from "@/lib/workflows/loan";

/**
 * GET /api/loans/[id]/schedule
 * Get full amortization schedule for loan
 * Returns array with month number, date, EMI, principal, interest, balance
 * For ACTIVE loans, marks past months as DEDUCTED/SKIPPED from LoanDeduction records
 * RBAC: Loan owner or admin
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch loan with deductions
    const loan = await prisma.employeeLoan.findUnique({
      where: { id },
      include: {
        deductions: {
          select: {
            month: true,
            year: true,
            status: true,
            emi_amount_paise: true,
            principal_paise: true,
            interest_paise: true,
            balance_after_paise: true,
          },
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // RBAC: Check permissions
    const isAdmin = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "SUPER_ADMIN"].includes(
      session.user.role,
    );
    const isOwner = session.user.employeeId === loan.employee_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate amortization schedule
    const scheduleEntries = generateAmortizationSchedule({
      principalPaise: loan.principal_paise,
      annualInterestRate: loan.annual_interest_rate,
      tenureMonths: loan.tenure_months,
    });

    // Map schedule entries to response format with dates
    const currentDate = new Date(loan.start_date);
    const schedule = scheduleEntries.map((entry, _index) => {
      const scheduleDate = new Date(currentDate);
      const month = scheduleDate.getMonth() + 1; // 1-12
      const year = scheduleDate.getFullYear();

      // Find corresponding deduction record if exists
      const deduction = loan.deductions.find((d) => d.month === month && d.year === year);

      // Move to next month for next iteration
      currentDate.setMonth(currentDate.getMonth() + 1);

      return {
        month: entry.month,
        date: scheduleDate.toISOString().split("T")[0],
        period: `${scheduleDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })}`,
        emi: paiseToRupees(entry.emiPaise),
        principal: paiseToRupees(entry.principalPaise),
        interest: paiseToRupees(entry.interestPaise),
        balance_after: paiseToRupees(entry.balanceAfterPaise),
        status: deduction ? deduction.status : "SCHEDULED",
      };
    });

    // Calculate summary
    const totalPrincipal = paiseToRupees(loan.principal_paise);
    const totalInterest = paiseToRupees(loan.total_interest_paise);
    const totalRepayment = paiseToRupees(loan.total_repayment_paise);

    const paidCount = loan.deductions.filter((d) => d.status === "DEDUCTED").length;
    const skippedCount = loan.deductions.filter((d) => d.status === "SKIPPED").length;
    const scheduledCount = loan.deductions.filter((d) => d.status === "SCHEDULED").length;

    return NextResponse.json(
      {
        loan_id: loan.id,
        loan_type: loan.loan_type,
        status: loan.status,
        schedule,
        summary: {
          total_principal: totalPrincipal,
          total_interest: totalInterest,
          total_repayment: totalRepayment,
          remaining_balance: paiseToRupees(loan.remaining_balance_paise),
          deductions: {
            paid: paidCount,
            skipped: skippedCount,
            scheduled: scheduledCount,
            total: loan.deductions.length,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching loan schedule:", error);
    return NextResponse.json({ error: "Failed to fetch loan schedule" }, { status: 500 });
  }
}
