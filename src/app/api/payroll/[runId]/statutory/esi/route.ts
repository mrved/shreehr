import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateESIChallanForPayrollRun } from '@/lib/statutory/file-generators/esi-challan';
import { saveStatutoryFile } from '@/lib/storage';

/**
 * GET /api/payroll/[runId]/statutory/esi
 * Generate and download ESI challan file for a payroll run
 *
 * RBAC: Only ADMIN, PAYROLL_MANAGER can download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // RBAC: Only ADMIN and PAYROLL_MANAGER can download statutory files
  if (
    session.user.role !== 'ADMIN' &&
    session.user.role !== 'SUPER_ADMIN' &&
    session.user.role !== 'PAYROLL_MANAGER'
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { runId } = await params;

  try {
    // Check if payroll run exists
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id: runId },
      include: {
        records: {
          where: {
            status: { in: ['CALCULATED', 'VERIFIED', 'PAID'] },
            esi_applicable: true,
          },
        },
      },
    });

    if (!payrollRun) {
      return NextResponse.json(
        { error: 'Payroll run not found' },
        { status: 404 }
      );
    }

    // Generate ESI challan content
    const esiContent = await generateESIChallanForPayrollRun(runId);

    // Generate filename
    const filename = `ESI_Challan_${payrollRun.month.toString().padStart(2, '0')}_${payrollRun.year}.csv`;

    // Save to storage
    const filepath = await saveStatutoryFile(runId, esiContent, filename);

    // Count records
    const recordCount = payrollRun.records.filter(
      (r) => r.esi_applicable && r.esi_employee_paise > 0
    ).length;

    // Calculate total amount
    const totalAmount = payrollRun.records.reduce(
      (sum, r) => sum + r.esi_employee_paise + r.esi_employer_paise,
      0
    );

    // Track in database
    await prisma.statutoryFile.create({
      data: {
        type: 'ESI_CHALLAN',
        filename,
        filepath,
        record_count: recordCount,
        total_amount: totalAmount,
        month: payrollRun.month,
        year: payrollRun.year,
        payroll_run_id: runId,
        created_by: session.user.id,
      },
    });

    // Return file as downloadable attachment
    return new NextResponse(esiContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(esiContent, 'utf-8').toString(),
      },
    });
  } catch (error) {
    console.error('ESI challan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ESI challan' },
      { status: 500 }
    );
  }
}
