import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { profileUpdateSchema, UPDATABLE_FIELDS, type UpdatableField } from '@/lib/validations/profile';
import { ZodError } from 'zod';

// GET /api/profile/update-requests - List update requests
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');

  try {
    // Build filter based on role
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role);

    const where: any = {};

    // Employees see only their own requests
    if (!isAdmin && session.user.employeeId) {
      where.employee_id = session.user.employeeId;
    }

    // Filter by status if provided
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    const requests = await prisma.profileUpdateRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Profile update requests fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch update requests' }, { status: 500 });
  }
}

// POST /api/profile/update-requests - Create update request
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.user.employeeId) {
    return NextResponse.json({ error: 'No employee record linked to this user' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validated = profileUpdateSchema.parse(body);

    // Fetch current employee data
    const employee = await prisma.employee.findUnique({
      where: { id: session.user.employeeId },
      select: {
        id: true,
        address_line1: true,
        address_line2: true,
        city: true,
        state: true,
        postal_code: true,
        emergency_contact: true,
        emergency_phone: true,
        personal_phone: true,
        personal_email: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Build changes JSON with only fields that actually changed
    const changes: Record<string, { old: any; new: any }> = {};
    let hasChanges = false;

    for (const field of UPDATABLE_FIELDS) {
      const newValue = validated[field as keyof typeof validated];
      const oldValue = employee[field as UpdatableField];

      // Only include if field was provided and is different
      if (newValue !== undefined && newValue !== oldValue) {
        changes[field] = {
          old: oldValue,
          new: newValue,
        };
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return NextResponse.json(
        { error: 'No changes detected. All fields match current values.' },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existingRequest = await prisma.profileUpdateRequest.findFirst({
      where: {
        employee_id: session.user.employeeId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'You already have a pending profile update request. Please wait for it to be processed.',
        },
        { status: 400 }
      );
    }

    // Create update request
    const updateRequest = await prisma.profileUpdateRequest.create({
      data: {
        employee_id: session.user.employeeId,
        changes,
        status: 'PENDING',
        reason: validated.reason || null,
        created_by: session.user.id,
        updated_by: session.user.id,
      },
      include: {
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    return NextResponse.json(updateRequest, { status: 201 });
  } catch (error) {
    console.error('Profile update request creation error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create update request' }, { status: 500 });
  }
}
