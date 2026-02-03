import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  saveFile,
  calculateRetentionDate,
  validateFile,
} from "@/lib/storage";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const employeeId = searchParams.get("employeeId");
  const type = searchParams.get("type");

  const where: any = { is_deleted: false };

  if (employeeId) {
    // Access control
    if (
      session.user.role === "EMPLOYEE" &&
      session.user.employeeId !== employeeId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    where.employee_id = employeeId;
  } else if (session.user.role === "EMPLOYEE") {
    where.employee_id = session.user.employeeId;
  }

  if (type) {
    where.type = type;
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: { uploaded_at: "desc" },
    include: {
      employee: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          employee_code: true,
        },
      },
    },
  });

  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const employeeId = formData.get("employeeId") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;

    if (!file || !employeeId || !type) {
      return NextResponse.json(
        { error: "Missing required fields: file, employeeId, type" },
        { status: 400 },
      );
    }

    // Validate file
    const validation = validateFile(file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Save file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { fileName, storagePath } = await saveFile(
      employeeId,
      fileBuffer,
      file.name,
    );

    // Create document record
    const uploadedAt = new Date();
    const document = await prisma.document.create({
      data: {
        employee_id: employeeId,
        type: type as any,
        file_name: fileName,
        original_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        description,
        uploaded_at: uploadedAt,
        retention_until: calculateRetentionDate(uploadedAt),
        created_by: session.user.id,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
