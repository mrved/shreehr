import { redirect } from "next/navigation";
import { ExpenseList } from "@/components/expenses/expense-list";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ExpensesPage() {
  const session = await auth();

  // RBAC: ADMIN, HR_MANAGER, PAYROLL_MANAGER, MANAGER
  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "MANAGER"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Fetch expenses based on role
  let expenses;
  let pendingApprovalCount = 0;

  if (session.user.role === "MANAGER" && session.user.employeeId) {
    // Managers see their subordinates' expenses
    const employee = await prisma.employee.findUnique({
      where: { id: session.user.employeeId },
      include: {
        subordinates: {
          select: { id: true },
        },
      },
    });

    const subordinateIds = employee?.subordinates.map((s) => s.id) || [];

    expenses = await prisma.expenseClaim.findMany({
      where: {
        employee_id: {
          in: subordinateIds,
        },
      },
      include: {
        policy: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Count pending approvals where manager's role matches current level
    // This would need proper approval chain logic from the API
    pendingApprovalCount = expenses.filter(
      (e) => e.status === "PENDING_APPROVAL" && e.current_approval_level === 1,
    ).length;
  } else {
    // Admins and HR see all expenses
    expenses = await prisma.expenseClaim.findMany({
      include: {
        policy: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  const transformedExpenses = expenses.map((expense) => ({
    id: expense.id,
    expense_date: expense.expense_date.toISOString(),
    policy: {
      category: expense.policy.name,
    },
    description: expense.description,
    amount_paise: expense.amount_paise,
    status: expense.status,
  }));

  const showPendingTab = session.user.role === "MANAGER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          {session.user.role === "MANAGER"
            ? "Review and approve expense claims from your team"
            : "Manage all employee expense claims"}
        </p>
      </div>

      <ExpenseList
        expenses={transformedExpenses}
        showPendingTab={showPendingTab}
        pendingApprovalCount={pendingApprovalCount}
      />
    </div>
  );
}
