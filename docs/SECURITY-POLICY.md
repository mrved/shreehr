# ShreeHR Security Policy

## Overview

This document outlines the security controls for the ShreeHR AI Assistant and overall HRMS system. Security is enforced at the application layer, not through AI prompts.

---

## 1. Role-Based Access Control (RBAC)

### 1.1 User Roles

| Role | Description | Level |
|------|-------------|-------|
| **SUPER_ADMIN** | Full system access, configuration, audit logs | 5 |
| **ADMIN** | HR management, employee records, payroll oversight | 4 |
| **HR_MANAGER** | Leave/attendance approvals, employee onboarding | 3 |
| **PAYROLL_MANAGER** | Payroll processing, salary structures, statutory compliance | 3 |
| **EMPLOYEE** | Self-service only | 1 |

### 1.2 Access Control Matrix

#### Employee Data Access

| Data Type | EMPLOYEE | HR_MANAGER | PAYROLL_MANAGER | ADMIN | SUPER_ADMIN |
|-----------|----------|------------|-----------------|-------|-------------|
| Own Profile | ✅ Read | ✅ Read | ✅ Read | ✅ Read/Write | ✅ Full |
| Own Leave Balance | ✅ Read | ✅ Read | ✅ Read | ✅ Full | ✅ Full |
| Own Salary | ✅ Read | ❌ | ✅ Read | ✅ Full | ✅ Full |
| Own Attendance | ✅ Read | ✅ Read | ✅ Read | ✅ Full | ✅ Full |
| Own Loans | ✅ Read | ❌ | ✅ Read | ✅ Full | ✅ Full |
| Team Data | ❌ | ✅ Subordinates | ❌ | ✅ All | ✅ All |
| All Employees | ❌ | ❌ | ✅ Payroll Only | ✅ All | ✅ All |

#### Action Permissions

| Action | EMPLOYEE | HR_MANAGER | PAYROLL_MANAGER | ADMIN | SUPER_ADMIN |
|--------|----------|------------|-----------------|-------|-------------|
| Apply Leave | ✅ Own | ✅ Own | ✅ Own | ✅ Any | ✅ Any |
| Approve Leave | ❌ | ✅ Team | ❌ | ✅ All | ✅ All |
| View Payslip | ✅ Own | ❌ | ✅ Any | ✅ Any | ✅ Any |
| Run Payroll | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create Employee | ❌ | ✅ | ❌ | ✅ | ✅ |
| Modify Salary | ❌ | ❌ | ✅ | ✅ | ✅ |
| System Config | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ✅ Read | ✅ Full |

---

## 2. AI Assistant Security

### 2.1 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                              │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           NextAuth Session Validation                │    │
│  │  - JWT verification                                  │    │
│  │  - User ID, Role extraction                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Tool Context Injection                     │    │
│  │  - userId: from verified session                    │    │
│  │  - employeeId: from DB lookup                       │    │
│  │  - role: from verified session                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Claude AI (Tool Calling)                   │    │
│  │  - Decides which tools to call                      │    │
│  │  - Cannot bypass RBAC (enforced in tool code)       │    │
│  └─────────────────────────────────────────────────────┘    │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Tool Execution (RBAC Enforced)            │    │
│  │  - validateAccess() called EVERY tool execution     │    │
│  │  - Returns error if unauthorized                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Response to User                          │    │
│  │  - Only authorized data returned                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Key Security Principles

1. **Context Injection, Not Prompts**
   - User identity comes from verified JWT session
   - AI cannot override or fake user context
   - Tool context is injected by server code

2. **RBAC in Tool Code**
   - `validateAccess()` function enforces permissions
   - Called at the START of every tool execution
   - Returns error message if access denied

3. **No PII in Prompts**
   - System prompt contains no user data
   - All data fetched through validated tool calls

4. **Audit Trail**
   - All tool calls logged with parameters and results
   - Stored in `messages.tool_calls` JSON field

### 2.3 Tool Security Implementation

```typescript
// Example: How tools enforce RBAC
async function validateAccess(context, targetEmployeeId) {
  // EMPLOYEE role: can only see own data
  if (context.role === 'EMPLOYEE') {
    if (targetEmployeeId !== context.employeeId) {
      return { allowed: false, error: 'You can only view your own data' };
    }
  }
  
  // HR_MANAGER: can see subordinates
  if (context.role === 'HR_MANAGER') {
    const isSubordinate = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, reporting_manager_id: context.employeeId }
    });
    if (!isSubordinate && targetEmployeeId !== context.employeeId) {
      return { allowed: false, error: 'Access denied' };
    }
  }
  
  // ADMIN/SUPER_ADMIN: can see all
  return { allowed: true };
}
```

