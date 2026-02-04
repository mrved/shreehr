import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseKekaLeave } from "@/lib/parsers/keka";

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
    const { data, errors } = parseKekaLeave(csvContent);

    const batch = await prisma.importBatch.create({
      data: {
        type: "LEAVE_BALANCES",
        file_name: file.name,
        status: "PROCESSING",
        total_records: data.length,
        started_at: new Date(),
        created_by: session.user.id,
        updated_by: session.user.id,
      },
    });

    const employees = await prisma.employee.findMany({
      select: { id: true, employee_code: true },
    });
    const empMap = new Map(employees.map((e) => [e.employee_code, e.id]));

    let successCount = 0;
    const importErrors: any[] = [...errors];

    for (const leave of data) {
      const employeeId = empMap.get(leave.employeeCode);
      if (!employeeId) {
        importErrors.push({
          row: data.indexOf(leave) + 2,
          field: "Employee Code",
          message: `Employee ${leave.employeeCode} not found`,
        });
        continue;
      }

      try {
        await prisma.leaveBalance.upsert({
          where: {
            employee_id_leave_type_year: {
              employee_id: employeeId,
              leave_type: leave.leaveType,
              year: leave.year,
            },
          },
          update: {
            opening: leave.opening,
            accrued: leave.accrued,
            used: leave.used,
            balance: leave.balance,
            source: "KEKA_IMPORT",
            import_batch_id: batch.id,
            updated_by: session.user.id,
          },
          create: {
            employee_id: employeeId,
            leave_type: leave.leaveType,
            year: leave.year,
            opening: leave.opening,
            accrued: leave.accrued,
            used: leave.used,
            balance: leave.balance,
            source: "KEKA_IMPORT",
            import_batch_id: batch.id,
            created_by: session.user.id,
            updated_by: session.user.id,
          },
        });
        successCount++;
      } catch (err) {
        importErrors.push({
          row: data.indexOf(leave) + 2,
          field: "leave",
          message: `Failed to import leave for ${leave.employeeCode}`,
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
    console.error("Leave import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
