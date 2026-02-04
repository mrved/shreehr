import { redirect } from "next/navigation";
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar";
import { CheckInButton } from "@/components/attendance/check-in-button";
import { auth } from "@/lib/auth";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground">Track your daily attendance</p>
      </div>

      <CheckInButton />

      <AttendanceCalendar employeeId={session.user.employeeId ?? undefined} />
    </div>
  );
}
