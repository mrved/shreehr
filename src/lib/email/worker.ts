import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '@/lib/queues/connection';
import { sendEmail } from './resend';
import { getTemplate } from './templates';
import { EmailJobData } from './queue';

/**
 * Email worker result
 */
interface EmailWorkerResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Create and start the email worker
 *
 * Processes email queue with:
 * - Concurrency: 5 (process 5 emails at a time)
 * - Retry: 3 attempts with exponential backoff (2s, 4s, 8s)
 * - Retention: 24h completed, 7 days failed
 */
export function createEmailWorker(): Worker<EmailJobData, EmailWorkerResult> {
  const worker = new Worker<EmailJobData, EmailWorkerResult>(
    'emails',
    async (job: Job<EmailJobData, EmailWorkerResult>) => {
      console.log(`Processing email job: ${job.id}, template: ${job.data.template}`);

      const { template, to, data } = job.data;

      try {
        // Get template
        const emailContent = getTemplate(template, data);

        // Send email
        const result = await sendEmail({
          to,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        console.log(
          `Email sent successfully: ${job.id}, messageId: ${result.messageId}, to: ${Array.isArray(to) ? to.join(', ') : to}`
        );

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error: any) {
        console.error(
          `Email job ${job.id} failed (attempt ${job.attemptsMade + 1}/${job.opts.attempts}):`,
          error.message
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
    {
      ...getQueueConnection(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`Email job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`Email job ${job?.id} failed after all retries:`, error.message);
  });

  return worker;
}
