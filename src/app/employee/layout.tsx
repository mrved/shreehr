import { Calendar, FileText, Home, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect admins and HR managers to dashboard (they use admin portal)
  if (
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "HR_MANAGER" ||
    session.user.role === "PAYROLL_MANAGER"
  ) {
    redirect("/dashboard");
  }

  // Only EMPLOYEE role can access this portal
  if (session.user.role !== "EMPLOYEE") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-xl font-bold text-gray-900">ShreeHR</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <EmployeeNav />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          <MobileNavItem href="/employee/dashboard" icon={Home} label="Home" />
          <MobileNavItem href="/employee/payslips" icon={FileText} label="Payslips" />
          <MobileNavItem href="/employee/leave" icon={Calendar} label="Leave" />
          <MobileNavItem href="/employee/profile" icon={User} label="Profile" />
        </div>
      </nav>
    </div>
  );
}

function EmployeeNav() {
  return (
    <ul className="flex flex-1 flex-col gap-y-1">
      <NavItem href="/employee/dashboard" icon={Home} label="Dashboard" />
      <NavItem href="/employee/payslips" icon={FileText} label="Payslips" />
      <NavItem href="/employee/tax" icon={FileText} label="Tax Documents" />
      <NavItem href="/employee/leave" icon={Calendar} label="Leave" />
      <NavItem href="/employee/attendance" icon={Calendar} label="Attendance" />
      <NavItem href="/employee/profile" icon={User} label="Profile" />
    </ul>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex gap-x-3 rounded-md p-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      >
        <Icon className="h-5 w-5 shrink-0" />
        {label}
      </Link>
    </li>
  );
}

function MobileNavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
