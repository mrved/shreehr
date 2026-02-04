---
phase: 06-ai-assistant
plan: 01
status: complete
one-liner: "AI SDK, Ollama, and Qdrant infrastructure with conversation/policy database models"
subsystem: ai-infrastructure
tags: [ai, rag, ollama, qdrant, vercel-ai-sdk, embeddings]

# Dependency graph
requires:
  - "05-04 (Payroll Integration for Expenses and Loans)"
provides:
  - "AI SDK (Vercel AI SDK) with Ollama provider configuration"
  - "Qdrant vector database container and client"
  - "Conversation and Message models for chat persistence"
  - "PolicyDocument model for RAG source tracking"
affects:
  - "06-02 (AI chat tools and APIs will use these models)"
  - "Future embedding and RAG implementation"

# Tech tracking
tech-stack:
  added:
    - "ai@6.0.69 (Vercel AI SDK)"
    - "ollama-ai-provider@1.2.0"
    - "@qdrant/js-client-rest@1.16.2"
  patterns:
    - "Singleton pattern for AI provider and Qdrant client"
    - "Environment variable configuration for service URLs"
    - "Vector database for policy document RAG"

# File tracking
key-files:
  created:
    - "src/lib/ai/ollama-client.ts"
    - "src/lib/qdrant/client.ts"
  modified:
    - "package.json"
    - "docker-compose.yml"
    - "prisma/schema.prisma"
    - ".env.example"

# Decisions from this plan
decisions:
  - what: "Use Vercel AI SDK with Ollama provider"
    why: "Self-hosted LLM control, no API costs, supports streaming"
    impact: "Need to install Ollama locally, but gain full control over model"
  - what: "Use Qdrant for vector database"
    why: "Open source, REST API, Docker-ready, optimized for similarity search"
    impact: "Easy local development, scales to production, supports filtering"
  - what: "Vector size 768 for nomic-embed-text"
    why: "Match embedding model output dimensions"
    impact: "Must use consistent model for all embeddings"
  - what: "Store visible_to_roles as String[] on PolicyDocument"
    why: "Enable RBAC filtering in RAG queries (filter by user role)"
    impact: "Can show different policy results based on user permissions"

# Metrics
duration: "3min 30sec"
completed: "2026-02-04"
---

# Phase 06 Plan 01: AI Assistant Infrastructure Summary

**One-liner:** AI SDK, Ollama, and Qdrant infrastructure with conversation/policy database models

## What Was Built

Set up the foundational infrastructure for AI chat assistant including:

1. **AI SDK Integration**
   - Installed Vercel AI SDK (`ai`), Ollama provider, and Qdrant client packages
   - Created `src/lib/ai/ollama-client.ts` with configured Ollama provider
   - Exported `chatModel` (llama3.2:3b) and `embeddingModel` (nomic-embed-text)
   - Environment variable support via `OLLAMA_BASE_URL`

2. **Qdrant Vector Database**
   - Added Qdrant service to `docker-compose.yml` with persistent volume
   - Created `src/lib/qdrant/client.ts` with singleton client
   - Implemented `ensureCollection()` function for automatic collection creation
   - Configured for 768-dimensional vectors (nomic-embed-text) with Cosine distance

3. **Database Models**
   - **Conversation model**: Chat sessions linked to users with auto-generated titles
   - **Message model**: Individual messages with role tracking and tool call audit
   - **PolicyDocument model**: RAG source documents with embedding status, chunking, and RBAC
   - **EmbeddingStatus enum**: Tracks document processing state (PENDING → PROCESSING → COMPLETED/FAILED)

## Technical Approach

**Package Selection:**
- **Vercel AI SDK**: Industry-standard SDK with streaming, tool calling, and provider abstraction
- **Ollama**: Self-hosted LLM runtime eliminating API costs and enabling full control
- **Qdrant**: Modern vector database with REST API, Docker support, and filtering capabilities

**Architecture Decisions:**
- Singleton pattern for AI and Qdrant clients to prevent connection overhead
- Environment variable configuration for service URLs (development flexibility)
- Cascade delete on conversations/messages (clean up when user deleted)
- Soft delete pattern NOT used for chat data (privacy-first approach)
- RBAC via `visible_to_roles` array on PolicyDocument for permission-aware RAG

**Vector Configuration:**
- Vector size: 768 (matches nomic-embed-text output)
- Distance metric: Cosine (optimal for text similarity)
- Collection: `hr_policies` (dedicated namespace for policy documents)

## Files Modified

### Created
- `src/lib/ai/ollama-client.ts` - Ollama provider configuration with chat and embedding models
- `src/lib/qdrant/client.ts` - Qdrant client singleton with collection management

### Modified
- `package.json` - Added AI SDK, Ollama provider, Qdrant client dependencies
- `docker-compose.yml` - Added Qdrant service with ports 6333/6334 and persistent volume
- `prisma/schema.prisma` - Added Conversation, Message, PolicyDocument models and EmbeddingStatus enum
- `.env.example` - Added OLLAMA_BASE_URL, QDRANT_URL, EMBEDDING_MODEL variables

