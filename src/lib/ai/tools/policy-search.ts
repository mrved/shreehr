// AI Tool for Policy Document Search
// Provides LLM with ability to search company HR policies by semantic similarity

import { tool } from 'ai';
import { z } from 'zod';
import { searchPolicies, hasPolices } from '@/lib/qdrant/search';

export interface PolicyToolContext {
  role: string;
}

/**
 * Create AI tool for searching policy documents.
 */
export function createPolicySearchTool(context: PolicyToolContext) {
  return {
    searchPolicies: tool({
      description: `Search company HR policy documents to answer questions about policies, procedures, and guidelines. Use this for questions like "What's the WFH policy?", "How do I claim medical expenses?", "What are the leave rules?". Always cite the source document in your response.`,
      parameters: z.object({
        query: z.string().describe('The question or topic to search for in policy documents'),
      }),
      execute: async ({ query }) => {
        // Check if we have any policies
        const hasDocs = await hasPolices();
        if (!hasDocs) {
          return {
            results: [],
            message: 'No policy documents have been uploaded yet. Please contact HR admin.',
          };
        }

        const results = await searchPolicies(query, context.role);

        if (results.length === 0) {
          return {
            results: [],
            message: `I couldn't find information about "${query}" in our policy documents. Try rephrasing your question or contact HR admin for help.`,
          };
        }

        return {
          results: results.map((r) => ({
            content: r.content,
            source: `${r.title} (${r.category})`,
            relevance: Math.round(r.score * 100) + '%',
          })),
          message: `Found ${results.length} relevant policy sections.`,
        };
      },
    }),
  };
}

export type PolicySearchTools = ReturnType<typeof createPolicySearchTool>;
