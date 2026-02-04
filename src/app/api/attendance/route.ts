import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { attendanceQuerySchema } from "@/lib/validations/attendance";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const params = attendanceQuerySchema.parse({
      employeeId: searchParams.get("employeeId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      status: searchParams.get("status"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: any = {};

    // Role-based access control
    if (session.user.role === "EMPLOYEE") {
      // Employees can only see their own attendance
      where.employee_id = session.user.employeeId;
    } else if (session.user.role === "PAYROLL_MANAGER") {
      // Payroll managers can see team attendance (direct reports)
      if (session.user.employeeId) {
        const managedEmployees = await prisma.employee.findMany({
          where: { reporting_manager_id: session.user.employeeId },
          select: { id: true },
        });
        const managedIds = managedEmployees.map((e) => e.id);
        managedIds.push(session.user.employeeId); // Include self
        where.employee_id = { in: managedIds };
      }
    } else if (params.employeeId) {
      // Admin/HR can filter by specific employee
      where.employee_id = params.employeeId;
    }

    if (params.startDate) {
      where.date = { ...where.date, gte: new Date(params.startDate) };
    }

    if (params.endDate) {
      where.date = { ...where.date, lte: new Date(params.endDate) };
    }

    if (params.status) {
      where.status = params.status;
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { date: "desc" },
        include: {
          employee: {
            select: { id: true, first_name: true, last_name: true, employee_code: true },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      attendances,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error("Attendance list error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// Get today's attendance status for current employee
export async function HEAD(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.employeeId) {
    return new NextResponse(null, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findUnique({
    where: { employee_id_date: { employee_id: session.user.employeeId, date: today } },
  });

  // Return status in custom headers for quick check
  const headers = new Headers();
  headers.set("X-Checked-In", attendance?.check_in ? "true" : "false");
  headers.set("X-Checked-Out", attendance?.check_out ? "true" : "false");
  headers.set("X-Status", attendance?.status || "NOT_RECORDED");

  return new NextResponse(null, { status: 200, headers });
}
