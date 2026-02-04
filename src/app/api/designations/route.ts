import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { designationSchema } from "@/lib/validations/organization";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const designations = await prisma.designation.findMany({
      orderBy: [{ level: "asc" }, { title: "asc" }],
      include: {
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json(designations);
  } catch (error) {
    console.error("Designation list error:", error);
    return NextResponse.json({ error: "Failed to fetch designations" }, { status: 500 });
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
    const validated = designationSchema.parse(body);

    const designation = await prisma.designation.create({
      data: {
        title: validated.title,
        level: validated.level,
        description: validated.description,
        is_active: validated.isActive ?? true,
        created_by: session.user.id,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json(designation, { status: 201 });
  } catch (error) {
    console.error("Designation create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Designation title already exists" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create designation" }, { status: 500 });
  }
}
