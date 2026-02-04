import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/payroll/runs - List payroll runs
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "12");

  const where: any = {};
  if (year) where.year = parseInt(year);
  if (status) where.status = status.toUpperCase();

  const runs = await prisma.payrollRun.findMany({
    where,
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: limit,
    include: {
      _count: {
        select: { records: true },
      },
    },
  });

  return NextResponse.json({ data: runs });
}
