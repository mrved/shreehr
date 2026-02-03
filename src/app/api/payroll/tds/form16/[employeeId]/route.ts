import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { renderToStream } from '@react-pdf/renderer';
import {
  Form16Document,
  generateForm16Data,
} from '@/lib/statutory/file-generators/form16';

// Company TDS details - should be in config/database
// TODO: Move to database settings in Phase 4
const DEDUCTOR_DETAILS = {
  tan: process.env.COMPANY_TAN || 'BLRS00000A',
  pan: process.env.COMPANY_PAN || 'AABCS0000A',
  name: process.env.COMPANY_NAME || 'SHREEHR DEMO COMPANY',
  address: process.env.COMPANY_ADDRESS || 'Bangalore, Karnataka 560001',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { employeeId } = await params;
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || '0');

  if (!year) {
    return NextResponse.json(
      { error: 'Financial year is required' },
      { status: 400 }
    );
  }

  // Check permissions
  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'].includes(
    session.user.role
  );

  if (!isAdmin) {
    // Employees can only download their own Form 16
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { employee_id: true },
    });

    if (user?.employee_id !== employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Verify employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  try {
    // Generate Form 16 data
    const data = await generateForm16Data(employeeId, year, DEDUCTOR_DETAILS);

    // Generate PDF
    const stream = await renderToStream(
      <Form16Document data={data} />
    );

    const filename = `Form16_${employee.employee_code}_FY${year}-${(year + 1).toString().slice(-2)}.pdf`;

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Form 16 generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Form 16', details: error.message },
      { status: 500 }
    );
  }
}
