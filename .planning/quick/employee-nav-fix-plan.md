# Employee Navigation Fix - GSD Quick Plan

**Created:** 2026-02-07 11:21 IST  
**Type:** Quick Fix (role-based navigation)  
**Issue:** Employee role only sees Dashboard in sidebar

---

## 1. PLAN

### Problem
In `src/components/layout/sidebar.tsx`, the navigation items filter by role. Currently:
- Dashboard: includes "EMPLOYEE" ✅
- All other items: exclude "EMPLOYEE" ❌

Result: Employees only see Dashboard in sidebar.

### Solution
Add "EMPLOYEE" role to appropriate navigation items that employees should access.

### Proposed Employee Access

**What employees should typically access:**
- ✅ Dashboard (already has access)
- 📅 Leave - View/request own leave
- ⏰ Attendance - View own attendance records  
- 💰 Payroll - View own payslips
- 🧾 Expenses - Submit/view own expenses
- 📄 Documents - View own documents
- 💬 AI Chat - Access HR assistant (maybe?)

**What employees should NOT access:**
- ❌ Employees management (admin only)
- ❌ Departments (admin only)
- ❌ Approvals (manager/admin only)
- ❌ Onboarding (HR only)
- ❌ Import Data (admin only)
- ❌ Settings (admin only)
- ❌ Loans (needs discussion - sensitive)

### Files to Modify
- `src/components/layout/sidebar.tsx` - Add "EMPLOYEE" to roles array

---

## 2. VERIFY

**Questions for Ved:**

Which sections should employees access?

1. **Leave** - Request and view own leave? (Recommended: YES)
2. **Attendance** - View own attendance? (Recommended: YES)
3. **Payroll** - View own payslips? (Recommended: YES)
4. **Expenses** - Submit own expenses? (Recommended: YES)
5. **Loans** - View/request loans? (Recommended: MAYBE - discuss)
6. **Documents** - View own documents? (Recommended: YES)
7. **AI Chat** - Access HR chatbot? (Recommended: MAYBE)

---

## 3. EXECUTE (after approval)

1. Update sidebar.tsx
2. Add "EMPLOYEE" to approved roles arrays
3. Test with employee login
4. Commit changes

---

**Status:** ⏸️ AWAITING VERIFICATION (Ved's input on which sections)
