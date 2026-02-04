// BullMQ Queue for Policy Document Embedding
// Handles background processing of document chunking and embedding generation

import { Queue } from 'bullmq';
import { getRedisConnection } from './connection';

export interface EmbeddingJobData {
  policyId: string;
  title: string;
  category: string;
  content: string;
  visibleToRoles: string[];
}

export const embeddingQueue = new Queue<EmbeddingJobData>('policy-embeddings', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60, // 24 hours
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60, // 7 days
    },
  },
});

/**
 * Add a policy document to the embedding queue.
 * Called when a policy is created or updated.
 */
export async function addEmbeddingJob(data: EmbeddingJobData) {
  const jobId = `embed-${data.policyId}`;

  // Remove any existing job for this policy (handles updates)
  const existingJob = await embeddingQueue.getJob(jobId);
  if (existingJob) {
    await existingJob.remove();
  }

  return embeddingQueue.add('embed-policy', data, {
    jobId,
  });
}

/**
 * Get embedding job status for a policy.
 */
export async function getEmbeddingJobStatus(policyId: string) {
  const jobId = `embed-${policyId}`;
  const job = await embeddingQueue.getJob(jobId);

  if (!job) return null;

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
  };
}
