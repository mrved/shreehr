# ShreeHR AI Assistant - Architecture Plan

## GSD Overview

**Goal**: Build a secure, role-aware AI assistant that helps employees with HR queries using natural language.

**Status**: ✅ Core Implementation Complete

---

## 1. Architecture

### 1.1 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| LLM | Claude API (Anthropic) or Ollama (local) | Natural language understanding |
| Framework | Vercel AI SDK v6 | Streaming, tool calling |
| Database | PostgreSQL (Neon) | HR data storage |
| Auth | NextAuth v5 | Session management |
| Frontend | React (Next.js 16) | Chat UI |

### 1.2 System Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│  Next.js    │────▶│   Claude    │
│   (Chat)    │     │  API Route  │     │   (LLM)     │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                          │                    │
                          │ Session            │ Tool
                          │ Validation         │ Calls
                          ▼                    ▼
                   ┌─────────────┐     ┌─────────────┐
                   │  NextAuth   │     │   Tools     │
                   │  (RBAC)     │     │  (RBAC)     │
                   └─────────────┘     └──────┬──────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  PostgreSQL │
                                       │   (Neon)    │
                                       └─────────────┘
```

---

## 2. Implementation Status

### 2.1 Completed Features ✅

| Feature | Status | Location |
|---------|--------|----------|
| Chat API Endpoint | ✅ | `/api/chat/route.ts` |
| Streaming Responses | ✅ | AI SDK `streamText()` |
| Tool Framework | ✅ | `/lib/ai/tools/` |
| RBAC Enforcement | ✅ | `validateAccess()` |
| Conversation History | ✅ | `/lib/ai/conversation.ts` |
| System Prompt | ✅ | `/lib/ai/prompts.ts` |

### 2.2 Available Tools

| Tool | Purpose | RBAC |
|------|---------|------|
| `getLeaveBalance` | Leave days by type | Self / Team / All |
| `getAttendance` | Attendance summary | Self / Team / All |
| `getSalary` | Salary breakdown | Self / Payroll / Admin |
| `getLoans` | Loan EMI details | Self / Payroll / Admin |
| `getTeamSummary` | Manager dashboard | Managers only |
| `searchPolicies` | Policy Q&A (RAG) | All (filtered by role) |

### 2.3 Pending Enhancements 📋

| Feature | Priority | Effort |
|---------|----------|--------|
| Switch to Claude API | High | 2h |
| Birthday/Anniversary queries | Medium | 1h |
| Pending approvals tool | Medium | 2h |
| Expense claim queries | Low | 1h |
| Voice input (Whisper) | Low | 4h |

---

## 3. Tool Definitions

### 3.1 Employee Data Tools

```typescript
// Leave Balance Tool
getLeaveBalance: {
  description: 'Get leave balance for current user or specified employee',
  parameters: {
    employeeId?: string,  // Managers only
    year?: number         // Defaults to current year
  },
  returns: {
    year: number,
    balances: [{ type, available, used, accrued }],
    pendingRequests: [{ type, days, from, to }]
  }
}

// Attendance Tool
getAttendance: {
  description: 'Get attendance summary for specified month',
  parameters: {
    employeeId?: string,
    month?: number,
    year?: number
  },
  returns: {
    summary: { present, absent, halfDay, onLeave, totalWorkHours },
    recentDays: [{ date, status, checkIn, checkOut }]
  }
}

// Salary Tool
getSalary: {
  description: 'Get salary details and deductions',
  parameters: {
    employeeId?: string,
    month?: number,
    year?: number
  },
  returns: {
    earnings: { basic, hra, gross, reimbursements },
    deductions: { pf, pt, tds, lop, loans },
    netSalary: string,
    lopDays: number
  }
}
```

### 3.2 Policy Search Tool (RAG)

```typescript
searchPolicies: {
  description: 'Search company policy documents',
  parameters: {
    query: string,       // Natural language query
    category?: string    // LEAVE, PAYROLL, ATTENDANCE, etc.
  },
  returns: {
    results: [{
      title: string,
      excerpt: string,
      score: number
    }]
  }
}
```

---

## 4. Security Model

### 4.1 RBAC Enforcement

Security is enforced in **tool code**, not AI prompts:

```typescript
async function validateAccess(context, targetEmployeeId) {
  // Context comes from verified JWT - AI cannot fake this
  const { userId, employeeId, role } = context;
  
  // EMPLOYEE: self only
  if (role === 'EMPLOYEE' && targetEmployeeId !== employeeId) {
    return { allowed: false, error: 'You can only view your own data' };
  }
  
  // HR_MANAGER: self + subordinates
  if (role === 'HR_MANAGER') {
    const isSubordinate = await checkSubordinate(employeeId, targetEmployeeId);
    if (!isSubordinate && targetEmployeeId !== employeeId) {
      return { allowed: false };
    }
  }
  
  // ADMIN/SUPER_ADMIN: all
  return { allowed: true };
}
```

### 4.2 Why This Is Secure

1. **Tool Context Injection**: User identity comes from verified session
2. **Server-Side Validation**: AI cannot bypass `validateAccess()`
3. **Fail-Closed**: Unknown roles are denied by default
4. **Audit Logging**: All tool calls recorded

---

## 5. Example Conversations

### 5.1 Employee Self-Service

```
User: What's my leave balance?
Assistant: [calls getLeaveBalance()]
         You have:
         - Casual Leave: 8 days available
         - Sick Leave: 5 days available
         - Earned Leave: 12 days available
         
         You have 1 pending request:
         - 2 days Casual Leave (05/02 - 06/02)

