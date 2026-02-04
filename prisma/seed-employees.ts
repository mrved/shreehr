/**
 * Seed Script: Test Employees with Leave Balances and History
 * Plan 07-01: Test Data Seeding
 */

import bcrypt from "bcrypt";
import { prisma } from "../src/lib/db";

// Department and Designation IDs from the database
const DEPARTMENTS = {
  HR: "cml7p192c0001cgvtnv6l0ewc",
  FINANCE: "cml7p199a0002cgvtj6k4eri3",
  ENGINEERING: "cml7p19ge0003cgvtrns23zc0",
};

const DESIGNATIONS = {
  HR_MANAGER: "cml7p1al40007cgvtp4a4yege",
  PAYROLL_MANAGER: "cml7p1as10008cgvthrwpyu68",
  SOFTWARE_ENGINEER: "cml7p1az30009cgvtnrixv94k",
  SENIOR_SOFTWARE_ENGINEER: "cml7p1b5u000acgvtnyqulldx",
};

const LEAVE_TYPES = {
  CL: "cml7ojtyw00001svt2pgaxgs7",
  SL: "cml7ojuc200011svtxzjyij5i",
  EL: "cml7ojudi00021svtedfxvj88",
};

// Employee data per plan requirements
const EMPLOYEES = [
  {
    // ADMIN - HR admin
    user: {
      email: "priya.sharma@shreehr.local",
      name: "Priya Sharma",
      role: "ADMIN" as const,
    },
    employee: {
      employee_code: "SHR001",
      first_name: "Priya",
      last_name: "Sharma",
      gender: "FEMALE" as const,
      date_of_birth: new Date("1988-05-15"),
      personal_phone: "9876543210",
      address_line1: "123 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      postal_code: "560001",
      department_id: DEPARTMENTS.HR,
      designation_id: DESIGNATIONS.HR_MANAGER,
      date_of_joining: new Date("2024-03-01"),
      pan_encrypted: "ABCPS1234A", // Placeholder
      bank_name: "HDFC Bank",
      bank_ifsc: "HDFC0001234",
      uan: "100123456789",
    },
    salary_paise: 8500000, // ₹85,000
    leaveBalances: { CL: 10, SL: 8, EL: 12 },
  },
  {
    // HR_MANAGER - Leave approvals
    user: {
      email: "rajesh.kumar@shreehr.local",
      name: "Rajesh Kumar",
      role: "HR_MANAGER" as const,
    },
    employee: {
      employee_code: "SHR002",
      first_name: "Rajesh",
      last_name: "Kumar",
      gender: "MALE" as const,
      date_of_birth: new Date("1985-08-22"),
      personal_phone: "9876543211",
      address_line1: "45 Pune Road",
      city: "Mumbai",
      state: "Maharashtra",
      postal_code: "400001",
      department_id: DEPARTMENTS.HR,
      designation_id: DESIGNATIONS.HR_MANAGER,
      date_of_joining: new Date("2024-06-15"),
      pan_encrypted: "ABCRK5678B",
      bank_name: "ICICI Bank",
      bank_ifsc: "ICIC0005678",
      uan: "100234567890",
    },
    salary_paise: 6500000, // ₹65,000
    leaveBalances: { CL: 9, SL: 7, EL: 10 },
  },
  {
    // PAYROLL_MANAGER - Payroll processing
    user: {
      email: "anita.patel@shreehr.local",
      name: "Anita Patel",
      role: "PAYROLL_MANAGER" as const,
    },
    employee: {
      employee_code: "SHR003",
      first_name: "Anita",
      last_name: "Patel",
      gender: "FEMALE" as const,
      date_of_birth: new Date("1990-01-10"),
      personal_phone: "9876543212",
      address_line1: "78 SG Highway",
      city: "Ahmedabad",
      state: "Gujarat",
      postal_code: "380015",
      department_id: DEPARTMENTS.FINANCE,
      designation_id: DESIGNATIONS.PAYROLL_MANAGER,
      date_of_joining: new Date("2024-09-01"),
      pan_encrypted: "ABCAP9012C",
      bank_name: "SBI",
      bank_ifsc: "SBIN0009012",
      uan: "100345678901",
    },
    salary_paise: 5500000, // ₹55,000
    leaveBalances: { CL: 11, SL: 9, EL: 8 },
  },
  {
    // EMPLOYEE - ESI eligible (≤₹21K)
    user: {
      email: "vikram.singh@shreehr.local",
      name: "Vikram Singh",
      role: "EMPLOYEE" as const,
    },
    employee: {
      employee_code: "SHR004",
      first_name: "Vikram",
      last_name: "Singh",
      gender: "MALE" as const,
      date_of_birth: new Date("1995-11-25"),
      personal_phone: "9876543213",
      address_line1: "22 Anna Salai",
      city: "Chennai",
      state: "Tamil Nadu",
      postal_code: "600002",
      department_id: DEPARTMENTS.ENGINEERING,
      designation_id: DESIGNATIONS.SOFTWARE_ENGINEER,
      date_of_joining: new Date("2025-01-10"),
      pan_encrypted: "ABCVS3456D",
      bank_name: "Axis Bank",
      bank_ifsc: "UTIB0003456",
      uan: "100456789012",
      esic_number: "31-00-123456-000-0001", // ESI eligible
    },
    salary_paise: 1800000, // ₹18,000 (ESI eligible)
    leaveBalances: { CL: 12, SL: 10, EL: 5 },
  },
  {
    // EMPLOYEE - Standard employee
    user: {
      email: "meera.reddy@shreehr.local",
      name: "Meera Reddy",
      role: "EMPLOYEE" as const,
    },
    employee: {
      employee_code: "SHR005",
      first_name: "Meera",
      last_name: "Reddy",
      gender: "FEMALE" as const,
      date_of_birth: new Date("1992-07-18"),
      personal_phone: "9876543214",
      address_line1: "56 Koramangala",
      city: "Bengaluru",
      state: "Karnataka",
      postal_code: "560034",
      department_id: DEPARTMENTS.ENGINEERING,
      designation_id: DESIGNATIONS.SENIOR_SOFTWARE_ENGINEER,
      date_of_joining: new Date("2024-04-15"),
      pan_encrypted: "ABCMR7890E",
      bank_name: "Kotak Bank",
      bank_ifsc: "KKBK0007890",
      uan: "100567890123",
    },
    salary_paise: 4200000, // ₹42,000
    leaveBalances: { CL: 8, SL: 6, EL: 14 },
  },
];

