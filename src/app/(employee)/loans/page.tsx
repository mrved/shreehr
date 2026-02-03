import { redirect } from "next/navigation";
import { LoanList } from "@/components/loans/loan-list";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function EmployeeLoansPage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  // Fetch employee's loans
  const loans = await prisma.employeeLoan.findMany({
    where: {
      employee_id: session.user.employeeId,
    },
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

  // Calculate summary
  const totalLoans = loans.length;
  const totalRemaining = loans
    .filter((l) => l.status === "ACTIVE")
    .reduce((sum, l) => sum + l.remaining_balance_paise, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Loans</h1>
        <p className="text-sm text-gray-500 mt-1">View your loans and repayment schedules</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Loans</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalLoans}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Remaining</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                ₹{(totalRemaining / 100).toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan List */}
      <LoanList loans={transformedLoans} isEmployee={true} />
    </div>
  );
}
