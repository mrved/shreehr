import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateExpensePolicySchema } from "@/lib/validations/expense";

/**
 * GET /api/expense-policies
 * List all active expense policies
 * RBAC: Any authenticated user
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const policies = await prisma.expensePolicy.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("Expense policies list error:", error);
    return NextResponse.json({ error: "Failed to fetch expense policies" }, { status: 500 });
  }
}

/**
 * POST /api/expense-policies
 * Create a new expense policy
 * RBAC: ADMIN only
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateExpensePolicySchema.parse(body);

    const policy = await prisma.expensePolicy.create({
      data: {
        name: validated.name,
        code: validated.code,
        description: validated.description,
        max_amount_paise: validated.max_amount_paise ?? null,
        requires_receipt: validated.requires_receipt,
        requires_approval: validated.requires_approval,
        auto_approve_below_paise: validated.auto_approve_below_paise ?? null,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error("Expense policy create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Policy name or code already exists" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create expense policy" }, { status: 500 });
  }
}
