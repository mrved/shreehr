import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LeaveRequestForm } from "@/components/employee/leave-request-form";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function LeaveApplyPage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();

  // Fetch active leave types
  const leaveTypes = await prisma.leaveType.findMany({
    where: { is_active: true },
    orderBy: { name: "asc" },
  });

  // Fetch leave balances for validation
  const existingBalances = await prisma.leaveBalance.findMany({
    where: {
      employee_id: session.user.employeeId,
      year: currentYear,
    },
  });

  // Get pending leave requests
  const pendingLeaves = await prisma.leaveRequest.groupBy({
    by: ["leave_type_id"],
    where: {
      employee_id: session.user.employeeId,
      status: "PENDING",
      start_date: { gte: new Date(currentYear, 0, 1) },
      end_date: { lte: new Date(currentYear, 11, 31) },
    },
    _sum: { days_count: true },
  });

  const pendingByType = new Map(
    pendingLeaves.map((p) => [p.leave_type_id, p._sum.days_count || 0]),
  );

  // Transform leave types for form
  const leaveTypesData = leaveTypes.map((lt) => ({
    id: lt.id,
    name: lt.name,
    code: lt.code,
    is_paid: lt.is_paid,
    requires_approval: lt.requires_approval,
    min_days_notice: lt.min_days_notice,
    annual_quota: lt.annual_quota,
  }));

  // Build balances for validation
  const balances = leaveTypes.map((lt) => {
    const existing = existingBalances.find((b) => b.leave_type === lt.code);
    const pending = pendingByType.get(lt.id) || 0;

    return {
      leaveTypeId: lt.id,
      available: (existing?.balance ?? lt.annual_quota) - pending,
    };
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/employee/leave">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leave Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
        <p className="text-sm text-gray-500 mt-1">
          Submit a new leave request with balance validation
        </p>
      </div>

      {/* Leave Request Form */}
      <LeaveRequestForm leaveTypes={leaveTypesData} balances={balances} />
    </div>
  );
}
