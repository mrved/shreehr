/**
 * State-specific Professional Tax Slabs API
 * GET - Get PT slabs for a specific state
 * PUT - Update PT slab
 * DELETE - Soft delete PT slab
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getPTSlabsForState } from '@/lib/statutory/pt';

/**
 * GET /api/pt-slabs/[state]
 * Get all PT slabs for a specific state
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and payroll managers can view PT slabs
    if (
      !['SUPER_ADMIN', 'ADMIN', 'PAYROLL_MANAGER'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { state } = await params;
    const stateCode = state.toUpperCase();

    const slabs = await getPTSlabsForState(stateCode);

    return NextResponse.json({ state_code: stateCode, slabs });
  } catch (error) {
    console.error('Error fetching PT slabs for state:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/pt-slabs/[state]
 * Update PT slab (state param is ignored, ID comes from body)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update PT slabs
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'PT slab ID required' },
        { status: 400 },
      );
    }

    // Validate salary range if both are provided
    if (
      updateData.salary_to !== undefined &&
      updateData.salary_from !== undefined &&
      updateData.salary_to !== null &&
      updateData.salary_to < updateData.salary_from
    ) {
      return NextResponse.json(
        { error: 'salary_to must be greater than salary_from' },
        { status: 400 },
      );
    }

    const slab = await prisma.professionalTaxSlab.update({
      where: { id },
      data: {
        ...updateData,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json({ slab });
  } catch (error) {
    console.error('Error updating PT slab:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/pt-slabs/[state]
 * Soft delete PT slab (deactivate)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete PT slabs
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'PT slab ID required' },
        { status: 400 },
      );
    }

    // Soft delete by setting is_active to false
    const slab = await prisma.professionalTaxSlab.update({
      where: { id },
      data: {
        is_active: false,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json({ slab });
  } catch (error) {
    console.error('Error deleting PT slab:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
