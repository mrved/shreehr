import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateECRForPayrollRun } from '@/lib/statutory/file-generators/ecr';
import { saveStatutoryFile } from '@/lib/storage';

/**
 * GET /api/payroll/[runId]/statutory/ecr
 * Generate and download ECR file for a payroll run
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

    // Get establishment details from environment or config
    // TODO: Store in database as company settings
    const establishmentCode = process.env.EPFO_ESTABLISHMENT_CODE || 'ESTCODE001';
    const establishmentName = process.env.COMPANY_NAME || 'ShreeHR Demo Company';

    // Generate ECR file content
    const ecrContent = await generateECRForPayrollRun(
      runId,
      establishmentCode,
      establishmentName
    );

    // Generate filename
    const filename = `ECR_${payrollRun.month.toString().padStart(2, '0')}_${payrollRun.year}.txt`;

    // Save to storage
    const filepath = await saveStatutoryFile(runId, ecrContent, filename);

    // Count records
    const recordCount = payrollRun.records.filter(
      (r) => r.pf_employee_paise > 0
    ).length;

    // Calculate total amount
    const totalAmount = payrollRun.records.reduce(
      (sum, r) => sum + r.pf_employee_paise + r.pf_total_employer_paise,
      0
    );

    // Track in database
    await prisma.statutoryFile.create({
      data: {
        type: 'ECR',
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
    return new NextResponse(ecrContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(ecrContent, 'utf-8').toString(),
      },
    });
  } catch (error) {
    console.error('ECR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ECR file' },
      { status: 500 }
    );
  }
}
