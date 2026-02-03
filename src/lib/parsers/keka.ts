/**
 * Keka HR CSV Parsers
 * Parses employee, salary, and leave data from Keka HR CSV exports
 */

import { parse } from "csv-parse/sync";

interface ParseResult<T> {
  data: T[];
  errors: { row: number; field: string; message: string }[];
}

interface KekaEmployee {
  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  personalEmail?: string;
  workEmail: string;
  phone: string;
  dateOfJoining: Date;
  department?: string;
  designation?: string;
  reportingManagerCode?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  uanNumber?: string;
  state?: string;
}

interface KekaSalary {
  employeeCode: string;
  month: number;
  year: number;
  basicPay: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  netSalary: number;
}

interface KekaLeaveBalance {
  employeeCode: string;
  leaveType: string;
  year: number;
  opening: number;
  accrued: number;
  used: number;
  balance: number;
}

/**
 * Parse Keka employee export CSV
 * Expected columns: Employee Code, First Name, Last Name, Date of Birth, Gender,
 * Personal Email, Work Email, Phone, Date of Joining, Department, Designation,
 * Reporting Manager Code, PAN, Bank Account, IFSC, Bank Name, UAN, State
 */
export function parseKekaEmployees(
  csvContent: string,
): ParseResult<KekaEmployee> {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const data: KekaEmployee[] = [];
  const errors: { row: number; field: string; message: string }[] = [];

  records.forEach((record: any, index: number) => {
    const row = index + 2; // 1-based, plus header

    try {
      // Required fields
      const employeeCode = record["Employee Code"]?.trim();
      const firstName = record["First Name"]?.trim();
      const lastName = record["Last Name"]?.trim();
      const workEmail = record["Work Email"]?.trim();
      const phone = record["Phone"]?.trim();
      const dobStr = record["Date of Birth"]?.trim();
      const dojStr = record["Date of Joining"]?.trim();

      if (!employeeCode) {
        errors.push({ row, field: "Employee Code", message: "Required" });
        return;
      }
      if (!firstName) {
        errors.push({ row, field: "First Name", message: "Required" });
        return;
      }
      if (!lastName) {
        errors.push({ row, field: "Last Name", message: "Required" });
        return;
      }
      if (!workEmail) {
        errors.push({ row, field: "Work Email", message: "Required" });
        return;
      }

      // Parse dates (handle multiple formats: DD/MM/YYYY, YYYY-MM-DD)
      const dateOfBirth = parseDate(dobStr);
      const dateOfJoining = parseDate(dojStr);

      if (!dateOfBirth) {
        errors.push({
          row,
          field: "Date of Birth",
          message: "Invalid date format",
        });
        return;
      }
      if (!dateOfJoining) {
        errors.push({
          row,
          field: "Date of Joining",
          message: "Invalid date format",
        });
        return;
      }

      // Parse gender
      const genderRaw = record["Gender"]?.trim().toUpperCase();
      let gender: "MALE" | "FEMALE" | "OTHER" = "MALE";
      if (genderRaw === "FEMALE" || genderRaw === "F") gender = "FEMALE";
      else if (genderRaw === "OTHER" || genderRaw === "O") gender = "OTHER";

      data.push({
        employeeCode,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        personalEmail: record["Personal Email"]?.trim() || undefined,
        workEmail,
        phone: phone || "",
        dateOfJoining,
        department: record["Department"]?.trim() || undefined,
        designation: record["Designation"]?.trim() || undefined,
        reportingManagerCode:
          record["Reporting Manager Code"]?.trim() || undefined,
        panNumber: record["PAN"]?.trim() || undefined,
        bankAccountNumber: record["Bank Account"]?.trim() || undefined,
        bankIfscCode: record["IFSC"]?.trim() || undefined,
        bankName: record["Bank Name"]?.trim() || undefined,
        uanNumber: record["UAN"]?.trim() || undefined,
        state: record["State"]?.trim() || undefined,
      });
    } catch (err) {
      errors.push({ row, field: "general", message: "Failed to parse row" });
    }
  });

  return { data, errors };
}

