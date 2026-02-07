/**
 * AI Model Configuration
 * 
 * Supports both Claude API (Anthropic) and local Ollama
 * Set AI_PROVIDER=anthropic and ANTHROPIC_API_KEY to use Claude
 * Otherwise defaults to Ollama
 */

import { createOllama } from 'ollama-ai-provider';
import { createMockModel } from './mock-provider';

// Dynamically import Anthropic only if needed
let anthropicModule: typeof import('@ai-sdk/anthropic') | null = null;

export async function getChatModel() {
  // If ANTHROPIC_API_KEY is present, automatically use Anthropic provider
  // This provides better developer experience - just set the key and it works!
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const explicitProvider = process.env.AI_PROVIDER?.toLowerCase();
  const provider = explicitProvider || (hasAnthropicKey ? 'anthropic' : 'ollama');
  
  if (provider === 'anthropic') {
    // Fail fast if Anthropic is selected but API key is missing
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'AI_PROVIDER is set to "anthropic" but ANTHROPIC_API_KEY is not configured. ' +
        'Please set the ANTHROPIC_API_KEY environment variable.'
      );
    }
    if (!anthropicModule) {
      anthropicModule = await import('@ai-sdk/anthropic');
    }
    // Use Claude Sonnet 4 for best balance of speed and capability
    return anthropicModule.anthropic('claude-sonnet-4-20250514');
  }
  
  // In production without proper configuration, use mock provider
  if (process.env.NODE_ENV === 'production' && !hasAnthropicKey) {
    console.warn('[AI Model] Using mock provider - AI not configured for production');
    return createMockModel() as any;
  }
  
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
export function getProviderInfo(): { provider: string; model: string; hasApiKey: boolean } {
  // Match the logic in getChatModel() - auto-detect Anthropic if key is present
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const explicitProvider = process.env.AI_PROVIDER?.toLowerCase();
  const provider = explicitProvider || (hasApiKey ? 'anthropic' : 'ollama');
  
  if (provider === 'anthropic') {
    return { 
      provider: 'anthropic', 
      model: 'claude-sonnet-4-20250514',
      hasApiKey 
    };
  }
  
  return { 
    provider: 'ollama', 
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    hasApiKey: false
  };
}
