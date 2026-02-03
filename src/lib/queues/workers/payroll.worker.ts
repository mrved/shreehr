import { type Job, Worker } from "bullmq";
import { prisma } from "@/lib/db";
import { addEmailJob } from "@/lib/email/queue";
import { calculatePayroll, getAttendanceSummary } from "@/lib/payroll/calculator";
import { getQueueConnection } from "../connection";
import { addPayrollJob, type PayrollJobData, type PayrollJobResult } from "../payroll.queue";

/**
 * Create and start the payroll worker
 */
export function createPayrollWorker(): Worker<PayrollJobData, PayrollJobResult> {
  const worker = new Worker<PayrollJobData, PayrollJobResult>(
    "payroll",
    async (job: Job<PayrollJobData, PayrollJobResult>) => {
      console.log(`Processing payroll job: ${job.id}, stage: ${job.data.stage}`);

      const { payrollRunId, stage } = job.data;

      // Update PayrollRun status
      await prisma.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: "PROCESSING",
          current_stage: stage.toUpperCase() as any,
          ...(stage === "validation" ? { started_at: new Date() } : {}),
        },
      });

      try {
        let result: PayrollJobResult;

        switch (stage) {
          case "validation":
            result = await processValidationStage(job);
            break;
          case "calculation":
            result = await processCalculationStage(job);
            break;
          case "statutory":
            result = await processStatutoryStage(job);
            break;
          case "finalization":
            result = await processFinalizationStage(job);
            break;
          default:
            throw new Error(`Unknown stage: ${stage}`);
        }

        // Queue next stage if applicable
        if (result.success && result.nextStage) {
          await addPayrollJob({
            payrollRunId,
            month: job.data.month,
            year: job.data.year,
            stage: result.nextStage,
          });
        }

        return result;
      } catch (error: any) {
        await prisma.payrollRun.update({
          where: { id: payrollRunId },
          data: {
            status: "FAILED",
            errors: [{ stage, message: error.message }],
          },
        });

        throw error;
      }
    },
    {
      ...getQueueConnection(),
      concurrency: 1,
    },
  );

  worker.on("completed", (job, result) => {
    console.log(`Payroll job ${job.id} completed:`, result);
  });

  worker.on("failed", (job, error) => {
    console.error(`Payroll job ${job?.id} failed:`, error.message);
  });

  return worker;
}

async function processValidationStage(
  job: Job<PayrollJobData, PayrollJobResult>,
): Promise<PayrollJobResult> {
  const { payrollRunId, month, year } = job.data;
  const errors: Array<{ employeeId: string; message: string }> = [];

  // 1. Check attendance lock
  const lock = await prisma.attendanceLock.findUnique({
    where: { month_year: { month, year } },
  });

  if (!lock) {
    return {
      success: false,
      processedCount: 0,
      errorCount: 1,
      errors: [{ employeeId: "", message: `Attendance not locked for ${year}-${month}` }],
    };
  }

  // 2. Get active employees
  const employees = await prisma.employee.findMany({
    where: { employment_status: "ACTIVE" },
    include: {
      salary_structures: {
        where: {
          effective_from: { lte: new Date() },
          OR: [{ effective_to: null }, { effective_to: { gte: new Date() } }],
        },
        orderBy: { effective_from: "desc" },
        take: 1,
      },
    },
  });

  // 3. Validate each employee has salary structure
  for (const emp of employees) {
    if (emp.salary_structures.length === 0) {
      errors.push({
        employeeId: emp.id,
        message: `No active salary structure for ${emp.first_name} ${emp.last_name}`,
      });
    } else if (!emp.salary_structures[0].is_compliant) {
      errors.push({
        employeeId: emp.id,
        message: `Salary structure not compliant with 50% rule for ${emp.first_name} ${emp.last_name}`,
      });
    }
  }

  // Update PayrollRun with employee count
  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: {
      total_employees: employees.length,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    },
  });

  await job.updateProgress(100);

  if (errors.length > 0) {
    return {
      success: false,
      processedCount: employees.length,
      errorCount: errors.length,
      errors,
    };
  }

  return {
    success: true,
    processedCount: employees.length,
    errorCount: 0,
    nextStage: "calculation",
  };
}

