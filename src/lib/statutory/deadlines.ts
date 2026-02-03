import { prisma } from '@/lib/db';
import { addDays, differenceInDays, startOfDay } from 'date-fns';

export type DeadlineType =
  | 'PF_PAYMENT'
  | 'PF_RETURN'
  | 'ESI_PAYMENT'
  | 'ESI_RETURN'
  | 'TDS_DEPOSIT'
  | 'TDS_RETURN_24Q'
  | 'PT_PAYMENT'
  | 'FORM_16';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface DeadlineInfo {
  type: DeadlineType;
  description: string;
  dueDay: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  dueMonth?: number; // For annual deadlines
}

// Standard statutory deadlines
export const STATUTORY_DEADLINES: DeadlineInfo[] = [
  {
    type: 'PF_PAYMENT',
    description: 'PF contribution payment to EPFO',
    dueDay: 15,
    frequency: 'MONTHLY',
  },
  {
    type: 'PF_RETURN',
    description: 'ECR file upload to EPFO portal',
    dueDay: 15,
    frequency: 'MONTHLY',
  },
  {
    type: 'ESI_PAYMENT',
    description: 'ESI contribution payment to ESIC',
    dueDay: 15,
    frequency: 'MONTHLY',
  },
  {
    type: 'TDS_DEPOSIT',
    description: 'TDS deposit to government',
    dueDay: 7,
    frequency: 'MONTHLY',
  },
  {
    type: 'TDS_RETURN_24Q',
    description: 'Form 24Q quarterly TDS return',
    dueDay: 31,
    frequency: 'QUARTERLY',
  },
  {
    type: 'PT_PAYMENT',
    description: 'Professional Tax payment to state',
    dueDay: 20,
    frequency: 'MONTHLY',
  },
  {
    type: 'FORM_16',
    description: 'Form 16 issuance to employees',
    dueDay: 15,
    dueMonth: 6, // June 15
    frequency: 'ANNUAL',
  },
];

export interface DeadlineAlert {
  id: string;
  type: DeadlineType;
  description: string;
  dueDate: Date;
  daysRemaining: number;
  severity: AlertSeverity;
  month: number;
  year: number;
  status: string;
}

/**
 * Calculate due date for a deadline
 */
export function calculateDueDate(
  deadline: DeadlineInfo,
  forMonth: number,
  forYear: number
): Date {
  if (deadline.frequency === 'MONTHLY') {
    // Due on Xth of following month
    const dueMonth = forMonth === 12 ? 1 : forMonth + 1;
    const dueYear = forMonth === 12 ? forYear + 1 : forYear;
    return new Date(dueYear, dueMonth - 1, deadline.dueDay);
  }

  if (deadline.frequency === 'QUARTERLY') {
    // Form 24Q due dates
    // Q1 (Apr-Jun) -> Jul 31
    // Q2 (Jul-Sep) -> Oct 31
    // Q3 (Oct-Dec) -> Jan 31
    // Q4 (Jan-Mar) -> May 31

    const quarter = Math.ceil(forMonth / 3);
    let dueMonth: number;
    let dueYear = forYear;

    switch (quarter) {
      case 2: // Q1: Apr-Jun -> Jul
        dueMonth = 7;
        break;
      case 3: // Q2: Jul-Sep -> Oct
        dueMonth = 10;
        break;
      case 4: // Q3: Oct-Dec -> Jan (next year)
        dueMonth = 1;
        dueYear = forYear + 1;
        break;
      case 1: // Q4: Jan-Mar -> May
        dueMonth = 5;
        break;
      default:
        dueMonth = 7;
    }

    return new Date(dueYear, dueMonth - 1, deadline.dueDay);
  }

  if (deadline.frequency === 'ANNUAL' && deadline.dueMonth) {
    // Form 16 due June 15
    return new Date(forYear, deadline.dueMonth - 1, deadline.dueDay);
  }

  throw new Error(`Unknown deadline frequency: ${deadline.frequency}`);
}

/**
 * Get upcoming statutory deadlines with alert status
 */
