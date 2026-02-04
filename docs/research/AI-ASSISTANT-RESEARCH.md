# AI Assistant Research

**Date:** 2026-02-04  
**Author:** GSD Research Agent  
**Status:** RESEARCH COMPLETE - Ready for Ved's Review

---

## Executive Summary

This document analyzes the current ShreeHR AI Assistant implementation and researches potential improvements including MCP (Model Context Protocol) integration and enhanced RBAC patterns. The existing implementation is **well-designed and secure**, with clear separation of concerns between AI tool calling and RBAC enforcement.

**Key Finding:** The current custom tool approach is **more secure** than MCP for this use case. MCP could be useful for admin-only analytics in the future.

---

## 1. Current State Analysis

### 1.1 Auth System (`src/lib/auth.ts`, `src/lib/auth-options.ts`)

**Framework:** NextAuth v5 (Auth.js)

**Authentication Flow:**
```
Credentials Provider → bcrypt password verification → JWT token → Session
```

**Session Structure:**
```typescript
interface Session {
  user: {
    id: string;        // User table ID
    email: string;
    name?: string;
    role: string;      // UserRole enum
    employeeId: string | null;  // Link to Employee record
  }
}
```

**Security Features:**
- ✅ Password hashing with bcrypt
- ✅ JWT session strategy (24-hour expiry)
- ✅ Role stored in JWT token (not just session)
- ✅ `is_active` flag checked on login
- ✅ Last login timestamp tracking

**Weakness Identified:**
- ❓ No rate limiting on login attempts (consider adding)
- ❓ No MFA support (future enhancement)

---

### 1.2 Role & Permission System

**User Roles (from Prisma schema):**

| Role | Level | Description |
|------|-------|-------------|
| `SUPER_ADMIN` | 5 | Full system access |
| `ADMIN` | 4 | HR management + payroll oversight |
| `HR_MANAGER` | 3 | Leave/attendance approvals |
| `PAYROLL_MANAGER` | 3 | Payroll processing |
| `EMPLOYEE` | 1 | Self-service only |

**Permission Enforcement:**
- Currently enforced at **tool level** in `/lib/ai/tools/employee-data.ts`
- Uses `validateAccess()` function with fail-closed design
- RBAC context injected from verified session, not AI prompts

---

### 1.3 Existing Chat Endpoint (`src/app/api/chat/route.ts`)

**Architecture:**
```
POST /api/chat
  ├── Auth check (session validation)
  ├── Get/Create conversation
  ├── Build tool context from session
  ├── Create tools with injected context
  ├── Stream response via AI SDK
  └── Save messages on completion
```

**Key Components:**
- **Model:** Ollama `llama3.2:3b` (local inference)
- **Framework:** Vercel AI SDK v6 (`streamText()`)
- **Tools:** 6 tools (leave, attendance, salary, loans, team, policies)
- **RAG:** Qdrant vector DB for policy search
- **History:** PostgreSQL conversation/message storage

**Streaming Response:**
- Returns `X-Conversation-Id` header for client conversation tracking
- Uses `onFinish` callback to save assistant responses

---

### 1.4 AI Tools Structure

**Location:** `/src/lib/ai/tools/`

| File | Tools | Purpose |
|------|-------|---------|
| `employee-data.ts` | 5 tools | Leave, attendance, salary, loans, team |
| `policy-search.ts` | 1 tool | RAG-based policy Q&A |
| `index.ts` | Factory | Creates tools with context injection |

**Security Model:**

```typescript
// CRITICAL: Context comes from verified JWT, NOT from AI
interface ToolContext {
  userId: string;     // From session
  employeeId: string; // From DB lookup
  role: string;       // From session
}

// Every tool calls validateAccess() FIRST
async function validateAccess(context, targetEmployeeId) {
  if (context.role === 'EMPLOYEE') {
    if (targetEmployeeId !== context.employeeId) {
      return { allowed: false, error: 'Access denied' };
    }
  }
  // ... role-based logic
}
```

