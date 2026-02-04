import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const correctionCreateSchema = z
  .object({
    attendanceId: z.string().cuid(),
    newCheckIn: z.string().datetime().optional(),
    newCheckOut: z.string().datetime().optional(),
    reason: z.string().min(10).max(500),
  })
  .refine((data) => data.newCheckIn || data.newCheckOut, {
    message: "At least one of newCheckIn or newCheckOut is required",
  });

// Get correction requests
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    // Role-based access
    if (session.user.role === "EMPLOYEE") {
      where.created_by = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    const [corrections, total] = await Promise.all([
      prisma.attendanceCorrection.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          attendance: {
            include: {
              employee: { select: { first_name: true, last_name: true, employee_code: true } },
            },
          },
          creator: { select: { name: true } },
          approver: { select: { name: true } },
        },
      }),
      prisma.attendanceCorrection.count({ where }),
    ]);

    return NextResponse.json({
      corrections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Corrections list error:", error);
    return NextResponse.json({ error: "Failed to fetch corrections" }, { status: 500 });
  }
}

// Submit correction request
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = correctionCreateSchema.parse(body);

    // Get attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: validated.attendanceId },
    });

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // Verify employee owns this attendance
    if (attendance.employee_id !== session.user.employeeId) {
      return NextResponse.json(
        { error: "Can only request corrections for your own attendance" },
        { status: 403 },
      );
    }

    // Check if period is locked
    const attendanceDate = new Date(attendance.date);
    const lock = await prisma.attendanceLock.findUnique({
      where: {
        month_year: {
          month: attendanceDate.getMonth() + 1,
          year: attendanceDate.getFullYear(),
        },
      },
    });

    if (!lock) {
      return NextResponse.json(
        {
          error: "Period is not locked - you can edit attendance directly",
        },
        { status: 400 },
      );
    }

    if (!lock.unlock_approved_at) {
      return NextResponse.json(
        {
          error: "Period is locked and no unlock has been approved. Request unlock first.",
        },
        { status: 400 },
      );
    }

    // Check for existing pending correction
    const existingCorrection = await prisma.attendanceCorrection.findFirst({
      where: {
        attendance_id: validated.attendanceId,
        status: "PENDING",
      },
    });

    if (existingCorrection) {
      return NextResponse.json(
        { error: "A pending correction already exists for this record" },
        { status: 400 },
      );
    }

    const correction = await prisma.attendanceCorrection.create({
      data: {
        attendance_id: validated.attendanceId,
        new_check_in: validated.newCheckIn ? new Date(validated.newCheckIn) : null,
        new_check_out: validated.newCheckOut ? new Date(validated.newCheckOut) : null,
        reason: validated.reason,
        created_by: session.user.id,
        updated_by: session.user.id,
      },
      include: {
        attendance: {
          include: {
            employee: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });

    return NextResponse.json(correction, { status: 201 });
  } catch (error) {
    console.error("Correction create error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to create correction request" }, { status: 500 });
  }
}