User: How much was my January salary?
Assistant: [calls getSalary(month=1, year=2026)]
         Your January 2026 salary breakdown:
         
         Earnings:
         - Basic: ₹50,000
         - HRA: ₹20,000
         - Gross: ₹75,000
         
         Deductions:
         - PF: ₹6,000
         - PT: ₹200
         - TDS: ₹5,500
         
         Net Salary: ₹63,300
```

### 5.2 Manager Queries

```
User: Show me team attendance for today
Assistant: [calls getTeamSummary()]
         Today's Team Status (5 members):
         - Present: 3
         - On Leave: 1
         - Not Marked: 1
         
         You have 2 pending leave requests to review.

User: What's our leave policy for sick leave?
Assistant: [calls searchPolicies(query="sick leave policy")]
         According to the Leave Policy document:
         
         Sick Leave entitlement:
         - 12 days per year
         - Medical certificate required for 3+ consecutive days
         - Cannot be carried forward
         - Pro-rated for new joiners
```

### 5.3 Access Denied

```
User: Show me Rahul's salary
Assistant: [calls getSalary(employeeId="rahul-id")]
         I'm sorry, but you don't have permission to view 
         other employees' salary information. You can only 
         access your own salary details.
         
         If you need this information for official purposes, 
         please contact HR admin.
```

---

## 6. MCP Integration Plan

### 6.1 Overview

MCP (Model Context Protocol) allows Claude to directly query databases with read-only access.

### 6.2 Why Not Using MCP (Current Decision)

| Factor | Custom Tools | MCP |
|--------|--------------|-----|
| RBAC Control | ✅ Full control | ⚠️ Need to filter at DB level |
| Query Safety | ✅ Predefined queries | ⚠️ AI writes SQL |
| Data Masking | ✅ Applied in tool | ⚠️ Raw data returned |
| Audit | ✅ Tool-level logging | ⚠️ Query-level only |
| Complexity | Higher | Lower |

**Decision**: Use custom tools for security; consider MCP for admin-only analytics.

### 6.3 Future MCP Use Cases

- Admin-only data exploration
- Report generation
- Anomaly detection queries

---

## 7. Deployment

### 7.1 Environment Variables

```env
# AI Provider
ANTHROPIC_API_KEY=sk-ant-...        # For Claude API
# OR
OLLAMA_BASE_URL=http://localhost:11434  # For local Ollama

# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=...
NEXTAUTH_URL=https://shreehr.vercel.app
```

### 7.2 Model Configuration

```typescript
// src/lib/ai/ollama-client.ts (current)
import { ollama } from 'ollama-ai-provider';
export const chatModel = ollama('llama3.2');

// Future: Claude API
import { anthropic } from '@ai-sdk/anthropic';
export const chatModel = anthropic('claude-3-5-sonnet-20241022');
```

---

## 8. Future Roadmap

### Phase 1: Core (✅ Complete)
- Chat interface
- Leave/Attendance/Salary queries
- RBAC enforcement
- Conversation history

### Phase 2: Enhanced Queries (In Progress)
- Birthday/Anniversary reminders
- Pending approvals summary
- Expense claims integration
- Holiday calendar queries

### Phase 3: Actions (Planned)
- Apply for leave via chat
- Submit expense claims
- Request attendance correction
- Approval actions for managers

### Phase 4: Advanced (Future)
- Voice input/output
- Slack/Teams integration
- Proactive notifications
- Analytics and insights

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | AI Agent | Initial architecture plan |
