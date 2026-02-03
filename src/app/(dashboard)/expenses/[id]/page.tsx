import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExpenseApproval } from "@/components/expenses/expense-approval";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  REIMBURSED: "bg-purple-100 text-purple-800",
};

export default async function ExpenseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch expense with all details
  const expense = await prisma.expenseClaim.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
      policy: {
        select: {
          name: true,
          max_amount_paise: true,
          requires_receipt: true,
        },
      },
      approvals: {
        orderBy: {
          level: "asc",
        },
      },
    },
  });

  if (!expense) {
    notFound();
  }

  // Check permission
  const isOwner = session.user.employeeId === expense.employee_id;
  const canManage = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "MANAGER"].includes(
    session.user.role,
  );

  if (!isOwner && !canManage) {
    redirect("/dashboard");
  }

  const employeeName = `${expense.employee.first_name} ${expense.employee.last_name}`;

  // Determine if user can approve at current level
  const policySnapshot = expense.policy_snapshot as any;
  const approvalChain = policySnapshot?.approval_levels || [];

  const canApprove =
    expense.status === "PENDING_APPROVAL" &&
    approvalChain[expense.current_approval_level - 1]?.role === session.user.role;

  // Transform approval chain
  const transformedApprovalChain = approvalChain.map((level: any, index: number) => {
    const approval = expense.approvals.find((a: any) => a.level === index + 1);
    return {
      level: index + 1,
      role: level.role,
      approved_by_name: approval?.approver_id || undefined,
      approved_at: approval?.acted_at?.toISOString(),
      status: approval?.status === "APPROVED" ? "APPROVED" : "PENDING",
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/expenses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            {expense.policy.name} - {employeeName}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <Badge className={statusColors[expense.status]}>
          {expense.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Show approval interface if user can approve */}
      {canApprove ? (
        <ExpenseApproval
          expenseId={expense.id}
          employeeName={employeeName}
          expenseDate={expense.expense_date.toISOString()}
          category={expense.policy.name}
          amount={expense.amount_paise / 100}
          description={expense.description}
          receiptPath={expense.receipt_path}
          receiptOriginalName={expense.receipt_original_name}
          policyLimit={expense.policy.max_amount_paise ? expense.policy.max_amount_paise / 100 : null}
          receiptRequired={expense.policy.requires_receipt}
          currentLevel={expense.current_approval_level}
          approvalChain={transformedApprovalChain}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Expense Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Employee</h3>
                <p className="mt-1 text-sm text-gray-900">{employeeName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1 text-sm text-gray-900">{expense.policy.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  ₹{(expense.amount_paise / 100).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Expense Date</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {expense.expense_date.toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">{expense.description}</p>
              </div>
              {expense.rejection_reason && (
                <div className="md:col-span-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-sm font-medium text-red-900">Rejection Reason</h3>
                  <p className="mt-1 text-sm text-red-700">{expense.rejection_reason}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
