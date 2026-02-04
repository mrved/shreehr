/**
 * Client Error Reporting Endpoint
 * 
 * Receives errors from client-side error boundaries and logs them
 * to the database for monitoring and notification.
 */

import { NextRequest } from 'next/server';
import { logError } from '@/lib/error-logger';
import { auth } from '@/lib/auth';

interface ClientErrorPayload {
  message: string;
  stack?: string;
  digest?: string;
  url?: string;
  userAgent?: string;
  componentStack?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ClientErrorPayload = await req.json();
    
    // Validate required fields
    if (!body.message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }
    
    // Get user ID if authenticated
    let userId: string | undefined;
    try {
      const session = await auth();
      userId = session?.user?.id;
    } catch {
      // Ignore auth errors
    }
    
    // Extract route from URL if available
    let route: string | undefined;
    if (body.url) {
      try {
        const url = new URL(body.url);
        route = url.pathname;
      } catch {
        route = body.url;
      }
    }
    
    // Log the error
    const result = await logError({
      type: 'CLIENT',
      severity: 'HIGH', // Client errors are generally high priority
      message: body.message,
      stack: body.stack,
      route,
      userId,
      metadata: {
        digest: body.digest,
        userAgent: body.userAgent?.slice(0, 500),
        componentStack: body.componentStack?.slice(0, 2000),
        fullUrl: body.url?.slice(0, 500),
      },
    });
    
    return Response.json({ 
      success: true,
      errorId: result.id,
    });
  } catch (error) {
    console.error('[ClientError] Failed to process error report:', error);
    
    // Return success anyway - don't want client to retry
    return Response.json({ success: true });
  }
}
