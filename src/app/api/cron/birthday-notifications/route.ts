import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addEmailJob } from "@/lib/email/queue";
import { getTodayCelebrations } from "@/lib/dashboard/birthdays";

// Bearer token auth for cron security — same pattern as statutory-alerts cron
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/birthday-notifications
 *
 * Daily cron endpoint (run at 9 AM) that:
 * 1. Checks which employees have a birthday or work anniversary today
 * 2. If any celebrations found, queues a digest email for every employee
 *
 * Vercel Cron example (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/birthday-notifications",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all active employees including their User (for email address)
    const employees = await prisma.employee.findMany({
      where: { employment_status: "ACTIVE" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        date_of_birth: true,
        date_of_joining: true,
        user: {
          select: { email: true },
        },
      },
    });

    // Determine today's celebrations using pure utility
    const todayCelebrations = getTodayCelebrations(employees);

    if (todayCelebrations.length === 0) {
      return NextResponse.json({
        message: "No celebrations today",
        sent: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Build list of employees with valid emails to receive the digest
    const recipients = employees
      .filter((e) => e.user?.email)
      .map((e) => ({ email: e.user!.email, name: e.first_name }));

    // Queue a digest email for each employee in the org
    for (const { email, name } of recipients) {
      await addEmailJob("birthday-notification", email, {
        recipientName: name,
        celebrations: todayCelebrations,
        dashboardUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      });
    }

    console.log(
      `Birthday notifications: ${todayCelebrations.length} celebrations, ${recipients.length} emails queued`,
    );

    return NextResponse.json({
      message: "Birthday notifications sent",
      celebrations: todayCelebrations.length,
      emailsQueued: recipients.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Birthday notifications cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
