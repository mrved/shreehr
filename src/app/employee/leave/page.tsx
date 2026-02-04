import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LeaveBalanceCards } from "@/components/employee/leave-balance-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function LeavePage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();

  // Fetch leave balances
  const leaveTypes = await prisma.leaveType.findMany({
    where: { is_active: true },
    orderBy: { name: "asc" },
  });

  const existingBalances = await prisma.leaveBalance.findMany({
    where: {
      employee_id: session.user.employeeId,
      year: currentYear,
    },
  });

  // Get pending leave requests to show committed but not yet used
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

  // Build combined balance view
  const balances = leaveTypes.map((lt) => {
    const existing = existingBalances.find((b) => b.leave_type === lt.code);
    const pending = pendingByType.get(lt.id) || 0;

    return {
      leaveTypeId: lt.id,
      leaveTypeName: lt.name,
      leaveTypeCode: lt.code,
      isPaid: lt.is_paid,
      year: currentYear,
      opening: existing?.opening ?? lt.annual_quota,
      accrued: existing?.accrued ?? 0,
      used: existing?.used ?? 0,
      pending,
      balance: existing?.balance ?? lt.annual_quota,
      available: (existing?.balance ?? lt.annual_quota) - pending,
    };
  });

  // Fetch recent leave requests
  const recentRequests = await prisma.leaveRequest.findMany({
    where: {
      employee_id: session.user.employeeId,
    },
    take: 10,
    orderBy: { created_at: "desc" },
    include: {
      leave_type: {
        select: { name: true, code: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1">View your leave balances and apply for leave</p>
        </div>
        <Button asChild>
          <Link href="/employee/leave/apply">
            <Plus className="h-4 w-4 mr-2" />
            Apply Leave
          </Link>
        </Button>
      </div>

      {/* Leave Balance Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Leave Balances ({currentYear})</h2>
        <LeaveBalanceCards balances={balances} />
      </div>

      {/* Recent Leave Requests */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Leave Requests</h2>
        {recentRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No leave requests found. Click "Apply Leave" to submit your first request.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRequests.map((request) => {
                  const statusColors = {
                    PENDING: "bg-yellow-100 text-yellow-800",
                    APPROVED: "bg-green-100 text-green-800",
                    REJECTED: "bg-red-100 text-red-800",
                    CANCELLED: "bg-gray-100 text-gray-800",
                  };

                  return (
                    <div
                      key={request.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {request.leave_type.name} ({request.leave_type.code})
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              statusColors[request.status as keyof typeof statusColors]
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(request.start_date).toLocaleDateString()} -{" "}
                          {new Date(request.end_date).toLocaleDateString()}
                          {request.is_half_day && (
                            <span className="ml-2 text-xs">
                              ({request.half_day_period?.replace("_", " ")})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.days_count} {request.days_count === 1 ? "day" : "days"}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 md:mt-0">
                        Applied on {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
