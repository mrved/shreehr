/**
 * Seed script to create E2E test users
 * Run before running E2E tests
 */

import bcrypt from "bcrypt";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Test users for E2E tests - matching the fixtures
const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
    role: 'SUPER_ADMIN',
    name: 'Test Admin',
    employeeData: {
      employee_code: 'E2E_ADMIN',
      first_name: 'Test',
      last_name: 'Admin',
      date_of_birth: new Date('1990-01-01'),
      gender: 'MALE' as const,
      personal_phone: '9999999901',
      address_line1: 'Test Address Admin',
      city: 'Bengaluru',
      state: 'Karnataka',
      postal_code: '560001',
      date_of_joining: new Date('2020-01-01'),
      department: 'Management',
      designation: 'System Administrator',
    }
  },
  {
    email: 'employee@test.com',
    password: 'TestEmployee123!',
    role: 'EMPLOYEE',
    name: 'Test Employee',
    employeeData: {
      employee_code: 'E2E_EMP',
      first_name: 'Test',
      last_name: 'Employee',
      date_of_birth: new Date('1995-05-15'),
      gender: 'FEMALE' as const,
      personal_phone: '9999999902',
      address_line1: 'Test Address Employee',
      city: 'Bengaluru',
      state: 'Karnataka',
      postal_code: '560002',
      date_of_joining: new Date('2023-06-01'),
      department: 'Engineering',
      designation: 'Software Engineer',
    }
  },
  {
    email: 'hr@test.com',
    password: 'TestHR123!',
    role: 'HR_MANAGER',
    name: 'Test HR',
    employeeData: {
      employee_code: 'E2E_HR',
      first_name: 'Test',
      last_name: 'HR',
      date_of_birth: new Date('1992-08-20'),
      gender: 'OTHER' as const,
      personal_phone: '9999999903',
      address_line1: 'Test Address HR',
      city: 'Bengaluru',
      state: 'Karnataka',
      postal_code: '560003',
      date_of_joining: new Date('2022-03-15'),
      department: 'Human Resources',
      designation: 'HR Manager',
    }
  }
];

async function seedE2EUsers() {
  console.log("🌱 Setting up E2E test users...\n");
  
  try {
    // Ensure required departments exist
    const departments = ['Management', 'Engineering', 'Human Resources'];
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
    }
    
    // Ensure required designations exist
    const designations = [
      { title: 'System Administrator', level: 8 },
      { title: 'Software Engineer', level: 4 },
      { title: 'HR Manager', level: 6 },
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
    }
    
    // Create test users
    for (const user of TEST_USERS) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      
      if (existingUser) {
        console.log(`⏭️  User ${user.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 12);
      
      // Create employee record
      const employee = await prisma.employee.create({
        data: {
          employee_code: user.employeeData.employee_code,
          first_name: user.employeeData.first_name,
          last_name: user.employeeData.last_name,
          date_of_birth: user.employeeData.date_of_birth,
          gender: user.employeeData.gender,
          personal_phone: user.employeeData.personal_phone,
          address_line1: user.employeeData.address_line1,
          city: user.employeeData.city,
          state: user.employeeData.state,
          postal_code: user.employeeData.postal_code,
          date_of_joining: user.employeeData.date_of_joining,
          department_id: deptMap.get(user.employeeData.department)!,
          designation_id: desigMap.get(user.employeeData.designation)!,
          employment_type: 'FULL_TIME',
          employment_status: 'ACTIVE',
        },
      });
      
      // Create user record
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password_hash: passwordHash,
          role: user.role as any,
          employee_id: employee.id,
          is_active: true,
        },
      });
      
      // Create basic salary structure
      await prisma.salaryStructure.create({
        data: {
          employee_id: employee.id,
          effective_from: user.employeeData.date_of_joining,
          basic_paise: 5000000, // 50k
          hra_paise: 2000000,   // 20k
          special_allowance_paise: 3000000, // 30k
          gross_monthly_paise: 10000000, // 100k
          annual_ctc_paise: 120000000, // 12L
          basic_percentage: 50,
          is_compliant: true,
          tax_regime: 'NEW',
        },
      });
      
      console.log(`✅ Created E2E test user: ${user.email} (${user.role})`);
    }
    
    console.log("\n✅ E2E test users setup complete!");
    console.log("\n📝 Test Credentials:");
    console.log("─".repeat(50));
    TEST_USERS.forEach(user => {
      console.log(`${user.email} / ${user.password} (${user.role})`);
    });
    console.log("─".repeat(50));
    
  } catch (error) {
    console.error("❌ Error setting up E2E test users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedE2EUsers().catch(console.error);
}