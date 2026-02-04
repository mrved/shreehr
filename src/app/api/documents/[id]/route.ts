import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { invalidateDocuments, invalidateDashboard } from "@/lib/cache";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  if (!document || document.is_deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Access control
  if (session.user.role === "EMPLOYEE" && session.user.employeeId !== document.employee_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(document);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Soft delete - mark as deleted but keep file until retention expires
  await prisma.document.update({
    where: { id },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      updated_by: session.user.id,
    },
  });

  // Invalidate document and dashboard caches
  invalidateDocuments();
  invalidateDashboard();

  return NextResponse.json({ success: true });
}
