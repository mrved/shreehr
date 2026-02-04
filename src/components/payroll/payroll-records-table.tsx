"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PayrollRecord {
  id: string;
  employee: {
    id: string;
    employee_code: string;
    first_name: string;
    last_name: string;
    department: { name: string };
  };
  gross_salary_paise: number;
  total_deductions_paise: number;
  net_salary_paise: number;
  status: string;
  error?: string;
}

interface Props {
  records: PayrollRecord[];
  runId: string;
}

function formatCurrency(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(paise / 100);
}

export function PayrollRecordsTable({ records, runId }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);

  async function downloadPayslip(employeeId: string) {
    setDownloading(employeeId);
    try {
      const res = await fetch(`/api/payroll/${runId}/payslips/${employeeId}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${employeeId}.pdf`;
      a.click();
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-2">Employee</th>
              <th className="text-left py-3 px-2">Department</th>
              <th className="text-right py-3 px-2">Gross</th>
              <th className="text-right py-3 px-2">Deductions</th>
              <th className="text-right py-3 px-2">Net Pay</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-2">
                  <div>
                    <p className="font-medium">
                      {record.employee.first_name} {record.employee.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{record.employee.employee_code}</p>
                  </div>
                </td>
                <td className="py-2 px-2 text-sm">{record.employee.department.name}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(record.gross_salary_paise)}</td>
                <td className="py-2 px-2 text-right text-red-600">
                  {formatCurrency(record.total_deductions_paise)}
                </td>
                <td className="py-2 px-2 text-right font-medium">
                  {formatCurrency(record.net_salary_paise)}
                </td>
                <td className="py-2 px-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      record.status === "CALCULATED" || record.status === "VERIFIED"
                        ? "bg-green-100 text-green-800"
                        : record.status === "ERROR"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100"
                    }`}
                  >
                    {record.status}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPayslip(record.employee.id)}
                    disabled={downloading === record.employee.id}
                  >
                    {downloading === record.employee.id ? "..." : "Payslip"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {records.map((record) => (
          <Card key={record.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {record.employee.first_name} {record.employee.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{record.employee.employee_code}</p>
                    <p className="text-sm text-gray-600">{record.employee.department.name}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      record.status === "CALCULATED" || record.status === "VERIFIED"
                        ? "bg-green-100 text-green-800"
                        : record.status === "ERROR"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Gross</p>
                    <p className="font-medium text-sm">{formatCurrency(record.gross_salary_paise)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Deductions</p>
                    <p className="font-medium text-sm text-red-600">
                      {formatCurrency(record.total_deductions_paise)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Net Pay</p>
                    <p className="font-semibold text-sm text-green-700">
                      {formatCurrency(record.net_salary_paise)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => downloadPayslip(record.employee.id)}
                  disabled={downloading === record.employee.id}
                >
                  {downloading === record.employee.id ? "Downloading..." : "Download Payslip"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
