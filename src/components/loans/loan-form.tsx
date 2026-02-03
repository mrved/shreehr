"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_code: string;
}

interface LoanFormProps {
  employees: Employee[];
}

const formSchema = z.object({
  employee_id: z.string().min(1, "Select an employee"),
  loan_type: z.enum(["SALARY_ADVANCE", "PERSONAL", "EMERGENCY"]),
  principal: z.number().min(1000, "Minimum loan amount is ₹1,000"),
  annual_interest_rate: z.number().min(0).max(30, "Interest rate must be between 0-30%"),
  tenure_months: z.number().min(1).max(60, "Tenure must be between 1-60 months"),
  start_date: z.string().min(1, "Select start date"),
});

type FormData = z.infer<typeof formSchema>;

// Calculate EMI using reducing balance method
function calculateEMI(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return { emi: 0, totalInterest: 0, totalRepayment: 0 };

  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) {
    // No interest case
    const emi = principal / months;
    return {
      emi: Math.round(emi),
      totalInterest: 0,
      totalRepayment: principal,
    };
  }

  // EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const totalRepayment = emi * months;
  const totalInterest = totalRepayment - principal;

  return {
    emi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalRepayment: Math.round(totalRepayment),
  };
}

// Generate mini schedule preview
function generateMiniSchedule(
  principal: number,
  annualRate: number,
  months: number,
  startDate: string,
) {
  const monthlyRate = annualRate / 12 / 100;
  const { emi } = calculateEMI(principal, annualRate, months);

  let balance = principal;
  const schedule = [];
  const start = new Date(startDate);

  // First 3 months
  for (let i = 1; i <= Math.min(3, months); i++) {
    const interest = Math.round(balance * monthlyRate);
    const principalPart = emi - interest;
    balance -= principalPart;

    const monthDate = new Date(start);
    monthDate.setMonth(monthDate.getMonth() + i - 1);

    schedule.push({
      month: i,
      date: monthDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      emi,
      principal: principalPart,
      interest,
      balance: Math.max(0, balance),
    });
  }

  // Last month if tenure > 3
  if (months > 3) {
    balance = principal;
    for (let i = 1; i < months; i++) {
      const interest = Math.round(balance * monthlyRate);
      const principalPart = emi - interest;
      balance -= principalPart;
    }

    const interest = Math.round(balance * monthlyRate);
    const principalPart = emi - interest;
    balance = 0;

    const lastMonthDate = new Date(start);
    lastMonthDate.setMonth(lastMonthDate.getMonth() + months - 1);

    schedule.push({
      month: months,
      date: lastMonthDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      emi,
      principal: principalPart,
      interest,
      balance: 0,
    });
  }

  return schedule;
}

export function LoanForm({ employees }: LoanFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_id: "",
      loan_type: "PERSONAL",
      principal: 0,
      annual_interest_rate: 12,
      tenure_months: 12,
      start_date: "",
    },
  });

  const principal = useWatch({ control, name: "principal" });
  const annualInterestRate = useWatch({ control, name: "annual_interest_rate" });
  const tenureMonths = useWatch({ control, name: "tenure_months" });
  const startDate = useWatch({ control, name: "start_date" });

  const { emi, totalInterest, totalRepayment } = calculateEMI(
    principal || 0,
    annualInterestRate || 0,
    tenureMonths || 1,
  );

  const miniSchedule = startDate
    ? generateMiniSchedule(principal || 0, annualInterestRate || 0, tenureMonths || 1, startDate)
    : [];

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);

    try {
      const payload = {
        employee_id: data.employee_id,
        loan_type: data.loan_type,
        principal_paise: Math.round(data.principal * 100),
        annual_interest_rate: data.annual_interest_rate,
        tenure_months: data.tenure_months,
        start_date: data.start_date,
      };

      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create loan");
      }

      const result = await response.json();

      toast({
        title: "Loan created",
        description: "Loan has been created in PENDING status",
      });

      router.push(`/loans/${result.id}`);
    } catch (error) {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create loan",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Loan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee_id">Employee *</Label>
              <Select {...register("employee_id")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employee_code} - {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && (
                <p className="text-sm text-red-600 mt-1">{errors.employee_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="loan_type">Loan Type *</Label>
              <Select {...register("loan_type")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALARY_ADVANCE">Salary Advance</SelectItem>
                  <SelectItem value="PERSONAL">Personal Loan</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency Loan</SelectItem>
                </SelectContent>
              </Select>
              {errors.loan_type && (
                <p className="text-sm text-red-600 mt-1">{errors.loan_type.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="principal">Principal Amount (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  id="principal"
                  type="number"
                  className="pl-8"
                  {...register("principal", { valueAsNumber: true })}
                  placeholder="50000"
                />
              </div>
              {errors.principal && (
                <p className="text-sm text-red-600 mt-1">{errors.principal.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="annual_interest_rate">Interest Rate (% per annum) *</Label>
              <div className="relative">
                <Input
                  id="annual_interest_rate"
                  type="number"
                  step="0.1"
                  {...register("annual_interest_rate", { valueAsNumber: true })}
                  placeholder="12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              {errors.annual_interest_rate && (
                <p className="text-sm text-red-600 mt-1">{errors.annual_interest_rate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tenure_months">Tenure (months) *</Label>
              <Input
                id="tenure_months"
                type="number"
                {...register("tenure_months", { valueAsNumber: true })}
                placeholder="12"
              />
              {errors.tenure_months && (
                <p className="text-sm text-red-600 mt-1">{errors.tenure_months.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="start_date">Start Date (first EMI month) *</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && (
                <p className="text-sm text-red-600 mt-1">{errors.start_date.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EMI Preview */}
      {principal > 0 && tenureMonths > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>EMI Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Monthly EMI</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  ₹{emi.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Interest</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{totalInterest.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Repayment</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{totalRepayment.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Mini Schedule */}
            {miniSchedule.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium mb-3">Repayment Schedule Preview</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Month</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-right py-2">EMI</th>
                        <th className="text-right py-2">Principal</th>
                        <th className="text-right py-2">Interest</th>
                        <th className="text-right py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {miniSchedule.map((row, index) => (
                        <tr key={row.month} className="border-b">
                          <td className="py-2">{row.month}</td>
                          <td className="py-2">{row.date}</td>
                          <td className="text-right py-2">
                            ₹{row.emi.toLocaleString("en-IN")}
                          </td>
                          <td className="text-right py-2">
                            ₹{row.principal.toLocaleString("en-IN")}
                          </td>
                          <td className="text-right py-2">
                            ₹{row.interest.toLocaleString("en-IN")}
                          </td>
                          <td className="text-right py-2">
                            ₹{row.balance.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                      {tenureMonths > 3 && (
                        <tr>
                          <td colSpan={6} className="text-center py-2 text-gray-500 italic">
                            ... {tenureMonths - 4} more months ...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Loan"
          )}
        </Button>
      </div>
    </form>
  );
}
