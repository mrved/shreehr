import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkInSchema } from "@/lib/validations/attendance";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.employeeId) {
    return NextResponse.json({ error: "Unauthorized or no employee profile" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = checkInSchema.parse(body);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if attendance is locked for this month
    const lock = await prisma.attendanceLock.findUnique({
      where: { month_year: { month: today.getMonth() + 1, year: today.getFullYear() } },
    });

    if (lock && !lock.unlock_approved_at) {
      return NextResponse.json({ error: "Attendance is locked for this period" }, { status: 400 });
    }

    // Check for existing attendance record for today
    const existing = await prisma.attendance.findUnique({
      where: { employee_id_date: { employee_id: session.user.employeeId, date: today } },
    });

    if (existing?.check_in) {
      return NextResponse.json({ error: "Already checked in for today" }, { status: 400 });
    }

    // Create or update attendance record
    const attendance = await prisma.attendance.upsert({
      where: { employee_id_date: { employee_id: session.user.employeeId, date: today } },
      create: {
        employee_id: session.user.employeeId,
        date: today,
        check_in: now,
        status: "PRESENT",
        source: "WEB",
        remarks: validated.remarks,
        created_by: session.user.id,
        updated_by: session.user.id,
      },
      update: {
        check_in: now,
        status: "PRESENT",
        remarks: validated.remarks,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Check-in error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
