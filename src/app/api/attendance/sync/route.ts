import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Sync approved leave requests to attendance records
// This should be run:
// 1. When a leave request is approved (from leave-requests API)
// 2. As a daily job to catch any missed syncs
// 3. Before payroll processing to ensure attendance is complete

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { month, year, employeeId } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // Build query for approved leave requests in the period
    const leaveWhere: any = {
      status: 'APPROVED',
      OR: [
        // Leave starts in this month
        { start_date: { gte: startDate, lte: endDate } },
        // Leave ends in this month
        { end_date: { gte: startDate, lte: endDate } },
        // Leave spans this month
        { start_date: { lte: startDate }, end_date: { gte: endDate } }
      ]
    };

    if (employeeId) {
      leaveWhere.employee_id = employeeId;
    }

    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: leaveWhere,
      include: {
        leave_type: { select: { is_paid: true, code: true } }
      }
    });

    let synced = 0;
    const errors: string[] = [];

    for (const leave of approvedLeaves) {
      // Iterate through each day of the leave
      const leaveStart = new Date(Math.max(startDate.getTime(), new Date(leave.start_date).getTime()));
      const leaveEnd = new Date(Math.min(endDate.getTime(), new Date(leave.end_date).getTime()));

      const current = new Date(leaveStart);
      while (current <= leaveEnd) {
        const dayOfWeek = current.getDay();

        // Skip weekends
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          try {
            const dateOnly = new Date(current.getFullYear(), current.getMonth(), current.getDate());

            // Determine if this is half-day leave
            let status: 'ON_LEAVE' | 'HALF_DAY' = 'ON_LEAVE';
            let workMinutes = 0;

            if (leave.is_half_day) {
              status = 'HALF_DAY';
              workMinutes = 240; // 4 hours for half day
            }

            await prisma.attendance.upsert({
              where: {
                employee_id_date: {
                  employee_id: leave.employee_id,
                  date: dateOnly
                }
              },
              create: {
                employee_id: leave.employee_id,
                date: dateOnly,
                status,
                work_minutes: workMinutes,
                source: 'MANUAL',
                remarks: `${leave.leave_type.code} - ${leave.reason}`,
                created_by: session.user.id,
                updated_by: session.user.id,
              },
              update: {
                status,
                work_minutes: leave.is_half_day ? workMinutes : 0,
                remarks: `${leave.leave_type.code} - ${leave.reason}`,
                updated_by: session.user.id,
              }
            });

            synced++;
          } catch (err) {
            errors.push(`Failed to sync ${current.toISOString().split('T')[0]} for employee ${leave.employee_id}`);
          }
        }

        current.setDate(current.getDate() + 1);
      }
    }

    // Now identify days with no attendance record (potential LOP)
    // Get all active employees
    const employees = employeeId
      ? [{ id: employeeId }]
      : await prisma.employee.findMany({
          where: { employment_status: 'ACTIVE' },
          select: { id: true }
        });

    const lopDays: { employeeId: string; date: Date }[] = [];

    for (const emp of employees) {
      const current = new Date(startDate);
      while (current <= endDate) {
        const dayOfWeek = current.getDay();

        // Skip weekends
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const dateOnly = new Date(current.getFullYear(), current.getMonth(), current.getDate());

          // Check if attendance exists
          const attendance = await prisma.attendance.findUnique({
            where: {
              employee_id_date: {
                employee_id: emp.id,
                date: dateOnly
              }
            }
          });

          if (!attendance) {
            // No record = absent without leave = LOP
            lopDays.push({ employeeId: emp.id, date: dateOnly });

            // Create LOP attendance record
            await prisma.attendance.create({
              data: {
                employee_id: emp.id,
                date: dateOnly,
                status: 'ABSENT',
                source: 'MANUAL',
                remarks: 'Absent - marked as LOP',
                created_by: session.user.id,
                updated_by: session.user.id,
              }
            });
          }
        }

        current.setDate(current.getDate() + 1);
      }
    }

    return NextResponse.json({
      message: 'Sync completed',
      synced,
      lopDaysMarked: lopDays.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Attendance sync error:', error);
    return NextResponse.json({ error: 'Failed to sync attendance' }, { status: 500 });
  }
}
