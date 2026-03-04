---
phase: 14
slug: admin-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | Announcements schema | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | Polls schema | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | Announcement CRUD API | integration | `pnpm test` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | Poll CRUD API | integration | `pnpm test` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 2 | Birthday/anniversary query | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 14-03-02 | 03 | 2 | Pending actions aggregation | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 14-04-01 | 04 | 3 | Dashboard UI rendering | manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for announcement and poll APIs
- [ ] Test stubs for birthday/anniversary queries
- [ ] Test stubs for pending actions aggregation

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard layout | Summary-only view, max 5 actions | Visual/UX check | Open dashboard, verify no PII visible, count action buttons |
| Org-wide email | Announcement triggers email to all | External service | Post announcement, verify Resend queue |
| Poll instant results | Results update after voting | Real-time UI | Create poll, cast vote, verify results update |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
