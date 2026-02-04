import { Building2, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getCachedDashboardCounts } from "@/lib/cache";

export default async function DashboardPage() {
  const session = await auth();

  // Fetch cached counts
  const counts = await getCachedDashboardCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session?.user?.name || session?.user?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.employees}</div>
            <p className="text-xs text-muted-foreground">
              {counts.employees === 0 ? "No employees yet" : "Active in system"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.departments}</div>
            <p className="text-xs text-muted-foreground">
              {counts.departments === 0 ? "No departments yet" : "Configured"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.documents}</div>
            <p className="text-xs text-muted-foreground">
              {counts.documents === 0 ? "No documents yet" : "Uploaded"}
            </p>
          </CardContent>
        </Card>
      </div>

      {(session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. Set up departments and designations</p>
            <p>2. Import employee data from Keka or add manually</p>
            <p>3. Upload employee documents</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
