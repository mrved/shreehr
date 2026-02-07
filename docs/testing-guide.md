# Testing Guide for ShreeHR

This guide covers how to run and maintain automated tests for the ShreeHR application.

## Table of Contents
- [Overview](#overview)
- [Test Types](#test-types)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

ShreeHR uses a comprehensive testing strategy with:
- **Unit Tests** (Vitest) - Fast, isolated component/function tests
- **E2E Tests** (Playwright) - Full user workflow tests across browsers

## Test Types

### Unit Tests (Vitest)
- Location: Throughout the codebase as `*.test.ts` or `*.spec.ts` files
- Purpose: Test individual components, hooks, and utilities
- Speed: Very fast (< 2 minutes)

### E2E Tests (Playwright)
- Location: `/e2e` directory
- Purpose: Test complete user workflows and navigation
- Speed: Slower but comprehensive (5-10 minutes)

## Setup

### Prerequisites
1. Install dependencies:
```bash
pnpm install
```

2. Set up test database:
```bash
# Copy .env.example to .env.test if not exists
cp .env.example .env.test

# Update DATABASE_URL in .env.test to point to test database
```

3. Seed test users:
```bash
# For general test data
pnpm db:seed-test

# For E2E specific users
pnpm tsx e2e/setup/seed-e2e-users.ts
```

## Running Tests

### Quick Commands

```bash
# Run all tests
pnpm test:all

# Unit tests only
pnpm test

# E2E tests only
pnpm test:e2e

# E2E tests with UI mode (recommended for debugging)
pnpm test:e2e:ui

# E2E tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug specific E2E test
pnpm test:e2e:debug navigation-visibility
```

### Before Running E2E Tests

1. **Ensure the app is running:**
```bash
pnpm dev
```

2. **Or let Playwright start it automatically** (configured in playwright.config.ts)

3. **Verify test users exist:**
```bash
pnpm tsx e2e/setup/seed-e2e-users.ts
```

### Test Credentials

E2E tests use these accounts:
- **Admin**: admin@test.com / TestAdmin123!
- **Employee**: employee@test.com / TestEmployee123!
- **HR**: hr@test.com / TestHR123!

## Writing Tests

### E2E Test Structure

```typescript
import { test, expect } from './fixtures/base';

test.describe('Feature Name', () => {
  // Use specific role
  test.use({ userRole: 'employee' });

  test('should do something', async ({ navigationPage, page }) => {
    // Your test here
  });
});
```

### Page Objects

Located in `/e2e/pages/`, page objects encapsulate UI interactions:

```typescript
// navigation.page.ts
export class NavigationPage {
  async isNavigationItemVisible(itemText: string): Promise<boolean> {
    // Implementation
  }
}
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Keep tests independent** - each test should run in isolation
3. **Use meaningful assertions** with clear error messages
4. **Test user workflows** not implementation details
5. **Clean up after tests** if they modify data

## Testing Checklist

Before marking any feature as "done", ensure:

### ✅ Navigation Changes
- [ ] All user roles tested (admin, employee, HR)
- [ ] Menu items visible for correct roles
- [ ] Menu items hidden for unauthorized roles
- [ ] Navigation works on mobile viewport

### ✅ New Features
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Loading states tested
- [ ] Form validations tested
- [ ] API error handling tested

### ✅ Bug Fixes
- [ ] Regression test written
- [ ] Original issue resolved
- [ ] No new issues introduced
- [ ] Related features still work

### ✅ Before Deployment
- [ ] All tests passing locally
- [ ] No `test.only` or `test.skip` left in code
- [ ] Test coverage adequate
- [ ] Performance acceptable

## CI/CD Integration

### GitHub Actions Setup

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - run: pnpm install
      
      - name: Setup test database
        run: |
          pnpm db:push
          pnpm tsx e2e/setup/seed-e2e-users.ts
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/shreehr_test
          
      - name: Run unit tests
        run: pnpm test
        
      - name: Install Playwright browsers
        run: pnpm playwright install --with-deps
        
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/shreehr_test
          
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Troubleshooting

### Common Issues

1. **"No element matching selector"**
   - Check if the app is running
   - Verify test user has permission
   - Use `pnpm test:e2e:ui` to debug selectors

2. **"Timeout waiting for navigation"**
   - Increase timeout in playwright.config.ts
   - Check if app is slow to respond
   - Verify DATABASE_URL is correct

3. **"Test user not found"**
   - Run seed script: `pnpm tsx e2e/setup/seed-e2e-users.ts`
   - Check database connection
   - Verify .env configuration

4. **Flaky tests**
   - Add explicit waits: `await page.waitForLoadState('networkidle')`
   - Use more specific selectors
   - Check for race conditions

### Debug Commands

```bash
# Show browser during tests
PWDEBUG=1 pnpm test:e2e

# Run specific test file
pnpm test:e2e navigation-visibility

# Generate and view report
pnpm test:e2e:report

# Check Playwright installation
pnpm playwright --version
```

## Maintenance

### Weekly Tasks
- Review failing tests
- Update tests for new features
- Remove obsolete tests

### Monthly Tasks
- Audit test coverage
- Update test data
- Review and optimize slow tests
- Update this documentation

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- Internal: See `/testing-framework-plan.md` for architecture decisions

---

**Remember**: A feature isn't done until it's tested! 🧪✅