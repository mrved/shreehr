import { redirect } from "next/navigation";
import { ProfileView } from "@/components/employee/profile-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  const employeeId = session.user.employeeId;

  // Fetch employee profile
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      employee_code: true,
      first_name: true,
      middle_name: true,
      last_name: true,
      date_of_birth: true,
      gender: true,
      marital_status: true,
      blood_group: true,
      personal_email: true,
      personal_phone: true,
      emergency_contact: true,
      emergency_phone: true,
      address_line1: true,
      address_line2: true,
      city: true,
      state: true,
      postal_code: true,
      country: true,
      pan_encrypted: true,
      aadhaar_encrypted: true,
      bank_name: true,
      bank_branch: true,
      bank_ifsc: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      designation: {
        select: {
          id: true,
          title: true,
        },
      },
      reporting_manager: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          employee_code: true,
        },
      },
      date_of_joining: true,
      employment_type: true,
      employment_status: true,
      uan: true,
      esic_number: true,
    },
  });

  if (!employee) {
    redirect("/login");
  }

  // Fetch pending profile update request
  const pendingRequest = await prisma.profileUpdateRequest.findFirst({
    where: {
      employee_id: employeeId,
      status: "PENDING",
    },
    select: {
      id: true,
      status: true,
      created_at: true,
    },
  });

  // Mask PII for display
  const maskedEmployee = {
    ...employee,
    pan: employee.pan_encrypted ? `******${employee.pan_encrypted.slice(-4)}` : null,
    aadhaar: employee.aadhaar_encrypted ? `********${employee.aadhaar_encrypted.slice(-4)}` : null,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-600">View and update your personal information</p>
      </div>

      <ProfileView employee={maskedEmployee} pendingRequest={pendingRequest || undefined} />
    </div>
  );
}
