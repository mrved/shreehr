import { randomBytes } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * POST /api/expenses/[id]/receipt
 * Upload receipt for an expense claim
 * RBAC: Claim owner only, only for DRAFT status
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const claim = await prisma.expenseClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // RBAC: Must be claim owner
    if (claim.employee_id !== session.user.employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only upload receipts for DRAFT claims
    if (claim.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only upload receipts for claims in DRAFT status" },
        { status: 400 },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and images are allowed." },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "";
    const uniqueId = randomBytes(16).toString("hex");
    const timestamp = Date.now();
    const fileName = `${timestamp}-${uniqueId}.${ext}`;

    // Create upload directory
    const expenseDir = join(UPLOAD_DIR, "expenses", id);
    await mkdir(expenseDir, { recursive: true });

    const storagePath = join(expenseDir, fileName);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(storagePath, buffer);

    // Update claim with receipt info
    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        receipt_path: storagePath,
        receipt_original_name: file.name,
        updated_by: session.user.id,
      },
      include: {
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        policy: true,
      },
    });

    return NextResponse.json({
      message: "Receipt uploaded successfully",
      claim: updated,
    });
  } catch (error) {
    console.error("Receipt upload error:", error);
    return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 });
  }
}

/**
 * GET /api/expenses/[id]/receipt
 * Download receipt for an expense claim
 * RBAC: Claim owner, approvers, or admin
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const claim = await prisma.expenseClaim.findUnique({
      where: { id },
      include: {
        approvals: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (!claim.receipt_path) {
      return NextResponse.json({ error: "No receipt uploaded for this claim" }, { status: 404 });
    }

    // RBAC: Owner, admin, or approver
    const { role, employeeId } = session.user;
    const isOwner = claim.employee_id === employeeId;
    const isAdmin = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(role);

    if (!isOwner && !isAdmin) {
      // Check if user is an approver
      const hasApproverRole = claim.approvals.some((a) => a.approver_role === role);
      if (!hasApproverRole) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Check if file exists
    try {
      await access(claim.receipt_path);
    } catch {
      return NextResponse.json({ error: "Receipt file not found" }, { status: 404 });
    }

    // Read and return file
    const fileBuffer = await readFile(claim.receipt_path);

    // Determine content type from file extension
    const ext = claim.receipt_path.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "pdf") contentType = "application/pdf";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "webp") contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${claim.receipt_original_name || "receipt"}"`,
      },
    });
  } catch (error) {
    console.error("Receipt download error:", error);
    return NextResponse.json({ error: "Failed to download receipt" }, { status: 500 });
  }
}
