'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AttendanceStatus {
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  workMinutes?: number;
}

export function CheckInButton() {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?startDate=${today}&endDate=${today}`);
      const data = await res.json();

      if (data.attendances && data.attendances.length > 0) {
        const todayRecord = data.attendances[0];
        setStatus({
          checkedIn: !!todayRecord.check_in,
          checkedOut: !!todayRecord.check_out,
          checkInTime: todayRecord.check_in,
          checkOutTime: todayRecord.check_out,
          workMinutes: todayRecord.work_minutes,
        });
      } else {
        setStatus({ checkedIn: false, checkedOut: false });
      }
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
      setStatus({ checkedIn: false, checkedOut: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    setActionLoading(true);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        toast({ title: 'Checked in successfully' });
        fetchStatus();
      } else {
        const data = await res.json();
        toast({ title: 'Check-in failed', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Check-in failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    try {
      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        toast({ title: 'Checked out successfully' });
        fetchStatus();
      } else {
        const data = await res.json();
        toast({ title: 'Check-out failed', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Check-out failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  function formatTime(isoString: string) {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Today's Attendance</p>
              {status?.checkedIn && (
                <p className="text-sm">
                  In: {formatTime(status.checkInTime!)}
                  {status.checkedOut && ` | Out: ${formatTime(status.checkOutTime!)}`}
                </p>
              )}
              {status?.workMinutes && status.workMinutes > 0 && (
                <p className="text-sm font-medium">
                  Work: {formatDuration(status.workMinutes)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!status?.checkedIn && (
              <Button onClick={handleCheckIn} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
                Check In
              </Button>
            )}

            {status?.checkedIn && !status?.checkedOut && (
              <Button onClick={handleCheckOut} disabled={actionLoading} variant="outline">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                Check Out
              </Button>
            )}

            {status?.checkedOut && (
              <Badge variant="secondary">Day Complete</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
