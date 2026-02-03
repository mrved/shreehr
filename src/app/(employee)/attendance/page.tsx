import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AttendanceCalendar } from '@/components/employee/attendance-calendar';

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect('/login');
  }

  // Get month and year from search params or use current
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth();
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  // Fetch attendance records for the month
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const attendances = await prisma.attendance.findMany({
    where: {
      employee_id: session.user.employeeId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Transform data for client component
  const attendanceData = attendances.map((a) => ({
    id: a.id,
    date: a.date.toISOString(),
    check_in: a.check_in?.toISOString() || null,
    check_out: a.check_out?.toISOString() || null,
    work_minutes: a.work_minutes,
    status: a.status as 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your attendance records and monthly summary
        </p>
      </div>

      <AttendanceCalendar attendances={attendanceData} month={month} year={year} />
    </div>
  );
}
