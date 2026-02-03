'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PayrollRecordsTable } from '@/components/payroll/payroll-records-table';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  current_stage: string;
  total_employees: number;
  processed_count: number;
  success_count: number;
  error_count: number;
  started_at?: string;
  completed_at?: string;
}

export default function PayrollRunDetailPage() {
  const params = useParams();
  const runId = params.runId as string;

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Poll for updates if processing
    const interval = setInterval(() => {
      if (run?.status === 'PROCESSING') {
        fetchData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [runId, run?.status]);

  async function fetchData() {
    try {
      const [runRes, recordsRes] = await Promise.all([
        fetch(`/api/payroll/runs/${runId}`),
        fetch(`/api/payroll/runs/${runId}/records`),
      ]);

      const runData = await runRes.json();
      const recordsData = await recordsRes.json();

      setRun(runData.data);
      setRecords(recordsData.data || []);
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!run) {
    return <div className="p-6">Payroll run not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Payroll: {MONTHS[run.month - 1]} {run.year}
          </h1>
          <p className="text-gray-500">
            {run.status === 'PROCESSING'
              ? `Processing... (${run.current_stage})`
              : run.status}
          </p>
        </div>

        <div className="space-x-2">
          {run.status === 'COMPLETED' && (
            <>
              <Link href={`/api/payroll/${runId}/statutory/ecr`}>
                <Button variant="outline">Download ECR</Button>
              </Link>
              <Link href={`/api/payroll/${runId}/statutory/esi`}>
                <Button variant="outline">Download ESI</Button>
              </Link>
              <Link href={`/api/payroll/${runId}/payslips/download-all`}>
                <Button>Download All Payslips</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold">{run.total_employees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Processed</p>
            <p className="text-2xl font-bold">{run.processed_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Success</p>
            <p className="text-2xl font-bold text-green-600">{run.success_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Errors</p>
            <p className="text-2xl font-bold text-red-600">{run.error_count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Processing Progress */}
      {run.status === 'PROCESSING' && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-blue-600 rounded transition-all"
                    style={{
                      width: `${(run.processed_count / run.total_employees) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {run.processed_count} / {run.total_employees}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Current stage: {run.current_stage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payroll Records */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-gray-500">No records yet</p>
          ) : (
            <PayrollRecordsTable records={records} runId={runId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
