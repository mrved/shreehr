import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addPayrollJob } from "@/lib/queues/payroll.queue";
import { logError } from "@/lib/error-logger";

// POST /api/payroll/run - Initiate new payroll run
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "ADMIN", "PAYROLL_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
    }

    // Check if payroll already exists for this month
    const existing = await prisma.payrollRun.findUnique({
      where: { month_year: { month, year } },
    });

    if (existing && existing.status !== "REVERTED") {
      return NextResponse.json(
        {
          error: `Payroll for ${year}-${month} already exists`,
          status: existing.status,
          id: existing.id,
        },
        { status: 400 },
      );
    }

    // Check attendance lock
    const lock = await prisma.attendanceLock.findUnique({
      where: { month_year: { month, year } },
    });

    if (!lock) {
      return NextResponse.json(
        { error: `Attendance not locked for ${year}-${month}. Lock attendance first.` },
        { status: 400 },
      );
    }

    // Create PayrollRun record
    const payrollRun = await prisma.payrollRun.create({
      data: {
        month,
        year,
        status: "PENDING",
        current_stage: "VALIDATION",
        created_by: session.user.id,
      },
    });

    // Queue the payroll job
    const job = await addPayrollJob({
      payrollRunId: payrollRun.id,
      month,
      year,
      stage: "validation",
    });

    // Update with job ID
    await prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: { job_id: job.id },
    });

    return NextResponse.json(
      {
        data: payrollRun,
        message: "Payroll run initiated",
        jobId: job.id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Payroll run error:", error);
    
    // Log payroll errors - these are CRITICAL
    await logError({
      type: 'PAYROLL',
      severity: 'CRITICAL',
      message: error.message || 'Failed to initiate payroll run',
      stack: error.stack,
      route: '/api/payroll/run',
      method: 'POST',
      userId: session?.user?.id,
    });
    
    return NextResponse.json(
      { error: "Failed to initiate payroll run", details: error.message },
      { status: 500 },
    );
  }
}
