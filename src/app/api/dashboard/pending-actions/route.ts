import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCachedPendingActionCounts } from "@/lib/cache";

// Roles that can see org-wide pending items
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"];
// Roles that may have subordinates (could see manager-scoped items)
const MANAGER_ROLES = ["PAYROLL_MANAGER"];

/**
 * GET /api/dashboard/pending-actions
 *
 * Returns unified pending actions inbox with summary counts and top 5 recent items.
 * RBAC applied:
 *   - ADMIN, SUPER_ADMIN, HR_MANAGER → org-wide view
 *   - PAYROLL_MANAGER + employees with subordinates → subordinates only
 *   - Regular EMPLOYEE (no subordinates) → empty result
 *
 * Never exposes employee PII — only name and request metadata.
 */
export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, employeeId } = session.user;

  try {
    // ── Admin/HR: org-wide view ───────────────────────────────────────────────
    if (ADMIN_ROLES.includes(role)) {
      const summary = await getCachedPendingActionCounts();

      const [leaveItems, expenseItems] = await Promise.all([
        prisma.leaveRequest.findMany({
          where: { status: "PENDING" },
          take: 5,
          orderBy: { created_at: "asc" },
          select: {
            id: true,
            start_date: true,
            end_date: true,
            status: true,
            created_at: true,
            employee: { select: { first_name: true, last_name: true } },
            leave_type: { select: { name: true } },
          },
        }),
        prisma.expenseClaim.findMany({
          where: { status: "PENDING_APPROVAL" },
          take: 5,
          orderBy: { created_at: "asc" },
          select: {
            id: true,
            description: true,
            amount_paise: true,
            status: true,
            created_at: true,
            employee: { select: { first_name: true, last_name: true } },
          },
        }),
      ]);

      const items = mergeAndSort(leaveItems, expenseItems);

      return NextResponse.json({ summary, items });
    }

    // ── Manager / Payroll-Manager: subordinates view ──────────────────────────
    if (MANAGER_ROLES.includes(role) && employeeId) {
      // Find subordinate employee IDs
      const subordinates = await prisma.employee.findMany({
        where: { reporting_manager_id: employeeId, employment_status: "ACTIVE" },
        select: { id: true },
      });

      if (subordinates.length === 0) {
        return NextResponse.json({ summary: emptySummary(), items: [] });
      }

      const subordinateIds = subordinates.map((s) => s.id);

      const [leave, expense, leaveItems, expenseItems] = await Promise.all([
        prisma.leaveRequest.count({
          where: { status: "PENDING", employee_id: { in: subordinateIds } },
        }),
        prisma.expenseClaim.count({
          where: { status: "PENDING_APPROVAL", employee_id: { in: subordinateIds } },
        }),
        prisma.leaveRequest.findMany({
          where: { status: "PENDING", employee_id: { in: subordinateIds } },
          take: 5,
          orderBy: { created_at: "asc" },
          select: {
            id: true,
            start_date: true,
            end_date: true,
            status: true,
            created_at: true,
            employee: { select: { first_name: true, last_name: true } },
            leave_type: { select: { name: true } },
          },
        }),
        prisma.expenseClaim.findMany({
          where: { status: "PENDING_APPROVAL", employee_id: { in: subordinateIds } },
          take: 5,
          orderBy: { created_at: "asc" },
          select: {
            id: true,
            description: true,
            amount_paise: true,
            status: true,
            created_at: true,
            employee: { select: { first_name: true, last_name: true } },
          },
        }),
      ]);

      const summary = {
        leave,
        expense,
        profile: 0,
        correction: 0,
        total: leave + expense,
      };

      const items = mergeAndSort(leaveItems, expenseItems);

      return NextResponse.json({ summary, items });
    }

    // ── Regular employee: check if they manage anyone ─────────────────────────
    if (employeeId) {
      const subordinates = await prisma.employee.findMany({
        where: { reporting_manager_id: employeeId, employment_status: "ACTIVE" },
        select: { id: true },
      });

      if (subordinates.length > 0) {
        const subordinateIds = subordinates.map((s) => s.id);

        const [leave, expense, leaveItems, expenseItems] = await Promise.all([
          prisma.leaveRequest.count({
            where: { status: "PENDING", employee_id: { in: subordinateIds } },
          }),
          prisma.expenseClaim.count({
            where: { status: "PENDING_APPROVAL", employee_id: { in: subordinateIds } },
          }),
          prisma.leaveRequest.findMany({
            where: { status: "PENDING", employee_id: { in: subordinateIds } },
            take: 5,
            orderBy: { created_at: "asc" },
            select: {
              id: true,
              start_date: true,
              end_date: true,
              status: true,
              created_at: true,
              employee: { select: { first_name: true, last_name: true } },
              leave_type: { select: { name: true } },
            },
          }),
          prisma.expenseClaim.findMany({
            where: { status: "PENDING_APPROVAL", employee_id: { in: subordinateIds } },
            take: 5,
            orderBy: { created_at: "asc" },
            select: {
              id: true,
              description: true,
              amount_paise: true,
              status: true,
              created_at: true,
              employee: { select: { first_name: true, last_name: true } },
            },
          }),
        ]);

        const summary = {
          leave,
          expense,
          profile: 0,
          correction: 0,
          total: leave + expense,
        };

        return NextResponse.json({ summary, items: mergeAndSort(leaveItems, expenseItems) });
      }
    }

    // No pending actions to show
    return NextResponse.json({ summary: emptySummary(), items: [] });
  } catch (error: any) {
    console.error("GET /api/dashboard/pending-actions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending actions" },
      { status: 500 },
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptySummary() {
  return { leave: 0, expense: 0, profile: 0, correction: 0, total: 0 };
}

type LeaveItem = {
  id: string;
  start_date: Date;
  end_date: Date;
  status: string;
  created_at: Date;
  employee: { first_name: string; last_name: string };
  leave_type: { name: string };
};

type ExpenseItem = {
  id: string;
  description: string;
  amount_paise: number;
  status: string;
  created_at: Date;
  employee: { first_name: string; last_name: string };
};

type UnifiedItem =
  | ({ itemType: "leave" } & LeaveItem)
  | ({ itemType: "expense" } & ExpenseItem);

/**
 * Merge leave and expense items, sort by created_at ascending, return top 5.
 * Returns a normalized structure safe for the dashboard (no PII beyond names).
 */
function mergeAndSort(leaveItems: LeaveItem[], expenseItems: ExpenseItem[]) {
  const unified: UnifiedItem[] = [
    ...leaveItems.map((l) => ({ itemType: "leave" as const, ...l })),
    ...expenseItems.map((e) => ({ itemType: "expense" as const, ...e })),
  ];

  unified.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

  return unified.slice(0, 5).map((item) => {
    if (item.itemType === "leave") {
      return {
        id: item.id,
        type: "leave",
        status: item.status,
        createdAt: item.created_at,
        employeeName: `${item.employee.first_name} ${item.employee.last_name}`,
        meta: {
          startDate: item.start_date,
          endDate: item.end_date,
          leaveType: item.leave_type.name,
        },
      };
    }
    return {
      id: item.id,
      type: "expense",
      status: item.status,
      createdAt: item.created_at,
      employeeName: `${item.employee.first_name} ${item.employee.last_name}`,
      meta: {
        description: item.description,
        amountPaise: item.amount_paise,
      },
    };
  });
}
