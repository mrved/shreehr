import { PayrollRunForm } from '@/components/payroll/payroll-run-form';

export default function RunPayrollPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Run Monthly Payroll</h1>
      <PayrollRunForm />
    </div>
  );
}
