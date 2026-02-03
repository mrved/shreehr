import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseKekaEmployees } from "@/lib/parsers/keka";
import { encryptOptional } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvContent = await file.text();
    const { data, errors } = parseKekaEmployees(csvContent);

    // Create import batch record
    const batch = await prisma.importBatch.create({
      data: {
        type: "EMPLOYEES",
        file_name: file.name,
        status: "PROCESSING",
        total_records: data.length,
        started_at: new Date(),
        created_by: session.user.id,
        updated_by: session.user.id,
      },
    });

    let successCount = 0;
    const importErrors: any[] = [...errors];

    // Get or create departments and designations
    const deptMap = new Map<string, string>();
    const desigMap = new Map<string, string>();

    const uniqueDepts = [
      ...new Set(data.map((e) => e.department).filter(Boolean)),
    ];
    const uniqueDesigs = [
      ...new Set(data.map((e) => e.designation).filter(Boolean)),
    ];

    for (const deptName of uniqueDepts) {
      if (!deptName) continue;
      let dept = await prisma.department.findFirst({ where: { name: deptName } });
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            name: deptName,
            code: deptName.substring(0, 10).toUpperCase().replace(/\s/g, ""),
            created_by: session.user.id,
            updated_by: session.user.id,
          },
        });
      }
      deptMap.set(deptName, dept.id);
    }

    for (const desigTitle of uniqueDesigs) {
      if (!desigTitle) continue;
      let desig = await prisma.designation.findFirst({
        where: { title: desigTitle },
      });
      if (!desig) {
        desig = await prisma.designation.create({
          data: {
            title: desigTitle,
            created_by: session.user.id,
            updated_by: session.user.id,
          },
        });
      }
      desigMap.set(desigTitle, desig.id);
    }

    // Build employee code to ID map for manager assignments
    const empCodeMap = new Map<string, string>();
    const existingEmps = await prisma.employee.findMany({
      select: { id: true, employee_code: true },
    });
    existingEmps.forEach((e) => empCodeMap.set(e.employee_code, e.id));

    // First pass: create/update employees without manager
    for (const emp of data) {
      try {
        const empData: any = {
          first_name: emp.firstName,
          last_name: emp.lastName,
          date_of_birth: emp.dateOfBirth,
          gender: emp.gender,
          personal_email: emp.personalEmail || null,
          work_email: emp.workEmail || "",
          personal_phone: emp.phone,
          date_of_joining: emp.dateOfJoining,
          state: emp.state || null,
          department_id: emp.department ? deptMap.get(emp.department) : null,
          designation_id: emp.designation ? desigMap.get(emp.designation) : null,
          pan_encrypted: encryptOptional(emp.panNumber),
          bank_account_encrypted: encryptOptional(emp.bankAccountNumber),
          bank_ifsc: emp.bankIfscCode || null,
          bank_name: emp.bankName || null,
          uan: emp.uanNumber || null,
          updated_by: session.user.id,
        };

        const existing = await prisma.employee.findUnique({
          where: { employee_code: emp.employeeCode },
        });

        if (existing) {
          await prisma.employee.update({
            where: { id: existing.id },
            data: empData,
          });
          empCodeMap.set(emp.employeeCode, existing.id);
        } else {
          // For new employees, need required fields
          if (!empData.department_id) {
            importErrors.push({
              row: data.indexOf(emp) + 2,
              field: "department",
              message: `Employee ${emp.employeeCode} missing department`,
            });
            continue;
          }
          if (!empData.designation_id) {
            importErrors.push({
              row: data.indexOf(emp) + 2,
              field: "designation",
              message: `Employee ${emp.employeeCode} missing designation`,
            });
            continue;
          }

          const created = await prisma.employee.create({
            data: {
              employee_code: emp.employeeCode,
              ...empData,
              // Required fields with defaults
              address_line1: "",
              city: "",
              postal_code: "",
              emergency_phone: "",
              created_by: session.user.id,
            },
          });
          empCodeMap.set(emp.employeeCode, created.id);
        }
        successCount++;
      } catch (err) {
        importErrors.push({
          row: data.indexOf(emp) + 2,
          field: "employee",
          message: `Failed to create employee ${emp.employeeCode}: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      }
    }

    // Second pass: update reporting managers
    for (const emp of data) {
      if (
        emp.reportingManagerCode &&
        empCodeMap.has(emp.reportingManagerCode)
      ) {
        try {
          await prisma.employee.update({
            where: { employee_code: emp.employeeCode },
            data: {
              reporting_manager_id: empCodeMap.get(emp.reportingManagerCode),
            },
          });
        } catch {
          // Ignore manager assignment errors
        }
      }
    }

    // Update batch record
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: importErrors.length > 0 ? "COMPLETED" : "COMPLETED",
        success_count: successCount,
        error_count: importErrors.length,
        errors: importErrors.length > 0 ? importErrors : undefined,
        completed_at: new Date(),
      },
    });

    return NextResponse.json({
      batchId: batch.id,
      totalRecords: data.length,
      successCount,
      errorCount: importErrors.length,
      errors: importErrors.slice(0, 50), // Limit errors in response
    });
  } catch (error) {
    console.error("Employee import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