---

### 1.5 Database Schema (Relevant Tables)

**AI-Specific Tables:**

| Table | Purpose |
|-------|---------|
| `conversations` | Chat session history |
| `messages` | Individual messages with tool_calls JSON |
| `policy_documents` | HR policies for RAG |

**Employee Data Tables:**

| Table | AI Tool Access |
|-------|----------------|
| `employees` | Profile info |
| `leave_balances` | Leave entitlements |
| `leave_requests` | Pending/historical requests |
| `attendances` | Check-in/out records |
| `payroll_records` | Salary breakdowns |
| `employee_loans` | Loan EMI details |

**PII Handling:**
- `pan_encrypted`, `aadhaar_encrypted`, `bank_account_encrypted` - AES-256 encrypted
- AI tools **do not** access encrypted PII fields
- Salary data accessible only to authorized roles

---

## 2. MCP (Model Context Protocol) Integration Research

### 2.1 What is MCP?

MCP is Anthropic's open protocol for connecting AI assistants to external data sources and tools. It provides a standardized way for LLMs to:
- Query databases
- Access file systems
- Call external APIs
- Execute code

**MCP Architecture:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ MCP Server  │────▶│  Resource   │
│  (Claude)   │◀────│  (Bridge)   │◀────│ (Database)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 2.2 MCP for PostgreSQL

**Available MCP Servers:**
1. **Official PostgreSQL MCP Server** (`@modelcontextprotocol/server-postgres`)
2. **Community implementations** (various)

**Required Packages:**
```bash
pnpm add @modelcontextprotocol/sdk
pnpm add @modelcontextprotocol/server-postgres
```

