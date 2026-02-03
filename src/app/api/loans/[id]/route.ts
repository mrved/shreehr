import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paiseToRupees } from "@/lib/payroll/types";
import { UpdateLoanStatusSchema } from "@/lib/validations/loan";

/**
 * GET /api/loans/[id]
 * Get loan by ID with employee details and deductions summary
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const loan = await prisma.employeeLoan.findUnique({
      where: { id },
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
        deductions: {
          select: {
            status: true,
          },
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

    // Calculate deductions summary
    const paidCount = loan.deductions.filter((d) => d.status === "DEDUCTED").length;
    const scheduledCount = loan.deductions.filter((d) => d.status === "SCHEDULED").length;

    return NextResponse.json(
      {
        loan: {
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
          deductions_summary: {
            paid: paidCount,
            scheduled: scheduledCount,
            total: loan.deductions.length,
          },
          created_at: loan.created_at.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching loan:", error);
    return NextResponse.json({ error: "Failed to fetch loan" }, { status: 500 });
  }
}

/**
 * PATCH /api/loans/[id]
 * Handle status actions: disburse, close, cancel
 * RBAC: ADMIN, HR_MANAGER, PAYROLL_MANAGER only
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only admins can update loan status
    const isAdmin = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "SUPER_ADMIN"].includes(
      session.user.role,
    );
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = UpdateLoanStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Fetch existing loan
    const existingLoan = await prisma.employeeLoan.findUnique({
      where: { id },
    });

    if (!existingLoan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    let updatedLoan: Awaited<ReturnType<typeof prisma.employeeLoan.update>>;

    // Handle different actions
    switch (data.action) {
      case "disburse":
        // PENDING -> ACTIVE
        if (existingLoan.status !== "PENDING") {
          return NextResponse.json(
            { error: "Only PENDING loans can be disbursed" },
            { status: 400 },
          );
        }

        updatedLoan = await prisma.employeeLoan.update({
          where: { id },
          data: {
            status: "ACTIVE",
            disbursement_date: new Date(),
            disbursed_paise: data.disbursed_paise || existingLoan.principal_paise,
            updated_by: session.user.id,
          },
        });
        break;

      case "close":
        // ACTIVE -> CLOSED
        if (existingLoan.status !== "ACTIVE") {
          return NextResponse.json({ error: "Only ACTIVE loans can be closed" }, { status: 400 });
        }

        // Check if balance is zero OR closure reason provided (early closure)
        if (existingLoan.remaining_balance_paise > 0 && !data.closure_reason) {
          return NextResponse.json(
            {
              error: "Cannot close loan with outstanding balance without closure reason",
            },
            { status: 400 },
          );
        }

        updatedLoan = await prisma.employeeLoan.update({
          where: { id },
          data: {
            status: "CLOSED",
            closed_at: new Date(),
            closure_reason: data.closure_reason,
            updated_by: session.user.id,
          },
        });
        break;

      case "cancel":
        // PENDING/ACTIVE -> CANCELLED
        if (!["PENDING", "ACTIVE"].includes(existingLoan.status)) {
          return NextResponse.json(
            { error: "Only PENDING or ACTIVE loans can be cancelled" },
            { status: 400 },
          );
        }

        // Delete SCHEDULED deductions in transaction
        updatedLoan = await prisma.$transaction(async (tx) => {
          // Delete SCHEDULED deductions
          await tx.loanDeduction.deleteMany({
            where: {
              loan_id: id,
              status: "SCHEDULED",
            },
          });

          // Update loan status
          return tx.employeeLoan.update({
            where: { id },
            data: {
              status: "CANCELLED",
              closure_reason: data.closure_reason,
              updated_by: session.user.id,
            },
          });
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(
      {
        loan: {
          id: updatedLoan.id,
          status: updatedLoan.status,
          disbursement_date: updatedLoan.disbursement_date
            ? updatedLoan.disbursement_date.toISOString().split("T")[0]
            : null,
          disbursed: paiseToRupees(updatedLoan.disbursed_paise),
          closed_at: updatedLoan.closed_at
            ? updatedLoan.closed_at.toISOString().split("T")[0]
            : null,
          closure_reason: updatedLoan.closure_reason,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating loan:", error);
    return NextResponse.json({ error: "Failed to update loan" }, { status: 500 });
  }
}

/**
 * DELETE /api/loans/[id]
 * Delete loan (only PENDING loans can be deleted)
 * RBAC: ADMIN, HR_MANAGER, PAYROLL_MANAGER only
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only admins can delete loans
    const isAdmin = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "SUPER_ADMIN"].includes(
      session.user.role,
    );
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Fetch existing loan
    const existingLoan = await prisma.employeeLoan.findUnique({
      where: { id },
    });

    if (!existingLoan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Only PENDING loans can be deleted
    if (existingLoan.status !== "PENDING") {
      return NextResponse.json({ error: "Only PENDING loans can be deleted" }, { status: 400 });
    }

    // Delete loan (cascade will delete deductions)
    await prisma.employeeLoan.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Loan deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting loan:", error);
    return NextResponse.json({ error: "Failed to delete loan" }, { status: 500 });
  }
}
