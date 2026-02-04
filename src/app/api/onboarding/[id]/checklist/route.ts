import { UserRole } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  type ChecklistItem,
  type UpdateChecklistInput,
  updateChecklistSchema,
} from "@/lib/validations/onboarding";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/onboarding/[id]/checklist
 * Update checklist item completion
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch current record
    const record = await prisma.onboardingRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: "Onboarding record not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateChecklistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const data: UpdateChecklistInput = validation.data;

    // Get current checklist
    const checklist = record.checklist as unknown as ChecklistItem[];

    // Find item to update
    const itemIndex = checklist.findIndex((item) => item.id === data.item_id);

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
    }

    const item = checklist[itemIndex];

    // RBAC: ADMIN, SUPER_ADMIN, HR_MANAGER, or user matching assignedTo
    const canUpdate =
      ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role) ||
      item.assignedTo === session.user.id;

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Forbidden - you are not assigned to this task" },
        { status: 403 },
      );
    }

    // Update item
    if (data.completed) {
      checklist[itemIndex] = {
        ...item,
        completedAt: new Date(),
        completedBy: session.user.id,
      };
    } else {
      checklist[itemIndex] = {
        ...item,
        completedAt: null,
        completedBy: null,
      };
    }

    // Save updated checklist
    const updated = await prisma.onboardingRecord.update({
      where: { id },
      data: {
        checklist: checklist as any,
        updated_by: session.user.id,
      },
      include: {
        department: true,
        designation: true,
        employee: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating checklist:", error);
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}
