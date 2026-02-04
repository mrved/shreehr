/**
 * Professional Tax Slabs API
 * GET - List all PT slabs (with optional state filter)
 * POST - Create new PT slab
 */

import type { Gender } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Validation schema for PT slab creation
const PTSlabSchema = z.object({
  state_code: z.string().length(2).toUpperCase(),
  salary_from: z.number().int().nonnegative(),
  salary_to: z.number().int().nonnegative().nullable(),
  tax_amount: z.number().int().nonnegative(),
  month: z.number().int().min(1).max(12).nullable(),
  applies_to_gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable(),
  frequency: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  is_active: z.boolean().default(true),
});

/**
 * GET /api/pt-slabs
 * List all PT slabs, optionally filtered by state
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and payroll managers can view PT slabs
    if (!["SUPER_ADMIN", "ADMIN", "PAYROLL_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get("state_code");

    const slabs = await prisma.professionalTaxSlab.findMany({
      where: {
        ...(stateCode && { state_code: stateCode }),
      },
      orderBy: [{ state_code: "asc" }, { month: "asc" }, { salary_from: "asc" }],
    });

    return NextResponse.json({ slabs });
  } catch (error) {
    console.error("Error fetching PT slabs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/pt-slabs
 * Create a new PT slab
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create PT slabs
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = PTSlabSchema.parse(body);

    // Validate salary range
    if (validated.salary_to !== null && validated.salary_to < validated.salary_from) {
      return NextResponse.json(
        { error: "salary_to must be greater than salary_from" },
        { status: 400 },
      );
    }

    const slab = await prisma.professionalTaxSlab.create({
      data: {
        state_code: validated.state_code,
        salary_from: validated.salary_from,
        salary_to: validated.salary_to,
        tax_amount: validated.tax_amount,
        month: validated.month,
        applies_to_gender: validated.applies_to_gender as Gender | null,
        frequency: validated.frequency,
        is_active: validated.is_active,
        created_by: session.user.id,
      },
    });

    return NextResponse.json({ slab }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating PT slab:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
