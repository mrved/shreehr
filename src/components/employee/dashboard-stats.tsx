"use client";

import { Calendar, Clock, FileText } from "lucide-react";

interface DashboardStatsProps {
  leaveBalance: {
    type: string;
    balance: number;
  }[];
  lastPayslip: {
    month: string;
    netPay: number;
  } | null;
  pendingRequests: number;
}

export function DashboardStats({
  leaveBalance,
  lastPayslip,
  pendingRequests,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Leave Balance Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Leave Balance</h3>
          <Calendar className="h-5 w-5 text-blue-500" />
        </div>
        <div className="space-y-2">
          {leaveBalance.length > 0 ? (
            leaveBalance.map((leave) => (
              <div key={leave.type} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{leave.type}</span>
                <span className="text-lg font-semibold text-gray-900">
                  {leave.balance.toFixed(1)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No leave balance data</p>
          )}
        </div>
      </div>

      {/* Last Payslip Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Last Payslip</h3>
          <FileText className="h-5 w-5 text-green-500" />
        </div>
        {lastPayslip ? (
          <div>
            <p className="text-sm text-gray-600 mb-1">{lastPayslip.month}</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹
              {(lastPayslip.netPay / 100).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No payslip data available</p>
        )}
      </div>

      {/* Pending Requests Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Pending Requests</h3>
          <Clock className="h-5 w-5 text-orange-500" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
        <p className="text-sm text-gray-600 mt-1">Leave requests pending approval</p>
      </div>
    </div>
  );
}
