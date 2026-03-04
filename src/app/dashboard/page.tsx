import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, FileText, Users, Play, UserPlus, CheckSquare, Megaphone, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getCachedDashboardCounts,
  getCachedActiveAnnouncements,
  getCachedActivePolls,
  getCachedPendingActionCounts,
} from "@/lib/cache";
import { getUpcomingBirthdays, getUpcomingAnniversaries } from "@/lib/dashboard/birthdays";
import { AnnouncementsWidget } from "@/components/dashboard/announcements-widget";
import { PollsWidget } from "@/components/dashboard/polls-widget";
import { BirthdaysWidget } from "@/components/dashboard/birthdays-widget";
import { PendingActionsWidget } from "@/components/dashboard/pending-actions-widget";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = ADMIN_ROLES.includes(session.user.role);

  // Parallel data fetching — all cached
  const [counts, announcements, rawPolls, pendingCounts, employees] = await Promise.all([
    getCachedDashboardCounts(),
    getCachedActiveAnnouncements(),
    getCachedActivePolls(),
    isAdmin
      ? getCachedPendingActionCounts()
      : Promise.resolve({ leave: 0, expense: 0, profile: 0, correction: 0, total: 0 }),
    prisma.employee.findMany({
      where: { employment_status: "ACTIVE" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        date_of_birth: true,
        date_of_joining: true,
      },
    }),
  ]);

  // Birthday and anniversary calculation (pure functions, no extra DB queries)
  const birthdays = getUpcomingBirthdays(employees, 30);
  const anniversaries = getUpcomingAnniversaries(employees, 30);

  // Fetch top 5 pending items for the actions inbox (admin only)
  let pendingItems: Array<{
    id: string;
    type: "leave" | "expense" | "profile" | "correction";
    title: string;
    employeeName: string;
    createdAt: Date;
  }> = [];

  if (isAdmin && pendingCounts.total > 0) {
    const [leaveItems, expenseItems] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { status: "PENDING" },
        take: 5,
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          created_at: true,
          employee: { select: { first_name: true, last_name: true } },
          leave_type: { select: { name: true } },
        },
      }),
      prisma.expenseClaim.findMany({
        where: { status: "PENDING_APPROVAL" },
        take: 5,
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          description: true,
          created_at: true,
          employee: { select: { first_name: true, last_name: true } },
        },
      }),
    ]);

    const combined = [
      ...leaveItems.map((l) => ({
        id: l.id,
        type: "leave" as const,
        title: l.leave_type.name,
        employeeName: `${l.employee.first_name} ${l.employee.last_name}`,
        createdAt: l.created_at,
      })),
      ...expenseItems.map((e) => ({
        id: e.id,
        type: "expense" as const,
        title: e.description,
        employeeName: `${e.employee.first_name} ${e.employee.last_name}`,
        createdAt: e.created_at,
      })),
    ];
    combined.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    pendingItems = combined.slice(0, 5);
  }

  // Merge per-user myVote into polls (needed to show results vs voting UI)
  const pollIds = rawPolls.map((p) => p.id);
  const myVoteRecords =
    pollIds.length > 0
      ? await prisma.pollResponse.findMany({
          where: {
            poll_id: { in: pollIds },
            employee: { user: { id: session.user.id } },
          },
          select: { poll_id: true, option_id: true },
        })
      : [];
  const myVoteMap = new Map(myVoteRecords.map((v) => [v.poll_id, v.option_id]));
  const polls = rawPolls.map((p) => ({
    ...p,
    myVote: myVoteMap.get(p.id) ?? null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {session.user.name || session.user.email}
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.employees}</div>
            <p className="text-xs text-muted-foreground">
              {counts.employees === 0 ? "No employees yet" : "Active in system"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.departments}</div>
            <p className="text-xs text-muted-foreground">
              {counts.departments === 0 ? "No departments yet" : "Configured"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.documents}</div>
            <p className="text-xs text-muted-foreground">
              {counts.documents === 0 ? "No documents yet" : "Uploaded"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions — exactly 5 (REQ-14-06) */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <QuickActionCard href="/dashboard/payroll/run" icon={<Play className="h-5 w-5 text-green-600" />} label="Run Payroll" />
          <QuickActionCard href="/dashboard/employees/new" icon={<UserPlus className="h-5 w-5 text-blue-600" />} label="Add Employee" />
          <QuickActionCard href="/dashboard/approvals" icon={<CheckSquare className="h-5 w-5 text-orange-600" />} label="View Approvals" />
          <QuickActionCard href="#post-announcement" icon={<Megaphone className="h-5 w-5 text-purple-600" />} label="Post Announcement" />
          <QuickActionCard href="#create-poll" icon={<BarChart3 className="h-5 w-5 text-indigo-600" />} label="Create Poll" />
        </div>
      </div>

      {/* Main widgets grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <AnnouncementsWidget announcements={announcements} canPost={isAdmin} />
          <PollsWidget polls={polls} canCreate={isAdmin} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {isAdmin && (
            <PendingActionsWidget summary={pendingCounts} items={pendingItems} />
          )}
          <BirthdaysWidget birthdays={birthdays} anniversaries={anniversaries} />
        </div>
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
