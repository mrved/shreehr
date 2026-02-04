import { redirect } from "next/navigation";
import { ProfileApprovalList } from "@/components/admin/profile-approval-list";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ApprovalsPage() {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect("/login");
  }

  // RBAC: Only ADMIN, SUPER_ADMIN, HR_MANAGER can access
  const canAccess = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(session.user.role);

  if (!canAccess) {
    redirect("/dashboard");
  }

  // Fetch pending profile update requests
  const profileRequests = await prisma.profileUpdateRequest.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      employee: {
        select: {
          id: true,
          employee_code: true,
          first_name: true,
          last_name: true,
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      created_at: "asc",
    },
  });

  // Fetch pending leave requests
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      employee: {
        select: {
          id: true,
          employee_code: true,
          first_name: true,
          last_name: true,
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      created_at: "asc",
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="mt-1 text-sm text-gray-600">Review and process pending approval requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Profile Update Requests</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{profileRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Leave Requests</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{leaveRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            <button className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
              Profile Updates
              {profileRequests.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {profileRequests.length}
                </span>
              )}
            </button>
            <a
              href="/dashboard/leave/approvals"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Leave Requests
              {leaveRequests.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {leaveRequests.length}
                </span>
              )}
            </a>
          </nav>
        </div>
      </div>

      {/* Profile Approvals List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Pending Profile Update Requests
          </h2>
          <ProfileApprovalList
            requests={profileRequests as any}
            onRequestProcessed={() => {
              // Refresh the page to show updated list
              window.location.reload();
            }}
          />
        </div>
      </div>
    </div>
  );
}
