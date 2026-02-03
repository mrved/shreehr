/**
 * Tests for PII Encryption Utilities
 */

import { describe, expect, it, beforeAll } from "vitest";
import {
  encrypt,
  decrypt,
  encryptOptional,
  decryptOptional,
  isValidPAN,
  isValidAadhaar,
  isValidBankAccount,
  maskPAN,
  maskAadhaar,
  maskBankAccount,
} from "./encryption";

// Set up test encryption key
beforeAll(() => {
  // 32-byte key (64 hex characters) for testing
  process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("encrypt and decrypt", () => {
  it("should encrypt and decrypt a string successfully", () => {
    const original = "ABCDE1234F"; // Sample PAN
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });

  it("should produce different ciphertexts for same plaintext", () => {
    const original = "123456789012"; // Sample Aadhaar
    const encrypted1 = encrypt(original);
    const encrypted2 = encrypt(original);

    // Different IVs should produce different ciphertexts
    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to same value
    expect(decrypt(encrypted1)).toBe(original);
    expect(decrypt(encrypted2)).toBe(original);
  });

  it("should throw error when encrypting empty string", () => {
    expect(() => encrypt("")).toThrow("Cannot encrypt empty string");
    expect(() => encrypt("   ")).toThrow("Cannot encrypt empty string");
  });

  it("should throw error when decrypting empty string", () => {
    expect(() => decrypt("")).toThrow("Cannot decrypt empty string");
    expect(() => decrypt("   ")).toThrow("Cannot decrypt empty string");
  });

  it("should throw error when decrypting invalid data", () => {
    expect(() => decrypt("invalid_base64")).toThrow();
  });

  it("should handle long strings", () => {
    const original = "A".repeat(1000);
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  it("should handle special characters", () => {
    const original = "Test@#$%^&*()_+-=[]{}|;:',.<>?/~`";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  it("should handle unicode characters", () => {
    const original = "हिन्दी 中文 العربية 日本語";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });
});

describe("encryptOptional and decryptOptional", () => {
  it("should return null for null input", () => {
    expect(encryptOptional(null)).toBeNull();
    expect(decryptOptional(null)).toBeNull();
  });

  it("should return null for undefined input", () => {
    expect(encryptOptional(undefined)).toBeNull();
    expect(decryptOptional(undefined)).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(encryptOptional("")).toBeNull();
    expect(encryptOptional("   ")).toBeNull();
  });

  it("should encrypt and decrypt valid values", () => {
    const original = "ABCDE1234F";
    const encrypted = encryptOptional(original);
    expect(encrypted).not.toBeNull();

    const decrypted = decryptOptional(encrypted!);
    expect(decrypted).toBe(original);
  });
});

describe("isValidPAN", () => {
  it("should validate correct PAN format", () => {
    expect(isValidPAN("ABCDE1234F")).toBe(true);
    expect(isValidPAN("ZYXWV9876A")).toBe(true);
  });

  it("should reject invalid PAN formats", () => {
    expect(isValidPAN("ABCDE123F")).toBe(false); // Too short
    expect(isValidPAN("ABCDE12345F")).toBe(false); // Too long
    expect(isValidPAN("abcde1234f")).toBe(false); // Lowercase
    expect(isValidPAN("ABCD11234F")).toBe(false); // Digit in wrong position
    expect(isValidPAN("ABCDE1234")).toBe(false); // Missing last letter
    expect(isValidPAN("")).toBe(false);
  });
});

describe("isValidAadhaar", () => {
  it("should validate correct Aadhaar format", () => {
    expect(isValidAadhaar("123456789012")).toBe(true);
    expect(isValidAadhaar("1234 5678 9012")).toBe(true);
    expect(isValidAadhaar("999988887777")).toBe(true);
  });

  it("should reject invalid Aadhaar formats", () => {
    expect(isValidAadhaar("12345678901")).toBe(false); // Too short
    expect(isValidAadhaar("1234567890123")).toBe(false); // Too long
    expect(isValidAadhaar("12345678901A")).toBe(false); // Contains letter
    expect(isValidAadhaar("")).toBe(false);
  });
});

describe("isValidBankAccount", () => {
  it("should validate correct bank account formats", () => {
    expect(isValidBankAccount("123456789")).toBe(true); // 9 digits
    expect(isValidBankAccount("12345678901234")).toBe(true); // 14 digits
    expect(isValidBankAccount("123456789012345678")).toBe(true); // 18 digits
    expect(isValidBankAccount("1234 5678 9012")).toBe(true); // With spaces
  });

  it("should reject invalid bank account formats", () => {
    expect(isValidBankAccount("12345678")).toBe(false); // Too short
    expect(isValidBankAccount("1234567890123456789")).toBe(false); // Too long
    expect(isValidBankAccount("12345678A012")).toBe(false); // Contains letter
    expect(isValidBankAccount("")).toBe(false);
  });
});

describe("maskPAN", () => {
  it("should mask PAN correctly", () => {
    expect(maskPAN("ABCDE1234F")).toBe("******1234F");
    expect(maskPAN("ZYXWV9876A")).toBe("******9876A");
  });

  it("should handle short strings", () => {
    expect(maskPAN("ABC")).toBe("****");
    expect(maskPAN("")).toBe("****");
  });
});

describe("maskAadhaar", () => {
  it("should mask Aadhaar correctly", () => {
    expect(maskAadhaar("123456789012")).toBe("XXXX XXXX 9012");
    expect(maskAadhaar("1234 5678 9012")).toBe("XXXX XXXX 9012");
  });

  it("should handle invalid lengths", () => {
    expect(maskAadhaar("12345")).toBe("XXXX XXXX XXXX");
    expect(maskAadhaar("")).toBe("XXXX XXXX XXXX");
  });
});

describe("maskBankAccount", () => {
  it("should mask bank account correctly", () => {
    expect(maskBankAccount("123456789012")).toBe("********9012");
    expect(maskBankAccount("1234567890123456")).toBe("************3456");
  });

  it("should handle short strings", () => {
    expect(maskBankAccount("123")).toBe("****");
    expect(maskBankAccount("")).toBe("****");
  });

  it("should handle spaces", () => {
    // "1234 5678 9012" has 12 digits, so 12-4=8 asterisks
    expect(maskBankAccount("1234 5678 9012")).toBe("********9012");
  });
});

describe("encryption key validation", () => {
  it("should throw error if ENCRYPTION_KEY is not set", () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;

    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY environment variable is not set");

    process.env.ENCRYPTION_KEY = originalKey;
  });

  it("should throw error if ENCRYPTION_KEY is wrong length", () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = "tooshort";

    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY must be 64 hex characters");

    process.env.ENCRYPTION_KEY = originalKey;
  });
});

describe("end-to-end PII encryption workflow", () => {
  it("should encrypt and decrypt PAN", () => {
    const pan = "ABCDE1234F";
    expect(isValidPAN(pan)).toBe(true);

    const encrypted = encrypt(pan);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(pan);
    expect(maskPAN(decrypted)).toBe("******1234F");
  });

  it("should encrypt and decrypt Aadhaar", () => {
    const aadhaar = "123456789012";
    expect(isValidAadhaar(aadhaar)).toBe(true);

    const encrypted = encrypt(aadhaar);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(aadhaar);
    expect(maskAadhaar(decrypted)).toBe("XXXX XXXX 9012");
  });

  it("should encrypt and decrypt bank account", () => {
    const account = "1234567890123456";
    expect(isValidBankAccount(account)).toBe(true);

    const encrypted = encrypt(account);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(account);
    expect(maskBankAccount(decrypted)).toBe("************3456");
  });
});
