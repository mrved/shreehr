/**
 * AI Model Configuration
 * 
 * Supports both Claude API (Anthropic) and local Ollama
 * Set AI_PROVIDER=anthropic and ANTHROPIC_API_KEY to use Claude
 * Otherwise defaults to Ollama
 */

import { createOllama } from 'ollama-ai-provider';

// Dynamically import Anthropic only if needed
let anthropicModule: typeof import('@ai-sdk/anthropic') | null = null;

export async function getChatModel() {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'ollama';
  
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    if (!anthropicModule) {
      anthropicModule = await import('@ai-sdk/anthropic');
    }
    // Use Claude Sonnet 4 for best balance of speed and capability
    return anthropicModule.anthropic('claude-sonnet-4-20250514');
  }
  
  // Default to Ollama
  const ollama = createOllama({
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api',
  });
  
  return ollama(process.env.OLLAMA_MODEL || 'llama3.2:3b');
}

export async function getEmbeddingModel() {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'ollama';
  
  if (provider === 'anthropic') {
    // Anthropic doesn't have native embeddings, use Ollama for embeddings
    const ollama = createOllama({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api',
    });
    return ollama.embedding('nomic-embed-text');
  }
  
  const ollama = createOllama({
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api',
  });
  
  return ollama.embedding(process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text');
}

/**
 * Get provider info for debugging
 */
export function getProviderInfo(): { provider: string; model: string } {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'ollama';
  
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return { provider: 'anthropic', model: 'claude-sonnet-4-20250514' };
  }
  
  return { 
    provider: 'ollama', 
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b' 
  };
}
