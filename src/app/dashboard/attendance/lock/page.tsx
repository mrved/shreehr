import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AttendanceLockManager } from "@/components/attendance/attendance-lock-manager";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Attendance Lock Management | ShreeHR",
  description: "Lock attendance for payroll processing and manage correction requests",
};

export default async function AttendanceLockPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Only admins and HR can manage locks
  if (!["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "PAYROLL_MANAGER"].includes(session.user.role)) {
    redirect("/attendance");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance Lock Management</h1>
        <p className="text-muted-foreground">
          Lock attendance before payroll processing and manage correction requests
        </p>
      </div>

      <AttendanceLockManager />
    </div>
  );
}
