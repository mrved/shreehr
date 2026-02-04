import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoanList } from "@/components/loans/loan-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function LoansPage() {
  const session = await auth();

  // RBAC: ADMIN, HR_MANAGER, PAYROLL_MANAGER
  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Fetch all loans
  const loans = await prisma.employeeLoan.findMany({
    include: {
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

  const transformedLoans = loans.map((loan) => ({
    id: loan.id,
    employee: loan.employee,
    loan_type: loan.loan_type,
    principal_paise: loan.principal_paise,
    emi_paise: loan.emi_paise,
    remaining_balance_paise: loan.remaining_balance_paise,
    status: loan.status,
    start_date: loan.start_date.toISOString(),
  }));

  // Calculate summary stats
  const activeLoans = loans.filter((l) => l.status === "ACTIVE");
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.remaining_balance_paise, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee loans and repayments</p>
        </div>
        <Link href="/dashboard/loans/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Loan
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Active Loans</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeLoans.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Outstanding</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                ₹{(totalOutstanding / 100).toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan List */}
      <LoanList loans={transformedLoans} />
    </div>
  );
}
