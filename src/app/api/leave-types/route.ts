import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leaveTypeCreateSchema } from "@/lib/validations/leave";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where = activeOnly ? { is_active: true } : {};

    const leaveTypes = await prisma.leaveType.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(leaveTypes);
  } catch (error) {
    console.error("Leave types list error:", error);
    return NextResponse.json({ error: "Failed to fetch leave types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = leaveTypeCreateSchema.parse(body);

    const leaveType = await prisma.leaveType.create({
      data: {
        name: validated.name,
        code: validated.code,
        description: validated.description,
        annual_quota: validated.annualQuota,
        max_carry_forward: validated.maxCarryForward,
        is_paid: validated.isPaid,
        requires_approval: validated.requiresApproval,
        min_days_notice: validated.minDaysNotice,
        created_by: session.user.id,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json(leaveType, { status: 201 });
  } catch (error) {
    console.error("Leave type create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Leave type name or code already exists" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to create leave type" }, { status: 500 });
  }
}
