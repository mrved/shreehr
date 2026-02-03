import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LoanSchedule } from "@/components/loans/loan-schedule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  DEFAULTED: "bg-red-100 text-red-800",
};

const loanTypeLabels: Record<string, string> = {
  SALARY_ADVANCE: "Salary Advance",
  PERSONAL: "Personal Loan",
  EMERGENCY: "Emergency Loan",
};

export default async function LoanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch loan with details
  const loan = await prisma.employeeLoan.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          employee_code: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });

  if (!loan) {
    notFound();
  }

  // Check permission
  const allowedRoles = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const employeeName = `${loan.employee.first_name} ${loan.employee.last_name}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/loans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loanTypeLabels[loan.loan_type]} - {employeeName}
          </p>
        </div>
      </div>

      {/* Loan Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Loan Information</CardTitle>
            <Badge className={statusColors[loan.status]}>{loan.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Employee</h3>
              <p className="mt-1 text-sm text-gray-900">
                {loan.employee.employee_code} - {employeeName}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Loan Type</h3>
              <p className="mt-1 text-sm text-gray-900">{loanTypeLabels[loan.loan_type]}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Principal Amount</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                ₹{(loan.principal_paise / 100).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Interest Rate</h3>
              <p className="mt-1 text-sm text-gray-900">{loan.annual_interest_rate}% per annum</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tenure</h3>
              <p className="mt-1 text-sm text-gray-900">{loan.tenure_months} months</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Monthly EMI</h3>
              <p className="mt-1 text-lg font-semibold text-blue-600">
                ₹{(loan.emi_paise / 100).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Interest</h3>
              <p className="mt-1 text-sm text-gray-900">
                ₹{(loan.total_interest_paise / 100).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Repayment</h3>
              <p className="mt-1 text-sm text-gray-900">
                ₹{(loan.total_repayment_paise / 100).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Remaining Balance</h3>
              <p className="mt-1 text-lg font-semibold text-orange-600">
                ₹{(loan.remaining_balance_paise / 100).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {loan.start_date.toLocaleDateString("en-IN")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {loan.end_date.toLocaleDateString("en-IN")}
              </p>
            </div>
            {loan.disbursement_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Disbursed On</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {loan.disbursement_date.toLocaleDateString("en-IN")}
                </p>
              </div>
            )}
            {loan.closed_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Closed On</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {loan.closed_at.toLocaleDateString("en-IN")}
                </p>
              </div>
            )}
            {loan.closure_reason && (
              <div className="md:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-medium text-gray-500">Closure Reason</h3>
                <p className="mt-1 text-sm text-gray-900">{loan.closure_reason}</p>
              </div>
            )}
          </div>

          {/* Status Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {loan.status === "PENDING" && (
              <form action={`/api/loans/${loan.id}`} method="PATCH">
                <Button size="sm">Disburse Loan</Button>
              </form>
            )}
            {loan.status === "ACTIVE" && (
              <>
                <form action={`/api/loans/${loan.id}`} method="PATCH">
                  <Button variant="outline" size="sm">
                    Close Loan
                  </Button>
                </form>
                <form action={`/api/loans/${loan.id}`} method="PATCH">
                  <Button variant="destructive" size="sm">
                    Cancel Loan
                  </Button>
                </form>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loan Schedule */}
      <LoanSchedule
        loanId={loan.id}
        principal={loan.principal_paise / 100}
        totalInterest={loan.total_interest_paise / 100}
        totalRepayment={loan.total_repayment_paise / 100}
      />
    </div>
  );
}
