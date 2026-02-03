import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Form16List } from '@/components/employee/form16-list';

export default async function Form16Page() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect('/login');
  }

  const employeeId = session.user.employeeId;

  // Get distinct financial years where the employee has payroll records
  // Form 16 is generated for completed financial years only
  const payrollRecords = await prisma.payrollRecord.findMany({
    where: {
      employee_id: employeeId,
      status: {
        in: ['CALCULATED', 'VERIFIED', 'PAID'],
      },
    },
    select: {
      month: true,
      year: true,
    },
    distinct: ['month', 'year'],
  });

  // Group records by financial year (April to March)
  // Financial year 2023 means April 2023 - March 2024
  const financialYears = new Set<number>();

  for (const record of payrollRecords) {
    // If month is Jan-Mar, belongs to previous FY
    // If month is Apr-Dec, belongs to current FY
    const fy = record.month >= 4 ? record.year : record.year - 1;
    financialYears.add(fy);
  }

  // Convert to sorted array and create certificate data
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Only show FYs that are complete (current FY is not complete until March ends)
  const completedFYs = Array.from(financialYears)
    .filter((fy) => {
      // FY is complete if we're past March of the ending year
      const endingYear = fy + 1;
      return currentYear > endingYear || (currentYear === endingYear && currentMonth > 3);
    })
    .sort((a, b) => b - a); // Most recent first

  const certificates = completedFYs.map((fy) => ({
    financialYear: `${fy}-${(fy + 1).toString().slice(-2)}`,
    startYear: fy,
    endYear: fy + 1,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Form 16</h1>
        <p className="mt-1 text-sm text-gray-600">
          Download your TDS certificates for completed financial years
        </p>
      </div>

      <Form16List certificates={certificates} employeeId={employeeId} />

      {certificates.length > 0 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">Important Note</h3>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>Form 16 is issued after the financial year ends and TDS returns are filed</li>
            <li>Employers typically issue Form 16 by June 15th following the end of the financial year</li>
            <li>You need Form 16 to file your income tax return (ITR)</li>
            <li>Keep Form 16 safely for at least 7 years for tax audit purposes</li>
          </ul>
        </div>
      )}
    </div>
  );
}
