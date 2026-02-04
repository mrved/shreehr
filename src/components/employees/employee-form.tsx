"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";

interface Department {
  id: string;
  name: string;
}
interface Designation {
  id: string;
  title: string;
}
interface Manager {
  id: string;
  first_name: string;
  last_name: string;
}

interface EmployeeFormProps {
  employee?: any;
  isEdit?: boolean;
}

export function EmployeeForm({ employee, isEdit }: EmployeeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  // Helper to format date (handles both Date objects and ISO strings)
  const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    if (date instanceof Date) return date.toISOString().split("T")[0];
    if (typeof date === "string") return date.split("T")[0];
    return "";
  };

  const [formData, setFormData] = useState({
    employeeCode: employee?.employee_code || "",
    firstName: employee?.first_name || "",
    middleName: employee?.middle_name || "",
    lastName: employee?.last_name || "",
    dateOfBirth: formatDateForInput(employee?.date_of_birth),
    gender: employee?.gender || "MALE",
    maritalStatus: employee?.marital_status || "SINGLE",
    bloodGroup: employee?.blood_group || "",
    personalEmail: employee?.personal_email || "",
    personalPhone: employee?.personal_phone || "",
    emergencyContact: employee?.emergency_contact || "",
    emergencyPhone: employee?.emergency_phone || "",
    addressLine1: employee?.address_line1 || "",
    addressLine2: employee?.address_line2 || "",
    city: employee?.city || "",
    state: employee?.state || "",
    postalCode: employee?.postal_code || "",
    country: employee?.country || "India",
    dateOfJoining: formatDateForInput(employee?.date_of_joining),
    dateOfLeaving: formatDateForInput(employee?.date_of_leaving),
    employmentType: employee?.employment_type || "FULL_TIME",
    employmentStatus: employee?.employment_status || "ACTIVE",
    departmentId: employee?.department_id || "",
    designationId: employee?.designation_id || "",
    reportingManagerId: employee?.reporting_manager_id || "",
    panNumber: employee?._sensitive?.panNumber || "",
    aadhaarNumber: employee?._sensitive?.aadhaarNumber || "",
    bankAccountNumber: employee?._sensitive?.bankAccountNumber || "",
    bankIfscCode: employee?.bank_ifsc || "",
    bankName: employee?.bank_name || "",
    bankBranch: employee?.bank_branch || "",
    uan: employee?.uan || "",
    esicNumber: employee?.esic_number || "",
    previousEmployerName: employee?.previous_employer_name || "",
    previousEmployerUan: employee?.previous_employer_uan || "",
  });

  useEffect(() => {
    async function fetchOptions() {
      const [deptRes, desigRes, empRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/designations"),
        fetch("/api/employees?limit=100"),
      ]);

      const depts = await deptRes.json();
      const desigs = await desigRes.json();
      const emps = await empRes.json();

      setDepartments(depts);
      setDesignations(desigs);
      setManagers(emps.employees?.filter((e: any) => e.id !== employee?.id) || []);
    }
    fetchOptions();
  }, [employee?.id]);

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const url = isEdit ? `/api/employees/${employee.id}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          departmentId: formData.departmentId || null,
          designationId: formData.designationId || null,
          reportingManagerId: formData.reportingManagerId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save employee");
      }

      router.push("/dashboard/employees");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="employeeCode">Employee Code *</Label>
            <Input
              id="employeeCode"
              value={formData.employeeCode}
              onChange={(e) => handleChange("employeeCode", e.target.value)}
              required
              disabled={isEdit}
              placeholder="EMP001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => handleChange("middleName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital Status</Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(v) => handleChange("maritalStatus", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE">Single</SelectItem>
                <SelectItem value="MARRIED">Married</SelectItem>
                <SelectItem value="DIVORCED">Divorced</SelectItem>
                <SelectItem value="WIDOWED">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Input
              id="bloodGroup"
              value={formData.bloodGroup}
              onChange={(e) => handleChange("bloodGroup", e.target.value)}
              placeholder="A+"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personalPhone">Phone *</Label>
            <Input
              id="personalPhone"
              value={formData.personalPhone}
              onChange={(e) => handleChange("personalPhone", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personalEmail">Personal Email</Label>
            <Input
              id="personalEmail"
              type="email"
              value={formData.personalEmail}
              onChange={(e) => handleChange("personalEmail", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              value={formData.emergencyContact}
              onChange={(e) => handleChange("emergencyContact", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Emergency Phone</Label>
            <Input
              id="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={(e) => handleChange("emergencyPhone", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1 *</Label>
            <Input
              id="addressLine1"
              value={formData.addressLine1}
              onChange={(e) => handleChange("addressLine1", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) => handleChange("addressLine2", e.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dateOfJoining">Date of Joining *</Label>
            <Input
              id="dateOfJoining"
              type="date"
              value={formData.dateOfJoining}
              onChange={(e) => handleChange("dateOfJoining", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select
              value={formData.employmentType}
              onValueChange={(v) => handleChange("employmentType", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INTERN">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employmentStatus">Status</Label>
            <Select
              value={formData.employmentStatus}
              onValueChange={(v) => handleChange("employmentStatus", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="RESIGNED">Resigned</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="departmentId">Department *</Label>
            <Select
              value={formData.departmentId}
              onValueChange={(v) => handleChange("departmentId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="designationId">Designation *</Label>
            <Select
              value={formData.designationId}
              onValueChange={(v) => handleChange("designationId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {designations.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportingManagerId">Reporting Manager</Label>
            <Select
              value={formData.reportingManagerId || "__none__"}
              onValueChange={(v) => handleChange("reportingManagerId", v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sensitive Information (Encrypted at Rest)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="panNumber">PAN Number</Label>
            <Input
              id="panNumber"
              value={formData.panNumber}
              onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
            <Input
              id="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={(e) => handleChange("aadhaarNumber", e.target.value.replace(/\D/g, ""))}
              placeholder="123456789012"
              maxLength={12}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
            <Input
              id="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankIfscCode">IFSC Code</Label>
            <Input
              id="bankIfscCode"
              value={formData.bankIfscCode}
              onChange={(e) => handleChange("bankIfscCode", e.target.value.toUpperCase())}
              placeholder="SBIN0001234"
              maxLength={11}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankBranch">Bank Branch</Label>
            <Input
              id="bankBranch"
              value={formData.bankBranch}
              onChange={(e) => handleChange("bankBranch", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statutory Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="uan">UAN Number</Label>
            <Input
              id="uan"
              value={formData.uan}
              onChange={(e) => handleChange("uan", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="esicNumber">ESIC Number</Label>
            <Input
              id="esicNumber"
              value={formData.esicNumber}
              onChange={(e) => handleChange("esicNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="previousEmployerName">Previous Employer Name</Label>
            <Input
              id="previousEmployerName"
              value={formData.previousEmployerName}
              onChange={(e) => handleChange("previousEmployerName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="previousEmployerUan">Previous Employer UAN</Label>
            <Input
              id="previousEmployerUan"
              value={formData.previousEmployerUan}
              onChange={(e) => handleChange("previousEmployerUan", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEdit ? "Update Employee" : "Create Employee"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
