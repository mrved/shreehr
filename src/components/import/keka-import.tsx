"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface ImportResult {
  batchId: string;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors?: { row: number; field: string; message: string }[];
}

interface ImportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  expectedColumns: string[];
}

function ImportCard({
  title,
  description,
  icon,
  endpoint,
  expectedColumns,
}: ImportCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!file) return;

    setIsImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setResult(data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setResult({
        batchId: "",
        totalRecords: 0,
        successCount: 0,
        errorCount: 1,
        errors: [
          {
            row: 0,
            field: "general",
            message: err instanceof Error ? err.message : "Import failed",
          },
        ],
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Expected CSV columns:</p>
          <p className="break-words">{expectedColumns.join(", ")}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>

        <Button
          onClick={handleImport}
          disabled={!file || isImporting}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isImporting ? "Importing..." : "Import CSV"}
        </Button>

        {result && (
          <div
            className={`p-4 rounded-md ${result.errorCount === 0 ? "bg-green-50" : result.successCount > 0 ? "bg-yellow-50" : "bg-red-50"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.errorCount === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : result.successCount > 0 ? (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {result.successCount} of {result.totalRecords} imported
              </span>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 10).map((err, i) => (
                  <div key={i} className="text-xs text-red-700">
                    Row {err.row}: {err.field} - {err.message}
                  </div>
                ))}
                {result.errors.length > 10 && (
                  <div className="text-xs text-red-700">
                    ...and {result.errors.length - 10} more errors
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KekaImport() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ImportCard
        title="Employee Data"
        description="Import employee profiles from Keka export"
        icon={<Users className="h-8 w-8 text-blue-600" />}
        endpoint="/api/import/employees"
        expectedColumns={[
          "Employee Code",
          "First Name",
          "Last Name",
          "Date of Birth",
          "Gender",
          "Personal Email",
          "Work Email",
          "Phone",
          "Date of Joining",
          "Department",
          "Designation",
          "Reporting Manager Code",
          "PAN",
          "Bank Account",
          "IFSC",
          "Bank Name",
          "UAN",
          "State",
        ]}
      />

      <ImportCard
        title="Salary History"
        description="Import salary records for Form 16 continuity"
        icon={<DollarSign className="h-8 w-8 text-green-600" />}
        endpoint="/api/import/salary"
        expectedColumns={[
          "Employee Code",
          "Month",
          "Year",
          "Basic",
          "HRA",
          "Conveyance",
          "Special Allowance",
          "Other Allowances",
          "Gross",
          "PF Employee",
          "PF Employer",
          "ESI Employee",
          "ESI Employer",
          "PT",
          "TDS",
          "Other Deductions",
          "Net",
        ]}
      />

      <ImportCard
        title="Leave Balances"
        description="Import current leave balances from Keka"
        icon={<Calendar className="h-8 w-8 text-purple-600" />}
        endpoint="/api/import/leave"
        expectedColumns={[
          "Employee Code",
          "Leave Type",
          "Year",
          "Opening",
          "Accrued",
          "Used",
          "Balance",
        ]}
      />
    </div>
  );
}
