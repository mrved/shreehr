import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { invalidateDesignations } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { designationSchema } from "@/lib/validations/organization";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const designation = await prisma.designation.findUnique({
      where: { id },
      include: {
        employees: {
          select: { id: true, first_name: true, last_name: true, employee_code: true },
        },
      },
    });

    if (!designation) {
      return NextResponse.json({ error: "Designation not found" }, { status: 404 });
    }

    return NextResponse.json(designation);
  } catch (error) {
    console.error("Designation fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch designation" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN" &&
      session.user.role !== "HR_MANAGER")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = designationSchema.partial().parse(body);

    const updateData: any = {
      updated_by: session.user.id,
    };

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.level !== undefined) updateData.level = validated.level;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.isActive !== undefined) updateData.is_active = validated.isActive;

    const designation = await prisma.designation.update({
      where: { id },
      data: updateData,
    });

    // Invalidate designation cache
    invalidateDesignations();

    return NextResponse.json(designation);
  } catch (error) {
    console.error("Designation update error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Designation not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to update designation" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN" &&
      session.user.role !== "HR_MANAGER")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if designation has employees
    const employeeCount = await prisma.employee.count({
      where: { designation_id: id },
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete designation with ${employeeCount} employees. Please reassign employees first.`,
        },
        { status: 400 },
      );
    }

    await prisma.designation.delete({ where: { id } });

    // Invalidate designation cache
    invalidateDesignations();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Designation delete error:", error);

    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Designation not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete designation" }, { status: 500 });
  }
}
