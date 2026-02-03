// Re-export Prisma types for convenience
export type {
  User,
  Employee,
  Department,
  Designation,
  Document,
  SalaryRecord,
  LeaveBalance,
  ImportBatch,
} from "@prisma/client";

export type {
  UserRole,
  Gender,
  MaritalStatus,
  EmploymentType,
  EmploymentStatus,
  DocumentType,
  PaymentMode,
  SalaryStatus,
  ImportType,
  ImportStatus,
} from "@prisma/client";

// Document types for UI selection
export const DOCUMENT_TYPES = [
  "OFFER_LETTER",
  "ID_PROOF",
  "ADDRESS_PROOF",
  "EDUCATION_CERT",
  "EXPERIENCE_CERT",
  "PAN_CARD",
  "AADHAAR_CARD",
  "BANK_PROOF",
  "OTHER",
] as const;

// Audit fields interface for entities
export interface AuditFields {
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
}

// PII field types (for type safety with encryption)
export interface PIIFields {
  pan: string | null;
  aadhaar: string | null;
  bank_account: string | null;
}

// Encrypted PII fields as stored in database
export interface EncryptedPIIFields {
  pan_encrypted: string | null;
  aadhaar_encrypted: string | null;
  bank_account_encrypted: string | null;
}

// Helper type for creating entities without audit fields
export type CreateInput<T extends AuditFields> = Omit<
  T,
  "id" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

// Helper type for updating entities without audit fields
export type UpdateInput<T extends AuditFields> = Partial<
  Omit<T, "id" | "created_at" | "updated_at" | "created_by" | "updated_by">
>;
