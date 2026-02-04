"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FloatingChatButtonProps {
  /** Target chat URL - defaults to /employee/chat */
  href?: string;
  /** Additional CSS classes */
  className?: string;
}

export function FloatingChatButton({ 
  href = "/employee/chat",
  className 
}: FloatingChatButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        // Position
        "fixed bottom-20 right-4 z-40",
        // Desktop: above mobile nav is fine, adjust position
        "md:bottom-6 md:right-6",
        // Size & shape - 48px minimum tap target
        "flex h-14 w-14 items-center justify-center rounded-full",
        // Colors
        "bg-primary text-primary-foreground",
        // Shadow & effects
        "shadow-lg hover:shadow-xl",
        // Transitions
        "transition-all duration-200 hover:scale-105",
        // Focus state
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        className
      )}
      aria-label="Ask HR - Open chat"
    >
      <MessageCircle className="h-6 w-6" />
      {/* Pulse indicator for attention */}
      <span className="absolute -right-1 -top-1 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
      </span>
    </Link>
  );
}
