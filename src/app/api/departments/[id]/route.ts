import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { departmentSchema } from '@/lib/validations/organization';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: { id: true, first_name: true, last_name: true, employee_code: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error('Department fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch department' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'HR_MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = departmentSchema.partial().parse(body);

    const updateData: any = {
      updated_by: session.user.id,
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.isActive !== undefined) updateData.is_active = validated.isActive;

    const department = await prisma.department.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Department update error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'HR_MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if department has employees
    const employeeCount = await prisma.employee.count({
      where: { department_id: id },
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete department with ${employeeCount} employees. Please reassign employees first.` },
        { status: 400 }
      );
    }

    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Department delete error:', error);

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
