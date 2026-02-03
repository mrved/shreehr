import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateAttendanceStatus } from '@/lib/validations/attendance';

// Approve or reject correction
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { action, rejectionReason } = body;

    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id },
      include: { attendance: true }
    });

    if (!correction) {
      return NextResponse.json({ error: 'Correction not found' }, { status: 404 });
    }

    if (correction.status !== 'PENDING') {
      return NextResponse.json({ error: 'Correction already processed' }, { status: 400 });
    }

    if (action === 'approve') {
      // Calculate new work minutes and status
      const checkIn = correction.new_check_in || correction.attendance.check_in;
      const checkOut = correction.new_check_out || correction.attendance.check_out;

      let workMinutes = 0;
      let status: 'PRESENT' | 'HALF_DAY' | 'ABSENT' = 'ABSENT';

      if (checkIn && checkOut) {
        workMinutes = Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60));
        status = calculateAttendanceStatus(workMinutes);
      }

      // Update attendance record
      await prisma.attendance.update({
        where: { id: correction.attendance_id },
        data: {
          check_in: correction.new_check_in || undefined,
          check_out: correction.new_check_out || undefined,
          work_minutes: workMinutes,
          status,
          is_regularized: true,
          regularized_by: session.user.id,
          regularized_at: new Date(),
          remarks: `Corrected: ${correction.reason}`,
          updated_by: session.user.id,
        }
      });

      // Update correction status
      const updated = await prisma.attendanceCorrection.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approved_by: session.user.id,
          approved_at: new Date(),
          updated_by: session.user.id,
        }
      });

      return NextResponse.json({
        message: 'Correction approved and attendance updated',
        correction: updated
      });
    }

    if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      const updated = await prisma.attendanceCorrection.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approved_by: session.user.id,
          approved_at: new Date(),
          rejection_reason: rejectionReason,
          updated_by: session.user.id,
        }
      });

      return NextResponse.json({
        message: 'Correction rejected',
        correction: updated
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Correction action error:', error);
    return NextResponse.json({ error: 'Failed to process correction' }, { status: 500 });
  }
}