**Configuration:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."]
    }
  }
}
```

### 2.3 MCP Security Model

**How MCP Handles Security:**
1. **Read-Only by Default** - Most MCP DB servers only support SELECT
2. **Schema Exposure** - LLM can see table structures
3. **Query Generation** - LLM writes SQL queries
4. **No Row-Level Security** - All data visible to connection

**Security Concerns for ShreeHR:**

| Concern | Risk Level | Mitigation |
|---------|------------|------------|
| AI writes arbitrary SQL | HIGH | Views/RLS required |
| Schema leakage | MEDIUM | Limit exposed tables |
| No user context | HIGH | Can't filter by employee |
| PII exposure | HIGH | Exclude sensitive columns |
| Audit trail | MEDIUM | Query logging only |

### 2.4 MCP vs Current Custom Tools

| Factor | Custom Tools ✅ | MCP ⚠️ |
|--------|-----------------|--------|
| **RBAC Control** | Full control in code | Must use DB views/RLS |
| **Query Safety** | Predefined queries | AI writes SQL |
| **PII Filtering** | Select specific fields | Expose entire tables |
| **Audit** | Tool-level with params | Query-level only |
| **User Context** | Injected from session | Not available |
| **Performance** | Optimized queries | AI may write slow SQL |
| **Complexity** | Higher dev effort | Lower dev effort |

### 2.5 Recommendation: Keep Custom Tools

**Current custom tool approach is BETTER for ShreeHR because:**

1. **RBAC is complex** - Employees see own data, managers see team, admins see all
2. **PII handling** - Need to exclude/mask sensitive fields
3. **Query optimization** - Pre-written queries are faster and safer
4. **Audit requirements** - Need to log WHO accessed WHAT data
5. **Error handling** - Custom error messages for access denied

**Where MCP Could Be Useful:**

| Use Case | Risk | Value |
|----------|------|-------|
| Admin-only analytics dashboards | Low | High |
| Data exploration for SUPER_ADMIN | Medium | Medium |
| Report generation | Low | High |

**Future MCP Strategy:**
```
1. Create read-only Postgres role with limited schema
2. Build views that exclude PII columns
3. MCP connection uses this restricted role
4. Only expose to SUPER_ADMIN role
5. Log all MCP queries
```

---

## 3. RBAC Best Practices Research

### 3.1 Current Role-Data Matrix

| Data Type | EMPLOYEE | HR_MANAGER | PAYROLL_MANAGER | ADMIN |
|-----------|----------|------------|-----------------|-------|
| Own Profile | ✅ Read | ✅ Read | ✅ Read | ✅ Full |
| Own Leave | ✅ Read | ✅ Read | ✅ Read | ✅ Full |
| Own Salary | ✅ Read | ❌ | ✅ Read | ✅ Full |
| Own Attendance | ✅ Read | ✅ Read | ✅ Read | ✅ Full |
| Team Leave | ❌ | ✅ Subs | ❌ | ✅ All |
| Team Attendance | ❌ | ✅ Subs | ❌ | ✅ All |
| Any Salary | ❌ | ❌ | ✅ All | ✅ All |

### 3.2 Recommended RBAC Enhancements

**1. Explicit Permission Constants:**
```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  VIEW_OWN_LEAVE: ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  VIEW_TEAM_LEAVE: ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  VIEW_ALL_LEAVE: ['ADMIN', 'SUPER_ADMIN'],
  VIEW_OWN_SALARY: ['EMPLOYEE', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  VIEW_ANY_SALARY: ['PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  // ... etc
} as const;
```

**2. Helper Function:**
```typescript
function hasPermission(userRole: string, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(userRole);
}
```

**3. Tool-Level Logging:**
```typescript
// Enhanced validateAccess with audit
async function validateAccess(context, targetEmployeeId, action) {
  const result = await checkAccess(context, targetEmployeeId);
  
  // Log the access attempt
  await prisma.accessLog.create({
    data: {
      user_id: context.userId,
      action,
      target_employee_id: targetEmployeeId,
      allowed: result.allowed,
      timestamp: new Date(),
    }
  });
  
  return result;
}
```

### 3.3 Data Filtering by Role

**Current Implementation (Good):**
- `validateAccess()` checks role before any data fetch
- Returns error message if unauthorized
- Subordinate check for HR_MANAGER

**Recommended Enhancement - Field-Level Filtering:**
```typescript
// Different data returned based on role
function filterSalaryData(data, role) {
  if (role === 'EMPLOYEE') {
    // Own salary - show everything
    return data;
  }
  if (role === 'HR_MANAGER') {
    // Team salary - hide detailed breakdown
    return {
      netSalary: data.netSalary,
      // Exclude: deduction details, PF/ESI numbers
    };
  }
  // Admin/Payroll - show everything
  return data;
}
```

### 3.4 PII Masking Requirements

**Current State:**
- Encrypted PII fields NOT exposed to AI tools ✅
- Salary data accessible to authorized users ✅

**Recommended Enhancements:**

| Field | Rule | Implementation |
|-------|------|----------------|
| Phone | Mask last 4 digits for non-owners | `XXXXXX7890` |
| Email | Mask domain for non-owners | `user@xxx.com` |
| Address | Only city/state for non-owners | Exclude street |
| Salary | Only net for team view | Exclude breakdown |
| Bank | Never expose via AI | Exclude from tools |

**Implementation:**
```typescript
function maskPII(data, requesterRole, isOwner) {
  if (isOwner) return data;
  
  return {
    ...data,
    personal_phone: data.personal_phone.slice(0, -4) + 'XXXX',
    personal_email: data.personal_email.replace(/@.*/, '@xxx.com'),
    // Remove sensitive fields entirely
    pan_encrypted: undefined,
    aadhaar_encrypted: undefined,
  };
}
```

---

## 4. Open Questions for Ved

### 4.1 Architecture Decisions

1. **Model Choice**
   - Current: Ollama `llama3.2:3b` (local, free, 3B params)
   - Option: Claude API (better reasoning, paid)
   - **Question:** Switch to Claude for production? Budget implications?

2. **MCP Integration**
   - Research shows custom tools are more secure
   - MCP could be admin-only analytics feature
   - **Question:** Worth implementing MCP for SUPER_ADMIN data exploration?

3. **RAG Enhancement**
   - Current: Qdrant for policy search
   - Could add: Employee handbook, FAQ, procedures
   - **Question:** What documents should be in the knowledge base?

### 4.2 RBAC Questions

4. **Manager Role Confusion**
   - Current code references `HR_MANAGER` and `MANAGER`
   - Prisma schema only has `HR_MANAGER`
   - **Question:** Should there be a separate `MANAGER` role for team leads?

5. **Salary Visibility**
   - HR_MANAGER currently CANNOT see team salaries
   - PAYROLL_MANAGER can see ALL salaries
   - **Question:** Should managers see team salary for budgeting?

6. **Cross-Department Access**
   - Current: Only subordinate chain respected
   - **Question:** Should HR_MANAGER see ALL employees in their department?

### 4.3 Feature Priorities

7. **Action Tools** (not just read)
   - Apply leave via chat
   - Submit expenses
   - Approve requests
   - **Question:** Priority for action tools vs read-only improvements?

8. **Birthday/Anniversary Queries**
   - Mentioned in AI-AGENT-PLAN.md as pending
   - **Question:** What data should be exposed? (Names only? Dates?)

9. **Notification Integration**
   - Proactive: "You have 2 leave requests to approve"
   - **Question:** Push notifications or in-app only?

### 4.4 Security Questions

10. **Audit Log Storage**
    - Current: Tool calls stored in `messages.tool_calls`
    - Need: Separate audit table?
    - **Question:** Compliance requirement for audit logs?

11. **Rate Limiting**
    - Current: None on AI endpoint
    - Concern: Token abuse
    - **Question:** What rate limits are appropriate?

12. **PII Masking Strictness**
    - Current: AI doesn't access encrypted fields
    - Enhancement: Mask even visible fields for non-owners
    - **Question:** How strict should PII masking be?

---

## 5. Summary of Findings

### 5.1 What's Working Well ✅

1. **Security Architecture** - RBAC enforced in tool code, not prompts
2. **Context Injection** - User identity from verified session
3. **Tool Design** - Clean separation of concerns
4. **Error Handling** - Clear access denied messages
5. **Streaming** - Good UX with AI SDK v6

### 5.2 Recommended Improvements 📋

| Priority | Item | Effort |
|----------|------|--------|
| High | Switch to Claude API for better reasoning | 2h |
| High | Add explicit permission constants | 2h |
| Medium | Implement field-level PII masking | 4h |
| Medium | Add tool execution audit logging | 3h |
| Medium | Birthday/anniversary queries | 2h |
| Low | MCP for admin analytics (optional) | 8h |
| Low | Rate limiting on chat endpoint | 2h |

### 5.3 NOT Recommended ❌

1. **MCP for regular users** - Custom tools more secure
2. **Direct DB queries from AI** - Security risk
3. **Exposing encrypted PII fields** - Never needed

---

## Appendix A: Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth configuration export |
| `src/lib/auth-options.ts` | Auth providers, callbacks |
| `src/app/api/chat/route.ts` | Chat endpoint |
| `src/lib/ai/tools/index.ts` | Tool factory |
| `src/lib/ai/tools/employee-data.ts` | RBAC validation + data tools |
| `src/lib/ai/tools/policy-search.ts` | RAG policy tool |
| `src/lib/ai/prompts.ts` | System prompt |
| `src/lib/ai/conversation.ts` | History management |
| `prisma/schema.prisma` | Database schema |

---

## Appendix B: Technology Versions

| Component | Version | Notes |
|-----------|---------|-------|
| Next.js | 16.1.6 | App Router |
| NextAuth | 5.0.0-beta.30 | v5 with JWT |
| AI SDK | 6.0.69 | Vercel AI SDK |
| Prisma | 7.3.0 | PostgreSQL ORM |
| Ollama Provider | 1.2.0 | Local LLM |
| Qdrant Client | 1.16.2 | Vector DB |

---

**Research Complete. Ready for Ved's planning phase review.**