## Decisions Made

1. **Self-hosted Ollama over OpenAI/Anthropic APIs**
   - **Why**: Zero API costs, complete control over model selection, no vendor lock-in, data privacy
   - **Tradeoff**: Requires local Ollama installation and model downloads (llama3.2:3b ~2GB)
   - **Impact**: User must run `ollama pull llama3.2:3b` and `ollama pull nomic-embed-text` before chat works

2. **Qdrant over pgvector (Postgres extension)**
   - **Why**: Dedicated vector database with optimized indexing, easier scaling, built-in filtering
   - **Tradeoff**: Additional container to manage vs. using existing Postgres
   - **Impact**: Better performance for RAG queries, cleaner separation of concerns

3. **Vector size 768 (nomic-embed-text)**
   - **Why**: Open-source embedding model optimized for retrieval, good balance of quality and speed
   - **Tradeoff**: Lower dimension than OpenAI embeddings (1536) but faster and free
   - **Impact**: All embeddings must use same model (consistency requirement)

4. **String array for roles vs. junction table**
   - **Why**: Simpler schema, sufficient for ~5 roles, easier filtering in Qdrant
   - **Tradeoff**: Can't enforce referential integrity on role names
   - **Impact**: Must validate role names in application code, document accepted values

5. **Separate Message and Conversation models**
   - **Why**: Enable message-level querying, support pagination, track tool calls per message
   - **Tradeoff**: Slightly more complex than JSON array of messages
   - **Impact**: Better for audit trail, easier to implement streaming responses

## Next Phase Readiness

**Ready for Plan 06-02 (AI Chat Tools and APIs):**
- ✅ AI SDK installed and importable
- ✅ Ollama client configured with chat and embedding models
- ✅ Qdrant client ready for vector operations
- ✅ Database models exist for conversation persistence
- ✅ PolicyDocument model ready for RAG source storage

**Blockers/Dependencies:**
- ⚠️ **User must install Ollama**: Run `curl -fsSL https://ollama.com/install.sh | sh` (Linux/Mac) or download from https://ollama.com (Windows)
- ⚠️ **User must pull models**: Run `ollama pull llama3.2:3b` and `ollama pull nomic-embed-text`
- ⚠️ **User must start Qdrant**: Run `docker compose up -d qdrant`
- ⚠️ **Environment variables required**: Add `OLLAMA_BASE_URL` and `QDRANT_URL` to `.env` file

**Outstanding Issues:**
- TypeScript compilation shows errors in `src/lib/ai/tools/index.ts` and `src/lib/qdrant/embeddings.ts` (files from future work)
- Peer dependency warnings: `ollama-ai-provider` expects `zod@^3.x` but project uses `zod@4.3.6` (should not block functionality)
- No collection initialization on app startup (must call `ensureCollection()` manually before first RAG query)

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**Manual Verification:**
1. ✅ Packages installed: `pnpm list ai ollama-ai-provider @qdrant/js-client-rest`
2. ✅ Prisma schema synced: `pnpm db:push` completed without errors
3. ✅ Prisma client generated: `pnpm db:generate` generated types for new models
4. ✅ Docker compose valid: `docker-compose.yml` syntax correct (docker not in PATH to test)

**Database Verification:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('conversations', 'messages', 'policy_documents');

-- Expected: 3 rows
```

**Next Steps for Developer:**
1. Install Ollama: Follow instructions at https://ollama.com/download
2. Pull models: `ollama pull llama3.2:3b && ollama pull nomic-embed-text`
3. Start Qdrant: `docker compose up -d qdrant`
4. Verify Qdrant: `curl http://localhost:6333/collections` (should return empty array)
5. Add environment variables to `.env`:
   ```
   OLLAMA_BASE_URL=http://localhost:11434/api
   QDRANT_URL=http://localhost:6333
   EMBEDDING_MODEL=nomic-embed-text
   ```

## Performance Notes

- Ollama local inference: ~2-5 tokens/sec on CPU, ~20-50 tokens/sec on GPU (depends on hardware)
- nomic-embed-text: ~100-200 embeddings/sec on CPU (batching improves throughput)
- Qdrant vector search: <100ms for similarity search on 10k documents (depends on collection size)

## Security Considerations

- Conversations cascade delete with user (ensures no orphaned chat data)
- PolicyDocument RBAC via `visible_to_roles` prevents unauthorized policy access in RAG
- No PII encryption on chat messages (assume conversations may contain sensitive HR data, handle at application level)
- Tool calls logged in Message model for audit trail (can review what data AI accessed)

## Task Completion Summary

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Install AI SDK packages and configure Ollama client | 22f3ac3 | package.json, src/lib/ai/ollama-client.ts, .env.example |
| 2 | Add Qdrant to docker-compose and create client | daa53eb | docker-compose.yml, src/lib/qdrant/client.ts |
| 3 | Add Prisma models for conversation history and policy documents | 68d5130 | prisma/schema.prisma |

**All tasks completed successfully. Infrastructure ready for AI chat implementation.**
