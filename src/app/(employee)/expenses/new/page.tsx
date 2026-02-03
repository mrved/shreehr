import { redirect } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { auth } from "@/lib/auth";

export default async function NewExpensePage() {
  const session = await auth();

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submit Expense Claim</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details and upload receipt to submit your expense claim
        </p>
      </div>

      <ExpenseForm />
    </div>
  );
}
