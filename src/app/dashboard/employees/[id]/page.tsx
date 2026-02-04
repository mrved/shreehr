import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmployeeForm } from "@/components/employees/employee-form";

async function getEmployee(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, title: true } },
      reporting_manager: { select: { id: true, first_name: true, last_name: true } },
    },
  });
  return employee;
}

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Employee</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {employee.first_name} {employee.last_name} ({employee.employee_code})
        </p>
      </div>
      <EmployeeForm employee={employee} isEdit />
    </div>
  );
}
