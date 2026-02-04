"use client";

import { Download, FileText } from "lucide-react";
import Link from "next/link";

interface PayslipListProps {
  payslips: {
    id: string;
    month: number;
    year: number;
    netSalary: number;
    status: string;
  }[];
}

export function PayslipList({ payslips }: PayslipListProps) {
  if (payslips.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No payslips</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have any payslips available yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Card View */}
      <div className="block md:hidden space-y-4">
        {payslips.map((payslip) => (
          <div key={payslip.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {new Date(payslip.year, payslip.month - 1).toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-sm text-gray-500">Status: {payslip.status}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                {payslip.status}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900">
                ₹
                {(payslip.netSalary / 100).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-gray-500">Net Salary</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/employee/payslips/${payslip.id}`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FileText className="h-4 w-4" />
                View
              </Link>
              <a
                href={`/api/payroll/payslips/${payslip.id}/download`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                Month
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Net Salary
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {payslips.map((payslip) => (
              <tr key={payslip.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                  {new Date(payslip.year, payslip.month - 1).toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  ₹
                  {(payslip.netSalary / 100).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                    {payslip.status}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/employee/payslips/${payslip.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                    >
                      <FileText className="h-4 w-4" />
                      View
                    </Link>
                    <a
                      href={`/api/payroll/payslips/${payslip.id}/download`}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
