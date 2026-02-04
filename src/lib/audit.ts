/**
 * Audit Logging Utility
 * 
 * Centralized logging for sensitive operations including:
 * - User authentication events (LOGIN, LOGOUT)
 * - PII access (VIEW_PII, EXPORT_PII)
 * - AI tool executions (TOOL_EXEC)
 * - Data modifications (CREATE, UPDATE, DELETE)
 */

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Audit action types
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'VIEW_PII'
  | 'EXPORT_PII'
  | 'TOOL_EXEC'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PAYROLL_RUN'
  | 'SALARY_VIEW'
  | 'BANK_DETAILS_VIEW'
  | 'DOCUMENT_ACCESS'
  | 'PERMISSION_DENIED';

// Resource types for categorization
export type AuditResource =
  | 'User'
  | 'Employee'
  | 'Payroll'
  | 'SalaryRecord'
  | 'SalaryStructure'
  | 'LeaveRequest'
  | 'Attendance'
  | 'Document'
  | 'BankDetails'
  | 'AITool'
  | 'PolicyDocument'
  | 'ExpenseClaim'
  | 'Loan'
  | 'System';

export interface AuditLogInput {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  userId?: string | null; // Override for cases where session isn't available
}

/**
 * Log an audit event.
 * Automatically extracts user from session and request headers.
 * Fails silently to not interrupt main operations.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    // Get user from session if not provided
    let userId = input.userId;
    if (!userId) {
      const session = await auth();
      userId = session?.user?.id ?? null;
    }

    // Get request headers for IP and user agent
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      const headersList = await headers();
      ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
        || headersList.get('x-real-ip') 
        || null;
      userAgent = headersList.get('user-agent') || null;
    } catch {
      // Headers not available (e.g., in non-request context)
    }

    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: input.action,
        resource: input.resource,
        resource_id: input.resourceId,
        details: input.details ? JSON.parse(JSON.stringify(input.details)) : undefined,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should never break main functionality
    console.error('[Audit] Failed to log audit event:', error);
  }
}

/**
 * Log AI tool execution with sanitized parameters.
 * Sensitive fields (passwords, tokens, full PII) are redacted.
 */
export async function logToolExecution(
  toolName: string,
  params: Record<string, unknown>,
  resourceId?: string | null,
  userId?: string | null
): Promise<void> {
  // Sanitize params - remove or mask sensitive fields
  const sanitizedParams = sanitizeParams(params);

  // Determine if this is a PII access
  const isPiiAccess = isPiiTool(toolName, params);

  await logAudit({
    action: isPiiAccess ? 'VIEW_PII' : 'TOOL_EXEC',
    resource: 'AITool',
    resourceId,
    details: {
      tool: toolName,
      params: sanitizedParams,
      pii_access: isPiiAccess,
    },
    userId,
  });
}

/**
 * Sanitize parameters by redacting sensitive fields.
 */
function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'pan',
    'aadhaar',
    'bank_account',
    'ssn',
    'credit_card',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive field names
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
    
    if (isSensitive && value) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeParams(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Check if a tool execution involves PII access.
 */
function isPiiTool(toolName: string, params: Record<string, unknown>): boolean {
  // Tools that access PII
  const piiTools = [
    'getSalaryDetails',
    'getBankDetails',
    'getEmployeePII',
    'getPayslip',
    'viewSalaryStructure',
  ];

  if (piiTools.includes(toolName)) {
    return true;
  }

  // Check if params request PII fields
  const piiFields = ['salary', 'bank', 'pan', 'aadhaar', 'payroll'];
  const paramStr = JSON.stringify(params).toLowerCase();
  
  return piiFields.some(field => paramStr.includes(field));
}

/**
 * Log a PII view event with specific details.
 */
export async function logPiiAccess(
  resource: AuditResource,
  resourceId: string,
  fieldAccessed: string,
  userId?: string | null
): Promise<void> {
  await logAudit({
    action: 'VIEW_PII',
    resource,
    resourceId,
    details: {
      field: fieldAccessed,
    },
    userId,
  });
}

/**
 * Log a permission denied event.
 */
export async function logPermissionDenied(
  resource: AuditResource,
  action: string,
  requiredPermission: string,
  userId?: string | null
): Promise<void> {
  await logAudit({
    action: 'PERMISSION_DENIED',
    resource,
    details: {
      attempted_action: action,
      required_permission: requiredPermission,
    },
    userId,
  });
}
