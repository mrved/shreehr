import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChecklistManager } from "@/components/onboarding/checklist-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function OnboardingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  // RBAC: Only ADMIN and HR_MANAGER can access
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "HR_MANAGER") {
    redirect("/dashboard");
  }

  // Fetch onboarding record
  const record = await prisma.onboardingRecord.findUnique({
    where: { id },
    include: {
      department: true,
      designation: true,
      employee: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });

  if (!record) {
    notFound();
  }

  // Transform checklist to expected format
  const checklist = Array.isArray(record.checklist)
    ? record.checklist.map((item: any) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        assignee: item.assignee,
        due_date: item.due_date,
        required: item.required,
        completed: item.completed || false,
        completed_at: item.completed_at || undefined,
        completed_by_name: item.completed_by_name || undefined,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/onboarding">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Details</h1>
          <p className="text-sm text-gray-500 mt-1">{record.candidate_name}</p>
        </div>
      </div>

      {/* Candidate Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Candidate Information</CardTitle>
            <Badge className={statusColors[record.status]}>{record.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
              <p className="mt-1 text-sm text-gray-900">{record.candidate_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-sm text-gray-900">{record.candidate_email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1 text-sm text-gray-900">{record.candidate_phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Position</h3>
              <p className="mt-1 text-sm text-gray-900">{record.designation.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Department</h3>
              <p className="mt-1 text-sm text-gray-900">{record.department.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Offered Salary</h3>
              <p className="mt-1 text-sm text-gray-900">
                ₹{(record.offered_salary_paise / 100).toLocaleString("en-IN")}/year
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Joining Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {record.joining_date.toLocaleDateString("en-IN")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Offer Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {record.offer_date.toLocaleDateString("en-IN")}
              </p>
            </div>
            {record.offer_sent_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Offer Sent</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(record.offer_sent_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            )}
            {record.offer_accepted_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Offer Accepted</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(record.offer_accepted_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            )}
            {record.employee && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Employee Profile</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {record.employee.first_name} {record.employee.last_name}
                </p>
              </div>
            )}
          </div>

          {/* Status Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {record.status === "PENDING" && (
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Resend Offer Email
              </Button>
            )}
            {record.status === "ACCEPTED" && (
              <form action={`/api/onboarding/${record.id}`} method="PATCH">
                <Button size="sm">Start Onboarding Tasks</Button>
              </form>
            )}
            {record.status === "IN_PROGRESS" && (
              <form action={`/api/onboarding/${record.id}`} method="PATCH">
                <Button size="sm">Mark as Completed</Button>
              </form>
            )}
            {(record.status === "PENDING" || record.status === "ACCEPTED") && (
              <form action={`/api/onboarding/${record.id}`} method="PATCH">
                <Button variant="destructive" size="sm">
                  Cancel Onboarding
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Manager */}
      <ChecklistManager
        onboardingId={record.id}
        checklist={checklist}
        status={record.status}
      />
    </div>
  );
}
