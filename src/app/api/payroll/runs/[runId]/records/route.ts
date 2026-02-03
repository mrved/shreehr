import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/payroll/runs/[runId]/records - Get records for run with employee join
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
    const records = await prisma.payrollRecord.findMany({
      where: { payroll_run_id: runId },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
      orderBy: [
        { employee: { employee_code: 'asc' } },
      ],
    });

    return NextResponse.json({ data: records });
  } catch (error: any) {
    console.error('Failed to fetch payroll records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll records', details: error.message },
      { status: 500 }
    );
  }
}
