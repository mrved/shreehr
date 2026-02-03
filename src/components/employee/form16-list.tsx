'use client';

import { FileText, Download } from 'lucide-react';

interface Form16ListProps {
  certificates: {
    financialYear: string;
    startYear: number;
    endYear: number;
  }[];
  employeeId: string;
}

export function Form16List({ certificates, employeeId }: Form16ListProps) {
  if (certificates.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No Form 16 available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Form 16 certificates will be available after the financial year closes and TDS filing is complete.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Card View */}
      <div className="block md:hidden space-y-4">
        {certificates.map((cert) => (
          <div key={cert.financialYear} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  FY {cert.financialYear}
                </h3>
                <p className="text-sm text-gray-500">
                  {cert.startYear}-{cert.endYear}
                </p>
              </div>
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <a
              href={`/api/payroll/tds/form16/${employeeId}?fy=${cert.startYear}`}
              className="flex items-center justify-center gap-2 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download Form 16
            </a>
          </div>
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                Financial Year
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Period
              </th>
              <th className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {certificates.map((cert) => (
              <tr key={cert.financialYear}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                  FY {cert.financialYear}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  April {cert.startYear} - March {cert.endYear}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm">
                  <a
                    href={`/api/payroll/tds/form16/${employeeId}?fy=${cert.startYear}`}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
