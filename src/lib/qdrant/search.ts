// Semantic Search with Role-Based Access Control
// Searches policy documents using vector similarity with RBAC filtering

import { qdrant, POLICIES_COLLECTION } from './client';
import { generateEmbedding } from './embeddings';

export interface PolicySearchResult {
  content: string;
  title: string;
  category: string;
  score: number;
  policyId: string;
}

/**
 * Search policy documents by semantic similarity.
 * Filters results by user role for RBAC compliance.
 */
export async function searchPolicies(
  query: string,
  userRole: string,
  limit: number = 5,
  minScore: number = 0.5
): Promise<PolicySearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Build filter for role-based access
  // visible_to_roles is an array; if empty, visible to all
  const filter = {
    should: [
      // Document has no role restriction (visible to all)
      {
        is_empty: {
          key: 'visible_to_roles',
        },
      },
      // Document is visible to user's role
      {
        key: 'visible_to_roles',
        match: {
          any: [userRole, 'ALL'],
        },
      },
    ],
  };

  // Search Qdrant
  const searchResult = await qdrant.search(POLICIES_COLLECTION, {
    vector: queryEmbedding,
    filter,
    limit,
    with_payload: true,
    score_threshold: minScore,
  });

  // Map results
  return searchResult.map((hit) => ({
    content: (hit.payload?.content as string) || '',
    title: (hit.payload?.title as string) || '',
    category: (hit.payload?.category as string) || '',
    score: hit.score,
    policyId: (hit.payload?.policyId as string) || '',
  }));
}

/**
 * Check if Qdrant collection exists and has documents.
 */
export async function hasPolices(): Promise<boolean> {
  try {
    const info = await qdrant.getCollection(POLICIES_COLLECTION);
    return (info.points_count ?? 0) > 0;
  } catch {
    return false;
  }
}
