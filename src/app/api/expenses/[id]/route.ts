import { ExpenseStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApproveRejectExpenseSchema, SubmitExpenseClaimSchema } from "@/lib/validations/expense";
import {
  canTransitionExpense,
  getRequiredApprovers,
  shouldAutoApprove,
  validateExpenseAgainstPolicy,
} from "@/lib/workflows/expense";

/**
 * GET /api/expenses/[id]
 * Get expense claim with policy and approvals
 * RBAC: Owner, approver, or admin
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const claim = await prisma.expenseClaim.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        policy: true,
        approvals: {
          orderBy: { level: "asc" },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // RBAC: Owner, admin, or approver
    const { role, employeeId } = session.user;
    const isOwner = claim.employee_id === employeeId;
    const isAdmin = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(role);

    if (!isOwner && !isAdmin) {
      // Check if user is an approver
      const hasApproverRole = claim.approvals.some((a) => a.approver_role === role);
      if (!hasApproverRole) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error("Expense claim fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch expense claim" }, { status: 500 });
  }
}

/**
 * PATCH /api/expenses/[id]
 * Handle expense claim actions: submit, approve, reject
 * RBAC:
 * - submit: Claim owner only, claim must be DRAFT
 * - approve/reject: Must be approver at current level
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const claim = await prisma.expenseClaim.findUnique({
      where: { id },
      include: {
        policy: true,
        approvals: {
          orderBy: { level: "asc" },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const { role, employeeId, id: userId } = session.user;

    // Handle submit action
    if (body.action === "submit") {
      SubmitExpenseClaimSchema.parse(body);

      // RBAC: Must be claim owner
      if (claim.employee_id !== employeeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Must be in DRAFT status
      if (claim.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Can only submit claims in DRAFT status" },
          { status: 400 },
        );
      }

      // Validate receipt if policy requires it
      const policySnapshot = claim.policy_snapshot as any;
      if (policySnapshot.requires_receipt && !claim.receipt_path) {
        return NextResponse.json({ error: "Receipt is required for this policy" }, { status: 400 });
      }

      // Check if should auto-approve
      const autoApprove = shouldAutoApprove(
        {
          requires_approval: policySnapshot.requires_approval,
          auto_approve_below_paise: policySnapshot.auto_approve_below_paise,
        },
        claim.amount_paise,
      );

      if (autoApprove) {
        // Auto-approve: transition directly to APPROVED
        const updated = await prisma.expenseClaim.update({
          where: { id },
          data: {
            status: "APPROVED",
            updated_by: userId,
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
            policy: true,
            approvals: true,
          },
        });

        return NextResponse.json(updated);
      }

      // Create approval records for required levels
      const requiredLevels = getRequiredApprovers(claim.amount_paise);

      await prisma.$transaction(async (tx) => {
        // Update claim to SUBMITTED -> PENDING_APPROVAL
        await tx.expenseClaim.update({
          where: { id },
          data: {
            status: "PENDING_APPROVAL",
            updated_by: userId,
          },
        });

        // Create approval records
        for (const level of requiredLevels) {
          await tx.expenseApproval.create({
            data: {
              expense_id: id,
              level: level.level,
              approver_role: level.role,
              status: "PENDING",
            },
          });
        }
      });

      const updated = await prisma.expenseClaim.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
            },
          },
          policy: true,
          approvals: {
            orderBy: { level: "asc" },
          },
        },
      });

      return NextResponse.json(updated);
    }

    // Handle approve/reject actions
    if (body.action === "approve" || body.action === "reject") {
      const validated = ApproveRejectExpenseSchema.parse(body);

      // RBAC: Must be approver at current level
      const currentLevel = claim.current_approval_level;
      const currentApproval = claim.approvals.find(
        (a) => a.level === currentLevel && a.status === "PENDING",
      );

      if (!currentApproval) {
        return NextResponse.json({ error: "No pending approval found" }, { status: 400 });
      }

      if (currentApproval.approver_role !== role) {
        return NextResponse.json(
          { error: `This approval requires ${currentApproval.approver_role} role` },
          { status: 403 },
        );
      }

      if (validated.action === "approve") {
        // Mark current approval as approved
        await prisma.$transaction(async (tx) => {
          await tx.expenseApproval.update({
            where: { id: currentApproval.id },
            data: {
              status: "APPROVED",
              approver_id: userId,
              comments: validated.comments,
              acted_at: new Date(),
            },
          });

          // Check if all approvals are done
          const allApprovals = await tx.expenseApproval.findMany({
            where: { expense_id: id },
            orderBy: { level: "asc" },
          });

          const allApproved = allApprovals.every((a) => a.status === "APPROVED");

          if (allApproved) {
            // All levels approved - mark claim as APPROVED
            await tx.expenseClaim.update({
              where: { id },
              data: {
                status: "APPROVED",
                updated_by: userId,
              },
            });
          } else {
            // Move to next level
            await tx.expenseClaim.update({
              where: { id },
              data: {
                current_approval_level: currentLevel + 1,
                updated_by: userId,
              },
            });
          }
        });
      } else {
        // Reject
        await prisma.$transaction(async (tx) => {
          await tx.expenseApproval.update({
            where: { id: currentApproval.id },
            data: {
              status: "REJECTED",
              approver_id: userId,
              comments: validated.comments,
              acted_at: new Date(),
            },
          });

          await tx.expenseClaim.update({
            where: { id },
            data: {
              status: "REJECTED",
              rejection_reason: validated.comments,
              updated_by: userId,
            },
          });
        });
      }

      const updated = await prisma.expenseClaim.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
            },
          },
          policy: true,
          approvals: {
            orderBy: { level: "asc" },
          },
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "Invalid action. Use: submit, approve, or reject" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Expense claim action error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to process expense claim action" }, { status: 500 });
  }
}

/**
 * DELETE /api/expenses/[id]
 * Delete a draft expense claim
 * RBAC: Claim owner only, must be DRAFT
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const claim = await prisma.expenseClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // RBAC: Must be claim owner
    if (claim.employee_id !== session.user.employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only delete DRAFT claims
    if (claim.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only delete claims in DRAFT status" },
        { status: 400 },
      );
    }

    await prisma.expenseClaim.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Claim deleted successfully" });
  } catch (error) {
    console.error("Expense claim delete error:", error);
    return NextResponse.json({ error: "Failed to delete expense claim" }, { status: 500 });
  }
}
