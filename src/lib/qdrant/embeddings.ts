// Embedding Generation and Document Chunking
// For policy document RAG using Ollama nomic-embed-text model

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    policyId: string;
    title: string;
    category: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

/**
 * Chunk a policy document for embedding.
 * Uses semantic boundaries (headings, paragraphs) for better RAG retrieval.
 * Target: 256-512 tokens per chunk for fact-focused policy retrieval.
 */
export function chunkDocument(
  policyId: string,
  title: string,
  category: string,
  content: string,
  maxChunkSize: number = 1500 // ~375 tokens
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // First, split by markdown headers (##, ###)
  const sections = content.split(/\n(?=#{1,3}\s)/);

  for (const section of sections) {
    if (!section.trim()) continue;

    // If section is small enough, keep as single chunk
    if (section.length <= maxChunkSize) {
      chunks.push({
        id: `${policyId}-chunk-${chunks.length}`,
        text: section.trim(),
        metadata: {
          policyId,
          title,
          category,
          chunkIndex: chunks.length,
          totalChunks: 0, // Will be updated after all chunks created
        },
      });
      continue;
    }

    // Split large sections by paragraphs
    const paragraphs = section.split(/\n\n+/);
    let currentChunk = '';

    for (const para of paragraphs) {
      if (currentChunk.length + para.length > maxChunkSize) {
        // Save current chunk
        if (currentChunk.trim()) {
          chunks.push({
            id: `${policyId}-chunk-${chunks.length}`,
            text: currentChunk.trim(),
            metadata: {
              policyId,
              title,
              category,
              chunkIndex: chunks.length,
              totalChunks: 0,
            },
          });
        }
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }

    // Don't forget last chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `${policyId}-chunk-${chunks.length}`,
        text: currentChunk.trim(),
        metadata: {
          policyId,
          title,
          category,
          chunkIndex: chunks.length,
          totalChunks: 0,
        },
      });
    }
  }

  // Update totalChunks in all chunks
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  return chunks;
}

/**
 * Generate embedding for a single text using Ollama's nomic-embed-text model.
 * Vector dimension: 768
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  const response = await fetch(`${baseURL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.statusText}`);
  }

  const data = await response.json() as { embedding: number[] };
  return data.embedding;
}

/**
 * Generate embeddings for multiple chunks in batch.
 * Processes sequentially to avoid overwhelming Ollama.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }

  return embeddings;
}
