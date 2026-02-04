import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { investmentCreateSchema } from "@/lib/validations/investment";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const financialYear = searchParams.get("financialYear");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    // Role-based access control
    if (session.user.role === "EMPLOYEE") {
      // Employees can only see their own declarations
      where.employee_id = session.user.employeeId;
    } else if (
      ["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(session.user.role || "")
    ) {
      // Admins can filter by employee
      if (employeeId) {
        where.employee_id = employeeId;
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (financialYear) {
      where.financial_year = financialYear;
    }

    if (status) {
      where.status = status;
    }

    const [declarations, total] = await Promise.all([
      prisma.investmentDeclaration.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updated_at: "desc" },
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
      }),
      prisma.investmentDeclaration.count({ where }),
    ]);

    return NextResponse.json({
      declarations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Investment declarations list error:", error);
    return NextResponse.json({ error: "Failed to fetch investment declarations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.employeeId) {
    return NextResponse.json({ error: "Unauthorized or no employee profile" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = investmentCreateSchema.parse(body);

    // Check if declaration already exists for this employee and financial year
    const existing = await prisma.investmentDeclaration.findUnique({
      where: {
        employee_id_financial_year: {
          employee_id: session.user.employeeId,
          financial_year: validated.financial_year,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Investment declaration already exists for financial year ${validated.financial_year}. Use PATCH to update.`,
        },
        { status: 400 },
      );
    }

    // Create new declaration
    const declaration = await prisma.investmentDeclaration.create({
      data: {
        employee_id: session.user.employeeId,
        financial_year: validated.financial_year,

        // Section 80C
        section_80c_ppf: validated.section_80c_ppf,
        section_80c_elss: validated.section_80c_elss,
        section_80c_life_insurance: validated.section_80c_life_insurance,
        section_80c_tuition_fees: validated.section_80c_tuition_fees,
        section_80c_nps: validated.section_80c_nps,
        section_80c_home_loan_principal: validated.section_80c_home_loan_principal,
        section_80c_sukanya: validated.section_80c_sukanya,
        section_80c_other: validated.section_80c_other,

        // Section 80D
        section_80d_self: validated.section_80d_self,
        section_80d_parents: validated.section_80d_parents,
        section_80d_checkup: validated.section_80d_checkup,

        // HRA
        hra_monthly_rent: validated.hra_monthly_rent,
        hra_landlord_name: validated.hra_landlord_name,
        hra_landlord_pan: validated.hra_landlord_pan,
        hra_rental_address: validated.hra_rental_address,

        // Other deductions
        section_80e_education_loan: validated.section_80e_education_loan,
        section_80g_donations: validated.section_80g_donations,
        section_24_home_loan_interest: validated.section_24_home_loan_interest,

        // Status
        status: "DRAFT",

        // Audit fields
        created_by: session.user.id,
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

    return NextResponse.json(declaration, { status: 201 });
  } catch (error) {
    console.error("Investment declaration create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to create investment declaration" }, { status: 500 });
  }
}
