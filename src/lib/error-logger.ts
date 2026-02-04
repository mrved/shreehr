/**
 * Error Tracking & Logging System for ShreeHR
 * 
 * Features:
 * - Logs all errors to database with fingerprinting for deduplication
 * - Rate-limited notifications to prevent spam
 * - Quiet hours for non-critical errors (23:00-08:00 IST)
 * - Severity-based notification prioritization
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Error types for categorization
export type ErrorType = 'API' | 'CLIENT' | 'AI_CHAT' | 'AUTH' | 'PAYROLL' | 'ATTENDANCE';

// Severity levels
export type ErrorSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Input interface for logging errors
export interface ErrorLogInput {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  route?: string;
  method?: string;
  userId?: string;
  employeeId?: string;
  metadata?: Record<string, unknown>;
}

// Rate limiting configuration
const RATE_LIMITS = {
  perFingerprint: 60 * 60 * 1000,  // 1 hour - same error won't notify again within this
  globalMax: 10,                    // Max notifications per hour
  quietHoursStart: 23,              // 11 PM IST
  quietHoursEnd: 8,                 // 8 AM IST
};

/**
 * Create a fingerprint for an error to enable deduplication.
 * Same fingerprint = same error (for notification purposes)
 */
export function createFingerprint(
  type: string, 
  message: string, 
  route?: string
): string {
  // Normalize message: remove variable parts like IDs, timestamps, specific values
  const normalizedMessage = message
    .replace(/[a-f0-9]{24,}/gi, '<ID>')  // Remove cuid/ObjectId
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '<TIMESTAMP>')  // ISO dates
    .replace(/\d+/g, '<NUM>')  // Numbers
    .slice(0, 200);  // Limit message length for fingerprint

  const input = `${type}:${route || 'unknown'}:${normalizedMessage}`;
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 64);
}

/**
 * Check if an error should trigger a notification.
 * Considers:
 * - Rate limiting per fingerprint (same error)
 * - Global rate limiting (total notifications/hour)
 * - Quiet hours (except for CRITICAL)
 */
export async function shouldNotify(
  fingerprint: string, 
  severity: ErrorSeverity
): Promise<boolean> {
  const now = new Date();
  
  // Get current hour in IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hour = istTime.getUTCHours();
  
  // Quiet hours check (except CRITICAL)
  if (severity !== 'CRITICAL' && (hour >= RATE_LIMITS.quietHoursStart || hour < RATE_LIMITS.quietHoursEnd)) {
    return false;
  }
  
  // Check fingerprint rate limit (same error within last hour)
  const oneHourAgo = new Date(Date.now() - RATE_LIMITS.perFingerprint);
  const recentSameError = await prisma.errorLog.findFirst({
    where: {
      fingerprint,
      notified: true,
      created_at: { gte: oneHourAgo },
    },
  });
  
  if (recentSameError) {
    return false;
  }
  
  // Check global rate limit
  const globalCount = await prisma.errorLog.count({
    where: {
      notified: true,
      created_at: { gte: oneHourAgo },
    },
  });
  
  if (globalCount >= RATE_LIMITS.globalMax) {
    // Allow CRITICAL to bypass if not too many
    if (severity === 'CRITICAL' && globalCount < RATE_LIMITS.globalMax * 2) {
      return true;
    }
    return false;
  }
  
  return true;
}

/**
 * Log an error to the database.
 * Automatically determines if notification should be triggered.
 * 
 * @returns The created error log entry
 */
export async function logError(input: ErrorLogInput): Promise<{
  id: string;
  fingerprint: string;
  notified: boolean;
}> {
  const fingerprint = createFingerprint(input.type, input.message, input.route);
  const shouldNotifyUser = await shouldNotify(fingerprint, input.severity);
  
  try {
    const errorLog = await prisma.errorLog.create({
      data: {
        fingerprint,
        error_type: input.type,
        severity: input.severity,
        message: input.message.slice(0, 10000), // Limit message length
        stack: input.stack?.slice(0, 50000),     // Limit stack length
        route: input.route?.slice(0, 255),
        method: input.method?.slice(0, 10),
        user_id: input.userId?.slice(0, 50),
        employee_id: input.employeeId,
        metadata: input.metadata as object | undefined,
        notified: shouldNotifyUser,
      },
    });
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ErrorLog] ${input.severity} ${input.type}: ${input.message}`);
    }
    
    return {
      id: errorLog.id,
      fingerprint: errorLog.fingerprint,
      notified: errorLog.notified,
    };
  } catch (dbError) {
    // If DB logging fails, at least log to console
    console.error('[ErrorLog] Failed to log error to database:', dbError);
    console.error('[ErrorLog] Original error:', input);
    
    return {
      id: 'failed',
      fingerprint,
      notified: false,
    };
  }
}

/**
 * Get recent unnotified errors that need attention.
 * Used by monitoring/cron jobs to pick up errors for notification.
 */
export async function getUnnotifiedErrors(limit = 10): Promise<{
  id: string;
  type: string;
  severity: string;
  message: string;
  route: string | null;
  created_at: Date;
}[]> {
  // Get high-priority unnotified errors from the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return prisma.errorLog.findMany({
    where: {
      notified: false,
      severity: { in: ['CRITICAL', 'HIGH'] },
      created_at: { gte: oneDayAgo },
    },
    select: {
      id: true,
      error_type: true,
      severity: true,
      message: true,
      route: true,
      created_at: true,
    },
    orderBy: [
      { severity: 'asc' }, // CRITICAL before HIGH
      { created_at: 'desc' },
    ],
    take: limit,
  }).then(errors => errors.map(e => ({
    id: e.id,
    type: e.error_type,
    severity: e.severity,
    message: e.message,
    route: e.route,
    created_at: e.created_at,
  })));
}

/**
 * Mark errors as notified.
 * Called after successfully sending notifications.
 */
export async function markErrorsNotified(errorIds: string[]): Promise<void> {
  await prisma.errorLog.updateMany({
    where: { id: { in: errorIds } },
    data: { notified: true },
  });
}

/**
 * Get error statistics for a time period.
 * Useful for dashboards and monitoring.
 */
export async function getErrorStats(hoursBack = 24): Promise<{
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  topErrors: { fingerprint: string; message: string; count: number }[];
}> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  
  const [total, byType, bySeverity, topErrors] = await Promise.all([
    // Total count
    prisma.errorLog.count({
      where: { created_at: { gte: since } },
    }),
    
    // Group by type
    prisma.errorLog.groupBy({
      by: ['error_type'],
      where: { created_at: { gte: since } },
      _count: { id: true },
    }),
    
    // Group by severity
    prisma.errorLog.groupBy({
      by: ['severity'],
      where: { created_at: { gte: since } },
      _count: { id: true },
    }),
    
    // Top recurring errors
    prisma.errorLog.groupBy({
      by: ['fingerprint', 'message'],
      where: { created_at: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);
  
  return {
    total,
    byType: Object.fromEntries(byType.map(t => [t.error_type, t._count.id])),
    bySeverity: Object.fromEntries(bySeverity.map(s => [s.severity, s._count.id])),
    topErrors: topErrors.map(e => ({
      fingerprint: e.fingerprint,
      message: e.message.slice(0, 100),
      count: e._count.id,
    })),
  };
}
