import { EmployeeList } from "@/components/employees/employee-list";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Employees</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage employee records</p>
      </div>
      <EmployeeList />
    </div>
  );
}
