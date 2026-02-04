import { Queue } from "bullmq";
import { getQueueConnection } from "@/lib/queues/connection";

/**
 * Email job data structure
 */
export interface EmailJobData {
  template: string;
  to: string | string[];
  data: Record<string, any>;
}

/**
 * Email queue for async email delivery
 */
export const emailQueue = new Queue<EmailJobData>("emails", getQueueConnection());

/**
 * Add an email job to the queue
 *
 * @param template Template name (e.g., 'payslip-notification')
 * @param to Recipient email address(es)
 * @param data Template data
 * @returns Job ID
 */
export async function addEmailJob(
  template: string,
  to: string | string[],
  data: Record<string, any>,
): Promise<string> {
  const job = await emailQueue.add(
    "send-email",
    {
      template,
      to,
      data,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000, // 2s, 4s, 8s
      },
      removeOnComplete: {
        age: 24 * 60 * 60, // 24 hours
      },
      removeOnFail: {
        age: 7 * 24 * 60 * 60, // 7 days
      },
    },
  );

  return job.id!;
}
