import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UpdateExpensePolicySchema } from "@/lib/validations/expense";

/**
 * GET /api/expense-policies/[id]
 * Get a single expense policy by ID
 * RBAC: Any authenticated user
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const policy = await prisma.expensePolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Expense policy fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch expense policy" }, { status: 500 });
  }
}

/**
 * PATCH /api/expense-policies/[id]
 * Update an expense policy
 * RBAC: ADMIN only
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateExpensePolicySchema.parse(body);

    const policy = await prisma.expensePolicy.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.code && { code: validated.code }),
        ...(validated.description !== undefined && {
          description: validated.description,
        }),
        ...(validated.max_amount_paise !== undefined && {
          max_amount_paise: validated.max_amount_paise ?? null,
        }),
        ...(validated.requires_receipt !== undefined && {
          requires_receipt: validated.requires_receipt,
        }),
        ...(validated.requires_approval !== undefined && {
          requires_approval: validated.requires_approval,
        }),
        ...(validated.auto_approve_below_paise !== undefined && {
          auto_approve_below_paise: validated.auto_approve_below_paise ?? null,
        }),
      },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Expense policy update error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Policy name or code already exists" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update expense policy" }, { status: 500 });
  }
}

/**
 * DELETE /api/expense-policies/[id]
 * Soft delete (deactivate) an expense policy
 * RBAC: ADMIN only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const policy = await prisma.expensePolicy.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({ message: "Policy deactivated successfully", policy });
  } catch (error) {
    console.error("Expense policy delete error:", error);

    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete expense policy" }, { status: 500 });
  }
}
