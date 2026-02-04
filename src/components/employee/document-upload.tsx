"use client";

import { Download, File, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/storage-constants";

interface DocumentUploadProps {
  declarationId: string;
  section: string;
  onUploadComplete?: () => void;
}

interface UploadedDocument {
  id: string;
  file_name: string;
  original_name: string;
  section: string;
  size_bytes: number;
  created_at: string;
}

export function DocumentUpload({ declarationId, section, onUploadComplete }: DocumentUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // Fetch existing documents
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/investments/${declarationId}/documents?section=${section}`,
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [declarationId, section]);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);

    // Validate each file
    for (const file of fileArray) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name}: Only PDF, JPG, PNG, and DOC files are allowed.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name}: Maximum file size is 10MB.`,
          variant: "destructive",
        });
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("section", section);

      const response = await fetch(`/api/investments/${declarationId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded.`,
      });

      // Refresh documents list
      await fetchDocuments();
      onUploadComplete?.();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/investments/${declarationId}/documents?documentId=${documentId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      toast({
        title: "Document deleted",
        description: `${fileName} has been deleted.`,
      });

      // Refresh documents list
      await fetchDocuments();
      onUploadComplete?.();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSectionLabel = () => {
    switch (section) {
      case "80C":
        return "80C Proofs (PF, ELSS, LIC, Tuition, NPS)";
      case "80D":
        return "80D Proofs (Health Insurance, Checkup Bills)";
      case "HRA":
        return "HRA Proofs (Rent Receipts, Agreement, Landlord PAN)";
      case "OTHER":
        return "Other Proofs (Education Loan, Donations)";
      default:
        return "Investment Proofs";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">{getSectionLabel()}</h4>
        <span className="text-xs text-gray-500">{documents.length} files</span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop files here, or{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={uploading}
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG, DOC (max 10MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          multiple
          disabled={uploading}
        />
      </div>

      {/* Uploading indicator */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Uploaded Files</p>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between bg-white border rounded-lg p-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.original_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(doc.size_bytes)} •{" "}
                    {new Date(doc.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/investments/${declarationId}/documents/${doc.id}/download`}
                  download
                  className="text-blue-600 hover:text-blue-700 p-1"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id, doc.original_name)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Delete"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
