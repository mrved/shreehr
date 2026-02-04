import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const employeeId = searchParams.get("employeeId");

    // For employees, only show their own balance
    const targetEmployeeId =
      session.user.role === "EMPLOYEE"
        ? session.user.employeeId
        : employeeId || session.user.employeeId;

    if (!targetEmployeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    // Get all leave types
    const leaveTypes = await prisma.leaveType.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });

    // Get existing balances
    const existingBalances = await prisma.leaveBalance.findMany({
      where: {
        employee_id: targetEmployeeId,
        year,
      },
    });

    // Get pending leave requests to show committed but not yet used
    const pendingLeaves = await prisma.leaveRequest.groupBy({
      by: ["leave_type_id"],
      where: {
        employee_id: targetEmployeeId,
        status: "PENDING",
        start_date: { gte: new Date(year, 0, 1) },
        end_date: { lte: new Date(year, 11, 31) },
      },
      _sum: { days_count: true },
    });

    const pendingByType = new Map(
      pendingLeaves.map((p) => [p.leave_type_id, p._sum.days_count || 0]),
    );

    // Build combined balance view
    const balances = leaveTypes.map((lt) => {
      const existing = existingBalances.find((b) => b.leave_type === lt.code);
      const pending = pendingByType.get(lt.id) || 0;

      return {
        leaveTypeId: lt.id,
        leaveTypeName: lt.name,
        leaveTypeCode: lt.code,
        isPaid: lt.is_paid,
        year,
        opening: existing?.opening ?? lt.annual_quota,
        accrued: existing?.accrued ?? 0,
        used: existing?.used ?? 0,
        pending,
        balance: existing?.balance ?? lt.annual_quota,
        available: (existing?.balance ?? lt.annual_quota) - pending,
      };
    });

    return NextResponse.json({
      employeeId: targetEmployeeId,
      year,
      balances,
    });
  } catch (error) {
    console.error("Leave balances error:", error);
    return NextResponse.json({ error: "Failed to fetch leave balances" }, { status: 500 });
  }
}

// Admin can initialize/reset leave balances for new year
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { year, employeeId, carryForward = false } = body;

    if (!year) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    // Get all active leave types
    const leaveTypes = await prisma.leaveType.findMany({
      where: { is_active: true },
    });

    // Get employees to initialize
    const employees = employeeId
      ? [{ id: employeeId }]
      : await prisma.employee.findMany({
          where: { employment_status: "ACTIVE" },
          select: { id: true },
        });

    let created = 0;

    for (const emp of employees) {
      for (const lt of leaveTypes) {
        let opening = lt.annual_quota;

        // Carry forward from previous year if requested
        if (carryForward) {
          const prevBalance = await prisma.leaveBalance.findFirst({
            where: {
              employee_id: emp.id,
              leave_type: lt.code,
              year: year - 1,
            },
          });

          if (prevBalance) {
            const carryOver = Math.min(prevBalance.balance, lt.max_carry_forward);
            opening = lt.annual_quota + carryOver;
          }
        }

        await prisma.leaveBalance.upsert({
          where: {
            employee_id_leave_type_year: {
              employee_id: emp.id,
              leave_type: lt.code,
              year,
            },
          },
          create: {
            employee_id: emp.id,
            leave_type: lt.code,
            year,
            opening,
            accrued: 0,
            used: 0,
            balance: opening,
            created_by: session.user.id,
            updated_by: session.user.id,
          },
          update: {
            // Only update opening if carry forward changed it
            opening: carryForward ? opening : undefined,
            balance: carryForward ? opening : undefined,
            updated_by: session.user.id,
          },
        });

        created++;
      }
    }

    return NextResponse.json({
      message: "Leave balances initialized",
      employeesProcessed: employees.length,
      balancesCreated: created,
    });
  } catch (error) {
    console.error("Leave balance init error:", error);
    return NextResponse.json({ error: "Failed to initialize leave balances" }, { status: 500 });
  }
}
