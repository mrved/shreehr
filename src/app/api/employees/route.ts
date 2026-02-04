import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt, maskAadhaar, maskBankAccount, maskPAN } from "@/lib/encryption";
import { employeeCreateSchema } from "@/lib/validations/employee";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { employee_code: { contains: search, mode: "insensitive" } },
        { personal_email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (departmentId) {
      where.department_id = departmentId;
    }

    if (status) {
      where.employment_status = status;
    }

    // For non-admin roles, restrict to own data or direct reports
    if (session.user.role === "EMPLOYEE") {
      where.id = session.user.employeeId;
    } else if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN" &&
      session.user.role !== "HR_MANAGER"
    ) {
      // Managers can see their reports
      if (session.user.employeeId) {
        where.OR = [
          { id: session.user.employeeId },
          { reporting_manager_id: session.user.employeeId },
        ];
      }
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { first_name: "asc" },
        include: {
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } },
          reporting_manager: { select: { id: true, first_name: true, last_name: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    // Mask sensitive fields in response
    const maskedEmployees = employees.map((emp) => ({
      ...emp,
      pan_encrypted: emp.pan_encrypted ? maskPAN("MASKED") : null,
      aadhaar_encrypted: emp.aadhaar_encrypted ? maskAadhaar("MASKED") : null,
      bank_account_encrypted: emp.bank_account_encrypted ? maskBankAccount("MASKED") : null,
    }));

    return NextResponse.json({
      employees: maskedEmployees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Employee list error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN" &&
      session.user.role !== "HR_MANAGER")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = employeeCreateSchema.parse(body);

    // Encrypt sensitive fields
    const employeeData: any = {
      employee_code: validated.employeeCode,
      first_name: validated.firstName,
      middle_name: validated.middleName,
      last_name: validated.lastName,
      date_of_birth: validated.dateOfBirth,
      gender: validated.gender,
      marital_status: validated.maritalStatus || "SINGLE",
      blood_group: validated.bloodGroup,
      personal_email: validated.personalEmail,
      personal_phone: validated.personalPhone,
      emergency_contact: validated.emergencyContact,
      emergency_phone: validated.emergencyPhone,
      address_line1: validated.addressLine1,
      address_line2: validated.addressLine2,
      city: validated.city,
      state: validated.state,
      postal_code: validated.postalCode,
      country: validated.country || "India",
      date_of_joining: validated.dateOfJoining,
      date_of_leaving: validated.dateOfLeaving,
      employment_type: validated.employmentType || "FULL_TIME",
      employment_status: validated.employmentStatus || "ACTIVE",
      department_id: validated.departmentId,
      designation_id: validated.designationId,
      reporting_manager_id: validated.reportingManagerId,
      pan_encrypted: validated.panNumber ? encrypt(validated.panNumber) : null,
      aadhaar_encrypted: validated.aadhaarNumber ? encrypt(validated.aadhaarNumber) : null,
      bank_account_encrypted: validated.bankAccountNumber
        ? encrypt(validated.bankAccountNumber)
        : null,
      bank_name: validated.bankName,
      bank_branch: validated.bankBranch,
      bank_ifsc: validated.bankIfscCode,
      uan: validated.uan,
      esic_number: validated.esicNumber,
      previous_employer_name: validated.previousEmployerName,
      previous_employer_uan: validated.previousEmployerUan,
      created_by: session.user.id,
      updated_by: session.user.id,
    };

    const employee = await prisma.employee.create({
      data: employeeData,
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Employee create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Employee code already exists" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
