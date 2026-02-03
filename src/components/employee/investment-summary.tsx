'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculate80CTotal, calculate80DTotal } from '@/lib/validations/investment';

interface InvestmentDeclaration {
  id: string;
  financial_year: string;
  status: string;

  // Section 80C
  section_80c_ppf: number;
  section_80c_elss: number;
  section_80c_life_insurance: number;
  section_80c_tuition_fees: number;
  section_80c_nps: number;
  section_80c_home_loan_principal: number;
  section_80c_sukanya: number;
  section_80c_other: number;

  // Section 80D
  section_80d_self: number;
  section_80d_parents: number;
  section_80d_checkup: number;

  // HRA
  hra_monthly_rent: number;
  hra_landlord_name?: string | null;
  hra_landlord_pan?: string | null;
  hra_rental_address?: string | null;

  // Other
  section_80e_education_loan: number;
  section_80g_donations: number;
  section_24_home_loan_interest: number;
}

interface InvestmentSummaryProps {
  declaration: InvestmentDeclaration;
}

const formatCurrency = (paise: number) => {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'SUBMITTED':
      return 'bg-blue-100 text-blue-800';
    case 'VERIFIED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function InvestmentSummary({ declaration }: InvestmentSummaryProps) {
  const total80C = calculate80CTotal(declaration);
  const total80D = calculate80DTotal(declaration);
  const totalHRA = declaration.hra_monthly_rent * 12;

  // Rough tax savings estimate (simplified - assumes 30% tax bracket)
  const taxSavings80C = Math.min(total80C, 15000000) * 0.30; // Max Rs.1.5L
  const taxSavings80D = total80D * 0.30;
  const totalEstimatedSavings = (taxSavings80C + taxSavings80D) / 100;

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Investment Declaration</h2>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(declaration.status)}`}>
          {declaration.status}
        </span>
      </div>

      {/* Desktop: Side-by-side, Mobile: Accordion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 80C */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Section 80C</CardTitle>
            <p className="text-sm text-gray-500">Max deduction: ₹1,50,000</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {declaration.section_80c_ppf > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PPF</span>
                <span className="font-medium">{formatCurrency(declaration.section_80c_ppf)}</span>
              </div>
            )}
            {declaration.section_80c_elss > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ELSS</span>
                <span className="font-medium">{formatCurrency(declaration.section_80c_elss)}</span>
              </div>
            )}
            {declaration.section_80c_life_insurance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Life Insurance</span>
                <span className="font-medium">{formatCurrency(declaration.section_80c_life_insurance)}</span>
              </div>
            )}
            {declaration.section_80c_tuition_fees > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tuition Fees</span>
                <span className="font-medium">{formatCurrency(declaration.section_80c_tuition_fees)}</span>
              </div>
            )}
            {declaration.section_80c_nps > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">NPS</span>
                <span className="font-medium">{formatCurrency(declaration.section_80c_nps)}</span>
              </div>
            )}
            {declaration.section_80c_home_loan_principal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Home Loan Principal</span>
                <span className="font-medium">{formatCurrency(declaration.section_80c_home_loan_principal)}</span>
              </div>
            )}
            {declaration.section_80c_sukanya > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sukanya Samriddhi</span>
                <span className="font-medium">{formatCurrency(declaration.section_80c_sukanya)}</span>
              </div>
            )}
            {declaration.section_80c_other > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Other 80C</span>
                <span className="font-medium">{formatCurrency(declaration.section_80c_other)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Total 80C</span>
                <span className={total80C > 15000000 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(total80C)}
                </span>
              </div>
              {total80C > 15000000 && (
                <p className="text-xs text-red-600 mt-1">Exceeds maximum limit</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 80D */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Section 80D</CardTitle>
            <p className="text-sm text-gray-500">Health Insurance</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {declaration.section_80d_self > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Self & Family</span>
                <span className="font-medium">{formatCurrency(declaration.section_80d_self)}</span>
              </div>
            )}
            {declaration.section_80d_parents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Parents</span>
                <span className="font-medium">{formatCurrency(declaration.section_80d_parents)}</span>
              </div>
            )}
            {declaration.section_80d_checkup > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Preventive Checkup</span>
                <span className="font-medium">{formatCurrency(declaration.section_80d_checkup)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Total 80D</span>
                <span className="text-green-600">{formatCurrency(total80D)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HRA */}
        {totalHRA > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">HRA (House Rent)</CardTitle>
              <p className="text-sm text-gray-500">Annual rent: {formatCurrency(totalHRA)}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly Rent</span>
                <span className="font-medium">{formatCurrency(declaration.hra_monthly_rent)}</span>
              </div>
              {declaration.hra_landlord_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Landlord</span>
                  <span className="font-medium">{declaration.hra_landlord_name}</span>
                </div>
              )}
              {declaration.hra_landlord_pan && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Landlord PAN</span>
                  <span className="font-medium">{declaration.hra_landlord_pan}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Other Deductions */}
        {(declaration.section_80e_education_loan > 0 ||
          declaration.section_80g_donations > 0 ||
          declaration.section_24_home_loan_interest > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Other Deductions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {declaration.section_80e_education_loan > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">80E Education Loan</span>
                  <span className="font-medium">{formatCurrency(declaration.section_80e_education_loan)}</span>
                </div>
              )}
              {declaration.section_80g_donations > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">80G Donations</span>
                  <span className="font-medium">{formatCurrency(declaration.section_80g_donations)}</span>
                </div>
              )}
              {declaration.section_24_home_loan_interest > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sec 24 Home Loan Interest</span>
                  <span className="font-medium">{formatCurrency(declaration.section_24_home_loan_interest)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estimated Tax Savings */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Estimated Annual Tax Savings</p>
            <p className="text-3xl font-bold text-green-700">
              ₹{totalEstimatedSavings.toLocaleString('en-IN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Based on 30% tax bracket. Actual savings may vary.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
