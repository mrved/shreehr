import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leaveRequestActionSchema } from "@/lib/validations/leave";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, employee_code: true },
        },
        leave_type: true,
        approver: { select: { id: true, name: true } },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Check access
    if (session.user.role === "EMPLOYEE" && leaveRequest.employee_id !== session.user.employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Leave request get error:", error);
    return NextResponse.json({ error: "Failed to fetch leave request" }, { status: 500 });
  }
}

// Approve/Reject/Cancel leave request
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = leaveRequestActionSchema.parse(body);

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { select: { reporting_manager_id: true } } },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Permission checks based on action
    if (validated.action === "cancel") {
      // Only the employee who created can cancel, and only if pending
      if (leaveRequest.employee_id !== session.user.employeeId) {
        return NextResponse.json({ error: "Only the applicant can cancel" }, { status: 403 });
      }
      if (leaveRequest.status !== "PENDING") {
        return NextResponse.json({ error: "Can only cancel pending requests" }, { status: 400 });
      }

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelled_at: new Date(),
          cancellation_reason: validated.reason,
          updated_by: session.user.id,
        },
      });

      return NextResponse.json(updated);
    }

    // Approve/Reject requires manager or admin permission
    const isManager = leaveRequest.employee.reporting_manager_id === session.user.employeeId;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role);

    if (!isManager && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to approve/reject this request" },
        { status: 403 },
      );
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only approve/reject pending requests" },
        { status: 400 },
      );
    }

    if (validated.action === "approve") {
      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approved_by: session.user.id,
          approved_at: new Date(),
          updated_by: session.user.id,
        },
      });

      // Update leave balance (deduct used days)
      const year = new Date(leaveRequest.start_date).getFullYear();
      const leaveType = await prisma.leaveType.findUnique({
        where: { id: leaveRequest.leave_type_id },
      });

      if (leaveType) {
        await prisma.leaveBalance.upsert({
          where: {
            employee_id_leave_type_year: {
              employee_id: leaveRequest.employee_id,
              leave_type: leaveType.code,
              year,
            },
          },
          create: {
            employee_id: leaveRequest.employee_id,
            leave_type: leaveType.code,
            year,
            opening: leaveType.annual_quota,
            accrued: 0,
            used: leaveRequest.days_count,
            balance: leaveType.annual_quota - leaveRequest.days_count,
            created_by: session.user.id,
            updated_by: session.user.id,
          },
          update: {
            used: { increment: leaveRequest.days_count },
            balance: { decrement: leaveRequest.days_count },
            updated_by: session.user.id,
          },
        });
      }

      return NextResponse.json(updated);
    }

    if (validated.action === "reject") {
      if (!validated.reason) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      }

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          approved_by: session.user.id,
          approved_at: new Date(),
          rejection_reason: validated.reason,
          updated_by: session.user.id,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Leave request action error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to process leave request" }, { status: 500 });
  }
}
