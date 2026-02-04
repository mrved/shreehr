/**
 * Minimal production seed script - creates test users only
 * Run with: DATABASE_URL="..." npx tsx scripts/seed-prod-users.ts
 */

import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEST_PASSWORD = "Test@123";

interface TestUser {
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "HR_MANAGER" | "PAYROLL_MANAGER" | "EMPLOYEE";
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
  designation: string;
  basic: number;
  hra: number;
  special_allowance: number;
}

const testUsers: TestUser[] = [
  {
    email: "admin@shreehr.local",
    name: "Admin User",
    role: "SUPER_ADMIN",
    employee_code: "ADM001",
    first_name: "Admin",
    last_name: "User",
    department: "Management",
    designation: "System Administrator",
    basic: 100000,
    hra: 40000,
    special_allowance: 60000,
  },
  {
    email: "hr@shreehr.local",
    name: "HR Manager",
    role: "HR_MANAGER",
    employee_code: "HR001",
    first_name: "HR",
    last_name: "Manager",
    department: "Human Resources",
    designation: "HR Manager",
    basic: 80000,
    hra: 32000,
    special_allowance: 48000,
  },
  {
    email: "employee@shreehr.local",
    name: "Test Employee",
    role: "EMPLOYEE",
    employee_code: "EMP001",
    first_name: "Test",
    last_name: "Employee",
    department: "Engineering",
    designation: "Software Engineer",
    basic: 50000,
    hra: 20000,
    special_allowance: 30000,
  },
  // Original test employees
  {
    email: "rahul.kumar@shreehr.local",
    name: "Rahul Kumar",
    role: "EMPLOYEE",
    employee_code: "SHR005",
    first_name: "Rahul",
    last_name: "Kumar",
    department: "Engineering",
    designation: "Software Engineer",
    basic: 50000,
    hra: 20000,
    special_allowance: 30000,
  },
];

async function seedProdUsers() {
  console.log("🌱 Seeding production test users...\n");

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  // Ensure departments exist
  const departments = ["Management", "Human Resources", "Engineering"];
  const deptMap = new Map<string, string>();

  for (const deptName of departments) {
    const dept = await prisma.department.upsert({
      where: { name: deptName },
      update: {},
      create: {
        name: deptName,
        code: deptName.substring(0, 3).toUpperCase(),
        description: `${deptName} department`,
        is_active: true,
      },
    });
    deptMap.set(deptName, dept.id);
    console.log(`✅ Department: ${deptName}`);
  }

  // Ensure designations exist
  const designations = [
    { title: "System Administrator", level: 10 },
    { title: "HR Manager", level: 6 },
    { title: "Software Engineer", level: 4 },
  ];
  const desigMap = new Map<string, string>();

  for (const desig of designations) {
    const d = await prisma.designation.upsert({
      where: { title: desig.title },
      update: {},
      create: {
        title: desig.title,
        level: desig.level,
        is_active: true,
      },
    });
    desigMap.set(desig.title, d.id);
    console.log(`✅ Designation: ${desig.title}`);
  }

  // Ensure leave types exist
  const leaveTypes = [
    { name: "Casual Leave", code: "CL", quota: 12 },
    { name: "Sick Leave", code: "SL", quota: 12 },
    { name: "Earned Leave", code: "EL", quota: 15 },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: {
        name: lt.name,
        code: lt.code,
        annual_quota: lt.quota,
        max_carry_forward: 0,
        is_paid: true,
        requires_approval: true,
        is_active: true,
      },
    });
    console.log(`✅ Leave Type: ${lt.name}`);
  }

  console.log("\n📝 Creating test users...\n");

  for (const user of testUsers) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      console.log(`⏭️  Skipping ${user.email} (already exists)`);
      continue;
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        employee_code: user.employee_code,
        first_name: user.first_name,
        last_name: user.last_name,
        date_of_birth: new Date("1990-01-01"),
        gender: "MALE",
        personal_phone: "9876543210",
        address_line1: "Test Address",
        city: "Bengaluru",
        state: "Karnataka",
        postal_code: "560001",
        date_of_joining: new Date("2024-01-01"),
        department_id: deptMap.get(user.department)!,
        designation_id: desigMap.get(user.designation)!,
        employment_type: "FULL_TIME",
        employment_status: "ACTIVE",
      },
    });

    // Create user linked to employee
    await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        password_hash: passwordHash,
        role: user.role,
        employee_id: employee.id,
        is_active: true,
      },
    });

    // Create salary structure
    const grossPaise = (user.basic + user.hra + user.special_allowance) * 100;
    await prisma.salaryStructure.create({
      data: {
        employee_id: employee.id,
        effective_from: new Date("2024-01-01"),
        basic_paise: user.basic * 100,
        hra_paise: user.hra * 100,
        special_allowance_paise: user.special_allowance * 100,
        gross_monthly_paise: grossPaise,
        annual_ctc_paise: grossPaise * 12,
        basic_percentage: (user.basic / (user.basic + user.hra + user.special_allowance)) * 100,
        is_compliant: true,
        tax_regime: "NEW",
      },
    });

    // Create leave balances
    const currentYear = new Date().getFullYear();
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employee_id: employee.id,
          year: currentYear,
          leave_type: lt.name,
          opening: 0,
          accrued: lt.quota,
          used: 0,
          balance: lt.quota,
        },
      });
    }

    console.log(`✅ Created: ${user.name} (${user.role}) - ${user.email}`);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                    TEST ACCOUNTS CREATED");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Password for all accounts: ${TEST_PASSWORD}`);
  console.log("───────────────────────────────────────────────────────────");
  console.log("admin@shreehr.local      - SUPER_ADMIN");
  console.log("hr@shreehr.local         - HR_MANAGER");
  console.log("employee@shreehr.local   - EMPLOYEE");
  console.log("rahul.kumar@shreehr.local - EMPLOYEE");
  console.log("═══════════════════════════════════════════════════════════\n");
}

seedProdUsers()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
