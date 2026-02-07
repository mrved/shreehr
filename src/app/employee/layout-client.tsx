"use client";

import {
  Calendar,
  Clock,
  FileCheck,
  FileText,
  Home,
  LogOut,
  MoreHorizontal,
  Receipt,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingChatButton } from "@/components/chat";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Navigation items configuration
const employeeNavItems = [
  { href: "/employee/dashboard", icon: Home, label: "Dashboard" },
  { href: "/employee/attendance", icon: Clock, label: "Attendance" },
  { href: "/employee/leave", icon: Calendar, label: "Leave" },
  { href: "/employee/payslips", icon: FileText, label: "Payslips" },
  { href: "/employee/expenses", icon: Receipt, label: "Expenses" },
  { href: "/employee/investments", icon: TrendingUp, label: "Investments" },
  { href: "/employee/loans", icon: Wallet, label: "Loans" },
  { href: "/employee/profile", icon: User, label: "Profile" },
  { href: "/employee/tax", icon: FileCheck, label: "Tax Documents" },
];

// Mobile bottom nav items (main 4)
const mobileMainNavItems = [
  { href: "/employee/dashboard", icon: Home, label: "Home" },
  { href: "/employee/attendance", icon: Clock, label: "Attendance" },
  { href: "/employee/leave", icon: Calendar, label: "Leave" },
  { href: "/employee/payslips", icon: FileText, label: "Payslips" },
];

// Mobile "More" menu items
const mobileMoreItems = [
  { href: "/employee/expenses", icon: Receipt, label: "Expenses" },
  { href: "/employee/investments", icon: TrendingUp, label: "Investments" },
  { href: "/employee/loans", icon: Wallet, label: "Loans" },
  { href: "/employee/profile", icon: User, label: "Profile" },
  { href: "/employee/tax", icon: FileCheck, label: "Tax Docs" },
];

interface EmployeeLayoutClientProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email: string;
    role: string;
  };
}

export function EmployeeLayoutClient({ children, user }: EmployeeLayoutClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-xl font-bold text-gray-900">ShreeHR</span>
          </div>
          {/* User info */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                <p className="text-xs text-gray-500">Employee</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <EmployeeNav />
            {/* Logout button at bottom of sidebar */}
            <div className="mt-auto pb-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign out
              </Button>
            </div>
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
          {mobileMainNavItems.map((item) => (
            <MobileNavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
          <MobileMoreMenu />
        </div>
      </nav>

      {/* Floating Ask HR Chat Button */}
      <FloatingChatButton href="/employee/chat" />
    </div>
  );
}

function EmployeeNav() {
  const pathname = usePathname();

  return (
    <ul className="flex flex-1 flex-col gap-y-1">
      {employeeNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "group flex gap-x-3 rounded-md p-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-700" : "text-gray-400")}
              />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
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
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
        isActive ? "text-blue-700" : "text-gray-600 hover:text-gray-900"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "text-blue-700")} />
      <span>{label}</span>
    </Link>
  );
}

function MobileMoreMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Check if any "more" item is currently active
  const isMoreActive = mobileMoreItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
            isMoreActive ? "text-blue-700" : "text-gray-600 hover:text-gray-900"
          )}
        >
          <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "text-blue-700")} />
          <span>More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto rounded-t-xl">
        <SheetHeader>
          <SheetTitle>More Options</SheetTitle>
        </SheetHeader>
        <nav className="grid grid-cols-3 gap-4 py-4">
          {mobileMoreItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg transition-colors",
                  isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-700"
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive && "text-blue-700")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {/* Logout button in mobile menu */}
        <div className="pt-4 mt-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-center text-gray-600 hover:text-gray-900"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/login" });
            }}
          >
            <LogOut className="h-6 w-6 mr-2" />
            <span className="text-sm font-medium">Sign out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
