# ShreeHR AI Assistant Documentation

## Quick Start

### Test Accounts

Login at https://shreehr.vercel.app with any of these accounts:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `vijay.sharma@shreehr.local` | `Test@123` | SUPER_ADMIN | Full access |
| `priya.reddy@shreehr.local` | `Test@123` | ADMIN | HR management |
| `amit.patel@shreehr.local` | `Test@123` | HR_MANAGER | Team management |
| `sunita.nair@shreehr.local` | `Test@123` | PAYROLL_MANAGER | Payroll access |
| `rahul.kumar@shreehr.local` | `Test@123` | EMPLOYEE | Self-service only |

### AI Chat Access

1. Login as any employee
2. Navigate to **Employee Portal → AI Chat** (`/employee/chat`)
3. Start asking HR questions!

---

## Try These Queries

### As an Employee (rahul.kumar@shreehr.local)

```
"What's my leave balance?"
"Show my January salary breakdown"
"What's the sick leave policy?"
"How do I apply for earned leave?"
"What are my upcoming EMI deductions?"
```

### As a Manager (amit.patel@shreehr.local)

```
"Show me pending leave requests"
"Who has a birthday this week?"
"What's the team attendance today?"
"How many employees are in Engineering?"
"Show work anniversaries this month"
```

### As Admin (priya.reddy@shreehr.local)

```
"Generate payroll summary"
"Show all pending approvals"
"What's our headcount by department?"
"Show me the PF contribution rules"
```

---

## Architecture

See [AI-AGENT-PLAN.md](./AI-AGENT-PLAN.md) for full technical details.

### Key Files

| File | Purpose |
|------|---------|
| `/api/chat/route.ts` | Main chat API endpoint |
| `/lib/ai/tools/index.ts` | Tool definitions |
| `/lib/ai/tools/employee-data.ts` | Core HR data tools |
| `/lib/ai/tools/hr-queries.ts` | Birthday, anniversaries, approvals |
| `/lib/ai/prompts.ts` | System prompt |
| `/lib/ai/conversation.ts` | Message history |

### Available Tools

| Tool | Description | Who Can Use |
|------|-------------|-------------|
| `getLeaveBalance` | Leave days by type | All |
| `getAttendance` | Attendance summary | All |
| `getSalary` | Salary breakdown | All |
| `getLoans` | Loan EMI info | All |
| `getTeamSummary` | Team status | Managers |
| `getBirthdays` | Birthdays this week | Managers |
| `getAnniversaries` | Work anniversaries | Managers |
| `getPendingApprovals` | All pending items | Managers |
| `getOrganisationStats` | Headcount stats | Managers |
| `searchPolicies` | Policy Q&A (RAG) | All |

---

## Security

See [SECURITY-POLICY.md](./SECURITY-POLICY.md) for complete details.

### Key Principles

1. **Context Injection**: User identity from verified JWT, not AI prompts
2. **RBAC in Tools**: `validateAccess()` called on every tool execution
3. **Fail-Closed**: Unknown roles denied by default
4. **Audit Trail**: All tool calls logged

---

## Configuration

### AI Provider (Claude vs Ollama)

Edit `.env`:

```bash
# Use Claude API (recommended for production)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here

# OR use local Ollama (for development)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/api
OLLAMA_MODEL=llama3.2:3b
```

---

## Database Scripts

```bash
# Seed test employees
pnpm db:seed-test

# Seed policy documents
pnpm db:seed-policies

# Push schema to database
pnpm db:push
```

---

## Next Steps

1. **Switch to Claude API**: Set `ANTHROPIC_API_KEY` for better responses
2. **Add voice input**: Integrate Whisper for speech-to-text
3. **Actions**: Enable "apply leave" and "submit expense" via chat
4. **Slack/Teams**: Bot integration for instant access
