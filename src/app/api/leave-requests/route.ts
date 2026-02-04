import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateLeaveDays, leaveRequestCreateSchema } from "@/lib/validations/leave";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    // Role-based access control
    if (session.user.role === "EMPLOYEE") {
      where.employee_id = session.user.employeeId;
    } else if (session.user.role === "PAYROLL_MANAGER") {
      // Managers see their direct reports' requests (for approval)
      if (session.user.employeeId) {
        const managedEmployees = await prisma.employee.findMany({
          where: { reporting_manager_id: session.user.employeeId },
          select: { id: true },
        });
        const managedIds = managedEmployees.map((e) => e.id);
        managedIds.push(session.user.employeeId);
        where.employee_id = { in: managedIds };
      }
    } else if (employeeId) {
      where.employee_id = employeeId;
    }

    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          employee: {
            select: { id: true, first_name: true, last_name: true, employee_code: true },
          },
          leave_type: {
            select: { id: true, name: true, code: true, is_paid: true },
          },
          approver: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Leave requests list error:", error);
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.employeeId) {
    return NextResponse.json({ error: "Unauthorized or no employee profile" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = leaveRequestCreateSchema.parse(body);

    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    // Calculate leave days (excluding weekends)
    const daysCount = calculateLeaveDays(startDate, endDate, validated.isHalfDay);

    // Get leave type
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: validated.leaveTypeId },
    });

    if (!leaveType || !leaveType.is_active) {
      return NextResponse.json({ error: "Invalid or inactive leave type" }, { status: 400 });
    }

    // Check minimum days notice
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < leaveType.min_days_notice) {
      return NextResponse.json(
        {
          error: `This leave type requires ${leaveType.min_days_notice} days advance notice`,
        },
        { status: 400 },
      );
    }

    // Check for overlapping leave requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employee_id: session.user.employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [{ start_date: { lte: endDate }, end_date: { gte: startDate } }],
      },
    });

    if (overlapping) {
      return NextResponse.json({ error: "Overlapping leave request exists" }, { status: 400 });
    }

    // Check leave balance
    const currentYear = startDate.getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        employee_id: session.user.employeeId,
        leave_type: leaveType.code,
        year: currentYear,
      },
    });

    // Calculate pending leave days for this type
    const pendingLeave = await prisma.leaveRequest.aggregate({
      where: {
        employee_id: session.user.employeeId,
        leave_type_id: validated.leaveTypeId,
        status: { in: ["PENDING", "APPROVED"] },
        start_date: { gte: new Date(currentYear, 0, 1) },
        end_date: { lte: new Date(currentYear, 11, 31) },
      },
      _sum: { days_count: true },
    });

    const usedDays = pendingLeave._sum.days_count || 0;
    const availableBalance = (leaveBalance?.balance || leaveType.annual_quota) - usedDays;

    if (daysCount > availableBalance) {
      return NextResponse.json(
        {
          error: `Insufficient leave balance. Available: ${availableBalance}, Requested: ${daysCount}`,
        },
        { status: 400 },
      );
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employee_id: session.user.employeeId,
        leave_type_id: validated.leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        days_count: daysCount,
        is_half_day: validated.isHalfDay,
        half_day_period: validated.halfDayPeriod,
        reason: validated.reason,
        status: leaveType.requires_approval ? "PENDING" : "APPROVED",
        approved_at: leaveType.requires_approval ? null : new Date(),
        created_by: session.user.id,
        updated_by: session.user.id,
      },
      include: {
        leave_type: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error("Leave request create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 });
  }
}
