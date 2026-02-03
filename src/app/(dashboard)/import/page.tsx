import { KekaImport } from "@/components/import/keka-import";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Import Data from Keka
        </h1>
        <p className="text-gray-600">
          Migrate your employee data, salary history, and leave balances from
          Keka HR exports
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Import Order</h3>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          <li>
            First, import <strong>Employee Data</strong> - this creates employee
            records and auto-creates departments/designations
          </li>
          <li>
            Then, import <strong>Salary History</strong> - links to existing
            employees by Employee Code
          </li>
          <li>
            Finally, import <strong>Leave Balances</strong> - links to existing
            employees by Employee Code
          </li>
        </ol>
      </div>

      <KekaImport />
    </div>
  );
}
