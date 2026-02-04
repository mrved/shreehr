import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  calculateAnnualCTC,
  salaryStructureSchema,
  validate50PercentRule,
} from "@/lib/payroll/validators";

// GET /api/salary-structures - List salary structures
// Query params: employee_id (optional), active_only (boolean)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only ADMIN, HR_MANAGER, PAYROLL_MANAGER can view salary structures
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employee_id");
  const activeOnly = searchParams.get("active_only") === "true";

  const where: any = {};

  if (employeeId) {
    where.employee_id = employeeId;
  }

  if (activeOnly) {
    const today = new Date();
    where.effective_from = { lte: today };
    where.OR = [{ effective_to: null }, { effective_to: { gte: today } }];
  }

  const structures = await prisma.salaryStructure.findMany({
    where,
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
    orderBy: [{ employee_id: "asc" }, { effective_from: "desc" }],
  });

  return NextResponse.json({ data: structures });
}

// POST /api/salary-structures - Create salary structure
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only ADMIN, HR_MANAGER, PAYROLL_MANAGER can create salary structures
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = salaryStructureSchema.parse(body);

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: validated.employee_id },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Calculate derived fields
    const validationResult = validate50PercentRule(validated);
    const annualCTC = calculateAnnualCTC(validationResult.grossMonthlyPaise, validated.basic_paise);

    // End previous active structure if exists
    await prisma.salaryStructure.updateMany({
      where: {
        employee_id: validated.employee_id,
        effective_to: null,
        effective_from: { lt: validated.effective_from },
      },
      data: {
        effective_to: new Date(validated.effective_from.getTime() - 86400000), // Day before
      },
    });

    // Create new structure
    const structure = await prisma.salaryStructure.create({
      data: {
        employee_id: validated.employee_id,
        effective_from: validated.effective_from,
        effective_to: validated.effective_to,

        basic_paise: validated.basic_paise,
        hra_paise: validated.hra_paise,
        special_allowance_paise: validated.special_allowance_paise,
        lta_paise: validated.lta_paise,
        medical_paise: validated.medical_paise,
        conveyance_paise: validated.conveyance_paise,
        other_allowances_paise: validated.other_allowances_paise,

        gross_monthly_paise: validationResult.grossMonthlyPaise,
        annual_ctc_paise: annualCTC,
        basic_percentage: validationResult.basicPercentage,
        is_compliant: validationResult.isValid,

        tax_regime: validated.tax_regime,

        created_by: session.user.id,
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

    return NextResponse.json({ data: structure }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Create salary structure error:", error);
    return NextResponse.json({ error: "Failed to create salary structure" }, { status: 500 });
  }
}
