import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, DollarSign, FileText, MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCachedActiveAnnouncements, getCachedActivePolls } from "@/lib/cache";
import { DashboardStats } from "@/components/employee/dashboard-stats";
import { QuickCheckinWidget } from "@/components/dashboard/quick-checkin-widget";
import { AnnouncementsWidget } from "@/components/dashboard/announcements-widget";
import { PollsWidget } from "@/components/dashboard/polls-widget";

export default async function EmployeeDashboardPage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  const employeeId = session.user.employeeId;

  // Compute today's date with time zeroed for attendance lookup
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = new Date().getFullYear();

  // Parallel data fetching
  const [
    leaveBalances,
    lastPayslip,
    pendingRequests,
    todayAttendance,
    announcements,
    rawPolls,
  ] = await Promise.all([
    prisma.leaveBalance.findMany({
      where: { employee_id: employeeId, year: currentYear },
      select: { leave_type: true, balance: true },
      orderBy: { leave_type: "asc" },
    }),
    prisma.payrollRecord.findFirst({
      where: {
        employee_id: employeeId,
        status: { in: ["CALCULATED", "VERIFIED", "PAID"] },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { month: true, year: true, net_salary_paise: true },
    }),
    prisma.leaveRequest.count({
      where: { employee_id: employeeId, status: "PENDING" },
    }),
    prisma.attendance.findUnique({
      where: { employee_id_date: { employee_id: employeeId, date: today } },
      select: { check_in: true, check_out: true, status: true, work_minutes: true },
    }),
    getCachedActiveAnnouncements(),
    getCachedActivePolls(),
  ]);

  // Fetch employee's existing votes to show results vs voting UI
  const pollIds = rawPolls.map((p) => p.id);
  const myVotes =
    pollIds.length > 0
      ? await prisma.pollResponse.findMany({
          where: { employee_id: employeeId, poll_id: { in: pollIds } },
          select: { poll_id: true, option_id: true },
        })
      : [];

  const pollsWithMyVote = rawPolls.map((p) => ({
    ...p,
    myVote: myVotes.find((v) => v.poll_id === p.id)?.option_id ?? null,
  }));

  // Serialize dates to ISO strings for client components
  const todayAttendanceForClient = todayAttendance
    ? {
        check_in: todayAttendance.check_in?.toISOString() ?? null,
        check_out: todayAttendance.check_out?.toISOString() ?? null,
        status: todayAttendance.status,
        work_minutes: todayAttendance.work_minutes,
      }
    : null;

  // Format data for stats component
  const leaveBalanceData = leaveBalances.map(
    (lb: { leave_type: string; balance: number }) => ({
      type: lb.leave_type,
      balance: lb.balance,
    }),
  );

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's an overview of your employment information
        </p>
      </div>

      {/* Quick Check-In — prominent at top */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <QuickCheckinWidget todayAttendance={todayAttendanceForClient} />
        </div>
        <div className="lg:col-span-2">
          <DashboardStats
            leaveBalance={leaveBalanceData}
            lastPayslip={lastPayslipData}
            pendingRequests={pendingRequests}
          />
        </div>
      </div>

      {/* Quick Actions — exactly 5 (REQ-14-06) */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <QuickActionCard
            href="/employee/leave/apply"
            icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
            label="Apply Leave"
          />
          <QuickActionCard
            href="/employee/expenses/new"
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            label="Submit Expense"
          />
          <QuickActionCard
            href="/employee/attendance"
            icon={<CalendarDays className="h-5 w-5 text-orange-600" />}
            label="My Attendance"
          />
          <QuickActionCard
            href="/employee/payslips"
            icon={<FileText className="h-5 w-5 text-purple-600" />}
            label="View Payslips"
          />
          <QuickActionCard
            href="/employee/chat"
            icon={<MessageSquare className="h-5 w-5 text-indigo-600" />}
            label="Ask AI"
          />
        </div>
      </div>

      {/* Announcements and Polls — two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnnouncementsWidget announcements={announcements} canPost={false} />
        <PollsWidget polls={pollsWithMyVote} canCreate={false} />
      </div>
    </div>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────

function QuickActionCard({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
    >
      {icon}
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </Link>
  );
}
