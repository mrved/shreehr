import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFile } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document || document.is_deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Access control
  if (
    session.user.role === "EMPLOYEE" &&
    session.user.employeeId !== document.employee_id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileBuffer = await getFile(document.storage_path);
  if (!fileBuffer) {
    return NextResponse.json(
      { error: "File not found on storage" },
      { status: 404 },
    );
  }

  return new NextResponse(fileBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": document.mime_type,
      "Content-Disposition": `attachment; filename="${document.original_name}"`,
      "Content-Length": document.file_size.toString(),
    },
  });
}
