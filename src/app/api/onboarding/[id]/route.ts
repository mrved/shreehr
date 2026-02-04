import { OnboardingStatus, UserRole } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  type ChecklistItem,
  type UpdateOnboardingStatusInput,
  updateOnboardingStatusSchema,
} from "@/lib/validations/onboarding";
import { canTransitionOnboarding } from "@/lib/workflows/onboarding";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/onboarding/[id]
 * Get onboarding record by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const record = await prisma.onboardingRecord.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        designation: {
          select: {
            id: true,
            title: true,
          },
        },
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Onboarding record not found" }, { status: 404 });
    }

    // RBAC: ADMIN, SUPER_ADMIN, HR_MANAGER, or linked employee can view
    const canView =
      ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role) ||
      (record.employee_id && session.user.employeeId === record.employee_id);

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error fetching onboarding record:", error);
    return NextResponse.json({ error: "Failed to fetch onboarding record" }, { status: 500 });
  }
}

/**
 * PATCH /api/onboarding/[id]
 * Update onboarding status via action
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
    const validation = updateOnboardingStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const data: UpdateOnboardingStatusInput = validation.data;

    // Determine target status based on action
    let targetStatus: OnboardingStatus;
    const updateData: any = {
      updated_by: session.user.id,
    };

    switch (data.action) {
      case "accept":
        // Verify offer token
        if (data.offer_token !== record.offer_token) {
          return NextResponse.json({ error: "Invalid offer token" }, { status: 400 });
        }

        targetStatus = OnboardingStatus.ACCEPTED;
        updateData.offer_accepted_at = new Date();
        break;

      case "start_tasks":
        targetStatus = OnboardingStatus.IN_PROGRESS;
        break;

      case "complete": {
        // Verify all required checklist items are completed
        const checklist = record.checklist as unknown as ChecklistItem[];
        const incompletRequired = checklist.filter((item) => item.required && !item.completedAt);

        if (incompletRequired.length > 0) {
          return NextResponse.json(
            {
              error: "Cannot complete onboarding with incomplete required tasks",
              incomplete_tasks: incompletRequired.map((item) => item.title),
            },
            { status: 400 },
          );
        }

        targetStatus = OnboardingStatus.COMPLETED;
        updateData.completed_at = new Date();
        break;
      }

      case "cancel":
        targetStatus = OnboardingStatus.CANCELLED;
        updateData.cancellation_reason = data.cancellation_reason;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Validate transition
    const transition = canTransitionOnboarding(record.status, targetStatus);
    if (!transition.valid) {
      return NextResponse.json({ error: transition.error }, { status: 400 });
    }

    // Update record
    updateData.status = targetStatus;

    const updated = await prisma.onboardingRecord.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        designation: true,
        employee: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating onboarding record:", error);
    return NextResponse.json({ error: "Failed to update onboarding record" }, { status: 500 });
  }
}

/**
 * DELETE /api/onboarding/[id]
 * Soft delete by setting status to CANCELLED (only if PENDING)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN, SUPER_ADMIN and HR_MANAGER can delete
    if (!["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const record = await prisma.onboardingRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: "Onboarding record not found" }, { status: 404 });
    }

    // Can only delete if status is PENDING
    if (record.status !== OnboardingStatus.PENDING) {
      return NextResponse.json(
        { error: "Can only cancel PENDING onboarding records" },
        { status: 400 },
      );
    }

    const updated = await prisma.onboardingRecord.update({
      where: { id },
      data: {
        status: OnboardingStatus.CANCELLED,
        cancellation_reason: "Cancelled by HR",
        updated_by: session.user.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error deleting onboarding record:", error);
    return NextResponse.json({ error: "Failed to delete onboarding record" }, { status: 500 });
  }
}