async function processCalculationStage(
  job: Job<PayrollJobData, PayrollJobResult>,
): Promise<PayrollJobResult> {
  const { payrollRunId, month, year } = job.data;
  const errors: Array<{ employeeId: string; message: string }> = [];
  let processedCount = 0;

  // Get PayrollRun for employee list
  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
  });

  if (!payrollRun) {
    throw new Error("PayrollRun not found");
  }

  // Get active employees with salary structures
  const employees = await prisma.employee.findMany({
    where: { employment_status: "ACTIVE" },
    include: {
      salary_structures: {
        where: {
          effective_from: { lte: new Date() },
          is_compliant: true,
          OR: [{ effective_to: null }, { effective_to: { gte: new Date() } }],
        },
        orderBy: { effective_from: "desc" },
        take: 1,
      },
    },
  });

  const totalEmployees = employees.length;

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];

    try {
      const salaryStructure = emp.salary_structures[0];

      // Get attendance summary
      const attendance = await getAttendanceSummary(emp.id, month, year);

      // Calculate payroll
      const result = await calculatePayroll({
        employeeId: emp.id,
        month,
        year,
        salaryStructure: {
          basic_paise: salaryStructure.basic_paise,
          hra_paise: salaryStructure.hra_paise,
          special_allowance_paise: salaryStructure.special_allowance_paise,
          lta_paise: salaryStructure.lta_paise,
          medical_paise: salaryStructure.medical_paise,
          conveyance_paise: salaryStructure.conveyance_paise,
          other_allowances_paise: salaryStructure.other_allowances_paise,
          tax_regime: salaryStructure.tax_regime,
        },
        attendance,
        workState: emp.state,
        gender: emp.gender,
      });

      // Create PayrollRecord
      const payrollRecord = await prisma.payrollRecord.upsert({
        where: {
          payroll_run_id_employee_id: {
            payroll_run_id: payrollRunId,
            employee_id: emp.id,
          },
        },
        create: {
          payroll_run_id: payrollRunId,
          employee_id: emp.id,
          month,
          year,

          working_days: attendance.workingDays,
          paid_days: attendance.paidDays,
          lop_days: attendance.lopDays,

          basic_paise: salaryStructure.basic_paise,
          hra_paise: salaryStructure.hra_paise,
          special_allowance_paise: salaryStructure.special_allowance_paise,
          lta_paise: salaryStructure.lta_paise,
          medical_paise: salaryStructure.medical_paise,
          conveyance_paise: salaryStructure.conveyance_paise,
          other_allowances_paise: salaryStructure.other_allowances_paise,

          gross_before_lop_paise: result.grossBeforeLOP,
          lop_deduction_paise: result.lopDeduction,
          gross_salary_paise: result.grossSalary,

          pf_employee_paise: result.pfEmployee,
          pf_employer_epf_paise: result.pfEmployerBreakdown.epf,
          pf_employer_eps_paise: result.pfEmployerBreakdown.eps,
          pf_employer_edli_paise: result.pfEmployerBreakdown.edli,
          pf_admin_charges_paise: result.pfEmployerBreakdown.adminCharges,
          pf_total_employer_paise: result.pfEmployerBreakdown.total,
          pf_base_paise: result.pfBase,

          esi_employee_paise: result.esiEmployee,
          esi_employer_paise: result.esiEmployer,
          esi_applicable: result.esiApplicable,

          pt_paise: result.ptAmount,

          tds_paise: result.tdsAmount,
          projected_annual_paise: result.projectedAnnualIncome,
          tax_regime: result.taxRegime,

          reimbursements_paise: result.reimbursements_paise,
          loan_deductions_paise: result.loan_deductions_paise,

          total_deductions_paise: result.totalDeductions,
          net_salary_paise: result.netSalary,
          employer_cost_paise: result.employerCost,

          status: "CALCULATED",
          processed_at: new Date(),
        },
        update: {
          // Same as create for re-runs
          working_days: attendance.workingDays,
          paid_days: attendance.paidDays,
          lop_days: attendance.lopDays,
          gross_salary_paise: result.grossSalary,
          reimbursements_paise: result.reimbursements_paise,
          loan_deductions_paise: result.loan_deductions_paise,
          total_deductions_paise: result.totalDeductions,
          net_salary_paise: result.netSalary,
          status: "CALCULATED",
          processed_at: new Date(),
        },
      });

      // Sync expenses: mark as synced and link to payroll record
      if (result.expense_ids?.length > 0) {
        await prisma.expenseClaim.updateMany({
          where: { id: { in: result.expense_ids } },
          data: {
            synced_to_payroll: true,
            payroll_record_id: payrollRecord.id,
            status: "REIMBURSED", // Transition to REIMBURSED
          },
        });
      }

      // Sync loan deductions: mark as deducted and update loan balance
      if (result.loan_deduction_details?.length > 0) {
        for (const deduction of result.loan_deduction_details) {
          await prisma.$transaction([
            // Update deduction status
            prisma.loanDeduction.update({
              where: { id: deduction.deduction_id },
              data: {
                status: "DEDUCTED",
                payroll_record_id: payrollRecord.id,
              },
            }),
            // Update loan remaining balance
            prisma.employeeLoan.update({
              where: { id: deduction.loan_id },
              data: {
                remaining_balance_paise: {
                  decrement: deduction.principal_paise,
                },
              },
            }),
          ]);

          // Check if loan is fully paid and close it
          const loan = await prisma.employeeLoan.findUnique({
            where: { id: deduction.loan_id },
          });
          if (loan && loan.remaining_balance_paise <= 0) {
            await prisma.employeeLoan.update({
              where: { id: deduction.loan_id },
              data: {
                status: "CLOSED",
                closed_at: new Date(),
                remaining_balance_paise: 0, // Ensure it's exactly 0
              },
            });
          }
        }
      }

      processedCount++;
    } catch (error: any) {
      errors.push({
        employeeId: emp.id,
        message: error.message,
      });
    }

    // Update progress
    await job.updateProgress(Math.round(((i + 1) / totalEmployees) * 100));
  }

  // Update PayrollRun
  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: {
      processed_count: processedCount,
      success_count: processedCount - errors.length,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    },
  });

  return {
    success: errors.length === 0,
    processedCount,
    errorCount: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    nextStage: errors.length === 0 ? "statutory" : undefined,
  };
}

