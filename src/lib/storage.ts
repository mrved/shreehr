/**
 * File Storage Utilities
 * Local filesystem storage for employee documents with 8-year retention
 */

import { randomBytes } from "node:crypto";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Base directory for file storage
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// 8 years in milliseconds for retention calculation
const RETENTION_YEARS = 8;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Calculate retention date (8 years from upload)
 */
export function calculateRetentionDate(uploadDate: Date = new Date()): Date {
  return new Date(uploadDate.getTime() + RETENTION_YEARS * MS_PER_YEAR);
}

/**
 * Generate a unique filename to prevent collisions
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = originalName.split(".").pop() || "";
  const uniqueId = randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}.${ext}`;
}

/**
 * Get storage path for an employee's documents
 */
function getEmployeeDir(employeeId: string): string {
  return join(UPLOAD_DIR, "employees", employeeId);
}

/**
 * Get storage path for statutory files
 */
export function getStatutoryDir(payrollRunId: string): string {
  return join(UPLOAD_DIR, "statutory", payrollRunId);
}

/**
 * Save a file to storage
 */
export async function saveFile(
  employeeId: string,
  file: Buffer,
  originalName: string,
): Promise<{ fileName: string; storagePath: string }> {
  const employeeDir = getEmployeeDir(employeeId);

  // Ensure directory exists
  await mkdir(employeeDir, { recursive: true });

  const fileName = generateUniqueFilename(originalName);
  const storagePath = join(employeeDir, fileName);

  await writeFile(storagePath, file);

  return { fileName, storagePath };
}

/**
 * Get a file from storage
 */
export async function getFile(storagePath: string): Promise<Buffer | null> {
  try {
    await access(storagePath);
    return await readFile(storagePath);
  } catch {
    return null;
  }
}

/**
 * Delete a file from storage (soft delete - file remains until retention expires)
 */
export async function deleteFile(storagePath: string): Promise<boolean> {
  try {
    await access(storagePath);
    await unlink(storagePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file path for download
 */
export function getFilePath(employeeId: string, fileName: string): string {
  return join(getEmployeeDir(employeeId), fileName);
}

// Re-export constants for backward compatibility
export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "./storage-constants";

/**
 * Validate file upload
 */
export function validateFile(mimeType: string, size: number): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: "File type not allowed. Use PDF, JPG, PNG, or DOC.",
    };
  }
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 10MB limit." };
  }
  return { valid: true };
}

/**
 * Save a statutory file to storage
 */
export async function saveStatutoryFile(
  payrollRunId: string,
  content: string,
  filename: string,
): Promise<string> {
  const statutoryDir = getStatutoryDir(payrollRunId);

  // Ensure directory exists
  await mkdir(statutoryDir, { recursive: true });

  const storagePath = join(statutoryDir, filename);
  await writeFile(storagePath, content, "utf-8");

  return storagePath;
}
