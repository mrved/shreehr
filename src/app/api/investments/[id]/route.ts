import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  investmentSubmitSchema,
  investmentUpdateSchema,
  investmentVerifySchema,
} from "@/lib/validations/investment";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const declaration = await prisma.investmentDeclaration.findUnique({
      where: { id: params.id },
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

    if (!declaration) {
      return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === "EMPLOYEE") {
      if (declaration.employee_id !== session.user.employeeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (
      !["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(session.user.role || "")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(declaration);
  } catch (error) {
    console.error("Investment declaration get error:", error);
    return NextResponse.json({ error: "Failed to fetch investment declaration" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check for action-based requests (submit, verify, reject)
    if (body.action) {
      if (body.action === "submit") {
        return handleSubmit(params.id, session);
      } else if (body.action === "verify" || body.action === "reject") {
        return handleVerify(params.id, session, body);
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    }

    // Regular update
    const validated = investmentUpdateSchema.parse(body);

    // Get existing declaration
    const existing = await prisma.investmentDeclaration.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === "EMPLOYEE") {
      if (existing.employee_id !== session.user.employeeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (
      !["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(session.user.role || "")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only DRAFT declarations can be edited
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        {
          error: `Cannot edit declaration with status ${existing.status}. Only DRAFT declarations can be edited.`,
        },
        { status: 400 },
      );
    }

    // Update declaration
    const updated = await prisma.investmentDeclaration.update({
      where: { id: params.id },
      data: {
        ...validated,
        updated_by: session.user.id,
      },
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Investment declaration update error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to update investment declaration" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get existing declaration
    const existing = await prisma.investmentDeclaration.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === "EMPLOYEE") {
      if (existing.employee_id !== session.user.employeeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (
      !["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(session.user.role || "")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only DRAFT declarations can be deleted
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        {
          error: `Cannot delete declaration with status ${existing.status}. Only DRAFT declarations can be deleted.`,
        },
        { status: 400 },
      );
    }

    await prisma.investmentDeclaration.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Declaration deleted successfully" });
  } catch (error) {
    console.error("Investment declaration delete error:", error);
    return NextResponse.json({ error: "Failed to delete investment declaration" }, { status: 500 });
  }
}

// Helper function to handle submit action
async function handleSubmit(declarationId: string, session: any) {
  const declaration = await prisma.investmentDeclaration.findUnique({
    where: { id: declarationId },
  });

  if (!declaration) {
    return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
  }

  // Only owner can submit
  if (declaration.employee_id !== session.user.employeeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only DRAFT can be submitted
  if (declaration.status !== "DRAFT") {
    return NextResponse.json(
      {
        error: `Cannot submit declaration with status ${declaration.status}`,
      },
      { status: 400 },
    );
  }

  const updated = await prisma.investmentDeclaration.update({
    where: { id: declarationId },
    data: {
      status: "SUBMITTED",
      submitted_at: new Date(),
      updated_by: session.user.id,
    },
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

  return NextResponse.json(updated);
}

// Helper function to handle verify/reject actions
async function handleVerify(declarationId: string, session: any, body: any) {
  // Only admins can verify/reject
  if (
    !["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(session.user.role || "")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const validated = investmentVerifySchema.parse(body);

  const declaration = await prisma.investmentDeclaration.findUnique({
    where: { id: declarationId },
  });

  if (!declaration) {
    return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
  }

  // Only SUBMITTED declarations can be verified/rejected
  if (declaration.status !== "SUBMITTED") {
    return NextResponse.json(
      {
        error: `Cannot ${validated.action} declaration with status ${declaration.status}`,
      },
      { status: 400 },
    );
  }

  const updated = await prisma.investmentDeclaration.update({
    where: { id: declarationId },
    data: {
      status: validated.action === "verify" ? "VERIFIED" : "REJECTED",
      verified_at: validated.action === "verify" ? new Date() : null,
      verified_by: session.user.id,
      updated_by: session.user.id,
    },
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

  return NextResponse.json(updated);
}
