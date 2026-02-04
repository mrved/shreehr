/**
 * Seed script to create test employees with different roles
 * Run: pnpm tsx prisma/seed-test-employees.ts
 */

import bcrypt from "bcrypt";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create connection pool for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Test password for all users (change in production!)
const TEST_PASSWORD = "Test@123";

interface TestEmployee {
  // User details
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "HR_MANAGER" | "PAYROLL_MANAGER" | "EMPLOYEE";
  
  // Employee details
  employee_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  personal_phone: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  date_of_joining: Date;
  department: string;
  designation: string;
  
  // Salary (monthly in rupees)
  basic: number;
  hra: number;
  special_allowance: number;
}

const testEmployees: TestEmployee[] = [
  // 1. SUPER_ADMIN - CEO/Founder
  {
    email: "vijay.sharma@shreehr.local",
    name: "Vijay Sharma",
    role: "SUPER_ADMIN",
    employee_code: "SHR001",
    first_name: "Vijay",
    last_name: "Sharma",
    date_of_birth: new Date("1975-03-15"),
    gender: "MALE",
    personal_phone: "9876543210",
    address_line1: "42, Koramangala 4th Block",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560034",
    date_of_joining: new Date("2020-01-01"),
    department: "Management",
    designation: "Chief Executive Officer",
    basic: 250000,
    hra: 100000,
    special_allowance: 150000,
  },
  
  // 2. ADMIN - HR Director
  {
    email: "priya.reddy@shreehr.local",
    name: "Priya Reddy",
    role: "ADMIN",
    employee_code: "SHR002",
    first_name: "Priya",
    last_name: "Reddy",
    date_of_birth: new Date("1985-07-22"),
    gender: "FEMALE",
    personal_phone: "9876543211",
    address_line1: "15, Indiranagar 100ft Road",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560038",
    date_of_joining: new Date("2021-03-15"),
    department: "Human Resources",
    designation: "HR Director",
    basic: 150000,
    hra: 60000,
    special_allowance: 90000,
  },
  
  // 3. HR_MANAGER - Team Lead HR
  {
    email: "amit.patel@shreehr.local",
    name: "Amit Patel",
    role: "HR_MANAGER",
    employee_code: "SHR003",
    first_name: "Amit",
    last_name: "Patel",
    date_of_birth: new Date("1990-11-08"),
    gender: "MALE",
    personal_phone: "9876543212",
    address_line1: "78, HSR Layout Sector 2",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560102",
    date_of_joining: new Date("2022-06-01"),
    department: "Human Resources",
    designation: "HR Manager",
    basic: 80000,
    hra: 32000,
    special_allowance: 48000,
  },
  
  // 4. PAYROLL_MANAGER - Finance Lead
  {
    email: "sunita.nair@shreehr.local",
    name: "Sunita Nair",
    role: "PAYROLL_MANAGER",
    employee_code: "SHR004",
    first_name: "Sunita",
    last_name: "Nair",
    date_of_birth: new Date("1988-04-30"),
    gender: "FEMALE",
    personal_phone: "9876543213",
    address_line1: "23, Whitefield Main Road",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560066",
    date_of_joining: new Date("2022-09-15"),
    department: "Finance",
    designation: "Payroll Manager",
    basic: 90000,
    hra: 36000,
    special_allowance: 54000,
  },
  
  // 5. EMPLOYEE - Software Engineer
  {
    email: "rahul.kumar@shreehr.local",
    name: "Rahul Kumar",
    role: "EMPLOYEE",
    employee_code: "SHR005",
    first_name: "Rahul",
    last_name: "Kumar",
    date_of_birth: new Date("1995-09-12"),
    gender: "MALE",
    personal_phone: "9876543214",
    address_line1: "56, Electronic City Phase 1",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560100",
    date_of_joining: new Date("2023-01-10"),
    department: "Engineering",
    designation: "Software Engineer",
    basic: 50000,
    hra: 20000,
    special_allowance: 30000,
  },
];

