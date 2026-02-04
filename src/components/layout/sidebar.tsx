"use client";

import { Building2, FileText, Home, Settings, Upload, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "EMPLOYEE"],
  },
  { name: "Employees", href: "/dashboard/employees", icon: Users, roles: ["ADMIN", "HR_MANAGER"] },
  {
    name: "Departments",
    href: "/dashboard/departments",
    icon: Building2,
    roles: ["ADMIN", "HR_MANAGER"],
  },
  {
    name: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
    roles: ["ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  { name: "Import Data", href: "/dashboard/import", icon: Upload, roles: ["ADMIN"] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = navigation.filter((item) => item.roles.includes(role));

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <span className="text-xl font-bold text-gray-900">ShreeHR</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul className="flex flex-1 flex-col gap-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex gap-x-3 rounded-md p-2 text-sm font-medium",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
