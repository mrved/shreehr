import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../connection';
import { PayrollJobData, PayrollJobResult } from '../payroll.queue';
import { prisma } from '@/lib/db';

/**
 * Create and start the payroll worker
 * This processes payroll jobs from the queue
 */
export function createPayrollWorker(): Worker<PayrollJobData, PayrollJobResult> {
  const worker = new Worker<PayrollJobData, PayrollJobResult>(
    'payroll',
    async (job: Job<PayrollJobData, PayrollJobResult>) => {
      console.log(`Processing payroll job: ${job.id}, stage: ${job.data.stage}`);

      const { payrollRunId, stage } = job.data;

      // Update PayrollRun to show processing
      await prisma.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: 'PROCESSING',
          current_stage: stage.toUpperCase() as any,
          started_at: new Date(),
        },
      });

      try {
        let result: PayrollJobResult;

        switch (stage) {
          case 'validation':
            result = await processValidationStage(job);
            break;
          case 'calculation':
            result = await processCalculationStage(job);
            break;
          case 'statutory':
            result = await processStatutoryStage(job);
            break;
          case 'finalization':
            result = await processFinalizationStage(job);
            break;
          default:
            throw new Error(`Unknown stage: ${stage}`);
        }

        return result;
      } catch (error: any) {
        // Update PayrollRun with error
        await prisma.payrollRun.update({
          where: { id: payrollRunId },
          data: {
            status: 'FAILED',
            errors: [{ stage, message: error.message }],
          },
        });

        throw error;
      }
    },
    {
      ...getQueueConnection(),
      concurrency: 1, // Process one payroll at a time
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`Payroll job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`Payroll job ${job?.id} failed:`, error.message);
  });

  return worker;
}

// Stage processors - stubs for now
async function processValidationStage(
  job: Job<PayrollJobData, PayrollJobResult>
): Promise<PayrollJobResult> {
  // TODO: Implement in Plan 04
  // 1. Check attendance lock exists
  // 2. Validate all employees have salary structures
  // 3. Validate salary structures are compliant

  await job.updateProgress(100);

  return {
    success: true,
    processedCount: 0,
    errorCount: 0,
    nextStage: 'calculation',
  };
}

async function processCalculationStage(
  job: Job<PayrollJobData, PayrollJobResult>
): Promise<PayrollJobResult> {
  // TODO: Implement in Plan 04
  // 1. Get all active employees
  // 2. For each employee, calculate:
  //    - Gross salary from salary structure
  //    - LOP deduction from attendance
  //    - PF contribution
  //    - ESI contribution
  //    - PT deduction
  //    - TDS deduction
  //    - Net salary

  await job.updateProgress(100);

  return {
    success: true,
    processedCount: 0,
    errorCount: 0,
    nextStage: 'statutory',
  };
}

async function processStatutoryStage(
  job: Job<PayrollJobData, PayrollJobResult>
): Promise<PayrollJobResult> {
  // TODO: Implement in Plan 06
  // 1. Generate ECR file
  // 2. Generate ESI challan
  // 3. Calculate TDS totals

  await job.updateProgress(100);

  return {
    success: true,
    processedCount: 0,
    errorCount: 0,
    nextStage: 'finalization',
  };
}

async function processFinalizationStage(
  job: Job<PayrollJobData, PayrollJobResult>
): Promise<PayrollJobResult> {
  const { payrollRunId } = job.data;

  // Mark PayrollRun as complete
  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: {
      status: 'COMPLETED',
      completed_at: new Date(),
    },
  });

  await job.updateProgress(100);

  return {
    success: true,
    processedCount: 0,
    errorCount: 0,
  };
}