// Additional employees for more realistic data
const additionalEmployees: Omit<TestEmployee, "role">[] = [
  {
    email: "neha.singh@shreehr.local",
    name: "Neha Singh",
    employee_code: "SHR006",
    first_name: "Neha",
    last_name: "Singh",
    date_of_birth: new Date("1993-02-28"),
    gender: "FEMALE",
    personal_phone: "9876543215",
    address_line1: "89, Marathahalli Bridge",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560037",
    date_of_joining: new Date("2023-04-03"),
    department: "Engineering",
    designation: "Senior Software Engineer",
    basic: 70000,
    hra: 28000,
    special_allowance: 42000,
  },
  {
    email: "deepak.joshi@shreehr.local",
    name: "Deepak Joshi",
    employee_code: "SHR007",
    first_name: "Deepak",
    last_name: "Joshi",
    date_of_birth: new Date("1991-06-18"),
    gender: "MALE",
    personal_phone: "9876543216",
    address_line1: "34, Jayanagar 4th Block",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560041",
    date_of_joining: new Date("2023-07-17"),
    department: "Engineering",
    designation: "QA Engineer",
    basic: 45000,
    hra: 18000,
    special_allowance: 27000,
  },
  {
    email: "kavitha.menon@shreehr.local",
    name: "Kavitha Menon",
    employee_code: "SHR008",
    first_name: "Kavitha",
    last_name: "Menon",
    date_of_birth: new Date("1994-12-05"),
    gender: "FEMALE",
    personal_phone: "9876543217",
    address_line1: "67, BTM Layout 2nd Stage",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560076",
    date_of_joining: new Date("2024-01-08"),
    department: "Design",
    designation: "UI/UX Designer",
    basic: 55000,
    hra: 22000,
    special_allowance: 33000,
  },
];

