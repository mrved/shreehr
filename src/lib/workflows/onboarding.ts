import type { OnboardingStatus } from "@prisma/client";
import type { ChecklistItem } from "@/lib/validations/onboarding";

/**
 * Onboarding workflow helpers
 */

// Allowed status transitions
export const ALLOWED_TRANSITIONS: Record<OnboardingStatus, OnboardingStatus[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionOnboarding(
  from: OnboardingStatus,
  to: OnboardingStatus,
): { valid: boolean; error?: string } {
  const allowedStates = ALLOWED_TRANSITIONS[from];

  if (!allowedStates.includes(to)) {
    return {
      valid: false,
      error: `Cannot transition from ${from} to ${to}. Allowed transitions: ${allowedStates.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Generate default onboarding checklist based on joining date
 */
export function generateDefaultChecklist(joiningDate: Date): ChecklistItem[] {
  const joining = new Date(joiningDate);

  // Calculate dates relative to joining date
  const twoDaysBefore = new Date(joining);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

  const oneDayBefore = new Date(joining);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);

  return [
    {
      id: crypto.randomUUID(),
      category: "IT",
      title: "Laptop Provisioning",
      description: "Provision laptop with required software and access",
      assignedTo: "IT_TEAM",
      dueDate: twoDaysBefore,
      completedAt: null,
      completedBy: null,
      required: true,
    },
    {
      id: crypto.randomUUID(),
      category: "IT",
      title: "Email Account Creation",
      description: "Create company email account and provide credentials",
      assignedTo: "IT_TEAM",
      dueDate: oneDayBefore,
      completedAt: null,
      completedBy: null,
      required: true,
    },
    {
      id: crypto.randomUUID(),
      category: "ADMIN",
      title: "Desk Assignment",
      description: "Assign desk and workspace for new employee",
      assignedTo: "ADMIN_TEAM",
      dueDate: oneDayBefore,
      completedAt: null,
      completedBy: null,
      required: true,
    },
    {
      id: crypto.randomUUID(),
      category: "HR",
      title: "Documentation Collection",
      description: "Collect required documents: PAN, Aadhaar, bank details, certificates",
      assignedTo: "HR_TEAM",
      dueDate: joining,
      completedAt: null,
      completedBy: null,
      required: true,
    },
    {
      id: crypto.randomUUID(),
      category: "MANAGER",
      title: "Welcome Meeting",
      description: "Conduct welcome meeting and team introduction",
      assignedTo: "MANAGER",
      dueDate: joining,
      completedAt: null,
      completedBy: null,
      required: true,
    },
  ];
}

/**
 * Calculate checklist progress
 */
export function calculateChecklistProgress(items: ChecklistItem[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = items.length;
  const completed = items.filter((item) => item.completedAt !== null).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    percentage,
  };
}
