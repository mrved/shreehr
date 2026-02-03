import { NextRequest, NextResponse } from 'next/server';
import { checkDeadlineAlerts } from '@/lib/statutory/deadlines';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/statutory-alerts
 *
 * Cron endpoint to check deadlines and send alerts
 * Should be called daily
 *
 * Vercel Cron example (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/statutory-alerts",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkDeadlineAlerts();

    console.log('Statutory alert check completed:', result);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Statutory alert check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
