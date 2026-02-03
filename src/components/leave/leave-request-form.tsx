'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface LeaveType {
  id: string;
  name: string;
  code: string;
  is_paid: boolean;
  requires_approval: boolean;
  min_days_notice: number;
}

export function LeaveRequestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDayPeriod: 'FIRST_HALF',
    reason: '',
  });

  useEffect(() => {
    async function fetchLeaveTypes() {
      try {
        const res = await fetch('/api/leave-types?activeOnly=true');
        const data = await res.json();
        setLeaveTypes(data);
      } catch (error) {
        console.error('Failed to fetch leave types:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaveTypes();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: 'Leave request submitted successfully' });
        router.push('/leave');
      } else {
        const data = await res.json();
        toast({ title: 'Failed to submit', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to submit leave request', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for Leave</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select
              value={formData.leaveTypeId}
              onValueChange={(value) => setFormData({ ...formData, leaveTypeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map(lt => (
                  <SelectItem key={lt.id} value={lt.id}>
                    {lt.name} ({lt.code})
                    {!lt.is_paid && ' - Unpaid'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({
                  ...formData,
                  startDate: e.target.value,
                  endDate: formData.isHalfDay ? e.target.value : formData.endDate
                })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                disabled={formData.isHalfDay}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="halfDay"
              checked={formData.isHalfDay}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                isHalfDay: checked,
                endDate: checked ? formData.startDate : formData.endDate
              })}
            />
            <Label htmlFor="halfDay">Half Day Leave</Label>
          </div>

          {formData.isHalfDay && (
            <div className="space-y-2">
              <Label>Half Day Period</Label>
              <Select
                value={formData.halfDayPeriod}
                onValueChange={(value) => setFormData({ ...formData, halfDayPeriod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST_HALF">First Half (Morning)</SelectItem>
                  <SelectItem value="SECOND_HALF">Second Half (Afternoon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Enter reason for leave"
              required
              minLength={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Request
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
