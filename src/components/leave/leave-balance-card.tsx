'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  isPaid: boolean;
  opening: number;
  used: number;
  pending: number;
  balance: number;
  available: number;
}

export function LeaveBalanceCard() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBalances() {
      try {
        const res = await fetch('/api/leave-balances');
        const data = await res.json();
        setBalances(data.balances || []);
      } catch (error) {
        console.error('Failed to fetch leave balances:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBalances();
  }, []);

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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {balances.map(balance => {
        const usedPercent = balance.opening > 0 ? (balance.used / balance.opening) * 100 : 0;
        const pendingPercent = balance.opening > 0 ? (balance.pending / balance.opening) * 100 : 0;

        return (
          <Card key={balance.leaveTypeId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                {balance.leaveTypeName}
                <span className="text-xs text-muted-foreground">{balance.leaveTypeCode}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-2xl font-bold">
                  <span>{balance.available}</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    of {balance.opening}
                  </span>
                </div>

                <Progress value={usedPercent + pendingPercent} className="h-2" />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Used: {balance.used}</span>
                  {balance.pending > 0 && <span>Pending: {balance.pending}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
