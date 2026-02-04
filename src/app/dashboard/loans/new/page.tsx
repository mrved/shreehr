import { redirect } from "next/navigation";
import { LoanForm } from "@/components/loans/loan-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewLoanPage() {
  const session = await auth();

  // RBAC: ADMIN, HR_MANAGER, PAYROLL_MANAGER
  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Fetch all employees
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employee_code: true,
      first_name: true,
      last_name: true,
    },
    orderBy: {
      employee_code: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Employee Loan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a new loan with EMI calculation and repayment schedule
        </p>
      </div>

      <LoanForm employees={employees} />
    </div>
  );
}