/**
 * Parse Keka salary export CSV
 * Expected columns: Employee Code, Month, Year, Basic, HRA, Conveyance,
 * Special Allowance, Other Allowances, Gross, PF Employee, PF Employer,
 * ESI Employee, ESI Employer, PT, TDS, Other Deductions, Net
 */
export function parseKekaSalary(csvContent: string): ParseResult<KekaSalary> {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const data: KekaSalary[] = [];
  const errors: { row: number; field: string; message: string }[] = [];

  records.forEach((record: any, index: number) => {
    const row = index + 2;

    try {
      const employeeCode = record["Employee Code"]?.trim();
      const month = parseInt(record["Month"]);
      const year = parseInt(record["Year"]);

      if (!employeeCode) {
        errors.push({ row, field: "Employee Code", message: "Required" });
        return;
      }
      if (isNaN(month) || month < 1 || month > 12) {
        errors.push({ row, field: "Month", message: "Invalid month (1-12)" });
        return;
      }
      if (isNaN(year) || year < 2000 || year > 2100) {
        errors.push({ row, field: "Year", message: "Invalid year" });
        return;
      }

      // Parse amounts (stored in paise for precision)
      const toPaise = (val: string) =>
        Math.round(parseFloat(val || "0") * 100);

      data.push({
        employeeCode,
        month,
        year,
        basicPay: toPaise(record["Basic"]),
        hra: toPaise(record["HRA"]),
        conveyance: toPaise(record["Conveyance"]),
        specialAllowance: toPaise(record["Special Allowance"]),
        otherAllowances: toPaise(record["Other Allowances"]),
        grossSalary: toPaise(record["Gross"]),
        pfEmployee: toPaise(record["PF Employee"]),
        pfEmployer: toPaise(record["PF Employer"]),
        esiEmployee: toPaise(record["ESI Employee"]),
        esiEmployer: toPaise(record["ESI Employer"]),
        professionalTax: toPaise(record["PT"]),
        tds: toPaise(record["TDS"]),
        otherDeductions: toPaise(record["Other Deductions"]),
        netSalary: toPaise(record["Net"]),
      });
    } catch (err) {
      errors.push({ row, field: "general", message: "Failed to parse row" });
    }
  });

  return { data, errors };
}

/**
 * Parse Keka leave balance export CSV
 * Expected columns: Employee Code, Leave Type, Year, Opening, Accrued, Used, Balance
 */
export function parseKekaLeave(
  csvContent: string,
): ParseResult<KekaLeaveBalance> {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const data: KekaLeaveBalance[] = [];
  const errors: { row: number; field: string; message: string }[] = [];

  records.forEach((record: any, index: number) => {
    const row = index + 2;

    try {
      const employeeCode = record["Employee Code"]?.trim();
      const leaveType = record["Leave Type"]?.trim();
      const year = parseInt(record["Year"]);

      if (!employeeCode) {
        errors.push({ row, field: "Employee Code", message: "Required" });
        return;
      }
      if (!leaveType) {
        errors.push({ row, field: "Leave Type", message: "Required" });
        return;
      }

      data.push({
        employeeCode,
        leaveType,
        year: isNaN(year) ? new Date().getFullYear() : year,
        opening: parseFloat(record["Opening"] || "0"),
        accrued: parseFloat(record["Accrued"] || "0"),
        used: parseFloat(record["Used"] || "0"),
        balance: parseFloat(record["Balance"] || "0"),
      });
    } catch (err) {
      errors.push({ row, field: "general", message: "Failed to parse row" });
    }
  });

  return { data, errors };
}

// Helper to parse dates in multiple formats
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try DD/MM/YYYY
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(
      parseInt(ddmmyyyy[3]),
      parseInt(ddmmyyyy[2]) - 1,
      parseInt(ddmmyyyy[1]),
    );
  }

  // Try YYYY-MM-DD
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  return null;
}
