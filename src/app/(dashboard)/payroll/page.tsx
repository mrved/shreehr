'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  current_stage: string;
  total_employees: number;
  success_count: number;
  error_count: number;
  completed_at?: string;
  _count: { records: number };
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function PayrollDashboard() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  async function fetchRuns() {
    try {
      const res = await fetch('/api/payroll/runs?limit=12');
      const data = await res.json();
      setRuns(data.data || []);
    } catch (error) {
      console.error('Failed to fetch payroll runs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <div className="space-x-2">
          <Link href="/payroll/salary-structures">
            <Button variant="outline">Salary Structures</Button>
          </Link>
          <Link href="/payroll/run">
            <Button>Run Payroll</Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Last Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {runs[0] ? `${MONTHS[runs[0].month - 1]} ${runs[0].year}` : 'None'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Employees Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {runs[0]?._count?.records || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`px-2 py-1 rounded text-sm ${getStatusColor(runs[0]?.status || '')}`}>
              {runs[0]?.status || 'N/A'}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {runs[0]?.error_count || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payroll Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payroll Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : runs.length === 0 ? (
            <p className="text-gray-500">No payroll runs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Period</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Employees</th>
                    <th className="text-left py-2">Completed</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        {MONTHS[run.month - 1]} {run.year}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(run.status)}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="py-2">{run._count.records}</td>
                      <td className="py-2">
                        {run.completed_at
                          ? new Date(run.completed_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-2">
                        <Link href={`/payroll/${run.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
