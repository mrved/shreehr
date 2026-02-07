import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { EmployeeLayoutClient } from "./layout-client";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect admins and HR managers to dashboard (they use admin portal)
  if (
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "HR_MANAGER" ||
    session.user.role === "PAYROLL_MANAGER"
  ) {
    redirect("/dashboard");
  }

  // Only EMPLOYEE role can access this portal
  if (session.user.role !== "EMPLOYEE") {
    redirect("/login");
  }

  return <EmployeeLayoutClient user={session.user}>{children}</EmployeeLayoutClient>;
}
