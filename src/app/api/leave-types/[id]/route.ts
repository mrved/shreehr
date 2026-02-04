import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leaveTypeUpdateSchema } from "@/lib/validations/leave";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const leaveType = await prisma.leaveType.findUnique({ where: { id } });

    if (!leaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    return NextResponse.json(leaveType);
  } catch (error) {
    console.error("Leave type get error:", error);
    return NextResponse.json({ error: "Failed to fetch leave type" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = leaveTypeUpdateSchema.parse(body);

    const existing = await prisma.leaveType.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    const leaveType = await prisma.leaveType.update({
      where: { id },
      data: {
        name: validated.name,
        code: validated.code,
        description: validated.description,
        annual_quota: validated.annualQuota,
        max_carry_forward: validated.maxCarryForward,
        is_paid: validated.isPaid,
        requires_approval: validated.requiresApproval,
        min_days_notice: validated.minDaysNotice,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json(leaveType);
  } catch (error) {
    console.error("Leave type update error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to update leave type" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if leave type has requests
    const requestCount = await prisma.leaveRequest.count({ where: { leave_type_id: id } });

    if (requestCount > 0) {
      // Soft delete by deactivating
      await prisma.leaveType.update({
        where: { id },
        data: { is_active: false, updated_by: session.user.id },
      });
      return NextResponse.json({ message: "Leave type deactivated (has existing requests)" });
    }

    await prisma.leaveType.delete({ where: { id } });
    return NextResponse.json({ message: "Leave type deleted" });
  } catch (error) {
    console.error("Leave type delete error:", error);
    return NextResponse.json({ error: "Failed to delete leave type" }, { status: 500 });
  }
}
