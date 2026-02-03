import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  generateForm24Q,
  generateForm24QJSON,
} from '@/lib/statutory/file-generators/form24q';

// Company TDS details - should be in config/database
// TODO: Move to database settings in Phase 4
const DEDUCTOR_DETAILS = {
  tan: process.env.COMPANY_TAN || 'BLRS00000A',
  name: process.env.COMPANY_NAME || 'SHREEHR DEMO COMPANY',
  pan: process.env.COMPANY_PAN || 'AABCS0000A',
  address: process.env.COMPANY_ADDRESS || 'Bangalore, Karnataka 560001',
  responsiblePerson: process.env.COMPANY_RESPONSIBLE_PERSON || 'Admin User',
  responsibleDesignation: process.env.COMPANY_RESPONSIBLE_DESIGNATION || 'Director',
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admin/payroll roles
  if (!['SUPER_ADMIN', 'ADMIN', 'PAYROLL_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const quarter = parseInt(searchParams.get('quarter') || '0');
  const year = parseInt(searchParams.get('year') || '0');

  if (!quarter || quarter < 1 || quarter > 4) {
    return NextResponse.json(
      { error: 'Invalid quarter (must be 1-4)' },
      { status: 400 }
    );
  }

  if (!year) {
    return NextResponse.json(
      { error: 'Financial year is required' },
      { status: 400 }
    );
  }

  try {
    const data = await generateForm24Q(quarter, year, DEDUCTOR_DETAILS);

    // Return as JSON for preview/preparation
    const format = searchParams.get('format') || 'json';

    if (format === 'download') {
      const content = generateForm24QJSON(data);
      const filename = `Form24Q_Q${quarter}_FY${year}-${(year + 1).toString().slice(-2)}.json`;

      return new Response(content, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      data,
      summary: {
        quarter,
        financialYear: `${year}-${(year + 1).toString().slice(-2)}`,
        employeeCount: data.annexureI.deductees.length,
        totalTDSDeducted: data.annexureI.totalTDSDeducted,
        hasAnnexureII: !!data.annexureII,
      },
    });
  } catch (error: any) {
    console.error('Form 24Q generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Form 24Q', details: error.message },
      { status: 500 }
    );
  }
}
