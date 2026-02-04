import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/employee/dashboard-stats";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function EmployeeDashboardPage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  const employeeId = session.user.employeeId;

  // Fetch leave balances
  const currentYear = new Date().getFullYear();
  const leaveBalances = await prisma.leaveBalance.findMany({
    where: {
      employee_id: employeeId,
      year: currentYear,
    },
    select: {
      leave_type: true,
      balance: true,
    },
    orderBy: {
      leave_type: "asc",
    },
  });

  // Fetch last payslip
  const lastPayslip = await prisma.payrollRecord.findFirst({
    where: {
      employee_id: employeeId,
      status: {
        in: ["CALCULATED", "VERIFIED", "PAID"],
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: {
      month: true,
      year: true,
      net_salary_paise: true,
    },
  });

  // Fetch pending leave requests
  const pendingRequests = await prisma.leaveRequest.count({
    where: {
      employee_id: employeeId,
      status: "PENDING",
    },
  });

  // Format data for stats component
  const leaveBalanceData = leaveBalances.map((lb: { leave_type: string; balance: number }) => ({
    type: lb.leave_type,
    balance: lb.balance,
  }));

  const lastPayslipData = lastPayslip
    ? {
        month: new Date(lastPayslip.year, lastPayslip.month - 1).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        }),
        netPay: lastPayslip.net_salary_paise,
      }
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's an overview of your employment information
        </p>
      </div>

      <DashboardStats
        leaveBalance={leaveBalanceData}
        lastPayslip={lastPayslipData}
        pendingRequests={pendingRequests}
      />

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/employee/leave/apply"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">Apply Leave</h3>
            <p className="mt-1 text-sm text-gray-500">Request time off</p>
          </a>
          <a
            href="/employee/payslips"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">View Payslips</h3>
            <p className="mt-1 text-sm text-gray-500">Access your salary statements</p>
          </a>
          <a
            href="/employee/tax"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">Tax Documents</h3>
            <p className="mt-1 text-sm text-gray-500">Download Form 16 and more</p>
          </a>
          <a
            href="/employee/expenses/new"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">Submit Expense</h3>
            <p className="mt-1 text-sm text-gray-500">Claim reimbursements</p>
          </a>
          <a
            href="/employee/investments"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">Investments</h3>
            <p className="mt-1 text-sm text-gray-500">Declare tax-saving investments</p>
          </a>
          <a
            href="/employee/loans"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">My Loans</h3>
            <p className="mt-1 text-sm text-gray-500">View loan status and EMIs</p>
          </a>
        </div>
      </div>
    </div>
  );
}