---

## 3. Data Privacy (PII Protection)

### 3.1 Sensitive Data Categories

| Category | Fields | Storage | Access |
|----------|--------|---------|--------|
| **PII - Critical** | Aadhaar, PAN, Bank Account | Encrypted (AES-256) | Admin+ only |
| **PII - Sensitive** | Salary, DOB, Address | Plaintext | Role-based |
| **PII - Contact** | Phone, Email | Plaintext | Role-based |
| **Non-PII** | Name, Department, Designation | Plaintext | All authenticated |

### 3.2 PII Masking Rules

When displaying data to users:

| Field | EMPLOYEE (Own) | MANAGER | ADMIN |
|-------|----------------|---------|-------|
| Aadhaar | `XXXX-XXXX-1234` | `XXXX-XXXX-XXXX` | Full (on request) |
| PAN | `XXXXX1234X` | Hidden | Full (on request) |
| Bank Account | `XXXXXXXX5678` | Hidden | Full (on request) |
| Salary | Full | Hidden | Full |
| Phone | Full | Full | Full |

### 3.3 AI Assistant PII Handling

The AI Assistant:
- ❌ Cannot access encrypted PII fields (Aadhaar, PAN, Bank)
- ✅ Can access salary data for authorized users
- ✅ Masks sensitive data in responses when appropriate
- ❌ Never includes PII in conversation titles/summaries

---

## 4. Audit Logging

### 4.1 What Gets Logged

| Event Type | Logged Data | Retention |
|------------|-------------|-----------|
| Login/Logout | User ID, IP, Timestamp, Success/Fail | 1 year |
| Data Access | Who, What, When, Result | 3 years |
| Data Modification | Who, What, Old/New values, When | 7 years |
| AI Conversations | User ID, Messages, Tool Calls | 1 year |
| Payroll Actions | Full audit trail | 8 years |

### 4.2 Audit Table Schema

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  user_id     String
  action      String   // READ, CREATE, UPDATE, DELETE
  entity_type String   // Employee, Salary, Leave, etc.
  entity_id   String?
  old_values  Json?
  new_values  Json?
  ip_address  String?
  user_agent  String?
}
```

### 4.3 AI Tool Call Logging

Every AI tool execution is logged:

```json
{
  "tool_calls": [
    {
      "name": "getLeaveBalance",
      "args": { "year": 2026 },
      "result": { "balances": [...] },
      "timestamp": "2026-02-04T12:00:00Z"
    }
  ]
}
```

---

## 5. API Security

### 5.1 Authentication

- All API routes require valid NextAuth session
- JWT tokens with 24-hour expiry
- Refresh tokens for extended sessions

### 5.2 Authorization Checks

Every API endpoint must:
1. Verify session exists
2. Check user role permissions
3. Validate resource ownership (for employee-specific data)

```typescript
// Standard pattern for API routes
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Role check
  if (!['ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Resource ownership check for employee data
  const employeeId = req.params.id;
  const hasAccess = await checkEmployeeAccess(session.user, employeeId);
  if (!hasAccess) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }
}
```

---

## 6. Data Retention

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Employee Records | 8 years after leaving | Labour law compliance |
| Salary Records | 8 years | Tax/PF regulations |
| Attendance | 3 years | Internal policy |
| Leave Records | 3 years | Internal policy |
| Documents | 8 years | Statutory requirement |
| Audit Logs | 7 years | Compliance |
| AI Conversations | 1 year | Operational |

---

## 7. Incident Response

### 7.1 Security Incident Categories

| Severity | Example | Response Time |
|----------|---------|---------------|
| Critical | Data breach, unauthorized PII access | Immediate |
| High | Failed auth attempts, privilege escalation | 4 hours |
| Medium | Policy violations, unusual access patterns | 24 hours |
| Low | Minor config issues | 1 week |

### 7.2 Response Procedure

1. **Detect**: Automated alerts or manual report
2. **Contain**: Disable affected accounts/systems
3. **Investigate**: Review audit logs
4. **Remediate**: Fix vulnerability
5. **Report**: Notify stakeholders (and regulators if required)

---

## 8. Compliance

### 8.1 Applicable Regulations

- **IT Act 2000** (India): Data protection
- **PF Act**: Statutory deductions and records
- **ESI Act**: Statutory deductions and records
- **Income Tax Act**: TDS compliance, Form 16

### 8.2 Compliance Checklist

- [ ] Encrypted storage for PII
- [ ] Role-based access control
- [ ] Audit logging enabled
- [ ] Data retention policies implemented
- [ ] Secure authentication (bcrypt, JWT)
- [ ] HTTPS enforced
- [ ] Regular security reviews

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | AI Agent | Initial version |