async function seedTestEmployees() {
  console.log("🌱 Starting seed script...\n");
  
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  
  // Create departments first
  const departments = ["Management", "Human Resources", "Finance", "Engineering", "Design"];
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
  
  // Create designations
  const designations = [
    { title: "Chief Executive Officer", level: 10 },
    { title: "HR Director", level: 8 },
    { title: "HR Manager", level: 6 },
    { title: "Payroll Manager", level: 6 },
    { title: "Software Engineer", level: 4 },
    { title: "Senior Software Engineer", level: 5 },
    { title: "QA Engineer", level: 4 },
    { title: "UI/UX Designer", level: 4 },
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
  
  // Create leave types
  const leaveTypes = [
    { name: "Casual Leave", code: "CL", quota: 12, carryForward: 0 },
    { name: "Sick Leave", code: "SL", quota: 12, carryForward: 0 },
    { name: "Earned Leave", code: "EL", quota: 15, carryForward: 30 },
    { name: "Loss of Pay", code: "LOP", quota: 0, carryForward: 0, isPaid: false },
  ];
  
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: {
        name: lt.name,
        code: lt.code,
        annual_quota: lt.quota,
        max_carry_forward: lt.carryForward,
        is_paid: lt.isPaid ?? true,
        requires_approval: true,
        is_active: true,
      },
    });
    console.log(`✅ Leave Type: ${lt.name}`);
  }
  
  console.log("\n📝 Creating test employees...\n");
  
  // Create main test employees with roles
  for (const emp of testEmployees) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emp.email },
    });
    
    if (existingUser) {
      console.log(`⏭️  Skipping ${emp.email} (already exists)`);
      continue;
    }
    
    // Create employee
    const employee = await prisma.employee.create({
      data: {
        employee_code: emp.employee_code,
        first_name: emp.first_name,
        last_name: emp.last_name,
        date_of_birth: emp.date_of_birth,
        gender: emp.gender,
        personal_phone: emp.personal_phone,
        address_line1: emp.address_line1,
        city: emp.city,
        state: emp.state,
        postal_code: emp.postal_code,
        date_of_joining: emp.date_of_joining,
        department_id: deptMap.get(emp.department)!,
        designation_id: desigMap.get(emp.designation)!,
        employment_type: "FULL_TIME",
        employment_status: "ACTIVE",
      },
    });
    
    // Create user linked to employee
    await prisma.user.create({
      data: {
        email: emp.email,
        name: emp.name,
        password_hash: passwordHash,
        role: emp.role,
        employee_id: employee.id,
        is_active: true,
      },
    });
    
    // Create salary structure
    const grossPaise = (emp.basic + emp.hra + emp.special_allowance) * 100;
    await prisma.salaryStructure.create({
      data: {
        employee_id: employee.id,
        effective_from: emp.date_of_joining,
        basic_paise: emp.basic * 100,
        hra_paise: emp.hra * 100,
        special_allowance_paise: emp.special_allowance * 100,
        gross_monthly_paise: grossPaise,
        annual_ctc_paise: grossPaise * 12,
        basic_percentage: (emp.basic / (emp.basic + emp.hra + emp.special_allowance)) * 100,
        is_compliant: true,
        tax_regime: "NEW",
      },
    });
    
    // Create leave balances for current year
    const currentYear = new Date().getFullYear();
    for (const lt of leaveTypes) {
      if (lt.quota > 0) {
        await prisma.leaveBalance.create({
          data: {
            employee_id: employee.id,
            year: currentYear,
            leave_type: lt.name,
            opening: 0,
            accrued: lt.quota,
            used: Math.floor(Math.random() * 4), // Random 0-3 days used
            balance: lt.quota - Math.floor(Math.random() * 4),
          },
        });
      }
    }
    
    console.log(`✅ Created: ${emp.name} (${emp.role}) - ${emp.email}`);
  }
  
  // Create additional employees (all as EMPLOYEE role)
  for (const emp of additionalEmployees) {
    const existingUser = await prisma.user.findUnique({
      where: { email: emp.email },
    });
    
    if (existingUser) {
      console.log(`⏭️  Skipping ${emp.email} (already exists)`);
      continue;
    }
    
    const employee = await prisma.employee.create({
      data: {
        employee_code: emp.employee_code,
        first_name: emp.first_name,
        last_name: emp.last_name,
        date_of_birth: emp.date_of_birth,
        gender: emp.gender,
        personal_phone: emp.personal_phone,
        address_line1: emp.address_line1,
        city: emp.city,
        state: emp.state,
        postal_code: emp.postal_code,
        date_of_joining: emp.date_of_joining,
        department_id: deptMap.get(emp.department)!,
        designation_id: desigMap.get(emp.designation)!,
        employment_type: "FULL_TIME",
        employment_status: "ACTIVE",
      },
    });
    
    await prisma.user.create({
      data: {
        email: emp.email,
        name: emp.name,
        password_hash: passwordHash,
        role: "EMPLOYEE",
        employee_id: employee.id,
        is_active: true,
      },
    });
    
    const grossPaise = (emp.basic + emp.hra + emp.special_allowance) * 100;
    await prisma.salaryStructure.create({
      data: {
        employee_id: employee.id,
        effective_from: emp.date_of_joining,
        basic_paise: emp.basic * 100,
        hra_paise: emp.hra * 100,
        special_allowance_paise: emp.special_allowance * 100,
        gross_monthly_paise: grossPaise,
        annual_ctc_paise: grossPaise * 12,
        basic_percentage: (emp.basic / (emp.basic + emp.hra + emp.special_allowance)) * 100,
        is_compliant: true,
        tax_regime: "NEW",
      },
    });
    
    const currentYear = new Date().getFullYear();
    for (const lt of leaveTypes) {
      if (lt.quota > 0) {
        await prisma.leaveBalance.create({
          data: {
            employee_id: employee.id,
            year: currentYear,
            leave_type: lt.name,
            opening: 0,
            accrued: lt.quota,
            used: Math.floor(Math.random() * 4),
            balance: lt.quota - Math.floor(Math.random() * 4),
          },
        });
      }
    }
    
    console.log(`✅ Created: ${emp.name} (EMPLOYEE) - ${emp.email}`);
  }
  
  // Set reporting relationships
  console.log("\n🔗 Setting up reporting structure...");
  
  // Get employee IDs
  const employees = await prisma.employee.findMany({
    include: { user: true },
  });
  
  const ceo = employees.find(e => e.employee_code === "SHR001");
  const hrDirector = employees.find(e => e.employee_code === "SHR002");
  const hrManager = employees.find(e => e.employee_code === "SHR003");
  const payrollManager = employees.find(e => e.employee_code === "SHR004");
  
  // HR Director reports to CEO
  if (hrDirector && ceo) {
    await prisma.employee.update({
      where: { id: hrDirector.id },
      data: { reporting_manager_id: ceo.id },
    });
  }
  
  // HR Manager and Payroll Manager report to HR Director
  if (hrDirector) {
    if (hrManager) {
      await prisma.employee.update({
        where: { id: hrManager.id },
        data: { reporting_manager_id: hrDirector.id },
      });
    }
    if (payrollManager) {
      await prisma.employee.update({
        where: { id: payrollManager.id },
        data: { reporting_manager_id: hrDirector.id },
      });
    }
  }
  
  // All other employees report to HR Manager
  if (hrManager) {
    for (const emp of employees) {
      if (!["SHR001", "SHR002", "SHR003", "SHR004"].includes(emp.employee_code)) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { reporting_manager_id: hrManager.id },
        });
      }
    }
  }
  
  console.log("✅ Reporting structure set up\n");
  
  // Summary
  console.log("═══════════════════════════════════════════════════════════");
  console.log("                    TEST ACCOUNTS SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Password for all accounts: ${TEST_PASSWORD}`);
  console.log("───────────────────────────────────────────────────────────");
  console.log("Email                              │ Role            │ Name");
  console.log("───────────────────────────────────────────────────────────");
  for (const emp of testEmployees) {
    console.log(`${emp.email.padEnd(34)}│ ${emp.role.padEnd(15)} │ ${emp.name}`);
  }
  for (const emp of additionalEmployees) {
    console.log(`${emp.email.padEnd(34)}│ ${"EMPLOYEE".padEnd(15)} │ ${emp.name}`);
  }
  console.log("═══════════════════════════════════════════════════════════\n");
}

seedTestEmployees()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
