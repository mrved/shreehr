"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExpenseClaim {
  id: string;
  expense_date: string;
  policy: {
    category: string;
  };
  description: string;
  amount_paise: number;
  status: string;
}

interface ExpenseListProps {
  expenses: ExpenseClaim[];
  showPendingTab?: boolean;
  pendingApprovalCount?: number;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  REIMBURSED: "bg-purple-100 text-purple-800",
};

export function ExpenseList({
  expenses,
  showPendingTab = false,
  pendingApprovalCount = 0,
}: ExpenseListProps) {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  const displayedExpenses =
    activeTab === "pending" ? expenses.filter((e) => e.status === "PENDING_APPROVAL") : expenses;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      {showPendingTab && (
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === "all"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              All Expenses
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === "pending"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending My Approval
              {pendingApprovalCount > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 text-xs">
                  {pendingApprovalCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No expense claims found
                </TableCell>
              </TableRow>
            ) : (
              displayedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {new Date(expense.expense_date).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>{expense.policy.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                  <TableCell>₹{(expense.amount_paise / 100).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[expense.status] || "bg-gray-100"}>
                      {expense.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/expenses/${expense.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {displayedExpenses.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No expense claims found
            </CardContent>
          </Card>
        ) : (
          displayedExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{expense.policy.category}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {expense.description}
                      </p>
                    </div>
                    <Badge className={statusColors[expense.status] || "bg-gray-100"}>
                      {expense.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {new Date(expense.expense_date).toLocaleDateString("en-IN")}
                    </span>
                    <span className="font-semibold">
                      ₹{(expense.amount_paise / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <Link href={`/dashboard/expenses/${expense.id}`} className="block">
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
