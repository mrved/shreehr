'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodayAttendance {
  check_in: string | null;
  check_out: string | null;
  status: string;
  work_minutes: number | null;
}

interface QuickCheckinWidgetProps {
  todayAttendance: TodayAttendance | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickCheckinWidget({ todayAttendance: initialAttendance }: QuickCheckinWidgetProps) {
  const [attendance, setAttendance] = useState<TodayAttendance | null>(initialAttendance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCheckedIn = attendance?.check_in != null;
  const isCheckedOut = attendance?.check_out != null;

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to check in');
        return;
      }
      const data = await res.json();
      setAttendance({
        check_in: data.check_in,
        check_out: null,
        status: data.status,
        work_minutes: null,
      });
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to check out');
        return;
      }
      const data = await res.json();
      setAttendance({
        check_in: data.check_in,
        check_out: data.check_out,
        status: data.status,
        work_minutes: data.work_minutes ?? null,
      });
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-blue-600" />
          Today's Attendance
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* State: Fully recorded */}
        {isCheckedIn && isCheckedOut && attendance ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-semibold">Attendance Recorded</span>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Checked In</span>
                <span className="font-medium text-gray-900">{formatTime(attendance.check_in!)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Checked Out</span>
                <span className="font-medium text-gray-900">{formatTime(attendance.check_out!)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium text-gray-900">{formatDuration(attendance.work_minutes)}</span>
              </div>
            </div>
          </div>
        ) : isCheckedIn && attendance ? (
          /* State: Checked in, not checked out */
          <div className="space-y-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Checked In</span>
                <span className="font-medium text-gray-900">{formatTime(attendance.check_in!)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Checking Out...' : 'Check Out'}
            </button>
          </div>
        ) : (
          /* State: Not checked in */
          <div className="space-y-3">
            <p className="text-sm text-gray-500">You haven't checked in yet today.</p>
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Checking In...' : 'Check In'}
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
