'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  isPaid: boolean;
  year: number;
  opening: number;
  accrued: number;
  used: number;
  pending: number;
  balance: number;
  available: number;
}

interface LeaveBalanceCardsProps {
  balances: LeaveBalance[];
}

export function LeaveBalanceCards({ balances }: LeaveBalanceCardsProps) {
  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No leave balances found. Contact HR to initialize your leave balances.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {balances.map((balance) => {
        const usagePercentage = balance.opening > 0
          ? ((balance.used / balance.opening) * 100)
          : 0;

        return (
          <Card key={balance.leaveTypeId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">
                    {balance.leaveTypeName}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {balance.leaveTypeCode}
                    {!balance.isPaid && ' • Unpaid'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {balance.available}
                  </div>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      usagePercentage >= 80 ? 'bg-red-500' :
                      usagePercentage >= 50 ? 'bg-yellow-500' :
                      'bg-green-500'
                    )}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{balance.opening} days</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                <div>
                  <div className="text-sm font-medium">{balance.used}</div>
                  <div className="text-xs text-muted-foreground">Used</div>
                </div>
                <div>
                  <div className="text-sm font-medium">{balance.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-sm font-medium">{balance.balance}</div>
                  <div className="text-xs text-muted-foreground">Balance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
