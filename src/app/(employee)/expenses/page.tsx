import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExpenseList } from "@/components/expenses/expense-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function EmployeeExpensesPage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  // Fetch employee's own expenses
  const expenses = await prisma.expenseClaim.findMany({
    where: {
      employee_id: session.user.employeeId,
    },
    include: {
      policy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

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

  // Calculate status summary
  const draftCount = expenses.filter((e) => e.status === "DRAFT").length;
  const pendingCount = expenses.filter(
    (e) => e.status === "SUBMITTED" || e.status === "PENDING_APPROVAL",
  ).length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const approvedThisMonth = expenses
    .filter((e) => {
      const expenseMonth = e.expense_date.getMonth();
      const expenseYear = e.expense_date.getFullYear();
      return (
        expenseMonth === currentMonth &&
        expenseYear === currentYear &&
        (e.status === "APPROVED" || e.status === "REIMBURSED")
      );
    })
    .reduce((sum, e) => sum + e.amount_paise, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit and track your expense claims
          </p>
        </div>
        <Link href="/employee/expenses/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Submit Expense
          </Button>
        </Link>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Drafts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{draftCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Approved This Month</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                ₹{(approvedThisMonth / 100).toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      <ExpenseList expenses={transformedExpenses} />
    </div>
  );
}
