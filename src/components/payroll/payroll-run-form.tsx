'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function PayrollRunForm() {
  const router = useRouter();
  const currentDate = new Date();

  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  async function handleValidate() {
    setValidating(true);
    setError(null);

    try {
      // Check attendance lock
      const lockRes = await fetch(`/api/attendance/lock?month=${month}&year=${year}`);
      const lockData = await lockRes.json();

      if (!lockData.data) {
        setError(`Attendance is not locked for ${MONTHS[month - 1].label} ${year}. Please lock attendance first.`);
        setValidationResult(null);
        return;
      }

      // Check for existing payroll
      const runsRes = await fetch(`/api/payroll/runs?year=${year}`);
      const runsData = await runsRes.json();
      const existing = runsData.data?.find((r: any) => r.month === month && r.status !== 'REVERTED');

      if (existing) {
        setError(`Payroll for ${MONTHS[month - 1].label} ${year} already exists (${existing.status})`);
        setValidationResult(null);
        return;
      }

      // Get employee count
      const empRes = await fetch('/api/employees?status=ACTIVE&limit=1');
      const empData = await empRes.json();

      setValidationResult({
        attendanceLocked: true,
        employeeCount: empData.total || 0,
        period: `${MONTHS[month - 1].label} ${year}`,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start payroll');
      }

      // Redirect to payroll run detail page
      router.push(`/payroll/${data.data.id}`);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Monthly Payroll</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full border rounded p-2"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full border rounded p-2"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handleValidate}
          disabled={validating}
          variant="outline"
          className="w-full"
        >
          {validating ? 'Validating...' : 'Validate'}
        </Button>

        {validationResult && (
          <div className="bg-green-50 p-4 rounded space-y-2">
            <p className="font-medium text-green-800">Ready to run payroll!</p>
            <ul className="text-sm text-green-700 space-y-1">
              <li>Period: {validationResult.period}</li>
              <li>Attendance: Locked</li>
              <li>Employees: {validationResult.employeeCount}</li>
            </ul>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading || !validationResult}
          className="w-full"
        >
          {loading ? 'Starting Payroll...' : 'Run Payroll'}
        </Button>
      </CardContent>
    </Card>
  );
}
