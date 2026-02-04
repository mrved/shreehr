import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/employee/profile-edit-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ProfileEditPage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  const employeeId = session.user.employeeId;

  // Check if pending request exists
  const pendingRequest = await prisma.profileUpdateRequest.findFirst({
    where: {
      employee_id: employeeId,
      status: "PENDING",
    },
  });

  // Fetch current employee data
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      address_line1: true,
      address_line2: true,
      city: true,
      state: true,
      postal_code: true,
      emergency_contact: true,
      emergency_phone: true,
      personal_phone: true,
      personal_email: true,
    },
  });

  if (!employee) {
    redirect("/login");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Request changes to your contact and address information
        </p>
      </div>

      {/* Warning if pending request exists */}
      {pendingRequest && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Existing Request Pending</h3>
            <p className="mt-1 text-sm text-yellow-700">
              You already have a pending profile update request. Please wait for it to be processed
              before submitting a new one. You can view your pending request on your profile page.
            </p>
            <a
              href="/employee/profile"
              className="mt-2 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              Go back to profile
            </a>
          </div>
        </div>
      )}

      {/* Only show form if no pending request */}
      {!pendingRequest && <ProfileEditForm defaultValues={employee} />}
    </div>
  );
}
