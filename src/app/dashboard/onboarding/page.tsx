import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingList } from "@/components/onboarding/onboarding-list";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function OnboardingPage() {
  const session = await auth();

  // RBAC: Only ADMIN and HR_MANAGER can access
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "HR_MANAGER") {
    redirect("/dashboard");
  }

  // Fetch all onboarding records
  const records = await prisma.onboardingRecord.findMany({
    include: {
      department: {
        select: {
          name: true,
        },
      },
      designation: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // Transform for client component
  const transformedRecords = records.map((record) => ({
    id: record.id,
    candidate_name: record.candidate_name,
    position: record.designation.title,
    department: record.department,
    joining_date: record.joining_date.toISOString(),
    status: record.status,
    checklist: Array.isArray(record.checklist) ? record.checklist : [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage candidate onboarding and checklists</p>
        </div>
        <Link href="/dashboard/onboarding/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Onboarding
          </Button>
        </Link>
      </div>

      <OnboardingList records={transformedRecords} />
    </div>
  );
}
