import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateDeadlinesForMonth, getUpcomingDeadlines } from "@/lib/statutory/deadlines";

// GET /api/statutory/deadlines - List upcoming deadlines
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin/payroll roles can view deadlines
  if (!["SUPER_ADMIN", "ADMIN", "PAYROLL_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const lookAhead = parseInt(searchParams.get("days") || "30");
  const status = searchParams.get("status");

  try {
    const deadlines = await getUpcomingDeadlines(lookAhead);

    // Filter by status if provided
    const filtered = status
      ? deadlines.filter((d) => d.status === status.toUpperCase())
      : deadlines;

    // Group by severity for dashboard
    const summary = {
      critical: filtered.filter((d) => d.severity === "CRITICAL").length,
      warning: filtered.filter((d) => d.severity === "WARNING").length,
      info: filtered.filter((d) => d.severity === "INFO").length,
      overdue: filtered.filter((d) => d.daysRemaining < 0).length,
    };

    return NextResponse.json({
      data: filtered,
      summary,
    });
  } catch (error: any) {
    console.error("Deadline fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch deadlines" }, { status: 500 });
  }
}

// POST /api/statutory/deadlines - Generate deadlines for a month
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
    }

    const created = await generateDeadlinesForMonth(month, year);

    return NextResponse.json({
      message: `Generated ${created} deadlines for ${year}-${month}`,
      count: created,
    });
  } catch (error: any) {
    console.error("Deadline generation error:", error);
    return NextResponse.json({ error: "Failed to generate deadlines" }, { status: 500 });
  }
}
