# Testing Patterns

**Analysis Date:** 2026-02-08

## Test Framework

**Unit Testing:**
- Framework: Vitest v4.0.18
- Config: `vitest.config.ts`
- Environment: jsdom
- Globals: enabled (describe, it, expect available without imports)

**E2E Testing:**
- Framework: Playwright v1.58.2
- Config: `playwright.config.ts`
- Test directory: `e2e/`
- Naming: `.spec.ts` suffix

**Run Commands:**
```bash
pnpm test              # Run unit tests (Vitest)
pnpm test:ui           # Run unit tests with UI
pnpm test:e2e          # Run E2E tests (Playwright)
pnpm test:e2e:ui       # Run E2E tests with UI
pnpm test:e2e:debug    # Debug mode
pnpm test:e2e:headed   # Run with visible browser
pnpm test:e2e:report   # Show HTML report
pnpm test:all          # Run all tests
```

**Assertion Library:**
- Vitest: built-in `expect()` from Vitest
- Playwright: `expect()` from `@playwright/test`

## Test File Organization

**Location:**
- Unit tests: co-located with source code
- E2E tests: separate `e2e/` directory at project root

**Naming:**
- Unit tests: `[filename].test.ts` (e.g., `encryption.test.ts`, `pf.test.ts`)
- E2E tests: `[feature].spec.ts` (e.g., `ai-chat-access.spec.ts`, `navigation-visibility.spec.ts`)

**File Structure:**
```
src/
├── lib/
│   ├── encryption.ts
│   ├── encryption.test.ts        # Co-located
│   ├── statutory/
│   │   ├── pf.ts
│   │   └── pf.test.ts            # Co-located
│   └── workflows/
│       ├── loan.ts
│       └── loan.test.ts          # Co-located
e2e/
├── fixtures/
│   └── base.ts                   # Shared test fixtures
├── pages/
│   ├── login.page.ts             # Page objects
│   ├── navigation.page.ts
│   └── ...
└── [feature].spec.ts             # Test files
```

## Test Structure

**Unit Test Pattern (Vitest):**
```typescript
import { describe, expect, it, beforeAll } from "vitest";
import { encrypt, decrypt } from "./encryption";

beforeAll(() => {
  // Set up test encryption key
  process.env.ENCRYPTION_KEY = "0123456789abcdef...";
});

describe("encrypt and decrypt", () => {
  it("should encrypt and decrypt a string successfully", () => {
    const original = "ABCDE1234F";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });

  it("should throw error when encrypting empty string", () => {
    expect(() => encrypt("")).toThrow("Cannot encrypt empty string");
  });
});
```

**Key Patterns:**
- `describe()` for grouping related tests
- `it()` for individual test cases
- `beforeAll()` for setup that runs once before all tests in block
- Clear test names describing what should happen
- Arrange-Act-Assert pattern (setup, execute, verify)

**E2E Test Pattern (Playwright):**
```typescript
import { test, expect } from './fixtures/base';

test.describe('AI Chat Access Tests', () => {
  test.describe('Employee AI Chat Access', () => {
    test.use({ userRole: 'employee' });

    test('should have access to AI chat functionality', async ({ navigationPage, page }) => {
      const isVisible = await navigationPage.isAIChatVisible();
      expect(isVisible, 'AI Chat should be accessible to employees').toBeTruthy();

      if (await navigationPage.aiChatButton.isVisible()) {
        await navigationPage.openAIChat();
        await expect(navigationPage.aiChatSection).toBeVisible();
      }
    });
  });

  test.describe('Admin AI Chat Access', () => {
    test.use({ userRole: 'admin' });
    // Admin-specific tests
  });
});
```

**Key Patterns:**
- `test.describe()` for grouping tests by feature/role
- `test.use()` for test configuration (userRole, fixtures)
- Custom fixtures from `e2e/fixtures/base.ts`
- Page object pattern for reusable selectors
- Assertion messages for clarity on failure

## Mocking

**Framework:** Vitest has built-in mocking support (vi)

**Patterns in Codebase:**
- No explicit mocking found in test files
- Tests work with real implementations (encryption, PF calculations)
- E2E tests mock at browser level (actual login with test credentials)

**What to Mock:**
- External API calls (AI model providers, email services)
- Database queries (in integration tests, use test database)
- Time-dependent functions (dates, random values)
- Browser APIs (localStorage, fetch)

**What NOT to Mock:**
- Core business logic (encryption, calculations)
- Validation schemas
- Standard library functions

**Example mocking pattern (if needed):**
```typescript
import { vi, describe, it, expect } from "vitest";

describe("with mocking", () => {
  it("should mock external API", () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ data: "mocked" })
    });
    global.fetch = mockFetch;
    // Test code
    expect(mockFetch).toHaveBeenCalledWith(...);
  });
});
```

## Fixtures and Factories

**Test Data (E2E):**
```typescript
// e2e/fixtures/base.ts
export type UserRole = 'admin' | 'employee' | 'hr';

export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

export const testUsers: Record<UserRole, TestUser> = {
  admin: {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
    role: 'admin',
    name: 'Test Admin'
  },
  employee: {
    email: 'employee@test.com',
    password: 'TestEmployee123!',
    role: 'employee',
    name: 'Test Employee'
  },
  hr: {
    email: 'hr@test.com',
    password: 'TestHR123!',
    role: 'hr',
    name: 'Test HR'
  }
};
```