export async function getUpcomingDeadlines(
  lookAheadDays: number = 30
): Promise<DeadlineAlert[]> {
  const today = startOfDay(new Date());
  const futureDate = addDays(today, lookAheadDays);

  // Get pending and overdue deadlines
  const deadlines = await prisma.statutoryDeadline.findMany({
    where: {
      status: { in: ['PENDING', 'OVERDUE'] },
      due_date: { lte: futureDate },
    },
    orderBy: { due_date: 'asc' },
  });

  return deadlines.map(d => {
    const daysRemaining = differenceInDays(d.due_date, today);
    let severity: AlertSeverity = 'INFO';

    if (daysRemaining < 0) {
      severity = 'CRITICAL'; // Overdue
    } else if (daysRemaining <= 1) {
      severity = 'CRITICAL';
    } else if (daysRemaining <= 3) {
      severity = 'WARNING';
    }

    return {
      id: d.id,
      type: d.type as DeadlineType,
      description: d.description,
      dueDate: d.due_date,
      daysRemaining,
      severity,
      month: d.month,
      year: d.year,
      status: d.status,
    };
  });
}

/**
 * Generate deadline records for a month
 * Call this at the start of each month or when payroll is run
 */
export async function generateDeadlinesForMonth(
  month: number,
  year: number
): Promise<number> {
  let created = 0;

  for (const deadline of STATUTORY_DEADLINES) {
    // Skip non-monthly deadlines for regular generation
    if (deadline.frequency !== 'MONTHLY') continue;

    const dueDate = calculateDueDate(deadline, month, year);

    // Upsert deadline
    await prisma.statutoryDeadline.upsert({
      where: {
        type_month_year: {
          type: deadline.type,
          month,
          year,
        },
      },
      create: {
        type: deadline.type,
        description: deadline.description,
        month,
        year,
        due_date: dueDate,
        status: 'PENDING',
      },
      update: {
        due_date: dueDate,
        description: deadline.description,
      },
    });

    created++;
  }

  return created;
}

/**
 * Check and send deadline alerts
 * Call this daily via cron
 */
export async function checkDeadlineAlerts(): Promise<{
  alertsSent: number;
  overdueMarked: number;
}> {
  const today = startOfDay(new Date());
  let alertsSent = 0;
  let overdueMarked = 0;

  // Get all pending deadlines
  const deadlines = await prisma.statutoryDeadline.findMany({
    where: {
      status: 'PENDING',
    },
  });

  for (const deadline of deadlines) {
    const daysRemaining = differenceInDays(deadline.due_date, today);

    // Mark overdue
    if (daysRemaining < 0 && deadline.status === 'PENDING') {
      await prisma.statutoryDeadline.update({
        where: { id: deadline.id },
        data: {
          status: 'OVERDUE',
          overdue_alert_sent: true,
        },
      });
      overdueMarked++;
      alertsSent++;
      continue;
    }

    // 7-day alert
    if (daysRemaining <= 7 && daysRemaining > 3 && !deadline.alert_7_day_sent) {
      await prisma.statutoryDeadline.update({
        where: { id: deadline.id },
        data: { alert_7_day_sent: true },
      });
      alertsSent++;
    }

    // 3-day alert
    if (daysRemaining <= 3 && daysRemaining > 1 && !deadline.alert_3_day_sent) {
      await prisma.statutoryDeadline.update({
        where: { id: deadline.id },
        data: { alert_3_day_sent: true },
      });
      alertsSent++;
    }

    // 1-day alert
    if (daysRemaining <= 1 && daysRemaining >= 0 && !deadline.alert_1_day_sent) {
      await prisma.statutoryDeadline.update({
        where: { id: deadline.id },
        data: { alert_1_day_sent: true },
      });
      alertsSent++;
    }
  }

  return { alertsSent, overdueMarked };
}

/**
 * Mark a deadline as filed
 */
export async function markDeadlineFiled(
  deadlineId: string,
  filedBy: string,
  details: {
    filingReference?: string;
    amountFiledPaise?: number;
  }
): Promise<void> {
  await prisma.statutoryDeadline.update({
    where: { id: deadlineId },
    data: {
      status: 'FILED',
      filed_at: new Date(),
      filed_by: filedBy,
      filing_reference: details.filingReference,
      amount_filed_paise: details.amountFiledPaise,
    },
  });
}
