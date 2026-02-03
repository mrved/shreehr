import Link from 'next/link';
import { FileText, TrendingUp } from 'lucide-react';

export default function TaxDocumentsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tax Documents</h1>
        <p className="mt-1 text-sm text-gray-600">
          Access your tax certificates and investment declarations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Form 16 Card */}
        <Link
          href="/employee/tax/form16"
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Form 16</h2>
          <p className="text-sm text-gray-600">
            Download your TDS certificate for completed financial years
          </p>
        </Link>

        {/* Investment Declarations Card */}
        <Link
          href="/employee/tax/investments"
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Investment Declarations
          </h2>
          <p className="text-sm text-gray-600">
            Submit your tax-saving investment proofs
          </p>
        </Link>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">About Form 16</h3>
        <p className="text-sm text-blue-700">
          Form 16 is a TDS certificate issued by your employer showing the tax deducted from
          your salary for a financial year. It is required for filing your income tax return.
          Form 16 becomes available after the financial year ends (typically by June).
        </p>
      </div>
    </div>
  );
}
