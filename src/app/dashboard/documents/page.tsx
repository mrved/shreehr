"use client";

import { format } from "date-fns";
import { Download, FileText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentUpload } from "@/components/documents/document-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface Document {
  id: string;
  type: string;
  original_name: string;
  file_size: number;
  uploaded_at: string;
  retention_until: string;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    employee_code: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_code: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchDocuments();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [selectedEmployee]);

  async function fetchEmployees() {
    const res = await fetch("/api/employees?limit=100");
    const data = await res.json();
    setEmployees(data.employees || []);
  }

  async function fetchDocuments() {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedEmployee) params.set("employeeId", selectedEmployee);

    const res = await fetch(`/api/documents?${params}`);
    const data = await res.json();
    setDocuments(data);
    setIsLoading(false);
  }

  async function deleteDocument(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    fetchDocuments();
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const typeLabels: Record<string, string> = {
    OFFER_LETTER: "Offer Letter",
    ID_PROOF: "ID Proof",
    ADDRESS_PROOF: "Address Proof",
    EDUCATION_CERT: "Education",
    EXPERIENCE_CERT: "Experience",
    PAN_CARD: "PAN Card",
    AADHAAR_CARD: "Aadhaar",
    BANK_PROOF: "Bank Proof",
    OTHER: "Other",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600">Manage employee documents (8-year retention)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedEmployee || "__all__"} onValueChange={(v) => setSelectedEmployee(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.employee_code} - {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Retention Until</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-[200px]">{doc.original_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.employee.first_name} {doc.employee.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[doc.type] || doc.type}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell>{format(new Date(doc.uploaded_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>{format(new Date(doc.retention_until), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(`/api/documents/${doc.id}/download`, "_blank")
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <DocumentUpload employees={employees} onUploadComplete={fetchDocuments} />
        </div>
      </div>
    </div>
  );
}
