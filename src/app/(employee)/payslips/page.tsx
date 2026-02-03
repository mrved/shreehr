import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { PayslipList } from '@/components/employee/payslip-list';

export default async function PayslipsPage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect('/login');
  }

  const employeeId = session.user.employeeId;

  // Fetch all payslips for the employee
  const payslips = await prisma.payrollRecord.findMany({
    where: {
      employee_id: employeeId,
      status: {
        in: ['CALCULATED', 'VERIFIED', 'PAID'],
      },
    },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
    select: {
      id: true,
      month: true,
      year: true,
      net_salary_paise: true,
      status: true,
    },
  });

  const payslipData = payslips.map((p) => ({
    id: p.id,
    month: p.month,
    year: p.year,
    netSalary: p.net_salary_paise,
    status: p.status,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payslips</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and download your salary statements
        </p>
      </div>

      <PayslipList payslips={payslipData} />
    </div>
  );
}
