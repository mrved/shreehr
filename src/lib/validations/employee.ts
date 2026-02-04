import { z } from "zod";

// Indian PAN format: 5 letters, 4 digits, 1 letter
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Indian Aadhaar: 12 digits
const aadhaarRegex = /^[0-9]{12}$/;

// IFSC code: 4 letters, 0, 6 alphanumeric
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const employeeCreateSchema = z.object({
  // Personal Info
  employeeCode: z.string().min(1).max(20),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().transform((s) => new Date(s)),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).default("SINGLE").optional(),
  bloodGroup: z.string().max(10).optional().nullable(),

  // Contact
  personalEmail: z.string().email().optional().nullable(),
  personalPhone: z.string().min(10).max(15),
  emergencyContact: z.string().max(100).optional().nullable(),
  emergencyPhone: z.string().max(15).optional().nullable(),

  // Address
  addressLine1: z.string().max(200),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().max(100),
  state: z.string().max(100),
  postalCode: z.string().max(10),
  country: z.string().max(100).default("India").optional(),

  // Employment
  dateOfJoining: z.string().transform((s) => new Date(s)),
  dateOfLeaving: z
    .string()
    .transform((s) => new Date(s))
    .optional()
    .nullable(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"])
    .default("FULL_TIME")
    .optional(),
  employmentStatus: z
    .enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "RESIGNED", "RETIRED"])
    .default("ACTIVE")
    .optional(),

  // Organization
  departmentId: z.string(),
  designationId: z.string(),
  reportingManagerId: z.string().optional().nullable(),

  // Sensitive (will be encrypted) - Optional for now
  panNumber: z.string().regex(panRegex, "Invalid PAN format (AAAAA9999A)").optional().nullable(),
  aadhaarNumber: z
    .string()
    .regex(aadhaarRegex, "Invalid Aadhaar format (12 digits)")
    .optional()
    .nullable(),
  bankAccountNumber: z.string().min(9).max(18).optional().nullable(),
  bankIfscCode: z
    .string()
    .regex(ifscRegex, "Invalid IFSC format (AAAA0NNNNNN)")
    .optional()
    .nullable(),
  bankName: z.string().max(100).optional().nullable(),
  bankBranch: z.string().max(100).optional().nullable(),

  // Statutory
  uan: z.string().max(12).optional().nullable(),
  esicNumber: z.string().max(17).optional().nullable(),
  previousEmployerName: z.string().max(200).optional().nullable(),
  previousEmployerUan: z.string().max(12).optional().nullable(),
});

export const employeeUpdateSchema = employeeCreateSchema.partial().omit({ employeeCode: true });

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
