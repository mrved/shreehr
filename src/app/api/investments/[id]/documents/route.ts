import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateRetentionDate, saveFile, validateFile } from "@/lib/storage";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const declarationId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get("section");

    // Verify declaration ownership
    const declaration = await prisma.investmentDeclaration.findUnique({
      where: { id: declarationId },
      select: { employee_id: true },
    });

    if (!declaration) {
      return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
    }

    // RBAC: Only owner or admin can view
    const isOwner = session.user.employeeId === declaration.employee_id;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(
      session.user.role || "",
    );

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch documents
    const where: any = {
      declaration_id: declarationId,
      is_deleted: false,
    };

    if (section) {
      where.section = section;
    }

    const documents = await prisma.investmentProofDocument.findMany({
      where,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        file_name: true,
        original_name: true,
        section: true,
        size_bytes: true,
        created_at: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Fetch documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user || !session.user.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const declarationId = params.id;

    // Verify declaration ownership
    const declaration = await prisma.investmentDeclaration.findUnique({
      where: { id: declarationId },
      select: { employee_id: true, status: true },
    });

    if (!declaration) {
      return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
    }

    if (declaration.employee_id !== session.user.employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow uploads for DRAFT or SUBMITTED declarations
    if (!["DRAFT", "SUBMITTED"].includes(declaration.status)) {
      return NextResponse.json(
        { error: "Cannot upload documents to verified or rejected declarations" },
        { status: 400 },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const section = formData.get("section") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!section || !["80C", "80D", "HRA", "OTHER"].includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to storage
    const { fileName, storagePath } = await saveFile(session.user.employeeId, buffer, file.name);

    // Create database record
    const document = await prisma.investmentProofDocument.create({
      data: {
        declaration_id: declarationId,
        file_name: fileName,
        original_name: file.name,
        storage_path: storagePath,
        section,
        mime_type: file.type,
        size_bytes: file.size,
        retention_until: calculateRetentionDate(),
        created_by: session.user.id,
      },
      select: {
        id: true,
        file_name: true,
        original_name: true,
        section: true,
        size_bytes: true,
        created_at: true,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Upload document error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    // Verify ownership
    const document = await prisma.investmentProofDocument.findUnique({
      where: { id: documentId },
      include: {
        declaration: {
          select: { employee_id: true, status: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // RBAC: Only owner or admin can delete
    const isOwner = session.user.employeeId === document.declaration.employee_id;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role || "");

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow deleting from DRAFT or SUBMITTED declarations
    if (!["DRAFT", "SUBMITTED"].includes(document.declaration.status)) {
      return NextResponse.json(
        { error: "Cannot delete documents from verified or rejected declarations" },
        { status: 400 },
      );
    }

    // Soft delete (file remains until retention expires)
    await prisma.investmentProofDocument.update({
      where: { id: documentId },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
