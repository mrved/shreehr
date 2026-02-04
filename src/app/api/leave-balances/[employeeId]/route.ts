import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await params;

  // Check access
  if (session.user.role === "EMPLOYEE" && session.user.employeeId !== employeeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    // Get employee info
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, first_name: true, last_name: true, employee_code: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get all leave types
    const leaveTypes = await prisma.leaveType.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });

    // Get existing balances
    const existingBalances = await prisma.leaveBalance.findMany({
      where: { employee_id: employeeId, year },
    });

    // Get pending and approved leave counts
    const leaveStats = await prisma.leaveRequest.groupBy({
      by: ["leave_type_id", "status"],
      where: {
        employee_id: employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        start_date: { gte: new Date(year, 0, 1) },
        end_date: { lte: new Date(year, 11, 31) },
      },
      _sum: { days_count: true },
    });

    // Get leave history for this year
    const leaveHistory = await prisma.leaveRequest.findMany({
      where: {
        employee_id: employeeId,
        start_date: { gte: new Date(year, 0, 1) },
        end_date: { lte: new Date(year, 11, 31) },
      },
      include: {
        leave_type: { select: { name: true, code: true } },
      },
      orderBy: { start_date: "desc" },
      take: 10,
    });

    // Build detailed balance view
    const balances = leaveTypes.map((lt) => {
      const existing = existingBalances.find((b) => b.leave_type === lt.code);

      const pendingStat = leaveStats.find(
        (s) => s.leave_type_id === lt.id && s.status === "PENDING",
      );
      const approvedStat = leaveStats.find(
        (s) => s.leave_type_id === lt.id && s.status === "APPROVED",
      );

      const pending = pendingStat?._sum.days_count || 0;
      const approvedThisYear = approvedStat?._sum.days_count || 0;

      return {
        leaveTypeId: lt.id,
        leaveTypeName: lt.name,
        leaveTypeCode: lt.code,
        isPaid: lt.is_paid,
        requiresApproval: lt.requires_approval,
        minDaysNotice: lt.min_days_notice,
        year,
        opening: existing?.opening ?? lt.annual_quota,
        accrued: existing?.accrued ?? 0,
        usedTotal: existing?.used ?? 0,
        usedThisYear: approvedThisYear,
        pending,
        balance: existing?.balance ?? lt.annual_quota,
        available: (existing?.balance ?? lt.annual_quota) - pending,
      };
    });

    return NextResponse.json({
      employee,
      year,
      balances,
      recentRequests: leaveHistory,
    });
  } catch (error) {
    console.error("Leave balance detail error:", error);
    return NextResponse.json({ error: "Failed to fetch leave balance" }, { status: 500 });
  }
}

// Admin can manually adjust leave balance
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await params;

  try {
    const body = await request.json();
    const { leaveTypeCode, year, adjustment, reason } = body;

    if (!leaveTypeCode || !year || adjustment === undefined) {
      return NextResponse.json(
        { error: "leaveTypeCode, year, and adjustment are required" },
        { status: 400 },
      );
    }

    const existing = await prisma.leaveBalance.findFirst({
      where: {
        employee_id: employeeId,
        leave_type: leaveTypeCode,
        year,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave balance record not found" }, { status: 404 });
    }

    const newBalance = existing.balance + adjustment;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: "Adjustment would result in negative balance" },
        { status: 400 },
      );
    }

    const updated = await prisma.leaveBalance.update({
      where: { id: existing.id },
      data: {
        accrued: adjustment > 0 ? existing.accrued + adjustment : existing.accrued,
        used: adjustment < 0 ? existing.used - adjustment : existing.used,
        balance: newBalance,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Leave balance adjusted",
      previousBalance: existing.balance,
      adjustment,
      newBalance,
      reason,
    });
  } catch (error) {
    console.error("Leave balance adjust error:", error);
    return NextResponse.json({ error: "Failed to adjust leave balance" }, { status: 500 });
  }
}
