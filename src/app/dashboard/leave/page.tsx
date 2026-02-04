import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LeaveBalanceCard } from "@/components/leave/leave-balance-card";
import { LeaveRequestsList } from "@/components/leave/leave-requests-list";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function LeavePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isManager = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(
    session.user.role,
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">View balances and manage leave requests</p>
        </div>
        <Link href="/dashboard/leave/apply">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Apply Leave
          </Button>
        </Link>
      </div>

      <LeaveBalanceCard />

      <LeaveRequestsList />

      {isManager && <LeaveRequestsList showApproval />}
    </div>
  );
}