// Historical leave requests
const LEAVE_REQUESTS = [
  {
    employeeCode: "SHR001",
    leaveType: "CL",
    startDate: new Date("2025-12-23"),
    endDate: new Date("2025-12-24"),
    days: 2,
    reason: "Personal work",
    status: "APPROVED" as const,
  },
  {
    employeeCode: "SHR002",
    leaveType: "SL",
    startDate: new Date("2025-11-10"),
    endDate: new Date("2025-11-11"),
    days: 2,
    reason: "Unwell - fever",
    status: "APPROVED" as const,
  },
  {
    employeeCode: "SHR003",
    leaveType: "EL",
    startDate: new Date("2025-12-26"),
    endDate: new Date("2025-12-31"),
    days: 4,
    reason: "New Year vacation",
    status: "APPROVED" as const,
  },
  {
    employeeCode: "SHR004",
    leaveType: "CL",
    startDate: new Date("2026-02-10"),
    endDate: new Date("2026-02-10"),
    days: 1,
    reason: "Family function",
    status: "PENDING" as const,
  },
  {
    employeeCode: "SHR005",
    leaveType: "SL",
    startDate: new Date("2026-01-06"),
    endDate: new Date("2026-01-07"),
    days: 2,
    reason: "Medical appointment",
    status: "APPROVED" as const,
  },
  {
    employeeCode: "SHR005",
    leaveType: "CL",
    startDate: new Date("2025-10-14"),
    endDate: new Date("2025-10-14"),
    days: 1,
    reason: "Personal",
    status: "APPROVED" as const,
  },
];

