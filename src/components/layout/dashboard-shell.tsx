"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface DashboardShellProps {
  user: {
    name?: string | null;
    email: string;
    role: string;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        role={user.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-64">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
