// ShreeHR API Test Script
// Run with: npx tsx src/lib/test-api.ts

import { prisma } from "./db";

async function testDatabase() {
  console.log("\n=== Database Connection Test ===");
  
  try {
    // Test basic queries
    const userCount = await prisma.user.count();
    const deptCount = await prisma.department.count();
    const desigCount = await prisma.designation.count();
    const empCount = await prisma.employee.count();
    const leaveTypeCount = await prisma.leaveType.count();
    
    console.log("✅ Database connected");
    console.log(`  Users: ${userCount}`);
    console.log(`  Departments: ${deptCount}`);
    console.log(`  Designations: ${desigCount}`);
    console.log(`  Employees: ${empCount}`);
    console.log(`  Leave Types: ${leaveTypeCount}`);
    
    // Test admin user
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    
    if (admin) {
      console.log(`✅ Admin user found: ${admin.email}`);
    } else {
      console.log("❌ No admin user found");
    }
    
    // Test leave types
    const leaveTypes = await prisma.leaveType.findMany({
      select: { code: true, name: true, annual_quota: true },
    });
    
    if (leaveTypes.length > 0) {
      console.log("✅ Leave types configured:");
      leaveTypes.forEach(lt => {
        console.log(`  - ${lt.code}: ${lt.name} (${lt.annual_quota} days)`);
      });
    } else {
      console.log("❌ No leave types configured");
    }
    
    // Test designations
    const designations = await prisma.designation.findMany({
      select: { title: true, level: true },
      orderBy: { level: "asc" },
    });
    
    if (designations.length > 0) {
      console.log("✅ Designations configured:");
      designations.forEach(d => {
        console.log(`  - L${d.level}: ${d.title}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error("❌ Database error:", error);
    return false;
  }
}

async function testValidations() {
  console.log("\n=== Validation Test ===");
  
  // Test employee validation schema
  const { employeeCreateSchema } = await import("./validations/employee");
  
  // Test valid data
  const validEmployee = {
    employeeCode: "EMP001",
    firstName: "Test",
    lastName: "User",
    dateOfBirth: "1990-01-01",
    gender: "MALE",
    personalPhone: "9876543210",
    addressLine1: "123 Test St",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    dateOfJoining: "2024-01-01",
    departmentId: "test-dept-id",
    designationId: "test-desig-id",
  };
  
  try {
    const result = employeeCreateSchema.parse(validEmployee);
    console.log("✅ Employee validation passed");
  } catch (error: any) {
    console.log("❌ Employee validation failed:", error.issues);
  }
  
  // Test leave type validation
  const { leaveTypeCreateSchema } = await import("./validations/leave");
  
  const validLeaveType = {
    name: "Test Leave",
    code: "TL",
    annualQuota: 10,
    maxCarryForward: 5,
    isPaid: true,
    requiresApproval: true,
    minDaysNotice: 1,
  };
  
  try {
    const result = leaveTypeCreateSchema.parse(validLeaveType);
    console.log("✅ Leave type validation passed");
  } catch (error: any) {
    console.log("❌ Leave type validation failed:", error.issues);
  }
}

async function main() {
  console.log("ShreeHR API Test Suite");
  console.log("=".repeat(50));
  
  await testDatabase();
  await testValidations();
  
  console.log("\n" + "=".repeat(50));
  console.log("Tests complete");
  
  await prisma.$disconnect();
}

main().catch(console.error);