async function seedEmployees() {
  console.log("🌱 Starting employee seed...\n");

  const passwordHash = await bcrypt.hash("employee123", 12);
  const employeeMap: Record<string, string> = {};

  for (const emp of EMPLOYEES) {
    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employee_code: emp.employee.employee_code },
    });

    if (existingEmployee) {
      console.log(`⚠️  Employee ${emp.employee.employee_code} already exists, skipping...`);
      employeeMap[emp.employee.employee_code] = existingEmployee.id;
      continue;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emp.user.email },
    });

    if (existingUser) {
      console.log(`⚠️  User ${emp.user.email} already exists, skipping...`);
      continue;
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: emp.employee,
    });

    // Create user linked to employee
    await prisma.user.create({
      data: {
        ...emp.user,
        password_hash: passwordHash,
        employee_id: employee.id,
      },
    });

    // Create salary structure
    const basicPaise = Math.round(emp.salary_paise * 0.5); // 50% basic
    const hraPaise = Math.round(emp.salary_paise * 0.25); // 25% HRA
    const specialAllowancePaise = emp.salary_paise - basicPaise - hraPaise; // Remainder

    await prisma.salaryStructure.create({
      data: {
        employee_id: employee.id,
        effective_from: emp.employee.date_of_joining,
        basic_paise: basicPaise,
        hra_paise: hraPaise,
        special_allowance_paise: specialAllowancePaise,
        gross_monthly_paise: emp.salary_paise,
        annual_ctc_paise: emp.salary_paise * 12,
        basic_percentage: 50,
        is_compliant: true,
      },
    });

    // Create leave balances for 2026
    for (const [code, balance] of Object.entries(emp.leaveBalances)) {
      await prisma.leaveBalance.create({
        data: {
          employee_id: employee.id,
          year: 2026,
          leave_type: code,
          opening: balance,
          accrued: 0,
          used: 0,
          balance: balance,
        },
      });
    }

    employeeMap[emp.employee.employee_code] = employee.id;

    console.log(
      `✅ Created: ${emp.user.name} (${emp.employee.employee_code}) - ${emp.user.role} - ₹${emp.salary_paise / 100}`
    );
  }

  console.log("\n📋 Creating leave requests...\n");

  // Create leave requests
  for (const lr of LEAVE_REQUESTS) {
    const employeeId = employeeMap[lr.employeeCode];
    if (!employeeId) {
      console.log(`⚠️  Employee ${lr.employeeCode} not found, skipping leave request`);
      continue;
    }

    const leaveTypeId = LEAVE_TYPES[lr.leaveType as keyof typeof LEAVE_TYPES];

    // Check if leave request already exists
    const existing = await prisma.leaveRequest.findFirst({
      where: {
        employee_id: employeeId,
        start_date: lr.startDate,
        end_date: lr.endDate,
      },
    });

    if (existing) {
      console.log(`⚠️  Leave request for ${lr.employeeCode} on ${lr.startDate.toISOString().split("T")[0]} already exists`);
      continue;
    }

    await prisma.leaveRequest.create({
      data: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        start_date: lr.startDate,
        end_date: lr.endDate,
        days_count: lr.days,
        reason: lr.reason,
        status: lr.status,
        approved_at: lr.status === "APPROVED" ? new Date() : null,
      },
    });

    console.log(
      `✅ Leave: ${lr.employeeCode} - ${lr.leaveType} - ${lr.startDate.toISOString().split("T")[0]} (${lr.status})`
    );
  }

  console.log("\n📅 Creating attendance records for past 30 days...\n");

  // Create attendance records for last 30 days
  const today = new Date();
  for (const [code, employeeId] of Object.entries(employeeMap)) {
    let attendanceCount = 0;
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Check if record exists
      const existing = await prisma.attendance.findUnique({
        where: {
          employee_id_date: {
            employee_id: employeeId,
            date: date,
          },
        },
      });

      if (existing) continue;

      // 90% present, 10% absent
      const isAbsent = Math.random() < 0.1;
      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0);
      const checkOut = new Date(date);
      checkOut.setHours(18, Math.floor(Math.random() * 30), 0);

      await prisma.attendance.create({
        data: {
          employee_id: employeeId,
          date: date,
          check_in: isAbsent ? null : checkIn,
          check_out: isAbsent ? null : checkOut,
          work_minutes: isAbsent ? 0 : 540 + Math.floor(Math.random() * 60),
          status: isAbsent ? "ABSENT" : "PRESENT",
          source: "MANUAL",
        },
      });
      attendanceCount++;
    }
    console.log(`✅ Attendance: ${code} - ${attendanceCount} records created`);
  }

  console.log("\n✨ Employee seeding complete!\n");

  // Summary
  const employeeCount = await prisma.employee.count();
  const leaveBalanceCount = await prisma.leaveBalance.count();
  const leaveRequestCount = await prisma.leaveRequest.count();
  const attendanceCount = await prisma.attendance.count();

  console.log("📊 Summary:");
  console.log(`   Employees: ${employeeCount}`);
  console.log(`   Leave Balances: ${leaveBalanceCount}`);
  console.log(`   Leave Requests: ${leaveRequestCount}`);
  console.log(`   Attendance Records: ${attendanceCount}`);
}

seedEmployees()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
