import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileUpdateActionSchema } from "@/lib/validations/profile";

// GET /api/profile/update-requests/[id] - Single request with changes diff
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const updateRequest = await prisma.profileUpdateRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
            department: {
              select: { name: true },
            },
            designation: {
              select: { title: true },
            },
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!updateRequest) {
      return NextResponse.json({ error: "Update request not found" }, { status: 404 });
    }

    // Check access
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role);
    const isOwner = updateRequest.employee_id === session.user.employeeId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(updateRequest);
  } catch (error) {
    console.error("Update request get error:", error);
    return NextResponse.json({ error: "Failed to fetch update request" }, { status: 500 });
  }
}

// PATCH /api/profile/update-requests/[id] - Approve or reject
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = profileUpdateActionSchema.parse(body);

    // Only admins and HR managers can approve/reject
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins and HR managers can approve/reject profile update requests" },
        { status: 403 },
      );
    }

    const updateRequest = await prisma.profileUpdateRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true },
        },
      },
    });

    if (!updateRequest) {
      return NextResponse.json({ error: "Update request not found" }, { status: 404 });
    }

    // Can only process pending requests
    if (updateRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only approve/reject pending requests" },
        { status: 400 },
      );
    }

    if (validated.action === "approve") {
      // Extract changes and apply to Employee record
      const changes = updateRequest.changes as Record<string, { old: any; new: any }>;
      const updateData: Record<string, any> = {};

      // Build update data from changes
      for (const [field, value] of Object.entries(changes)) {
        updateData[field] = value.new;
      }

      // Update employee record and update request in a transaction
      const [updatedEmployee, updatedRequest] = await prisma.$transaction([
        prisma.employee.update({
          where: { id: updateRequest.employee_id },
          data: {
            ...updateData,
            updated_by: session.user.id,
          },
        }),
        prisma.profileUpdateRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            approved_by: session.user.id,
            approved_at: new Date(),
            updated_by: session.user.id,
          },
          include: {
            employee: {
              select: {
                id: true,
                employee_code: true,
                first_name: true,
                last_name: true,
              },
            },
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

      return NextResponse.json(updatedRequest);
    }

    if (validated.action === "reject") {
      const updatedRequest = await prisma.profileUpdateRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          approved_by: session.user.id,
          approved_at: new Date(),
          rejection_reason: validated.rejection_reason,
          updated_by: session.user.id,
        },
        include: {
          employee: {
            select: {
              id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json(updatedRequest);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update request action error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to process update request" }, { status: 500 });
  }
}
