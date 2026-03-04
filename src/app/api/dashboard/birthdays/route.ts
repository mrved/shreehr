import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUpcomingBirthdays, getUpcomingAnniversaries } from "@/lib/dashboard/birthdays";

/**
 * GET /api/dashboard/birthdays
 *
 * Returns upcoming birthdays and work anniversaries within a 30-day window.
 * Available to all authenticated users (non-PII: only names and computed dates).
 */
export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch only the fields we need — never PII, salary, or encrypted fields
    const employees = await prisma.employee.findMany({
      where: { employment_status: "ACTIVE" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        date_of_birth: true,
        date_of_joining: true,
      },
    });

    const birthdays = getUpcomingBirthdays(employees, 30);
    const anniversaries = getUpcomingAnniversaries(employees, 30);

    return NextResponse.json({ birthdays, anniversaries });
  } catch (error: any) {
    console.error("GET /api/dashboard/birthdays error:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming celebrations" },
      { status: 500 },
    );
  }
}
