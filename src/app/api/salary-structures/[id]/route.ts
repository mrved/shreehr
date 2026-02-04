import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  calculateAnnualCTC,
  salaryStructureUpdateSchema,
  validate50PercentRule,
} from "@/lib/payroll/validators";

// GET /api/salary-structures/[id] - Get single salary structure
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const structure = await prisma.salaryStructure.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          employee_code: true,
          first_name: true,
          last_name: true,
          department: { select: { name: true } },
          designation: { select: { title: true } },
        },
      },
    },
  });

  if (!structure) {
    return NextResponse.json({ error: "Salary structure not found" }, { status: 404 });
  }

  return NextResponse.json({ data: structure });
}

// PATCH /api/salary-structures/[id] - Update salary structure
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.salaryStructure.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Salary structure not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = salaryStructureUpdateSchema.parse(body);

    // Merge with existing values for validation
    const merged = {
      basic_paise: validated.basic_paise ?? existing.basic_paise,
      hra_paise: validated.hra_paise ?? existing.hra_paise,
      special_allowance_paise:
        validated.special_allowance_paise ?? existing.special_allowance_paise,
      lta_paise: validated.lta_paise ?? existing.lta_paise,
      medical_paise: validated.medical_paise ?? existing.medical_paise,
      conveyance_paise: validated.conveyance_paise ?? existing.conveyance_paise,
      other_allowances_paise: validated.other_allowances_paise ?? existing.other_allowances_paise,
    };

    // Validate 50% rule with merged values
    const validationResult = validate50PercentRule(merged);

    if (!validationResult.isValid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const annualCTC = calculateAnnualCTC(validationResult.grossMonthlyPaise, merged.basic_paise);

    const updated = await prisma.salaryStructure.update({
      where: { id },
      data: {
        ...validated,
        gross_monthly_paise: validationResult.grossMonthlyPaise,
        annual_ctc_paise: annualCTC,
        basic_percentage: validationResult.basicPercentage,
        is_compliant: validationResult.isValid,
        updated_by: session.user.id,
      },
      include: {
        employee: {
          select: {
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Update salary structure error:", error);
    return NextResponse.json({ error: "Failed to update salary structure" }, { status: 500 });
  }
}

// DELETE /api/salary-structures/[id] - Delete salary structure
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only ADMIN can delete salary structures
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.salaryStructure.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Salary structure not found" }, { status: 404 });
  }

  // Check if salary structure has been used in payroll
  // (Will add this check when PayrollRecord model exists)

  await prisma.salaryStructure.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Salary structure deleted" });
}
