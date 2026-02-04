import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateAttendanceStatus, regularizeSchema } from "@/lib/validations/attendance";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, employee_code: true },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // Check access: employee can only see own, managers can see reports
    if (session.user.role === "EMPLOYEE" && attendance.employee_id !== session.user.employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Attendance get error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// Regularize attendance (manual correction by admin/HR)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = regularizeSchema.parse(body);

    const attendance = await prisma.attendance.findUnique({ where: { id } });

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // Check if attendance is locked
    const attendanceDate = new Date(attendance.date);
    const lock = await prisma.attendanceLock.findUnique({
      where: {
        month_year: { month: attendanceDate.getMonth() + 1, year: attendanceDate.getFullYear() },
      },
    });

    if (lock && !lock.unlock_approved_at) {
      return NextResponse.json({ error: "Attendance is locked for this period" }, { status: 400 });
    }

    const checkIn = new Date(validated.checkIn);
    const checkOut = validated.checkOut ? new Date(validated.checkOut) : null;

    let workMinutes = 0;
    let status: "PRESENT" | "HALF_DAY" | "ABSENT" = "ABSENT";

    if (checkOut) {
      workMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
      status = calculateAttendanceStatus(workMinutes);
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        check_in: checkIn,
        check_out: checkOut,
        work_minutes: workMinutes,
        status,
        remarks: validated.remarks,
        is_regularized: true,
        regularized_by: session.user.id,
        regularized_at: new Date(),
        updated_by: session.user.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Attendance regularize error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to regularize attendance" }, { status: 500 });
  }
}
