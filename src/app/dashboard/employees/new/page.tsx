import { EmployeeForm } from "@/components/employees/employee-form";

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Employee</h1>
        <p className="text-gray-600 dark:text-gray-400">Create a new employee record</p>
      </div>
      <EmployeeForm />
    </div>
  );
}
