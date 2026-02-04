"use client";

import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  department?: { name: string };
  designation?: { title: string };
}

interface SalaryStructure {
  id: string;
  employee_id: string;
  employee: Employee;
  effective_from: string;
  effective_to?: string;
  basic_paise: number;
  hra_paise: number;
  special_allowance_paise: number;
  lta_paise: number;
  medical_paise: number;
  conveyance_paise: number;
  other_allowances_paise: number;
  gross_monthly_paise: number;
  annual_ctc_paise: number;
  basic_percentage: number;
  is_compliant: boolean;
  tax_regime: string;
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: "",
    effective_from: new Date().toISOString().split("T")[0],
    basic_paise: 0,
    hra_paise: 0,
    special_allowance_paise: 0,
    lta_paise: 0,
    medical_paise: 0,
    conveyance_paise: 0,
    other_allowances_paise: 0,
    tax_regime: "NEW",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [structRes, empRes] = await Promise.all([
        fetch("/api/salary-structures"),
        fetch("/api/employees?limit=500"),
      ]);
      const structData = await structRes.json();
      const empData = await empRes.json();
      setStructures(structData.data || []);
      setEmployees(empData.employees || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(field: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/salary-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          effective_from: new Date(formData.effective_from),
        }),
      });

      if (res.ok) {
        toast({ title: "Salary structure created successfully" });
        setDialogOpen(false);
        setFormData({
          employee_id: "",
          effective_from: new Date().toISOString().split("T")[0],
          basic_paise: 0,
          hra_paise: 0,
          special_allowance_paise: 0,
          lta_paise: 0,
          medical_paise: 0,
          conveyance_paise: 0,
          other_allowances_paise: 0,
          tax_regime: "NEW",
        });
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // Calculate gross from form data
  const formGross =
    formData.basic_paise +
    formData.hra_paise +
    formData.special_allowance_paise +
    formData.lta_paise +
    formData.medical_paise +
    formData.conveyance_paise +
    formData.other_allowances_paise;

  const formBasicPercentage = formGross > 0 ? ((formData.basic_paise / formGross) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Salary Structures</h1>
          <p className="text-muted-foreground">
            Manage employee salary structures (Labour Code 2026 compliant)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Salary Structure</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(v) => handleInputChange("employee_id", v)}
                  >
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
                </div>
                <div className="space-y-2">
                  <Label>Effective From *</Label>
                  <Input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => handleInputChange("effective_from", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Salary Components (in Paise)</h3>
                <p className="text-xs text-muted-foreground">
                  Enter amounts in paise (1 rupee = 100 paise). E.g., ₹50,000 = 5000000 paise
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Basic (min 50% of gross)</Label>
                    <Input
                      type="number"
                      value={formData.basic_paise}
                      onChange={(e) => handleInputChange("basic_paise", parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>HRA</Label>
                    <Input
                      type="number"
                      value={formData.hra_paise}
                      onChange={(e) => handleInputChange("hra_paise", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Special Allowance</Label>
                    <Input
                      type="number"
                      value={formData.special_allowance_paise}
                      onChange={(e) =>
                        handleInputChange("special_allowance_paise", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>LTA</Label>
                    <Input
                      type="number"
                      value={formData.lta_paise}
                      onChange={(e) => handleInputChange("lta_paise", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical</Label>
                    <Input
                      type="number"
                      value={formData.medical_paise}
                      onChange={(e) => handleInputChange("medical_paise", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conveyance</Label>
                    <Input
                      type="number"
                      value={formData.conveyance_paise}
                      onChange={(e) =>
                        handleInputChange("conveyance_paise", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Other Allowances</Label>
                    <Input
                      type="number"
                      value={formData.other_allowances_paise}
                      onChange={(e) =>
                        handleInputChange("other_allowances_paise", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Regime</Label>
                    <Select
                      value={formData.tax_regime}
                      onValueChange={(v) => handleInputChange("tax_regime", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New Regime</SelectItem>
                        <SelectItem value="OLD">Old Regime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-md space-y-1">
                  <p>
                    <strong>Gross Monthly:</strong> {formatCurrency(formGross)}
                  </p>
                  <p>
                    <strong>Basic Percentage:</strong> {formBasicPercentage}%
                    {Number(formBasicPercentage) < 50 && (
                      <span className="text-red-500 ml-2">⚠ Must be ≥50% per Labour Code 2026</span>
                    )}
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Salary Structure
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Salary Structures</CardTitle>
        </CardHeader>
        <CardContent>
          {structures.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No salary structures defined yet. Add employees first, then create their salary structures.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead className="text-right">Gross Monthly</TableHead>
                  <TableHead className="text-right">Annual CTC</TableHead>
                  <TableHead>Basic %</TableHead>
                  <TableHead>Compliant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.employee.first_name} {s.employee.last_name}
                      <br />
                      <span className="text-xs text-muted-foreground">{s.employee.employee_code}</span>
                    </TableCell>
                    <TableCell>{s.employee.department?.name || "-"}</TableCell>
                    <TableCell>{new Date(s.effective_from).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.gross_monthly_paise)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.annual_ctc_paise)}</TableCell>
                    <TableCell>{s.basic_percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${s.is_compliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {s.is_compliant ? "Yes" : "No"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
