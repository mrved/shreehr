import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get lock status for a specific month/year
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const lock = await prisma.attendanceLock.findUnique({
      where: { month_year: { month, year } },
      include: {
        locker: { select: { name: true } },
      },
    });

    // Check if we're within 5 days of month end (auto-lock zone)
    const today = new Date();
    const endOfMonth = new Date(year, month, 0); // Last day of target month
    const daysUntilLock = Math.ceil(
      (endOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const shouldAutoLock =
      daysUntilLock <= 5 && month === today.getMonth() + 1 && year === today.getFullYear();

    return NextResponse.json({
      month,
      year,
      isLocked: !!lock,
      lock,
      daysUntilAutoLock: shouldAutoLock ? Math.max(0, daysUntilLock) : null,
      canUnlock: lock ? !!lock.unlock_approved_at : true,
    });
  } catch (error) {
    console.error("Lock status error:", error);
    return NextResponse.json({ error: "Failed to get lock status" }, { status: 500 });
  }
}

// Lock or unlock attendance for a month
export async function POST(request: NextRequest) {
  const session = await auth();
  if (
    !session?.user ||
    !["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { month, year, action } = body;

    if (!month || !year || !action) {
      return NextResponse.json({ error: "Month, year, and action are required" }, { status: 400 });
    }

    if (action === "lock") {
      // First sync attendance to ensure all leave days are marked
      // (Attendance sync should be called separately before locking)

      const lock = await prisma.attendanceLock.create({
        data: {
          month,
          year,
          locked_by: session.user.id,
        },
      });

      return NextResponse.json({
        message: `Attendance locked for ${month}/${year}`,
        lock,
      });
    }

    if (action === "relock") {
      // Re-lock an already locked period (clears unlock approval)
      const lock = await prisma.attendanceLock.update({
        where: { month_year: { month, year } },
        data: {
          locked_at: new Date(),
          locked_by: session.user.id,
          // Clear any unlock approval
          unlock_requested_by: null,
          unlock_requested_at: null,
          unlock_reason: null,
          unlock_approved_by: null,
          unlock_approved_at: null,
        },
      });

      return NextResponse.json({
        message: `Attendance re-locked for ${month}/${year}`,
        lock,
      });
    }

    if (action === "request-unlock") {
      const { reason } = body;
      if (!reason) {
        return NextResponse.json({ error: "Unlock reason is required" }, { status: 400 });
      }

      const lock = await prisma.attendanceLock.update({
        where: { month_year: { month, year } },
        data: {
          unlock_requested_by: session.user.id,
          unlock_requested_at: new Date(),
          unlock_reason: reason,
        },
      });

      return NextResponse.json({
        message: "Unlock request submitted",
        lock,
      });
    }

    if (action === "approve-unlock") {
      // Only SUPER_ADMIN or ADMIN can approve unlock
      if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "Only admin can approve unlock" }, { status: 403 });
      }

      const lock = await prisma.attendanceLock.update({
        where: { month_year: { month, year } },
        data: {
          unlock_approved_by: session.user.id,
          unlock_approved_at: new Date(),
        },
      });

      return NextResponse.json({
        message: "Unlock approved - corrections can now be made",
        lock,
      });
    }

    if (action === "remove-lock") {
      // Only SUPER_ADMIN can completely remove a lock
      if (session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Only super admin can remove locks" }, { status: 403 });
      }

      await prisma.attendanceLock.delete({
        where: { month_year: { month, year } },
      });

      return NextResponse.json({
        message: `Attendance lock removed for ${month}/${year}`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Lock action error:", error);
    return NextResponse.json({ error: "Failed to process lock action" }, { status: 500 });
  }
}