**Location:**
- E2E test data: `e2e/fixtures/base.ts`
- Test users defined in fixtures with credentials
- Page objects in `e2e/pages/`

**Usage:**
```typescript
export const test = base.extend<{
  authenticatedPage: Page;
  loginPage: LoginPage;
  navigationPage: NavigationPage;
  userRole: UserRole;
}>({
  userRole: ['employee', { option: true }],

  authenticatedPage: async ({ page, userRole }, use) => {
    const loginPage = new LoginPage(page);
    const user = testUsers[userRole];

    await page.goto('/login');
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/\/dashboard|\/home/, { timeout: 10000 });

    await use(page);
  },
});
```

## Coverage

**Requirements:** No enforced coverage target

**View Coverage:**
```bash
# Not currently configured - would need to add coverage options to vitest.config.ts
# Example setup:
# "test:coverage": "vitest run --coverage"
```

**To Enable Coverage:**
- Add to `vitest.config.ts`: `coverage: { provider: 'v8' }`
- Add dev dependency: `@vitest/coverage-v8`
- Run: `pnpm test:coverage`

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities
- Approach: Test inputs and expected outputs
- Examples: `encryption.test.ts`, `pf.test.ts`, `loan.test.ts`
- Focus on edge cases and error conditions

**Unit Test Examples:**

*Encryption Tests (`src/lib/encryption.test.ts`):*
- Encrypt/decrypt roundtrip
- Different ciphertexts for same plaintext (IV randomness)
- Error cases (empty strings, invalid data)
- Special characters and Unicode handling
- Environment variable validation

*PF Calculation Tests (`src/lib/statutory/pf.test.ts`):*
- Salary under wage ceiling (12% PF)
- Salary above ceiling (capped at Rs.15,000)
- Employer contribution breakdown (EPF 3.67%, EPS 8.33%, EDLI 0.50%, Admin 0.51%)
- Edge cases (zero salary, exact ceiling)
- Total consistency checks

*Loan Calculation Tests (`src/lib/workflows/loan.test.ts`):*
- EMI calculation for different principals and rates
- Zero-interest loans
- Amortization schedule generation
- Schedule validation (total paid, final balance, EMI components)
- Interest calculation consistency

**Integration Tests:**
- Not explicitly separated in codebase
- Could test API routes with mocked database
- Not currently implemented

**E2E Tests:**
- Scope: User workflows and UI interactions
- Approach: Test via browser automation
- Examples: `ai-chat-access.spec.ts`, `navigation-visibility.spec.ts`
- Focus on critical user journeys and access control

**E2E Test Coverage:**
- AI Chat access by role (Employee, Admin, HR)
- Login flow
- Navigation visibility per role
- Message sending and chat responses
- Multiple browser engines (Chromium, Firefox, WebKit)
- Mobile viewports (Pixel 5, iPhone 12)

## Common Patterns

**Async Testing:**
```typescript
// In E2E tests
it("should send message to AI chat", async ({ navigationPage, page }) => {
  await navigationPage.openAIChat();

  const chatInput = page.locator('textarea[placeholder*="Ask"]');
  await expect(chatInput).toBeVisible();

  await chatInput.fill('What is my leave balance?');
  await chatInput.press('Enter');

  const messageContainer = page.locator('.message');
  await expect(messageContainer).toBeVisible({ timeout: 10000 });
});
```

**Error Testing:**
```typescript
// In unit tests
it("should throw error when decrypting invalid data", () => {
  expect(() => decrypt("invalid_base64")).toThrow();
});

it("should throw error if ENCRYPTION_KEY is not set", () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  delete process.env.ENCRYPTION_KEY;

  expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY environment variable is not set");

  process.env.ENCRYPTION_KEY = originalKey;
});
```

**State/Environment Testing:**
```typescript
// Cleanup after modifying env
beforeAll(() => {
  process.env.ENCRYPTION_KEY = "test_key...";
});

// Restore state
afterEach(() => {
  process.env.ENCRYPTION_KEY = originalKey;
});
```

**Comparison Testing:**
```typescript
// Verify behavior (e.g., interest decreasing in amortization)
it("generates schedule with decreasing interest", () => {
  const schedule = generateAmortizationSchedule(params);

  for (let i = 1; i < schedule.length; i++) {
    expect(schedule[i].interestPaise).toBeLessThanOrEqual(
      schedule[i - 1].interestPaise
    );
  }
});
```

## Playwright Configuration Details

**Browser Coverage:**
- Desktop Chrome
- Desktop Firefox
- Desktop Safari
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

**Retries and Timeouts:**
```typescript
retries: process.env.CI ? 2 : 0,    // Retry on CI
forbidOnly: !!process.env.CI,        // Fail if test.only left
workers: process.env.CI ? 1 : undefined, // Parallel on local, serial on CI
```

**Reporters:**
- HTML report (open: 'never')
- List output
- JSON output (`test-results.json`)

**Screenshots and Traces:**
- Screenshot: only on failure
- Trace: on first retry only

**Timeouts:**
- Action timeout: 10 seconds
- Navigation timeout: 30 seconds
- Dev server startup: 120 seconds

---

*Testing analysis: 2026-02-08*
