import { notFound } from 'next/navigation';
import { EmployeeForm } from '@/components/employees/employee-form';

async function getEmployee(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/employees/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
