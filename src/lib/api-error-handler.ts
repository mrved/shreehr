/**
 * API Error Handler Wrapper for ShreeHR
 * 
 * Provides a higher-order function to wrap API route handlers with
 * automatic error logging, consistent error responses, and monitoring.
 */

import { NextRequest } from 'next/server';
import { logError, ErrorType, ErrorSeverity } from '@/lib/error-logger';
import { auth } from '@/lib/auth';

// Options for the error handler
interface ErrorHandlerOptions {
  route: string;               // The API route path (e.g., '/api/chat')
  type?: ErrorType;            // Error type for categorization
  critical?: boolean;          // Whether errors should be treated as CRITICAL
  includeUserId?: boolean;     // Whether to extract and log user ID
}

// Standard error response
interface ErrorResponse {
  error: string;
  code?: string;
  requestId?: string;
}

/**
 * Wrap an API route handler with error logging.
 * 
 * Usage:
 * ```typescript
 * // Before
 * export async function POST(req: Request) { ... }
 * 
 * // After
 * export const POST = withErrorLogging(
 *   async (req: Request) => { ... },
 *   { route: '/api/chat', critical: true }
 * );
 * ```
 */
export function withErrorLogging<T extends Request | NextRequest>(
  handler: (req: T, ctx?: { params?: Record<string, string> }) => Promise<Response>,
  options: ErrorHandlerOptions
) {
  return async (req: T, ctx?: { params?: Record<string, string> }): Promise<Response> => {
    const requestId = crypto.randomUUID().slice(0, 8);
    const startTime = Date.now();
    
    try {
      // Execute the handler
      const response = await handler(req, ctx);
      
      // Log 5xx responses as errors
      if (response.status >= 500) {
        let userId: string | undefined;
        
        if (options.includeUserId !== false) {
          try {
            const session = await auth();
            userId = session?.user?.id;
          } catch {
            // Ignore auth errors here
          }
        }
        
        await logError({
          type: options.type || 'API',
          severity: options.critical ? 'CRITICAL' : 'HIGH',
          message: `API returned ${response.status}: ${response.statusText || 'Server Error'}`,
          route: options.route,
          method: req.method,
          userId,
          metadata: {
            requestId,
            duration: Date.now() - startTime,
            status: response.status,
          },
        });
      }
      
      return response;
    } catch (error) {
      // Determine severity
      const severity: ErrorSeverity = options.critical ? 'CRITICAL' : 'HIGH';
      
      // Extract user ID if available
      let userId: string | undefined;
      if (options.includeUserId !== false) {
        try {
          const session = await auth();
          userId = session?.user?.id;
        } catch {
          // Ignore auth errors here
        }
      }
      
      // Log the error
      await logError({
        type: options.type || 'API',
        severity,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined,
        route: options.route,
        method: req.method,
        userId,
        metadata: {
          requestId,
          duration: Date.now() - startTime,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        },
      });
      
      // Return consistent error response
      const errorResponse: ErrorResponse = {
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : (error instanceof Error ? error.message : 'Unknown error'),
        requestId,
      };
      
      // Determine status code
      let status = 500;
      if (error instanceof Error) {
        // Handle known error types
        if (error.message.includes('Unauthorized') || error.message.includes('not authenticated')) {
          status = 401;
          errorResponse.error = 'Unauthorized';
        } else if (error.message.includes('Forbidden') || error.message.includes('not allowed')) {
          status = 403;
          errorResponse.error = 'Forbidden';
        } else if (error.message.includes('not found') || error.message.includes('Not found')) {
          status = 404;
          errorResponse.error = 'Not found';
        } else if (error.message.includes('validation') || error.message.includes('invalid')) {
          status = 400;
          errorResponse.error = error.message;
        }
      }
      
      return Response.json(errorResponse, { status });
    }
  };
}

/**
 * Simplified error logger for use within route handlers.
 * Call this for errors you catch and handle yourself.
 * 
 * Usage:
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   await logRouteError(error, '/api/payroll/run', req);
 *   return Response.json({ error: 'Failed' }, { status: 500 });
 * }
 * ```
 */
export async function logRouteError(
  error: unknown,
  route: string,
  req?: Request,
  options?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    userId?: string;
    employeeId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await logError({
    type: options?.type || 'API',
    severity: options?.severity || 'HIGH',
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    route,
    method: req?.method,
    userId: options?.userId,
    employeeId: options?.employeeId,
    metadata: options?.metadata,
  });
}
