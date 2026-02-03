'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface LockStatus {
  month: number;
  year: number;
  isLocked: boolean;
  lock?: {
    locked_at: string;
    locker: { name: string };
    unlock_requested_at?: string;
    unlock_reason?: string;
    unlock_approved_at?: string;
  };
  daysUntilAutoLock: number | null;
  canUnlock: boolean;
}

interface Correction {
  id: string;
  attendance: {
    date: string;
    employee: { first_name: string; last_name: string; employee_code: string };
  };
  new_check_in?: string;
  new_check_out?: string;
  reason: string;
  status: string;
  created_at: string;
}

export function AttendanceLockManager() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lockRes, corrRes] = await Promise.all([
        fetch(`/api/attendance/lock?month=${month}&year=${year}`),
        fetch(`/api/attendance/corrections?status=PENDING&limit=50`)
      ]);

      const lockData = await lockRes.json();
      const corrData = await corrRes.json();

      setLockStatus(lockData);
      setCorrections(corrData.corrections || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLockAction(action: string, reason?: string) {
    setActionLoading(true);
    try {
      const res = await fetch('/api/attendance/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, action, reason }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: data.message });
        setDialogOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: 'Action failed', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Lock action error:', error);
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setUnlockReason('');
    }
  }

  async function handleCorrection(id: string, action: 'approve' | 'reject', rejectionReason?: string) {
    try {
      const res = await fetch(`/api/attendance/corrections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }),
      });

      if (res.ok) {
        toast({ title: `Correction ${action}d` });
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: 'Action failed', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Correction action error:', error);
      toast({ title: 'Action failed', variant: 'destructive' });
    }
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatTime(isoString?: string) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector and Lock Status */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Lock Status</CardTitle>
          <CardDescription>
            Lock attendance 5 days before payroll cut-off to ensure accurate calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${lockStatus?.isLocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {lockStatus?.isLocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                  </svg>
                )}
              </div>

              <div>
                <p className="font-medium">
                  {months[month - 1]} {year}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lockStatus?.isLocked
                    ? `Locked on ${formatDate(lockStatus.lock!.locked_at)} by ${lockStatus.lock!.locker.name}`
                    : 'Not locked - attendance can be modified'}
                </p>
                {lockStatus?.lock?.unlock_approved_at && (
                  <Badge variant="secondary" className="mt-1">Unlock Approved</Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!lockStatus?.isLocked && (
                <Button onClick={() => handleLockAction('lock')} disabled={actionLoading}>
                  {actionLoading && <span className="animate-spin mr-2">...</span>}
                  Lock Period
                </Button>
              )}

              {lockStatus?.isLocked && !lockStatus.lock?.unlock_requested_at && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Request Unlock
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Unlock</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Reason for unlock</Label>
                        <Textarea
                          value={unlockReason}
                          onChange={(e) => setUnlockReason(e.target.value)}
                          placeholder="Explain why corrections are needed..."
                        />
                      </div>
                      <Button
                        onClick={() => handleLockAction('request-unlock', unlockReason)}
                        disabled={!unlockReason || actionLoading}
                      >
                        Submit Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {lockStatus?.lock?.unlock_requested_at && !lockStatus.lock.unlock_approved_at && (
                <Button onClick={() => handleLockAction('approve-unlock')} disabled={actionLoading}>
                  Approve Unlock
                </Button>
              )}

              {lockStatus?.lock?.unlock_approved_at && (
                <Button onClick={() => handleLockAction('relock')} disabled={actionLoading} variant="outline">
                  Re-lock Period
                </Button>
              )}
            </div>
          </div>

          {lockStatus && lockStatus.daysUntilAutoLock !== null && lockStatus.daysUntilAutoLock <= 5 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                {lockStatus.daysUntilAutoLock === 0
                  ? 'This period should be locked today for payroll processing'
                  : `${lockStatus.daysUntilAutoLock} days until recommended lock date`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Corrections */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Correction Requests</CardTitle>
          <CardDescription>
            Review and approve attendance corrections for locked periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {corrections.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending corrections</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>New Check-In</TableHead>
                  <TableHead>New Check-Out</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corrections.map(corr => (
                  <TableRow key={corr.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {corr.attendance.employee.first_name} {corr.attendance.employee.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {corr.attendance.employee.employee_code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(corr.attendance.date)}</TableCell>
                    <TableCell>{formatTime(corr.new_check_in)}</TableCell>
                    <TableCell>{formatTime(corr.new_check_out)}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={corr.reason}>
                      {corr.reason}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCorrection(corr.id, 'approve')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) handleCorrection(corr.id, 'reject', reason);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
