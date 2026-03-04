import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingActionSummary {
  leave: number;
  expense: number;
  profile: number;
  correction: number;
  total: number;
}

interface PendingActionItem {
  id: string;
  type: 'leave' | 'expense' | 'profile' | 'correction';
  title: string;
  employeeName: string;
  createdAt: Date | string;
}

interface PendingActionsWidgetProps {
  summary: PendingActionSummary;
  items: PendingActionItem[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACTION_LINKS: Record<PendingActionItem['type'], string> = {
  leave: '/dashboard/leave',
  expense: '/dashboard/expenses',
  profile: '/dashboard/approvals',
  correction: '/dashboard/attendance/lock',
};

const ACTION_LABELS: Record<PendingActionItem['type'], string> = {
  leave: 'Leave',
  expense: 'Expense',
  profile: 'Profile',
  correction: 'Correction',
};

const ACTION_COLORS: Record<PendingActionItem['type'], string> = {
  leave: 'bg-blue-100 text-blue-700',
  expense: 'bg-amber-100 text-amber-700',
  profile: 'bg-purple-100 text-purple-700',
  correction: 'bg-red-100 text-red-700',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PendingActionsWidget({ summary, items }: PendingActionsWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Inbox className="h-4 w-4 text-orange-600" />
          Pending Actions
          {summary.total > 0 && (
            <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
              {summary.total}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {summary.total === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            All caught up! No pending actions.
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-4 gap-2">
              <SummaryCard label="Leave" count={summary.leave} href="/dashboard/leave" color="border-blue-200 bg-blue-50 text-blue-700" />
              <SummaryCard label="Expenses" count={summary.expense} href="/dashboard/expenses" color="border-amber-200 bg-amber-50 text-amber-700" />
              <SummaryCard label="Profile" count={summary.profile} href="/dashboard/approvals" color="border-purple-200 bg-purple-50 text-purple-700" />
              <SummaryCard label="Corrections" count={summary.correction} href="/dashboard/attendance/lock" color="border-red-200 bg-red-50 text-red-700" />
            </div>

            {/* Recent items */}
            {items.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Recent
                </h4>
                <ul className="space-y-1.5">
                  {items.slice(0, 5).map((item) => {
                    const createdAt = typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt;
                    return (
                      <li key={item.id}>
                        <Link
                          href={ACTION_LINKS[item.type]}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold shrink-0 ${ACTION_COLORS[item.type]}`}>
                            {ACTION_LABELS[item.type]}
                          </span>
                          <span className="flex-1 truncate text-sm text-gray-700">{item.employeeName}</span>
                          <span className="shrink-0 text-xs text-gray-400">
                            {formatDistanceToNow(createdAt, { addSuffix: true })}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  count,
  href,
  color,
}: {
  label: string;
  count: number;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center rounded-lg border p-2 text-center transition-opacity hover:opacity-80 ${color}`}
    >
      <span className="text-lg font-bold leading-tight">{count}</span>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  );
}
