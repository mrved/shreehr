"use client";

import { LogOut, Menu, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: {
    name?: string | null;
    email: string;
    role: string;
  };
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ user, onMenuClick, showMenuButton = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Mobile menu button */}
        {showMenuButton && (
          <button
            type="button"
            className="lg:hidden -m-2.5 p-2.5 text-gray-700 hover:text-gray-900"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        )}
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="flex items-center gap-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
