'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  employee_code: string;
  todayStatus?: string;
  checkIn?: string;
  checkOut?: string;
  missingPunch: boolean;
}

interface AttendanceRecord {
  employee_id: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
}

export function TeamAttendance() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchTeamAttendance();
  }, []);

  async function fetchTeamAttendance() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get team members (direct reports)
      const empRes = await fetch('/api/employees?limit=100');
      const empData = await empRes.json();

      // Get today's attendance for all
      const attRes = await fetch(`/api/attendance?startDate=${today}&endDate=${today}&limit=100`);
      const attData = await attRes.json();

      const attendanceMap = new Map<string, AttendanceRecord>(
        (attData.attendances || []).map((a: AttendanceRecord) => [a.employee_id, a])
      );

      const teamMembers: TeamMember[] = (empData.employees || []).map((emp: any) => {
        const att = attendanceMap.get(emp.id);
        return {
          id: emp.id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          employee_code: emp.employee_code,
          todayStatus: att?.status || 'NOT_RECORDED',
          checkIn: att?.check_in || undefined,
          checkOut: att?.check_out || undefined,
          missingPunch: !!att?.check_in && !att?.check_out,
        };
      });

      setTeam(teamMembers);
    } catch (error) {
      console.error('Failed to fetch team attendance:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTeam = team.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'present') return m.todayStatus === 'PRESENT' || m.todayStatus === 'HALF_DAY';
    if (filter === 'absent') return m.todayStatus === 'ABSENT' || m.todayStatus === 'NOT_RECORDED';
    if (filter === 'missing') return m.missingPunch;
    return true;
  });

  function formatTime(isoString?: string) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PRESENT: 'default',
      HALF_DAY: 'secondary',
      ABSENT: 'destructive',
      ON_LEAVE: 'outline',
      NOT_RECORDED: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  const missingCount = team.filter(m => m.missingPunch).length;
  const absentCount = team.filter(m => m.todayStatus === 'ABSENT' || m.todayStatus === 'NOT_RECORDED').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Attendance</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {team.length} team members | {absentCount} absent | {missingCount} missing punches
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="missing">Missing Punch</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeam.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{member.first_name} {member.last_name}</p>
                      <p className="text-xs text-muted-foreground">{member.employee_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(member.todayStatus || 'NOT_RECORDED')}</TableCell>
                  <TableCell>{formatTime(member.checkIn)}</TableCell>
                  <TableCell>{formatTime(member.checkOut)}</TableCell>
                  <TableCell>
                    {member.missingPunch && (
                      <span title="Missing check-out">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
