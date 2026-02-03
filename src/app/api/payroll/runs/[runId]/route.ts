import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/payroll/runs/[runId] - Get single run details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { runId } = await params;

  try {
    const run = await prisma.payrollRun.findUnique({
      where: { id: runId },
      include: {
        _count: {
          select: { records: true },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    return NextResponse.json({ data: run });
  } catch (error: any) {
    console.error('Failed to fetch payroll run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll run', details: error.message },
      { status: 500 }
    );
  }
}
