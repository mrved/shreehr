import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { InvestmentSummary } from '@/components/employee/investment-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, AlertCircle } from 'lucide-react';

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

export default async function InvestmentsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) {
    redirect('/login');
  }

  const currentFY = getCurrentFinancialYear();

  // Fetch current FY declaration
  const currentDeclaration = await prisma.investmentDeclaration.findUnique({
    where: {
      employee_id_financial_year: {
        employee_id: session.user.employeeId,
        financial_year: currentFY,
      },
    },
    include: {
      _count: {
        select: {
          proof_documents: {
            where: { is_deleted: false },
          },
        },
      },
    },
  });

  // Fetch past declarations
  const pastDeclarations = await prisma.investmentDeclaration.findMany({
    where: {
      employee_id: session.user.employeeId,
      financial_year: { not: currentFY },
    },
    orderBy: { financial_year: 'desc' },
    include: {
      _count: {
        select: {
          proof_documents: {
            where: { is_deleted: false },
          },
        },
      },
    },
  });

  const documentCount = currentDeclaration?._count.proof_documents || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Declarations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Declare your tax-saving investments for TDS calculation
          </p>
        </div>
        {currentDeclaration?.status === 'DRAFT' && (
          <Link href="/employee/investments/declare">
            <Button className="w-full sm:w-auto">
              <FileText className="h-4 w-4 mr-2" />
              Edit Declaration
            </Button>
          </Link>
        )}
        {!currentDeclaration && (
          <Link href="/employee/investments/declare">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Declare Investments
            </Button>
          </Link>
        )}
      </div>

      {/* Current FY Declaration */}
      {currentDeclaration ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">FY {currentDeclaration.financial_year}</h2>
            <span className="text-sm text-gray-500">
              {documentCount} document{documentCount !== 1 ? 's' : ''} uploaded
            </span>
          </div>
          <InvestmentSummary declaration={currentDeclaration} />
          {currentDeclaration.status === 'DRAFT' && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900">Draft Declaration</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your declaration is saved as draft. Upload supporting documents and submit for verification.
                    </p>
                    <Link href="/employee/investments/declare">
                      <Button variant="outline" className="mt-3 bg-white">
                        Complete Declaration
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-blue-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No Declaration for FY {currentFY}</h3>
              <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
                Declare your tax-saving investments to reduce your monthly TDS deduction. Include 80C investments, health insurance (80D), and HRA.
              </p>
              <Link href="/employee/investments/declare">
                <Button className="mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Declare Investments Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Declarations */}
      {pastDeclarations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Past Financial Years</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastDeclarations.map((declaration) => (
              <Card key={declaration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">FY {declaration.financial_year}</CardTitle>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        declaration.status === 'VERIFIED'
                          ? 'bg-green-100 text-green-800'
                          : declaration.status === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-800'
                          : declaration.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {declaration.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>
                      {declaration._count.proof_documents} document{declaration._count.proof_documents !== 1 ? 's' : ''}
                    </p>
                    {declaration.verified_at && (
                      <p className="mt-1 text-xs text-gray-500">
                        Verified on {new Date(declaration.verified_at).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
