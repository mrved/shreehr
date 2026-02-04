import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markDeadlineFiled } from "@/lib/statutory/deadlines";

// GET /api/statutory/deadlines/[id] - Get single deadline
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "ADMIN", "PAYROLL_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const deadline = await prisma.statutoryDeadline.findUnique({
    where: { id },
  });

  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }

  return NextResponse.json({ data: deadline });
}

// PATCH /api/statutory/deadlines/[id] - Mark deadline as filed
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "ADMIN", "PAYROLL_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { filingReference, amountFiledPaise } = body;

    await markDeadlineFiled(id, session.user.id, {
      filingReference,
      amountFiledPaise,
    });

    const updated = await prisma.statutoryDeadline.findUnique({
      where: { id },
    });

    return NextResponse.json({
      data: updated,
      message: "Deadline marked as filed",
    });
  } catch (error: any) {
    console.error("Deadline update error:", error);
    return NextResponse.json({ error: "Failed to update deadline" }, { status: 500 });
  }
}
