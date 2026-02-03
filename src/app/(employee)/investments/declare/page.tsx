import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { InvestmentDeclarationForm } from '@/components/employee/investment-declaration-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Calculate current financial year (April to March)
function getCurrentFinancialYear(): string {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const year = today.getFullYear();
  // FY starts April (month 3)
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`; // "2025-26"
  }
  return `${year - 1}-${year.toString().slice(-2)}`; // "2024-25"
}

export default async function DeclareInvestmentsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) {
    redirect('/login');
  }

  const currentFY = getCurrentFinancialYear();

  // Check if declaration exists for current FY
  const existingDeclaration = await prisma.investmentDeclaration.findUnique({
    where: {
      employee_id_financial_year: {
        employee_id: session.user.employeeId,
        financial_year: currentFY,
      },
    },
  });

  // If exists and SUBMITTED or VERIFIED, redirect to view
  if (existingDeclaration && ['SUBMITTED', 'VERIFIED'].includes(existingDeclaration.status)) {
    redirect('/employee/investments');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/employee/investments"
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {existingDeclaration ? 'Edit' : 'Declare'} Investment Declaration
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Financial Year {currentFY}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Important Information</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>All amounts should be entered in rupees</li>
          <li>Section 80C has a maximum deduction limit of ₹1,50,000</li>
          <li>Upload supporting documents (receipts, statements, rent agreements)</li>
          <li>Landlord PAN is required if annual rent exceeds ₹1,00,000</li>
          <li>You can save as draft and submit later</li>
          <li>Once submitted, HR will verify your declaration</li>
        </ul>
      </div>

      <InvestmentDeclarationForm
        declarationId={existingDeclaration?.id || null}
        initialData={existingDeclaration ? {
          section_80c_ppf: existingDeclaration.section_80c_ppf,
          section_80c_elss: existingDeclaration.section_80c_elss,
          section_80c_life_insurance: existingDeclaration.section_80c_life_insurance,
          section_80c_tuition_fees: existingDeclaration.section_80c_tuition_fees,
          section_80c_nps: existingDeclaration.section_80c_nps,
          section_80c_home_loan_principal: existingDeclaration.section_80c_home_loan_principal,
          section_80c_sukanya: existingDeclaration.section_80c_sukanya,
          section_80c_other: existingDeclaration.section_80c_other,
          section_80d_self: existingDeclaration.section_80d_self,
          section_80d_parents: existingDeclaration.section_80d_parents,
          section_80d_checkup: existingDeclaration.section_80d_checkup,
          hra_monthly_rent: existingDeclaration.hra_monthly_rent,
          hra_landlord_name: existingDeclaration.hra_landlord_name ?? undefined,
          hra_landlord_pan: existingDeclaration.hra_landlord_pan ?? undefined,
          hra_rental_address: existingDeclaration.hra_rental_address ?? undefined,
          section_80e_education_loan: existingDeclaration.section_80e_education_loan,
          section_80g_donations: existingDeclaration.section_80g_donations,
          section_24_home_loan_interest: existingDeclaration.section_24_home_loan_interest,
        } : undefined}
        financialYear={currentFY}
      />
    </div>
  );
}
