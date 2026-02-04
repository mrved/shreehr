import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseKekaSalary } from "@/lib/parsers/keka";

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
    const { data, errors } = parseKekaSalary(csvContent);

    const batch = await prisma.importBatch.create({
      data: {
        type: "SALARY_HISTORY",
        file_name: file.name,
        status: "PROCESSING",
        total_records: data.length,
        started_at: new Date(),
        created_by: session.user.id,
        updated_by: session.user.id,
      },
    });

    // Get employee code to ID mapping
    const employees = await prisma.employee.findMany({
      select: { id: true, employee_code: true },
    });
    const empMap = new Map(employees.map((e) => [e.employee_code, e.id]));

    let successCount = 0;
    const importErrors: any[] = [...errors];

    for (const salary of data) {
      const employeeId = empMap.get(salary.employeeCode);
      if (!employeeId) {
        importErrors.push({
          row: data.indexOf(salary) + 2,
          field: "Employee Code",
          message: `Employee ${salary.employeeCode} not found`,
        });
        continue;
      }

      try {
        await prisma.salaryRecord.upsert({
          where: {
            employee_id_month_year: {
              employee_id: employeeId,
              month: salary.month,
              year: salary.year,
            },
          },
          update: {
            basic_pay: salary.basicPay,
            hra: salary.hra,
            conveyance: salary.conveyance,
            special_allowance: salary.specialAllowance,
            other_allowances: salary.otherAllowances,
            gross_salary: salary.grossSalary,
            pf_employee: salary.pfEmployee,
            pf_employer: salary.pfEmployer,
            esi_employee: salary.esiEmployee,
            esi_employer: salary.esiEmployer,
            professional_tax: salary.professionalTax,
            tds: salary.tds,
            other_deductions: salary.otherDeductions,
            net_salary: salary.netSalary,
            source: "KEKA_IMPORT",
            import_batch_id: batch.id,
            updated_by: session.user.id,
          },
          create: {
            employee_id: employeeId,
            month: salary.month,
            year: salary.year,
            basic_pay: salary.basicPay,
            hra: salary.hra,
            conveyance: salary.conveyance,
            special_allowance: salary.specialAllowance,
            other_allowances: salary.otherAllowances,
            gross_salary: salary.grossSalary,
            pf_employee: salary.pfEmployee,
            pf_employer: salary.pfEmployer,
            esi_employee: salary.esiEmployee,
            esi_employer: salary.esiEmployer,
            professional_tax: salary.professionalTax,
            tds: salary.tds,
            other_deductions: salary.otherDeductions,
            net_salary: salary.netSalary,
            source: "KEKA_IMPORT",
            import_batch_id: batch.id,
            created_by: session.user.id,
            updated_by: session.user.id,
          },
        });
        successCount++;
      } catch (err) {
        importErrors.push({
          row: data.indexOf(salary) + 2,
          field: "salary",
          message: `Failed to import salary for ${salary.employeeCode} ${salary.month}/${salary.year}`,
        });
      }
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
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
      errors: importErrors.slice(0, 50),
    });
  } catch (error) {
    console.error("Salary import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
