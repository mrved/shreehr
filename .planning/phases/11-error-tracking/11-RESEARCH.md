# Phase 11: Error Tracking Research

## Current State Analysis

**Error Handling Today:**
- Errors caught in try/catch blocks within API routes
- Logged via `console.error()` (only visible in Vercel logs)
- Returns generic 500 responses to client
- No client-side error boundaries exist
- No proactive notification - Ved must check Vercel dashboard manually

**Problems:**
1. Errors go unnoticed until users complain
2. No alerting for critical failures (AI chat, payroll, auth)
3. No error aggregation or deduplication
4. Console logs get lost in Vercel's log retention

---

## Option Analysis

### Option A: Sentry (Full-Featured)

**Pros:**
- Industry standard, battle-tested
- Automatic source map upload
- Issue grouping and deduplication built-in
- Excellent Next.js integration (`@sentry/nextjs`)
- Free tier: 5K errors/month, 1 user

**Cons:**
- Another external service to manage
- SDK adds ~40KB to client bundle
- Free tier limitations may hit quickly
- Overkill for a small team app
- Still need webhook → WhatsApp integration

**Cost:** Free (5K errors/month) or $29/month for 50K

**WhatsApp Integration:** Sentry → Webhook → Custom endpoint → OpenClaw message

### Option B: Vercel's Built-in Monitoring

**Pros:**
- Already deployed on Vercel
- Zero additional setup
- Logs available in dashboard
- Speed Insights included

**Cons:**
- No real-time alerting to WhatsApp
- Requires manual dashboard checking
- Limited error aggregation
- Can't filter by error type easily
- Pro plan ($20/month) needed for better retention

**WhatsApp Integration:** Not directly possible - no webhook support

### Option C: Custom Error Boundary + Webhook (Simple)

**Pros:**
- Zero dependencies
- Complete control over what gets captured
- Direct WhatsApp notification via OpenClaw
- No external services to manage
- Free forever

**Cons:**
- Must build everything ourselves
- Need to implement deduplication
- No fancy UI for browsing errors
- Manual rate limiting implementation

**WhatsApp Integration:** Direct - capture error → call webhook → OpenClaw sends message

### Option D: Hybrid (Custom + Log to DB)

**Pros:**
- Errors stored in existing PostgreSQL
- Can query/analyze errors later
- Batch notifications possible
- Full audit trail
- Still zero external services

**Cons:**
- Slight DB storage cost (minimal)
- Need to build simple admin UI eventually
- More code than Option C

**WhatsApp Integration:** Direct - same as Option C, plus DB storage

---

## Recommendation: Option D (Hybrid Custom)

**Why:**
1. **Simplicity** - No new external dependencies
2. **Cost** - $0 (uses existing DB)
3. **Control** - Customize exactly what triggers alerts
4. **WhatsApp** - Direct integration with OpenClaw already in place
5. **Audit** - Errors stored for later analysis

---

## What to Capture

| Error Type | Priority | Notification |
|------------|----------|--------------|
| AI Chat failures | HIGH | Immediate |
| Auth/Login failures | HIGH | Immediate |
| Payroll calculation errors | HIGH | Immediate |
| Unhandled API exceptions | MEDIUM | Batched (hourly) |
| Client-side React errors | MEDIUM | Batched (hourly) |
| 4xx Client errors | LOW | Daily summary |
| Validation errors | NONE | Log only |

---

## WhatsApp Notification Approach

**Architecture:**
```
Error Occurs → Log to DB → Check Rate Limit → Send to OpenClaw Webhook
```

**Webhook Endpoint:**
- Already have OpenClaw running
- Can use `message` tool action to send to Ved
- Simple POST with error details

**Rate Limiting Strategy:**
1. **Per-error dedup:** Same error fingerprint → notify once per hour
2. **Global throttle:** Max 10 messages per hour
3. **Quiet hours:** No alerts 23:00-08:00 unless CRITICAL
4. **Escalation:** If >20 errors in 10 min → single "Multiple errors" alert

---

## Error Fingerprinting

Generate unique fingerprint from:
- Error message (normalized - strip dynamic values)
- File/function where it occurred
- HTTP method + route (for API errors)

Example fingerprint: `sha256("POST:/api/chat|AI model timeout")`

---

## Existing Integration Points

**API Routes:** Wrap in try/catch → log to ErrorLog table
**React Client:** Add `global-error.tsx` and component error boundaries
**AI Chat:** Already has error handling - just need to log to DB
**Middleware:** Can catch auth failures centrally

---

## DB Schema (Draft)

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY,
  fingerprint VARCHAR(64) NOT NULL,
  error_type VARCHAR(50) NOT NULL, -- 'API', 'CLIENT', 'AI_CHAT', 'AUTH'
  severity VARCHAR(20) NOT NULL,   -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  message TEXT NOT NULL,
  stack TEXT,
  route VARCHAR(255),
  user_id VARCHAR(50),
  metadata JSONB,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_fingerprint ON error_logs(fingerprint);
CREATE INDEX idx_error_created ON error_logs(created_at);
```

---

## External Services Evaluated

| Service | Free Tier | WhatsApp Support | Verdict |
|---------|-----------|------------------|---------|
| Sentry | 5K/month | Via webhook | Overkill |
| LogRocket | 1K sessions | No | Wrong tool |
| Bugsnag | 7.5K events | Via webhook | Expensive for more |
| Rollbar | 5K events | Via webhook | Similar to Sentry |
| Custom | Unlimited | Direct | **Winner** |

---

## Conclusion

Build a lightweight custom solution:
1. Error logging to PostgreSQL
2. Smart deduplication via fingerprinting
3. Direct WhatsApp notifications via OpenClaw webhook
4. Rate limiting to prevent spam
5. Simple severity-based routing

**Estimated effort:** 4-6 hours total
**External dependencies:** None (OpenClaw already available)
**Ongoing cost:** $0
