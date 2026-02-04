// Ollama AI Provider Configuration
// Configured for local Ollama instance with llama3.2:3b model

import { createOllama } from 'ollama-ai-provider';

export const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api',
});

export const chatModel = ollama('llama3.2:3b');
export const embeddingModel = ollama.embedding('nomic-embed-text');
