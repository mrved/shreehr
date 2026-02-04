import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { departmentSchema } from "@/lib/validations/organization";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Department list error:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
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
    const validated = departmentSchema.parse(body);

    const department = await prisma.department.create({
      data: {
        name: validated.name,
        code: validated.name.substring(0, 10).toUpperCase().replace(/\s/g, ""),
        description: validated.description,
        is_active: validated.isActive ?? true,
        created_by: session.user.id,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("Department create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Department name already exists" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
