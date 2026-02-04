# Phase 10: AI Chat Debug & MCP Evaluation - Research Findings

**Date:** 2026-02-04  
**Status:** Research Complete

---

## Part 1: AI Chat Debug Analysis

### Files Examined

| File | Status | Notes |
|------|--------|-------|
| `src/app/api/chat/route.ts` | ✅ Solid | Well-structured, has auth, error handling |
| `src/lib/ai/model-client.ts` | ⚠️ Minor Issues | See below |
| `src/lib/ai/tools/index.ts` | ✅ OK | Has @ts-expect-error comments but works |
| `src/lib/ai/tools/employee-data.ts` | ✅ OK | Good RBAC validation |
| `src/lib/ai/tools/policy-search.ts` | ✅ OK | Proper error handling |
| `src/components/chat/chat-interface.tsx` | ✅ OK | Uses AI SDK v6 correctly |

### TypeScript Check
```
npx tsc --noEmit → No errors
```

### Potential Issues Found

#### 1. **Environment Variable Configuration (Most Likely Culprit)**

The `model-client.ts` checks both `AI_PROVIDER` and `ANTHROPIC_API_KEY`:

```typescript
if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
  // Uses Anthropic
}
// Else defaults to Ollama
```

**Problem:** If either condition fails, it silently falls back to Ollama (which won't be available on Vercel).

**Required Vercel Environment Variables:**
- `AI_PROVIDER=anthropic` (exact lowercase)
- `ANTHROPIC_API_KEY=sk-ant-...`

#### 2. **Dynamic Import Timing**

```typescript
let anthropicModule: typeof import('@ai-sdk/anthropic') | null = null;

export async function getChatModel() {
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    if (!anthropicModule) {
      anthropicModule = await import('@ai-sdk/anthropic');  // Dynamic import
    }
```

This should work, but dynamic imports in serverless functions can sometimes cause cold start issues.

#### 3. **AI SDK v6 Tool Typing Issues**

All tools have `@ts-expect-error` comments:
```typescript
// @ts-expect-error - AI SDK v6 tool typing issue with execute parameter
execute: async ({employeeId, year}: any) => {
```

This is a known AI SDK v6 issue and shouldn't cause runtime problems, but indicates the SDK has type definition gaps.

#### 4. **No Error Visibility**

The chat route catches errors but only logs to `console.error`:
```typescript
} catch (error) {
  console.error('Chat API error:', error);
  return Response.json(
    { error: error instanceof Error ? error.message : 'Chat failed' },
    { status: 500 }
  );
}
```

**Need:** Check Vercel logs for actual runtime errors.

### Recommendations for Debug

1. **Verify Vercel Environment Variables** (highest priority)
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Confirm `AI_PROVIDER` = `anthropic` (exactly, lowercase)
   - Confirm `ANTHROPIC_API_KEY` is set with valid key

2. **Add Better Error Logging**
   - Add provider info to error responses during debug
   - Log which provider was selected

3. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Deployments → Functions
   - Look for runtime errors in the `/api/chat` function

4. **Test Locally with Production Env**
   ```bash
   pnpm build && AI_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-... pnpm start
   ```

---

## Part 2: MCP (Model Context Protocol) Evaluation

### What is MCP?

MCP (Model Context Protocol) is a standardized protocol by Anthropic for connecting AI models to external data sources and tools. It provides:

1. **Standardized Tool Interface** - Define tools once, use across clients
2. **Resource Access** - Give AI access to databases, files, APIs
3. **Prompt Templates** - Reusable prompt templates
4. **Security** - Built-in authentication and authorization

### Does ShreeHR Currently Have MCP?

**No.** Search results:
- No MCP-related files in `src/`
- No `@modelcontextprotocol/sdk` in dependencies
- No MCP configuration files

**However:** The dependencies already support MCP:
- `ai@6.0.69` has `@ai-sdk/mcp` available
- `next@16.1.6` has built-in MCP middleware

### Current Architecture vs MCP

**Current:** Tools defined inline in `src/lib/ai/tools/`
```typescript
// Current approach - tools embedded in Next.js app
const employeeTools = createEmployeeDataTools(toolContext);
const policyTools = createPolicySearchTool({ role: toolContext.role });
const tools = { ...employeeTools, ...policyTools };
```

**With MCP:** Tools exposed via MCP server
```typescript
// MCP approach - separate server
import { createMCPClient } from '@ai-sdk/mcp';
const mcpClient = await createMCPClient({
  transport: { type: 'http', url: '/api/mcp' }
});
const tools = await mcpClient.tools();
```

### Should ShreeHR Use MCP?

| Factor | Without MCP | With MCP |
|--------|-------------|----------|
| Complexity | Simpler | More complex |
| Multi-client support | No | Yes (any MCP client can connect) |
| Tool discovery | Hardcoded | Dynamic |
| Deployment | Single app | Potentially separate MCP server |
| Current state | **Already working** | Would need refactoring |

**Recommendation:** MCP is **NOT needed** for ShreeHR's current use case.

**Why:**
- ShreeHR is a single Next.js app
- Only one AI interface (chat widget)
- Tools are already well-integrated
- No external clients need to access the tools

**When MCP would be useful:**
- If you wanted Claude Desktop to access ShreeHR data
- If building a mobile app with separate AI interface
- If providing API access for third-party integrations

### Data the AI Currently Has Access To

| Tool | Data | RBAC |
|------|------|------|
| `getLeaveBalance` | Leave balances, pending requests | Own/subordinates |
| `getAttendance` | Attendance records | Own/subordinates |
| `getSalary` | Salary details, deductions | Own/subordinates |
| `getLoans` | Loan balances, EMI | Own/subordinates |
| `getTeamSummary` | Team attendance, approvals | Managers only |
| `getBirthdays` | This week's birthdays | All |
| `getAnniversaries` | Work anniversaries | All |
| `getPendingApprovals` | Leave/expense approvals | Managers only |
| `getOrganisationStats` | Employee counts by dept | Managers only |
| `searchPolicies` | HR policy documents | Role-filtered |

**RBAC is properly enforced** via `validateAccess()` function in `employee-data.ts`.

---

## Summary

### AI Chat Issues
1. **Most likely:** Environment variables not set correctly on Vercel
2. **Secondary:** Need to check Vercel function logs for runtime errors
3. **Low risk:** AI SDK v6 typing issues (cosmetic, not runtime)

### MCP Recommendation
- **Do NOT add MCP** - unnecessary complexity for current use case
- Current tool architecture is correct and working
- MCP would only add value for multi-client scenarios

### Next Steps
1. Verify Vercel environment variables
2. Add debug logging to identify exact failure point
3. Test with production environment locally
