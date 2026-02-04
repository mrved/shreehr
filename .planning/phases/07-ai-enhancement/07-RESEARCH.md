# Phase 7: AI Enhancement - Research

## Phase Context

**Why:** Phase 6 delivered a working AI assistant with Ollama. Now we need:
1. Better model (Claude API instead of llama3.2:3b)
2. Test data for different roles
3. Security policy documentation
4. PostgreSQL MCP for advanced analytics (SUPER_ADMIN only)

**Depends on:** Phase 6 (AI Assistant) - COMPLETE

## Current State Analysis

### Existing AI Infrastructure
- **Model:** Ollama with llama3.2:3b (local)
- **Framework:** AI SDK v6 with streaming
- **Tools:** 6 working tools
  - `getLeaveBalance` - Employee leave data
  - `getAttendance` - Attendance records
  - `getSalaryInfo` - Salary structure
  - `getLoanInfo` - Loan details
  - `getTeamSummary` - Manager team view
  - `searchPolicies` - Policy Q&A via RAG

### Auth & RBAC
- NextAuth v5 with JWT
- Role in token: EMPLOYEE, HR_MANAGER, PAYROLL_MANAGER, ADMIN, SUPER_ADMIN
- Tools enforce RBAC at code level (secure)

### Research Findings (from shreehr-gsd-research agent)

**MCP Assessment:**
- MCP exposes raw SQL to AI - security risk for regular users
- No user context injection possible
- Recommended: Use only for SUPER_ADMIN analytics queries
- Keep custom tools for normal users

**Claude Integration:**
- Replace Ollama with Claude API (anthropic package)
- Better reasoning, faster responses
- Cost: ~$0.01-0.05 per conversation

**Test Data Needs:**
- 5 employees with different roles
- Realistic Indian names, departments, salaries
- Leave balances, attendance history

**Security Policy:**
- RBAC matrix documentation
- PII fields: PAN, Aadhaar, bank details
- Audit logging for tool executions

## Open Questions

1. **Budget for Claude API?** (affects model choice)
2. **MCP scope?** (SUPER_ADMIN only recommended)
3. **Compliance requirements?** (audit log retention)
4. **Priority:** Test data vs Claude integration vs security docs?

## Recommendation

**Phase 7 should be split into quick tasks:**
- 07-01: Test data seeding (5 employees)
- 07-02: Security policy documentation
- 07-03: Claude API integration
- 07-04: MCP for SUPER_ADMIN (optional)

Awaiting Ved's approval to proceed with planning.
