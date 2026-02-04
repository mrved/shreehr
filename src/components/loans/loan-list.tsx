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

interface Loan {
  id: string;
  employee: {
    first_name: string;
    last_name: string;
  };
  loan_type: string;
  principal_paise: number;
  emi_paise: number;
  remaining_balance_paise: number;
  status: string;
  start_date: string;
}

interface LoanListProps {
  loans: Loan[];
  isEmployee?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  DEFAULTED: "bg-red-100 text-red-800",
};

const loanTypeLabels: Record<string, string> = {
  SALARY_ADVANCE: "Salary Advance",
  PERSONAL: "Personal Loan",
  EMERGENCY: "Emergency Loan",
};

export function LoanList({ loans, isEmployee = false }: LoanListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLoans =
    statusFilter === "all" ? loans : loans.filter((l) => l.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {!isEmployee && <TableHead>Employee</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>EMI</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isEmployee ? 7 : 8} className="text-center text-gray-500 py-8">
                  No loans found
                </TableCell>
              </TableRow>
            ) : (
              filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  {!isEmployee && (
                    <TableCell className="font-medium">
                      {loan.employee.first_name} {loan.employee.last_name}
                    </TableCell>
                  )}
                  <TableCell>{loanTypeLabels[loan.loan_type] || loan.loan_type}</TableCell>
                  <TableCell>₹{(loan.principal_paise / 100).toLocaleString("en-IN")}</TableCell>
                  <TableCell>₹{(loan.emi_paise / 100).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    ₹{(loan.remaining_balance_paise / 100).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[loan.status]}>{loan.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(loan.start_date).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>
                    <Link href={isEmployee ? `/employee/loans/${loan.id}` : `/loans/${loan.id}`}>
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
        {filteredLoans.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">No loans found</CardContent>
          </Card>
        ) : (
          filteredLoans.map((loan) => (
            <Card key={loan.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {loanTypeLabels[loan.loan_type] || loan.loan_type}
                      </h3>
                      {!isEmployee && (
                        <p className="text-sm text-gray-600">
                          {loan.employee.first_name} {loan.employee.last_name}
                        </p>
                      )}
                    </div>
                    <Badge className={statusColors[loan.status]}>{loan.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Principal:</span>
                      <p className="font-medium">
                        ₹{(loan.principal_paise / 100).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">EMI:</span>
                      <p className="font-medium">
                        ₹{(loan.emi_paise / 100).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Remaining:</span>
                      <p className="font-medium">
                        ₹{(loan.remaining_balance_paise / 100).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <p className="font-medium">
                        {new Date(loan.start_date).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={isEmployee ? `/employee/loans/${loan.id}` : `/loans/${loan.id}`}
                    className="block"
                  >
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
