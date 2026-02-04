"use client";

import { useCallback, useState } from "react";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastState {
  toasts: ToastMessage[];
}

// Simple toast hook using console for now
// Can be replaced with a full toast implementation later
export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const toast = useCallback(({ title, description, variant }: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(7);

    // Log to console for visibility
    if (variant === "destructive") {
      console.error(`[Toast Error] ${title}${description ? `: ${description}` : ""}`);
    } else {
      console.log(`[Toast] ${title}${description ? `: ${description}` : ""}`);
    }

    // Show browser alert for important messages (can be replaced with proper toast UI)
    if (typeof window !== "undefined") {
      // Use a timeout to not block the UI
      setTimeout(() => {
        const message = description ? `${title}\n${description}` : title;
        if (variant === "destructive") {
          // For errors, use alert to ensure user sees them
          alert(message);
        }
      }, 0);
    }

    setState((prev) => ({
      toasts: [...prev.toasts, { id, title, description, variant }],
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setState((prev) => ({
        toasts: prev.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  }, []);

  return { toast, toasts: state.toasts };
}
