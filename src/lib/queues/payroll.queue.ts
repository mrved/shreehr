import { Queue, Job } from 'bullmq';
import { getQueueConnection } from './connection';

export interface PayrollJobData {
  payrollRunId: string;
  month: number;
  year: number;
  stage: 'validation' | 'calculation' | 'statutory' | 'finalization';
  employeeIds?: string[]; // For partial processing
}

export interface PayrollJobResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  errors?: Array<{ employeeId: string; message: string }>;
  nextStage?: PayrollJobData['stage'];
}

// Queue instance
let payrollQueueInstance: Queue<PayrollJobData, PayrollJobResult> | null = null;

/**
 * Get or create the payroll queue
 */
export function getPayrollQueue(): Queue<PayrollJobData, PayrollJobResult> {
  if (!payrollQueueInstance) {
    payrollQueueInstance = new Queue<PayrollJobData, PayrollJobResult>('payroll', {
      ...getQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });
  }

  return payrollQueueInstance;
}

/**
 * Add a payroll job to the queue
 */
export async function addPayrollJob(
  data: PayrollJobData,
  options?: {
    priority?: number;
    delay?: number;
  }
): Promise<Job<PayrollJobData, PayrollJobResult>> {
  const queue = getPayrollQueue();

  const jobId = `payroll-${data.payrollRunId}-${data.stage}`;

  return queue.add(data.stage, data, {
    jobId,
    priority: options?.priority ?? 1,
    delay: options?.delay,
  });
}

/**
 * Get job status
 */
export async function getPayrollJobStatus(
  payrollRunId: string,
  stage: string
): Promise<{
  state: string;
  progress: number;
  result?: PayrollJobResult;
  failedReason?: string;
} | null> {
  const queue = getPayrollQueue();
  const jobId = `payroll-${payrollRunId}-${stage}`;

  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress as number || 0;

  return {
    state,
    progress,
    result: job.returnvalue,
    failedReason: job.failedReason,
  };
}

/**
 * Cancel pending payroll jobs
 */
export async function cancelPayrollJobs(payrollRunId: string): Promise<void> {
  const queue = getPayrollQueue();
  const stages = ['validation', 'calculation', 'statutory', 'finalization'];

  for (const stage of stages) {
    const jobId = `payroll-${payrollRunId}-${stage}`;
    const job = await queue.getJob(jobId);

    if (job) {
      const state = await job.getState();
      if (state === 'waiting' || state === 'delayed') {
        await job.remove();
      }
    }
  }
}
