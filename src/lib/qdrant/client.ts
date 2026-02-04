// Qdrant Vector Database Client
// Configured for local Qdrant instance for policy document RAG

import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';

export const qdrant = new QdrantClient({ url: QDRANT_URL });
export const POLICIES_COLLECTION = 'hr_policies';

/**
 * Ensures the policies collection exists with proper configuration
 * Vector size: 768 (for nomic-embed-text embeddings)
 * Distance: Cosine (optimal for text similarity)
 */
export async function ensureCollection() {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(c => c.name === POLICIES_COLLECTION);

  if (!exists) {
    await qdrant.createCollection(POLICIES_COLLECTION, {
      vectors: { size: 768, distance: 'Cosine' },
    });
  }
}
