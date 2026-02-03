import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { differenceInDays, startOfDay } from 'date-fns';

/**
 * GET /api/dashboard/statutory
 *
 * Returns statutory compliance summary for dashboard widget
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Allow admin, HR, and payroll roles
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = startOfDay(new Date());

  // Get upcoming deadlines (next 14 days)
  const upcomingDeadlines = await prisma.statutoryDeadline.findMany({
    where: {
      status: 'PENDING',
      due_date: {
        gte: today,
        lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { due_date: 'asc' },
    take: 5,
  });

  // Get overdue deadlines
  const overdueDeadlines = await prisma.statutoryDeadline.findMany({
    where: {
      status: 'OVERDUE',
    },
    orderBy: { due_date: 'asc' },
  });

  // Get recently filed (last 7 days)
  const recentlyFiled = await prisma.statutoryDeadline.findMany({
    where: {
      status: 'FILED',
      filed_at: {
        gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { filed_at: 'desc' },
    take: 5,
  });

  // Format deadlines for dashboard
  const formatDeadline = (d: any) => ({
    id: d.id,
    type: d.type,
    description: d.description,
    dueDate: d.due_date,
    month: d.month,
    year: d.year,
    daysRemaining: differenceInDays(d.due_date, today),
    status: d.status,
    filingReference: d.filing_reference,
  });

  // Calculate compliance score
  // Score = (Filed on time / Total deadlines in last 3 months) * 100
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentDeadlinesAll = await prisma.statutoryDeadline.findMany({
    where: {
      due_date: { gte: threeMonthsAgo },
    },
  });

  const filedOnTime = recentDeadlinesAll.filter(d =>
    d.status === 'FILED' && d.filed_at && d.filed_at <= d.due_date
  ).length;

  const totalApplicable = recentDeadlinesAll.filter(d =>
    d.status !== 'NOT_APPLICABLE'
  ).length;

  const complianceScore = totalApplicable > 0
    ? Math.round((filedOnTime / totalApplicable) * 100)
    : 100;

  return NextResponse.json({
    summary: {
      overdue: overdueDeadlines.length,
      dueSoon: upcomingDeadlines.filter(d =>
        differenceInDays(d.due_date, today) <= 3
      ).length,
      upcoming: upcomingDeadlines.length,
      complianceScore,
    },
    upcomingDeadlines: upcomingDeadlines.map(formatDeadline),
    overdueDeadlines: overdueDeadlines.map(formatDeadline),
    recentlyFiled: recentlyFiled.map(d => ({
      ...formatDeadline(d),
      filedAt: d.filed_at,
    })),
  });
}