async function processStatutoryStage(
  job: Job<PayrollJobData, PayrollJobResult>,
): Promise<PayrollJobResult> {
  // TODO: Implement in Plan 06 (ECR, ESI challan generation)
  await job.updateProgress(100);

  return {
    success: true,
    processedCount: 0,
    errorCount: 0,
    nextStage: "finalization",
  };
}

async function processFinalizationStage(
  job: Job<PayrollJobData, PayrollJobResult>,
): Promise<PayrollJobResult> {
  const { payrollRunId, month, year } = job.data;

  // Get the payroll run for employee records
  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      records: {
        where: {
          status: "CALCULATED",
        },
        include: {
          employee: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              personal_email: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!payrollRun) {
    throw new Error("Payroll run not found");
  }

  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: {
      status: "COMPLETED",
      completed_at: new Date(),
    },
  });

  // Update all records to VERIFIED
  await prisma.payrollRecord.updateMany({
    where: {
      payroll_run_id: payrollRunId,
      status: "CALCULATED",
    },
    data: {
      status: "VERIFIED",
    },
  });

  // Queue payslip email notifications for each employee
  let emailsSent = 0;
  let emailsFailed = 0;

  for (const record of payrollRun.records) {
    const employee = record.employee;
    const email = employee.personal_email || employee.user?.email;

    if (email) {
      try {
        await addEmailJob("payslip-available", email, {
          employeeName: `${employee.first_name} ${employee.last_name}`,
          month: month.toString(),
          year: year.toString(),
          payslipUrl: `/employee/payslips/${record.id}`,
        });
        emailsSent++;
        console.log(`Queued payslip email for employee ${employee.id} (${email})`);
      } catch (err) {
        emailsFailed++;
        console.error(`Failed to queue email for employee ${employee.id}:`, err);
        // Don't throw - email failure shouldn't fail payroll
      }
    } else {
      console.warn(`No email address for employee ${employee.id}, skipping notification`);
    }
  }

  console.log(`Payroll finalization complete: ${emailsSent} emails queued, ${emailsFailed} failed`);

  await job.updateProgress(100);

  return {
    success: true,
    processedCount: emailsSent,
    errorCount: emailsFailed,
  };
}
