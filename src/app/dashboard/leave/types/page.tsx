import { redirect } from "next/navigation";
import { LeaveTypesManager } from "@/components/leave/leave-types-manager";
import { auth } from "@/lib/auth";

export default async function LeaveTypesPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role)) {
    redirect("/leave");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Leave Type Configuration</h1>
        <p className="text-muted-foreground">Configure leave types and annual quotas</p>
      </div>

      <LeaveTypesManager />
    </div>
  );
}
