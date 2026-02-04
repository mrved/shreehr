// BullMQ Worker for Policy Document Embedding
// Processes documents: chunks, generates embeddings, upserts to Qdrant

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../connection';
import { qdrant, POLICIES_COLLECTION, ensureCollection } from '@/lib/qdrant/client';
import { chunkDocument, generateEmbedding } from '@/lib/qdrant/embeddings';
import { prisma } from '@/lib/db';
import type { EmbeddingJobData } from '../embedding.queue';

/**
 * Worker that processes policy document embedding jobs.
 * - Chunks the document
 * - Generates embeddings for each chunk
 * - Upserts to Qdrant
 * - Updates PolicyDocument status in Prisma
 */
export const embeddingWorker = new Worker<EmbeddingJobData>(
  'policy-embeddings',
  async (job: Job<EmbeddingJobData>) => {
    const { policyId, title, category, content, visibleToRoles } = job.data;

    console.log(`Processing embedding job for policy: ${title}`);

    try {
      // Update status to processing
      await prisma.policyDocument.update({
        where: { id: policyId },
        data: { embedding_status: 'PROCESSING' },
      });

      // Ensure collection exists
      await ensureCollection();

      // Delete existing chunks for this policy (handles updates)
      await qdrant.delete(POLICIES_COLLECTION, {
        filter: {
          must: [
            { key: 'policyId', match: { value: policyId } },
          ],
        },
      });

      // Chunk the document
      const chunks = chunkDocument(policyId, title, category, content);

      if (chunks.length === 0) {
        throw new Error('Document produced no chunks');
      }

      // Process chunks
      const points = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Update progress
        await job.updateProgress(Math.round((i / chunks.length) * 100));

        // Generate embedding
        const embedding = await generateEmbedding(chunk.text);

        points.push({
          id: chunk.id,
          vector: embedding,
          payload: {
            policyId,
            title,
            category,
            content: chunk.text,
            chunkIndex: chunk.metadata.chunkIndex,
            totalChunks: chunk.metadata.totalChunks,
            visible_to_roles: visibleToRoles,
          },
        });
      }

      // Upsert all points to Qdrant
      await qdrant.upsert(POLICIES_COLLECTION, {
        wait: true,
        points,
      });

      // Update status to completed
      await prisma.policyDocument.update({
        where: { id: policyId },
        data: {
          embedding_status: 'COMPLETED',
          chunk_count: chunks.length,
          last_embedded_at: new Date(),
        },
      });

      console.log(`Completed embedding for policy: ${title} (${chunks.length} chunks)`);

      return { success: true, chunkCount: chunks.length };
    } catch (error) {
      // Update status to failed
      await prisma.policyDocument.update({
        where: { id: policyId },
        data: { embedding_status: 'FAILED' },
      });

      throw error;
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 1, // Process one at a time to avoid overwhelming Ollama
  }
);

// Event handlers for logging
embeddingWorker.on('completed', (job) => {
  console.log(`Embedding job ${job.id} completed`);
});

embeddingWorker.on('failed', (job, error) => {
  console.error(`Embedding job ${job?.id} failed:`, error.message);
});

// Graceful shutdown
export async function closeEmbeddingWorker() {
  await embeddingWorker.close();
}
