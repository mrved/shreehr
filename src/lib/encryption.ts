/**
 * PII Encryption Utilities
 * Uses AES-256-GCM for encrypting sensitive employee data (PAN, Aadhaar, Bank Account)
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for AES
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 * Key must be 32 bytes (64 hex characters) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Generate one with: openssl rand -hex 32",
    );
  }

  if (key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32",
    );
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * Returns base64-encoded string: salt + iv + auth_tag + encrypted_data
 *
 * @param plaintext - The sensitive data to encrypt
 * @returns Base64-encoded encrypted string
 */
export function encrypt(plaintext: string): string {
  if (!plaintext || plaintext.trim() === "") {
    throw new Error("Cannot encrypt empty string");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  const tag = cipher.getAuthTag();

  // Combine: salt + iv + tag + encrypted data
  const result = Buffer.concat([salt, iv, tag, encrypted]);

  return result.toString("base64");
}

/**
 * Decrypts an encrypted string using AES-256-GCM
 *
 * @param encryptedData - Base64-encoded encrypted string from encrypt()
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData || encryptedData.trim() === "") {
    throw new Error("Cannot decrypt empty string");
  }

  const key = getEncryptionKey();
  const buffer = Buffer.from(encryptedData, "base64");

  // Extract components
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = buffer.subarray(ENCRYPTED_POSITION);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Safely encrypts a value that might be null or undefined
 * Returns null if input is null/undefined
 *
 * @param value - The value to encrypt (or null/undefined)
 * @returns Encrypted string or null
 */
export function encryptOptional(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") {
    return null;
  }
  return encrypt(value);
}

/**
 * Safely decrypts a value that might be null or undefined
 * Returns null if input is null/undefined
 *
 * @param encryptedValue - The encrypted value (or null/undefined)
 * @returns Decrypted string or null
 */
export function decryptOptional(encryptedValue: string | null | undefined): string | null {
  if (encryptedValue == null || encryptedValue.trim() === "") {
    return null;
  }
  return decrypt(encryptedValue);
}

/**
 * Validates PAN card number format (India)
 * Format: AAAAA9999A (5 letters, 4 digits, 1 letter)
 *
 * @param pan - PAN card number to validate
 * @returns true if valid format
 */
export function isValidPAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

/**
 * Validates Aadhaar number format (India)
 * Format: 12 digits, optionally with spaces (XXXX XXXX XXXX)
 *
 * @param aadhaar - Aadhaar number to validate
 * @returns true if valid format
 */
export function isValidAadhaar(aadhaar: string): boolean {
  // Remove spaces and check if it's 12 digits
  const cleaned = aadhaar.replace(/\s/g, "");
  return /^\d{12}$/.test(cleaned);
}

/**
 * Validates basic bank account number format
 * Accepts 9-18 digit account numbers
 *
 * @param accountNumber - Bank account number to validate
 * @returns true if valid format
 */
export function isValidBankAccount(accountNumber: string): boolean {
  const cleaned = accountNumber.replace(/\s/g, "");
  return /^\d{9,18}$/.test(cleaned);
}

/**
 * Masks a PAN number for display (shows only last 4 characters)
 * Example: ABCDE1234F -> ******1234F
 *
 * @param pan - PAN number to mask
 * @returns Masked PAN string
 */
export function maskPAN(pan: string): string {
  if (!pan || pan.length < 4) return "****";
  return `******${pan.slice(-5)}`;
}

/**
 * Masks an Aadhaar number for display (shows only last 4 digits)
 * Example: 123456789012 -> XXXX XXXX 9012
 *
 * @param aadhaar - Aadhaar number to mask
 * @returns Masked Aadhaar string
 */
export function maskAadhaar(aadhaar: string): string {
  const cleaned = aadhaar.replace(/\s/g, "");
  if (!cleaned || cleaned.length !== 12) return "XXXX XXXX XXXX";
  return `XXXX XXXX ${cleaned.slice(-4)}`;
}

/**
 * Masks a bank account number for display (shows only last 4 digits)
 * Example: 1234567890123456 -> ************3456
 *
 * @param accountNumber - Bank account number to mask
 * @returns Masked account number string
 */
export function maskBankAccount(accountNumber: string): string {
  const cleaned = accountNumber.replace(/\s/g, "");
  if (!cleaned || cleaned.length < 4) return "****";
  return `${"*".repeat(cleaned.length - 4)}${cleaned.slice(-4)}`;
}
