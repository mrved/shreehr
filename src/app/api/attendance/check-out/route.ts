import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateAttendanceStatus, checkOutSchema } from "@/lib/validations/attendance";
import { logError } from "@/lib/error-logger";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.employeeId) {
    return NextResponse.json({ error: "Unauthorized or no employee profile" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = checkOutSchema.parse(body);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if attendance is locked
    const lock = await prisma.attendanceLock.findUnique({
      where: { month_year: { month: today.getMonth() + 1, year: today.getFullYear() } },
    });

    if (lock && !lock.unlock_approved_at) {
      return NextResponse.json({ error: "Attendance is locked for this period" }, { status: 400 });
    }

    // Find today's attendance record
    const existing = await prisma.attendance.findUnique({
      where: { employee_id_date: { employee_id: session.user.employeeId, date: today } },
    });

    if (!existing) {
      return NextResponse.json({ error: "No check-in record found for today" }, { status: 400 });
    }

    if (!existing.check_in) {
      return NextResponse.json(
        { error: "Cannot check out without checking in first" },
        { status: 400 },
      );
    }

    if (existing.check_out) {
      return NextResponse.json({ error: "Already checked out for today" }, { status: 400 });
    }

    // Calculate work minutes
    const checkInTime = new Date(existing.check_in);
    const workMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60));
    const status = calculateAttendanceStatus(workMinutes);

    // Update attendance record
    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        check_out: now,
        work_minutes: workMinutes,
        status,
        remarks: validated.remarks
          ? `${existing.remarks || ""}\n${validated.remarks}`.trim()
          : existing.remarks,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Check-out error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    // Log attendance errors
    await logError({
      type: 'ATTENDANCE',
      severity: 'HIGH',
      message: error instanceof Error ? error.message : 'Failed to check out',
      stack: error instanceof Error ? error.stack : undefined,
      route: '/api/attendance/check-out',
      method: 'POST',
      userId: session?.user?.id,
      employeeId: session?.user?.employeeId,
    });

    return NextResponse.json({ error: "Failed to check out" }, { status: 500 });
  }
}
