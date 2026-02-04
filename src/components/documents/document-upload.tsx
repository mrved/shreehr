"use client";

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
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
import { DOCUMENT_TYPES } from "@/types";

interface DocumentUploadProps {
  employeeId?: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_code: string;
  }[];
  onUploadComplete?: () => void;
}

export function DocumentUpload({ employeeId, employees, onUploadComplete }: DocumentUploadProps) {
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || "");
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!selectedEmployee || !documentType || !file) {
      setError("Please select employee, document type, and file");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeId", selectedEmployee);
      formData.append("type", documentType);
      if (description) formData.append("description", description);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      // Reset form
      setFile(null);
      setDocumentType("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const documentTypeLabels: Record<string, string> = {
    OFFER_LETTER: "Offer Letter",
    ID_PROOF: "ID Proof",
    ADDRESS_PROOF: "Address Proof",
    EDUCATION_CERT: "Education Certificate",
    EXPERIENCE_CERT: "Experience Certificate",
    PAN_CARD: "PAN Card",
    AADHAAR_CARD: "Aadhaar Card",
    BANK_PROOF: "Bank Proof",
    OTHER: "Other",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}

        {!employeeId && employees && (
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
        )}

        <div className="space-y-2">
          <Label>Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {documentTypeLabels[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>File</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">Max 10MB. Allowed: PDF, JPG, PNG, DOC, DOCX</p>
        </div>

        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
          />
        </div>

        <Button onClick={handleUpload} disabled={isUploading} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Document"}
        </Button>
      </CardContent>
    </Card>
  );
}
