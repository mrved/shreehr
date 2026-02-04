import { redirect } from "next/navigation";
import { TeamAttendance } from "@/components/attendance/team-attendance";
import { auth } from "@/lib/auth";

export default async function TeamAttendancePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Only managers and admins can access
  if (!["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(session.user.role)) {
    redirect("/attendance");
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Attendance</h1>
        <p className="text-muted-foreground">
          Monitor team attendance and identify missing punches
        </p>
      </div>

      <TeamAttendance />
    </div>
  );
}
