# 🧪 ShreeHR Testing Checklist

**IMPORTANT**: No feature is "DONE" until ALL tests pass!

## 🚀 Quick Test Commands

```bash
# Before claiming any fix is done, RUN THESE:
pnpm test:e2e              # Run all E2E tests
pnpm test:e2e:ui           # Debug with UI (recommended)
pnpm test:e2e navigation   # Test specific feature
```

## ✅ Pre-Push Checklist

Before pushing any changes:

### 1. Navigation/Menu Changes
- [ ] Run: `pnpm test:e2e navigation-visibility`
- [ ] Verify all 3 roles tested (admin, employee, HR)
- [ ] Check both desktop and mobile views
- [ ] Screenshot the passed tests

### 2. AI Chat Changes
- [ ] Run: `pnpm test:e2e ai-chat`
- [ ] Test message sending works
- [ ] Test for all user roles
- [ ] Verify error handling

### 3. Authentication Changes
- [ ] Test login for all roles
- [ ] Test logout functionality
- [ ] Test session persistence
- [ ] Test invalid credentials

### 4. Any Bug Fix
- [ ] Write a test that reproduces the bug
- [ ] Fix the bug
- [ ] Verify test now passes
- [ ] Run full test suite to check for regressions

## 🎯 Test Evidence

For EVERY fix, provide:
1. **Screenshot** of passing tests
2. **Test output** showing what was verified
3. **Brief explanation** of what the test covers

## 🔥 Common Test Failures & Fixes

### "Element not found"
```bash
# Debug with UI mode
pnpm test:e2e:ui

# Check if element has different selector
# Add data-testid to make it testable
```

### "Timeout waiting for selector"
```bash
# App might be slow, increase timeout
# Or element might be behind authentication
# Check if test user has permission
```

### "Test worked locally but fails in CI"
```bash
# Check for:
- Hardcoded URLs (use BASE_URL env)
- Missing test data (run seed scripts)
- Browser differences (test all browsers)
```

## 📊 Test Coverage Goals

- **Navigation**: 100% - Every menu item for every role
- **Critical Paths**: 100% - Login, core features
- **Bug Fixes**: 100% - Every bug needs a regression test
- **New Features**: 80%+ - Main flows + edge cases

## 🚨 Red Flags

If you find yourself:
- Commenting out tests ❌
- Using test.skip() ❌
- Saying "works on my machine" ❌
- Not running tests before pushing ❌

**STOP!** Fix the tests properly.

## 💡 Pro Tips

1. **Run tests BEFORE starting work** - Know baseline
2. **Run tests AFTER each change** - Catch breaks early
3. **Use test:e2e:ui for debugging** - See what's happening
4. **Write tests WHILE fixing** - Not after
5. **Small commits** - Easy to find what broke tests

## 📝 Test Documentation

- Full guide: `docs/testing-guide.md`
- Test structure: `testing-framework-plan.md`
- Page objects: `e2e/pages/`
- Test fixtures: `e2e/fixtures/`

## 🎉 Success Metrics

You know you're doing it right when:
- ✅ All tests pass before marking "done"
- ✅ New bugs get regression tests
- ✅ Tests run in < 10 minutes
- ✅ No flaky tests
- ✅ Clear test failure messages

---

**Remember**: Untested code is broken code! 🐛➡️✅