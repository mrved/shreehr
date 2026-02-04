import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewOnboardingPage() {
  const session = await auth();

  // RBAC: Only ADMIN and HR_MANAGER can access
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "HR_MANAGER") {
    redirect("/dashboard");
  }

  // Fetch departments and designations for the form
  const [departments, designations] = await Promise.all([
    prisma.department.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.designation.findMany({
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        title: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Onboarding Record</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add new candidate and send offer letter with onboarding checklist
        </p>
      </div>

      <OnboardingForm departments={departments} designations={designations} />
    </div>
  );
}
