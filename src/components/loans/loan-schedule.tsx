"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScheduleRow {
  month: number;
  month_year: string;
  emi_amount_paise: number;
  principal_paise: number;
  interest_paise: number;
  balance_after_paise: number;
  status: "SCHEDULED" | "DEDUCTED" | "SKIPPED";
  is_past: boolean;
  is_current: boolean;
}

interface LoanScheduleProps {
  loanId: string;
  principal: number;
  totalInterest: number;
  totalRepayment: number;
}

export function LoanSchedule({
  loanId,
  principal,
  totalInterest,
  totalRepayment,
}: LoanScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const response = await fetch(`/api/loans/${loanId}/schedule`);
        if (response.ok) {
          const data = await response.json();
          setSchedule(data);
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, [loanId]);

  const toggleMonth = (month: number) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  const getRowClass = (row: ScheduleRow) => {
    if (row.is_current) return "bg-yellow-50 border-yellow-200";
    if (row.is_past && row.status === "DEDUCTED") return "bg-green-50 border-green-200";
    if (row.is_past && row.status === "SKIPPED") return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">Loading schedule...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Repayment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Principal</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{principal.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Interest</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{totalInterest.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Repayment</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ₹{totalRepayment.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Schedule Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Amortization Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Month</th>
                  <th className="text-left py-3">Date</th>
                  <th className="text-right py-3">EMI</th>
                  <th className="text-right py-3">Principal</th>
                  <th className="text-right py-3">Interest</th>
                  <th className="text-right py-3">Balance</th>
                  <th className="text-center py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.month} className={`border-b ${getRowClass(row)}`}>
                    <td className="py-3 font-medium">{row.month}</td>
                    <td className="py-3">{row.month_year}</td>
                    <td className="text-right py-3">
                      ₹{(row.emi_amount_paise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="text-right py-3">
                      ₹{(row.principal_paise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="text-right py-3">
                      ₹{(row.interest_paise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="text-right py-3 font-semibold">
                      ₹{(row.balance_after_paise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="text-center py-3">
                      {row.status === "DEDUCTED" && (
                        <span className="text-green-600 font-medium">✓ Paid</span>
                      )}
                      {row.status === "SKIPPED" && (
                        <span className="text-red-600 font-medium">✗ Skipped</span>
                      )}
                      {row.status === "SCHEDULED" && row.is_current && (
                        <span className="text-yellow-600 font-medium">→ Current</span>
                      )}
                      {row.status === "SCHEDULED" && !row.is_current && (
                        <span className="text-gray-500">Scheduled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Schedule Cards */}
      <div className="md:hidden space-y-3">
        {schedule.map((row) => (
          <Card
            key={row.month}
            className={`cursor-pointer ${getRowClass(row)}`}
            onClick={() => toggleMonth(row.month)}
          >
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Month {row.month}</h3>
                    <p className="text-sm text-gray-600">{row.month_year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">EMI</p>
                    <p className="font-bold">
                      ₹{(row.emi_amount_paise / 100).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {expandedMonths.has(row.month) && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Principal:</span>
                      <span className="font-medium">
                        ₹{(row.principal_paise / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Interest:</span>
                      <span className="font-medium">
                        ₹{(row.interest_paise / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining Balance:</span>
                      <span className="font-semibold">
                        ₹{(row.balance_after_paise / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  {row.status === "DEDUCTED" && (
                    <span className="text-green-600 font-medium text-sm">✓ Paid</span>
                  )}
                  {row.status === "SKIPPED" && (
                    <span className="text-red-600 font-medium text-sm">✗ Skipped</span>
                  )}
                  {row.status === "SCHEDULED" && row.is_current && (
                    <span className="text-yellow-600 font-medium text-sm">→ Current Month</span>
                  )}
                  {row.status === "SCHEDULED" && !row.is_current && (
                    <span className="text-gray-500 text-sm">Scheduled</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
