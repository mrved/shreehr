# ShreeHR Navigation & AI Chat Fix - GSD Plan

**Created:** 2026-02-07 12:59 IST  
**Type:** Bug Fix  
**Method:** Get Shit Done (GSD)

---

## 🎯 PROBLEMS TO SOLVE

### 1. Employee Navigation Not Working
- **Symptom:** Employee users still can't see self-service navigation items
- **Previous Fix:** Commit d4acd1d added "EMPLOYEE" role to navigation items
- **Current State:** Ved reports it's still not working

### 2. AI Chat Issue
- **Symptom:** Unknown - needs investigation
- **Location:** /dashboard/chat route

---

## 🔍 INVESTIGATION PLAN

### Navigation Issue Analysis

1. **Code Review** ✅ DONE
   - sidebar.tsx: EMPLOYEE role is correctly added
   - layout.tsx: Role is properly passed
   - middleware.ts: No blocking

2. **Possible Causes:**
   - [ ] Vercel deployment not updated
   - [ ] Browser/CDN caching
   - [ ] User role in database is not "EMPLOYEE"
   - [ ] Session/auth not refreshing after role update
   - [ ] Next.js static generation caching

3. **Investigation Steps:**
   ```bash
   # Check deployment status
   vercel ls

   # Check user roles in database
   SELECT id, email, role FROM users WHERE email LIKE '%employee%' OR role = 'EMPLOYEE';
   ```

### AI Chat Issue Analysis

1. **Check Implementation:**
   - [ ] Review chat component code
   - [ ] Check API endpoints
   - [ ] Review error logs
   - [ ] Test functionality

2. **Common Chat Issues:**
   - API key/configuration
   - CORS/auth issues
   - WebSocket connection
   - Message formatting

---

## 🛠️ FIX PLAN

### Phase 1: Diagnose Navigation (15 min)

1. **Check Vercel Deployment**
   ```bash
   # Check if latest commit is deployed
   vercel ls
   vercel inspect <deployment-url>
   ```

2. **Database Check**
   - Connect to Neon PostgreSQL
   - Verify employee user roles
   - Check session data

3. **Cache Clear Strategy**
   - Force cache invalidation in Vercel
   - Update vercel.json with cache headers
   - Add cache-busting to navigation components

### Phase 2: Fix Navigation (30 min)

**Option A: If deployment issue**
```bash
# Force redeploy
vercel --prod --force

# Or trigger from GitHub
git commit --allow-empty -m "fix: force redeploy for navigation cache"
git push
```

**Option B: If caching issue**
```typescript
// Add to src/components/layout/sidebar.tsx
export const revalidate = 0; // Force dynamic

// Or add cache key to force refresh
const cacheKey = Date.now(); // temporary for testing
```

**Option C: If role/auth issue**
```typescript
// Add debug logging to dashboard-shell.tsx
console.log('User role in Sidebar:', user.role);

// Force session refresh
import { revalidatePath } from 'next/cache';
revalidatePath('/dashboard');
```

### Phase 3: Investigate AI Chat (20 min)

1. **Locate Chat Components**
   ```bash
   # Find chat files
   find . -name "*chat*" -type f | grep -v node_modules
   ```

2. **Test Chat Functionality**
   - Login as admin
   - Navigate to /dashboard/chat
   - Document any errors
   - Check browser console
   - Check network tab

3. **Review Implementation**
   - Check chat UI component
   - Review API routes
   - Verify AI service integration

### Phase 4: Fix AI Chat (30 min)

Based on findings, likely fixes:

**Common Fix 1: API Configuration**
```typescript
// Check .env for AI keys
OPENAI_API_KEY=...
// or
ANTHROPIC_API_KEY=...
```

**Common Fix 2: CORS/Auth**
```typescript
// In API route
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

**Common Fix 3: Stream Handling**
```typescript
// Fix streaming response
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  },
});
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Navigation Fix
- [ ] Verify current deployment status
- [ ] Check employee user roles in DB
- [ ] Test with fresh employee account
- [ ] Clear all caches (Vercel, browser, Next.js)
- [ ] Add debug logging if needed
- [ ] Force redeploy if necessary
- [ ] Test on multiple browsers
- [ ] Verify mobile navigation

### AI Chat Fix
- [ ] Locate chat implementation
- [ ] Test current functionality
- [ ] Check browser console errors
- [ ] Review API endpoints
- [ ] Fix identified issues
- [ ] Test chat messages
- [ ] Verify streaming works
- [ ] Test error handling

### Deployment & Verification
- [ ] Commit fixes with clear messages
- [ ] Push to GitHub
- [ ] Monitor Vercel deployment
- [ ] Clear CDN cache if needed
- [ ] Test as admin user
- [ ] Test as employee user
- [ ] Test on mobile
- [ ] Document fix for future

---

## 🚀 QUICK WINS

If stuck, try these immediately:

1. **Force Clean Deploy**
   ```bash
   vercel --prod --force --no-cache
   ```

2. **Add Version Tag**
   ```typescript
   // In sidebar.tsx
   const VERSION = "v2.0"; // Force cache bust
   ```

3. **Session Refresh**
   ```typescript
   // Add logout/login helper
   await signOut({ redirect: true });
   ```

---

## 📊 SUCCESS METRICS

1. **Navigation:** Employee can see all self-service items
2. **AI Chat:** Can send messages and receive responses
3. **Performance:** No visible delays or errors
4. **Mobile:** Both features work on mobile

---

## 🔄 ROLLBACK PLAN

If fixes break something:
```bash
git revert HEAD
git push
# Vercel auto-deploys previous version
```

---

**Status:** 📝 READY TO EXECUTE