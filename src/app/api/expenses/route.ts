import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateExpenseClaimSchema } from "@/lib/validations/expense";
import { validateExpenseAgainstPolicy } from "@/lib/workflows/expense";

/**
 * GET /api/expenses
 * List expense claims with RBAC filtering
 * Query params: ?status=PENDING_APPROVAL&pending_approval=true
 * RBAC:
 * - Employees see own claims
 * - Managers see subordinates' pending claims
 * - ADMIN/HR_MANAGER see all claims
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const pendingApproval = searchParams.get("pending_approval") === "true";

    const { role, employeeId } = session.user;

    const where: any = {};

    // RBAC filtering
    if (role === "EMPLOYEE") {
      // Employees see only their own claims
      if (!employeeId) {
        return NextResponse.json({ error: "Employee ID not found" }, { status: 400 });
      }
      where.employee_id = employeeId;
    } else if (role === "PAYROLL_MANAGER") {
      // Payroll managers see subordinates' pending claims (they act as first-level approvers)
      if (!employeeId) {
        return NextResponse.json({ error: "Employee ID not found" }, { status: 400 });
      }

      // Get subordinates
      const subordinates = await prisma.employee.findMany({
        where: { reporting_manager_id: employeeId },
        select: { id: true },
      });

      const subordinateIds = subordinates.map((s) => s.id);

      if (pendingApproval) {
        where.employee_id = { in: subordinateIds };
        where.status = "PENDING_APPROVAL";
      } else {
        where.employee_id = employeeId; // Show own claims
      }
    }
    // ADMIN, HR_MANAGER, PAYROLL_MANAGER see all (no filter)

    // Status filter
    if (status) {
      where.status = status;
    }

    const claims = await prisma.expenseClaim.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        policy: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        approvals: {
          orderBy: { level: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Expense claims list error:", error);
    return NextResponse.json({ error: "Failed to fetch expense claims" }, { status: 500 });
  }
}

/**
 * POST /api/expenses
 * Create a draft expense claim
 * RBAC: Any authenticated employee
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId, id: userId } = session.user;

  if (!employeeId) {
    return NextResponse.json({ error: "Employee ID not found" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validated = CreateExpenseClaimSchema.parse(body);

    // Validate against policy (without receipt for now - will be validated on submit)
    const validation = await validateExpenseAgainstPolicy(
      validated.policy_id,
      validated.amount_paise,
      false, // No receipt required for draft
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get policy snapshot
    const policy = await prisma.expensePolicy.findUnique({
      where: { id: validated.policy_id },
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Create draft claim
    const claim = await prisma.expenseClaim.create({
      data: {
        employee_id: employeeId,
        policy_id: validated.policy_id,
        amount_paise: validated.amount_paise,
        description: validated.description,
        expense_date: validated.expense_date,
        status: "DRAFT",
        policy_snapshot: {
          name: policy.name,
          code: policy.code,
          max_amount_paise: policy.max_amount_paise,
          requires_receipt: policy.requires_receipt,
          requires_approval: policy.requires_approval,
          auto_approve_below_paise: policy.auto_approve_below_paise,
        },
        created_by: userId,
        updated_by: userId,
      },
      include: {
        policy: true,
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error("Expense claim create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to create expense claim" }, { status: 500 });
  }
}
