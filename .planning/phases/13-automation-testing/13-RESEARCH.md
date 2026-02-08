# Phase 13: Automation Testing - Research

**Researched:** 2026-02-08
**Domain:** End-to-End Testing with Selenium WebDriver, Test-Driven Development
**Confidence:** MEDIUM

## Summary

This research investigated implementing Selenium WebDriver with TypeScript for E2E testing in a Next.js 15 HRMS application with heavy TDD focus. Selenium remains the industry standard for cross-browser automation despite newer alternatives like Playwright. The project currently uses Playwright for E2E testing, but the user explicitly requested Selenium with heavy TDD emphasis.

The standard approach for Selenium with TypeScript involves using selenium-webdriver npm package (v4.38.0) with a test runner framework (Mocha recommended), Page Object Model design pattern, and explicit wait strategies. For TDD, tests should be written before implementation, using data-driven patterns with Prisma database seeding for test data isolation.

Key challenges include synchronization issues with dynamic content, flaky tests, and complex test data management. Modern best practices emphasize explicit waits, data-testid selectors, Page Object Model, and CI/CD integration with headless browsers.

**Primary recommendation:** Use selenium-webdriver with Mocha test runner, TypeScript, Page Object Model pattern, and explicit waits. Integrate with existing Prisma seeding infrastructure for test data management. Structure tests in parallel with Playwright or replace Playwright if heavy Selenium adoption is desired.

## Standard Stack

The established libraries/tools for Selenium E2E testing with TypeScript:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| selenium-webdriver | 4.38.0 | Browser automation driver | Official Selenium bindings for Node.js, W3C WebDriver compliant |
| @types/selenium-webdriver | 4.35.x | TypeScript type definitions | Official type definitions from DefinitelyTyped, 116+ projects using it |
| mocha | Latest | Test framework | Feature-rich, flexible, widely used with Selenium in Node.js ecosystem |
| chai | Latest | Assertion library | BDD/TDD assertion syntax, pairs naturally with Mocha |
| @types/mocha | Latest | TypeScript types for Mocha | Full type safety for test framework |
| @types/chai | Latest | TypeScript types for Chai | Type-safe assertions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| mocha-webdriver | Latest | Mocha integration helpers | Simplifies browser test creation with selenium-webdriver |
| mochawesome | Latest | HTML test reports | Professional test reporting with charts and screenshots |
| dotenv | 17.x (existing) | Environment configuration | Already in project, use for test environment variables |
| tsx | 4.x (existing) | TypeScript execution | Already in project for Prisma seeding scripts |
| chromedriver | Latest | Chrome browser driver | Automated ChromeDriver management (alternative: webdriver-manager) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Mocha | Jest | Jest better for unit tests, Mocha more flexible for E2E with Selenium |
| Mocha | Playwright Test | Playwright modern but user explicitly requested Selenium |
| selenium-webdriver | WebdriverIO | WebdriverIO adds convenience API layer, more opinionated but heavier |

**Installation:**
```bash
pnpm add -D selenium-webdriver @types/selenium-webdriver mocha @types/mocha chai @types/chai mocha-webdriver mochawesome chromedriver
```

## Architecture Patterns

### Recommended Project Structure
```
tests/
├── e2e-selenium/           # Selenium E2E tests (separate from Playwright)
│   ├── specs/              # Test specifications
│   │   ├── auth/           # Authentication tests
│   │   ├── employees/      # Employee CRUD tests
│   │   ├── attendance/     # Attendance workflow tests
│   │   ├── leave/          # Leave management tests
│   │   ├── payroll/        # Payroll processing tests
│   │   └── portal/         # Employee self-service tests
│   ├── pages/              # Page Object Models
│   │   ├── base.page.ts    # Base page class
│   │   ├── login.page.ts   # Login page
│   │   ├── dashboard.page.ts
│   │   ├── employees.page.ts
│   │   └── ...
│   ├── fixtures/           # Test data and fixtures
│   │   ├── users.ts        # Test user credentials
│   │   ├── employees.ts    # Employee test data
│   │   └── seed.ts         # Database seeding utilities
│   ├── utils/              # Shared utilities
│   │   ├── driver.ts       # WebDriver setup and teardown
│   │   ├── wait.ts         # Custom wait helpers
│   │   └── config.ts       # Test configuration
│   └── reports/            # Test reports output
├── .mocharc.json           # Mocha configuration
└── tsconfig.test.json      # TypeScript config for tests
```

### Pattern 1: Page Object Model (POM)
**What:** Encapsulate page structure and interactions in reusable classes, separating test logic from UI implementation details.

**When to use:** Always. POM is the industry standard for maintainable Selenium tests.

**Example:**
```typescript
// Source: https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/
// pages/base.page.ts
import { WebDriver, By, until, WebElement } from 'selenium-webdriver';

export class BasePage {
  constructor(protected driver: WebDriver) {}

  async waitForElement(locator: By, timeout = 10000): Promise<WebElement> {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async waitForElementVisible(locator: By, timeout = 10000): Promise<WebElement> {
    const element = await this.waitForElement(locator, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async clickElement(locator: By): Promise<void> {
    const element = await this.waitForElementVisible(locator);
    await this.driver.wait(until.elementIsEnabled(element), 5000);
    await element.click();
  }

  async enterText(locator: By, text: string): Promise<void> {
    const element = await this.waitForElementVisible(locator);
    await element.clear();
    await element.sendKeys(text);
  }

  async getElementText(locator: By): Promise<string> {
    const element = await this.waitForElementVisible(locator);
    return await element.getText();
  }
}

// pages/login.page.ts
export class LoginPage extends BasePage {
  private emailInput = By.css('[data-testid="email-input"]');
  private passwordInput = By.css('[data-testid="password-input"]');
  private submitButton = By.css('[data-testid="login-submit"]');
  private errorMessage = By.css('[data-testid="error-message"]');

  async navigate(): Promise<void> {
    await this.driver.get('http://localhost:3000/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.enterText(this.emailInput, email);
    await this.enterText(this.passwordInput, password);
    await this.clickElement(this.submitButton);
  }

  async getErrorMessage(): Promise<string> {
    return await this.getElementText(this.errorMessage);
  }

  async waitForDashboard(): Promise<void> {
    await this.driver.wait(until.urlContains('/dashboard'), 10000);
  }
}
```

### Pattern 2: Test-Driven Development (TDD) Workflow
**What:** Write failing tests first, implement minimal code to pass, then refactor. Red-Green-Refactor cycle.

**When to use:** Always, as specified in user requirements for "heavy TDD focus".

**Example:**
```typescript
// Source: TDD best practices from https://www.obeythetestinggoat.com/pages/book.html
// specs/auth/login.spec.ts
import { expect } from 'chai';
import { getDriver, quitDriver } from '../../utils/driver';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { WebDriver } from 'selenium-webdriver';

describe('Login Authentication', () => {
  let driver: WebDriver;
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  before(async () => {
    driver = await getDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
  });

  after(async () => {
    await quitDriver(driver);
  });

  beforeEach(async () => {
    await loginPage.navigate();
  });

  // RED: Write failing test first
  it('should successfully login with valid credentials', async () => {
    await loginPage.login('admin@shreehr.com', 'validPassword123');
    await loginPage.waitForDashboard();

    const welcomeMessage = await dashboardPage.getWelcomeMessage();
    expect(welcomeMessage).to.include('Welcome');
  });

  // RED: Another failing test
  it('should display error for invalid credentials', async () => {
    await loginPage.login('admin@shreehr.com', 'wrongPassword');

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).to.equal('Invalid email or password');
  });

  // RED: Test role-based redirect
  it('should redirect EMPLOYEE role to employee portal', async () => {
    await loginPage.login('employee@shreehr.com', 'employeePass123');

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/employee');
    }, 10000);

    const url = await driver.getCurrentUrl();
    expect(url).to.include('/employee');
  });
});
```

### Pattern 3: Test Data Factory Pattern
**What:** Create reusable functions to generate test data with Prisma, ensuring test isolation and cleanup.

**When to use:** For all tests requiring database state. Essential for HRMS with employee, attendance, leave data.

**Example:**
```typescript
// Source: Prisma testing best practices https://www.prisma.io/blog/testing-series-4-OVXtDis201
// fixtures/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedTestUser(role: 'EMPLOYEE' | 'ADMIN' | 'HR_MANAGER') {
  const hashedPassword = await bcrypt.hash('testPassword123', 10);

  return await prisma.user.create({
    data: {
      email: `test-${role.toLowerCase()}-${Date.now()}@shreehr.com`,
      password: hashedPassword,
      role: role,
      employee: {
        create: {
          firstName: 'Test',
          lastName: role,
          employeeId: `EMP-${Date.now()}`,
          department: 'Testing',
          designation: 'Test Engineer',
          dateOfJoining: new Date(),
        }
      }
    },
    include: { employee: true }
  });
}

export async function cleanupTestData() {
  // Delete test users (cascade deletes related data)
  await prisma.user.deleteMany({
    where: {
      email: { contains: '@test.shreehr.com' }
    }
  });
}

export async function resetDatabase() {
  // Only use in non-production environments
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetDatabase can only be used in test environment');
  }

  // Drop and recreate database using Prisma migrate
  // This is handled via: prisma migrate reset --skip-seed
}
```

### Pattern 4: Explicit Wait with Expected Conditions
**What:** Use WebDriverWait with specific conditions instead of Thread.sleep or implicit waits.

**When to use:** Always. Critical for handling Next.js dynamic content and avoiding flaky tests.

**Example:**
```typescript
// Source: https://www.selenium.dev/documentation/webdriver/waits/
// utils/wait.ts
import { WebDriver, By, until, WebElement } from 'selenium-webdriver';

export class WaitHelper {
  constructor(private driver: WebDriver, private defaultTimeout = 10000) {}

  async waitForElementClickable(locator: By, timeout?: number): Promise<WebElement> {
    const element = await this.driver.wait(
      until.elementLocated(locator),
      timeout || this.defaultTimeout
    );
    await this.driver.wait(
      until.elementIsEnabled(element),
      timeout || this.defaultTimeout
    );
    return element;
  }

  async waitForTextPresent(locator: By, text: string, timeout?: number): Promise<void> {
    await this.driver.wait(async () => {
      try {
        const element = await this.driver.findElement(locator);
        const elementText = await element.getText();
        return elementText.includes(text);
      } catch {
        return false;
      }
    }, timeout || this.defaultTimeout);
  }

  async waitForUrlContains(urlPart: string, timeout?: number): Promise<void> {
    await this.driver.wait(
      until.urlContains(urlPart),
      timeout || this.defaultTimeout
    );
  }

  async waitForElementCount(locator: By, count: number, timeout?: number): Promise<void> {
    await this.driver.wait(async () => {
      const elements = await this.driver.findElements(locator);
      return elements.length === count;
    }, timeout || this.defaultTimeout);
  }
}
```

### Anti-Patterns to Avoid
- **Hard-coded sleep():** Never use `setTimeout()` or `sleep()` for synchronization. Always use explicit waits with conditions.
- **Mixing implicit and explicit waits:** Selenium docs warn this causes unpredictable timeouts (10s implicit + 15s explicit = 20s+ actual timeout).
- **Brittle XPath locators:** Avoid complex XPath like `/html/body/div[3]/form/input[2]`. Use data-testid, ids, or stable CSS selectors.
- **No Page Object Model:** Don't write element locators directly in test files. Always encapsulate in Page Objects.
- **Shared test accounts:** Don't reuse same test user across tests. Create unique users per test to avoid pollution.
- **Testing everything through UI:** Follow test pyramid: unit tests for logic, API tests for workflows, E2E for critical paths only.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser driver management | Custom download/install scripts | chromedriver npm package or webdriver-manager | Handles version compatibility, OS differences, auto-updates |
| Test reporting | Custom HTML generation | mochawesome | Professional reports with charts, screenshots, pass/fail metrics |
| Database seeding | Ad-hoc SQL scripts | Prisma seed scripts with TypeScript | Type-safe, version controlled, reusable across test suites |
| Wait utilities | Custom polling loops | selenium-webdriver's `until` conditions | Battle-tested, handles edge cases (element detached from DOM, stale references) |
| Test data cleanup | Manual database deletes | Prisma transactions with rollback | Automatic cleanup, prevents test pollution |
| Parallel test execution | Custom process spawning | Mocha's built-in parallel mode | Handles test isolation, resource cleanup, failure aggregation |
| Screenshot capture | Raw WebDriver.takeScreenshot() | mochawesome with test hooks | Automatic capture on failure, organized by test, embedded in reports |
| Session management | Manual cookie/token handling | NextAuth session cookies with proper domain/path | Secure, matches production auth flow |

**Key insight:** E2E testing has many subtle edge cases (stale element references, timing races, browser crashes, test pollution). Established libraries have encountered and fixed these issues over years. Custom solutions will rediscover the same bugs.

## Common Pitfalls

### Pitfall 1: Synchronization Issues with Dynamic Content
**What goes wrong:** Tests fail intermittently because Selenium interacts with elements before Next.js hydration completes or before AJAX updates finish.

**Why it happens:** Next.js uses client-side hydration and React Server Components. Selenium executes JavaScript faster than React can render, leading to "element not found" or "element not clickable" errors.

**How to avoid:**
- Always use explicit waits: `driver.wait(until.elementIsVisible(element), 10000)`
- Wait for specific conditions: `waitForTextPresent`, `waitForElementClickable`
- Never use `Thread.sleep()` or `setTimeout()` as "fixes"
- For AJAX/API calls, wait for loading spinners to disappear: `driver.wait(until.stalenessOf(loadingSpinner))`

**Warning signs:**
- Tests pass locally but fail in CI
- Re-running tests without changes makes them pass
- Error messages like "element is not attached to DOM"

### Pitfall 2: Fragile Element Locators
**What goes wrong:** Tests break when developers change CSS classes, restructure HTML, or update component libraries (e.g., Tailwind class changes).

**Why it happens:** Tests rely on implementation details (CSS classes like `bg-blue-500`, complex XPath like `//div[3]/span[2]`) instead of stable identifiers.

**How to avoid:**
- Add `data-testid` attributes to critical elements in the application code
- Prioritize locator strategy: `data-testid` > `id` > `name` > stable CSS > XPath
- Use semantic HTML selectors when possible (role-based: `button[aria-label="Submit"]`)
- Never use auto-generated classes or dynamic IDs

**Warning signs:**
- Tests fail after UI styling changes but functionality is unchanged
- XPath expressions longer than 50 characters
- Tests break when upgrading UI component libraries

### Pitfall 3: Flaky Tests Due to Test Data Pollution
**What goes wrong:** Test A passes when run alone but fails when run after Test B. Tests depend on specific database state that other tests modify.

**Why it happens:** Tests share database state. Test B creates an employee with email `test@example.com`, Test A expects that email to be available for creation.

**How to avoid:**
- Create unique test data per test using timestamps: `test-${Date.now()}@example.com`
- Use `beforeEach` hooks to seed fresh data for each test
- Use `afterEach` hooks to clean up test data
- Consider using database transactions with rollback for true isolation
- Run database reset (`prisma migrate reset`) before test suite in CI

**Warning signs:**
- Tests pass individually but fail in suite
- Test order affects pass/fail results
- "Unique constraint violation" errors in tests

### Pitfall 4: Mixing Implicit and Explicit Waits
**What goes wrong:** Timeouts become unpredictable. A test might wait 25+ seconds when you expected 15 seconds.

**Why it happens:** Selenium's implicit wait + explicit wait = cumulative timeout. Setting implicit wait to 10s and explicit wait to 15s can result in 25s actual timeout.

**How to avoid:**
- Never set implicit waits: `driver.manage().timeouts().implicitlyWait(0)`
- Only use explicit waits with `WebDriverWait` and `until` conditions
- Set explicit timeout consistently across project (e.g., 10s default)
- Document timeout values in shared config

**Warning signs:**
- Tests take much longer to fail than configured timeout
- Timeout errors show unexpected durations
- Inconsistent wait behavior across different elements

### Pitfall 5: Cross-Browser Testing Configuration Inconsistencies
**What goes wrong:** Tests pass in Chrome but fail in Firefox/Safari. Browser window sizes differ, causing responsive layout differences.

**Why it happens:** Each browser driver has different default configurations (window size, locale, timeouts). Chrome headless defaults to 800x600, Firefox to different size.

**How to avoid:**
- Standardize browser configuration across all drivers:
  ```typescript
  driver.manage().window().setRect({ width: 1440, height: 900 });
  driver.manage().timeouts().pageLoad(30000);
  ```
- Set consistent viewport sizes for mobile testing
- Use same environment variables for all browsers (BASE_URL, locale)
- Run cross-browser tests in CI, not just Chrome

**Warning signs:**
- "Element not visible" errors only in specific browsers
- Tests pass in headed mode but fail in headless
- Responsive layout behaves differently across browsers

### Pitfall 6: Not Handling NextAuth Session Cookies Properly
**What goes wrong:** Tests can't maintain authenticated session, requiring login before every test, slowing down suite execution.

**Why it happens:** NextAuth uses secure, http-only session cookies that Selenium can't easily manipulate. Session cookies have specific domain/path requirements.

**How to avoid:**
- Use proper login flow via UI for authentication tests
- For non-auth tests, create helper to login once and reuse session:
  ```typescript
  async function loginAndGetSession(driver: WebDriver, email: string, password: string) {
    // Login via UI
    // Extract session cookie
    const cookies = await driver.manage().getCookies();
    const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token');
    return sessionCookie;
  }

  // Reuse in other tests
  await driver.manage().addCookie(sessionCookie);
  ```
- Consider test-only auth bypass for non-auth-related tests (requires backend support)

**Warning signs:**
- Every test starts with login flow (slow)
- "Unauthorized" errors in tests that should be authenticated
- Session cookies not persisting between page navigations

### Pitfall 7: Over-Testing Through UI (Test Pyramid Violation)
**What goes wrong:** Test suite becomes slow (hours), brittle, and expensive to maintain. CI takes too long. Developers avoid running tests.

**Why it happens:** Testing all business logic, validations, and edge cases through Selenium UI tests instead of faster unit/integration tests.

**How to avoid:**
- Follow test pyramid: 70% unit tests, 20% integration/API tests, 10% E2E UI tests
- E2E tests should cover critical user workflows only:
  - Authentication flows (login, logout, role-based access)
  - Critical CRUD operations (create employee, submit leave)
  - End-to-end workflows (onboarding, payroll processing)
- Use Vitest (already in project) for business logic unit tests
- Test API endpoints directly for validation logic
- Reserve Selenium for user journey validation

**Warning signs:**
- Test suite takes more than 30 minutes to run
- More than 100 Selenium tests in project
- Tests validating individual field validations through UI
- Developers say "tests are too slow, I don't run them"

## Code Examples

Verified patterns from official sources:

### WebDriver Setup with TypeScript
```typescript
// Source: https://www.npmjs.com/package/selenium-webdriver
// utils/driver.ts
import { Builder, Browser, WebDriver, Capabilities } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

export async function getDriver(headless = true): Promise<WebDriver> {
  const chromeOptions = new chrome.Options();

  if (headless) {
    chromeOptions.addArguments(
      '--headless',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--window-size=1440,900'
    );
  } else {
    chromeOptions.addArguments('--start-maximized');
  }

  const driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)
    .build();

  // Set timeouts
  await driver.manage().setTimeouts({
    implicit: 0, // Never use implicit waits
    pageLoad: 30000,
    script: 30000,
  });

  return driver;
}

export async function quitDriver(driver: WebDriver): Promise<void> {
  if (driver) {
    await driver.quit();
  }
}
```

### Mocha Configuration for TypeScript
```json
// Source: https://mochajs.org/ and community best practices
// .mocharc.json
{
  "require": ["tsx/cjs"],
  "spec": "tests/e2e-selenium/specs/**/*.spec.ts",
  "timeout": 30000,
  "slow": 5000,
  "reporter": "mochawesome",
  "reporter-options": [
    "reportDir=tests/e2e-selenium/reports",
    "reportFilename=selenium-report",
    "html=true",
    "json=true",
    "overwrite=false",
    "timestamp=true"
  ],
  "parallel": false,
  "bail": false
}
```

### Data-Driven Test Pattern
```typescript
// Source: Data-driven testing best practices
// specs/employees/employee-crud.spec.ts
import { expect } from 'chai';
import { getDriver, quitDriver } from '../../utils/driver';
import { EmployeesPage } from '../../pages/employees.page';
import { WebDriver } from 'selenium-webdriver';
import { seedTestUser, cleanupTestData } from '../../fixtures/seed';

describe('Employee CRUD Operations', () => {
  let driver: WebDriver;
  let employeesPage: EmployeesPage;

  before(async () => {
    driver = await getDriver(process.env.CI === 'true');
    employeesPage = new EmployeesPage(driver);
  });

  after(async () => {
    await cleanupTestData();
    await quitDriver(driver);
  });

  const employeeTestData = [
    { firstName: 'John', lastName: 'Doe', department: 'Engineering', designation: 'Developer' },
    { firstName: 'Jane', lastName: 'Smith', department: 'HR', designation: 'Manager' },
    { firstName: 'Bob', lastName: 'Wilson', department: 'Sales', designation: 'Executive' },
  ];

  employeeTestData.forEach((employeeData) => {
    it(`should create employee: ${employeeData.firstName} ${employeeData.lastName}`, async () => {
      await employeesPage.navigate();
      await employeesPage.clickCreateEmployee();

      await employeesPage.fillEmployeeForm({
        ...employeeData,
        email: `${employeeData.firstName.toLowerCase()}.${Date.now()}@shreehr.com`,
        employeeId: `EMP-${Date.now()}`,
      });

      await employeesPage.submitForm();
      await employeesPage.waitForSuccessMessage();

      const successMessage = await employeesPage.getSuccessMessage();
      expect(successMessage).to.include('Employee created successfully');
    });
  });
});
```

### CI/CD GitHub Actions Configuration
```yaml
# Source: https://github.com/jsoma/selenium-github-actions
# .github/workflows/selenium-tests.yml
name: Selenium E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  selenium-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: shreehr_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install

      - name: Setup test database
        run: |
          pnpm prisma migrate deploy
          pnpm db:seed-test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/shreehr_test

      - name: Start Next.js server
        run: pnpm dev &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/shreehr_test
          NODE_ENV: test

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000

      - name: Run Selenium tests
        run: pnpm test:selenium
        env:
          BASE_URL: http://localhost:3000
          CI: true

      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: selenium-reports
          path: tests/e2e-selenium/reports/
          retention-days: 30
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Selenium 3 with JSON Wire Protocol | Selenium 4 with W3C WebDriver | 2021 | More stable cross-browser behavior, reduced flaky tests |
| Implicit waits | Explicit waits with ExpectedConditions | Always best practice | Predictable timing, faster test execution |
| CSS/XPath only | data-testid attributes | 2020+ | Tests survive UI refactoring, clearer test intent |
| Manual ChromeDriver download | npm packages (chromedriver, webdriver-manager) | 2019+ | Automatic version management, CI compatibility |
| Hard-coded test data | Data factories with unique IDs | Always best practice | Test isolation, parallel execution safety |
| Java-heavy ecosystem | Node.js/TypeScript with selenium-webdriver | 2018+ | Better Next.js integration, shared language with app code |
| Selenium Grid for parallelization | Cloud services (BrowserStack, Sauce Labs) OR local parallel Mocha | 2020+ | Easier setup, better resource utilization |
| Single browser testing | Multi-browser with Playwright OR Selenium Grid | 2022+ | Better cross-browser coverage, but Playwright easier for this |

**Deprecated/outdated:**
- **Protractor:** Angular-specific E2E framework built on Selenium, deprecated in 2021. Use Selenium directly or Playwright.
- **Selenium IDE Firefox plugin:** Old Firefox-only recorder, replaced by modern Selenium IDE as standalone Chrome/Firefox extension.
- **WebDriverJS (old package):** Replaced by `selenium-webdriver` official npm package.

## Open Questions

Things that couldn't be fully resolved:

1. **Playwright vs Selenium Coexistence**
   - What we know: Project already has Playwright configured with test scripts in `e2e/` directory. User explicitly requested Selenium.
   - What's unclear: Should Selenium replace Playwright or coexist? Are there specific Selenium features needed (legacy browser support, Java/Python test reuse)?
   - Recommendation: Clarify with user. If coexisting, keep Playwright for modern browsers (Chrome/Firefox/Safari/Edge), add Selenium only if legacy browser support (IE, old mobile browsers) or specific cross-language requirements exist. Avoid duplicating test coverage.

2. **Heavy TDD Approach with E2E Tests**
   - What we know: User requested "heavy test-driven development". TDD typically applies to unit/integration tests, written before implementation. E2E tests are usually written after features exist.
   - What's unclear: Does "heavy TDD" mean writing E2E test skeletons before implementation? Or writing comprehensive E2E coverage? Or applying TDD to lower-level components while E2E validates integration?
   - Recommendation: Apply TDD at unit level (Vitest tests for business logic). Write E2E test outlines (describe/it blocks with pending tests) before implementing features, then fill in test implementation as feature develops. E2E tests verify TDD'd components integrate correctly.

3. **Test Data Isolation Strategy**
   - What we know: Project uses Prisma with PostgreSQL. Multiple seed scripts exist (`db:seed-test`, `db:seed-policies`). Tests need isolated data to avoid pollution.
   - What's unclear: Should tests use separate test database, database transactions with rollback, or unique data per test with cleanup?
   - Recommendation: Use separate test database (DATABASE_URL_TEST environment variable). Before suite: `prisma migrate reset`, run test seeds. Each test: create unique data with timestamps. After suite: optional cleanup. Transactions with rollback ideal but complex with E2E tests hitting real HTTP server.

4. **Code Coverage for E2E Tests**
   - What we know: E2E tests can collect frontend code coverage using Istanbul by instrumenting code and extracting `window.__coverage__` via Selenium.
   - What's unclear: Is code coverage needed for E2E tests? Success criteria mentions "test coverage report generated" but unclear if this means coverage of test cases or code coverage.
   - Recommendation: If "coverage report" means test case coverage: use mochawesome reports showing which test cases passed/failed. If it means code coverage: implement Istanbul instrumentation (complex, adds overhead). Clarify requirement—E2E tests typically measured by scenario coverage, not line coverage.

5. **Testing Encrypted PII Fields**
   - What we know: Project encrypts PII at rest. Tests need to verify data display/operations with encrypted fields.
   - What's unclear: Do E2E tests need to verify encryption, or just functional behavior? Can tests use unencrypted test data?
   - Recommendation: E2E tests should test functional behavior (create employee, view profile), not encryption implementation (that's unit test). Test environment can use same encryption as production for realism, but not required for most E2E scenarios.

6. **NextAuth v5 Beta Testing Approach**
   - What we know: Project uses NextAuth 5.0.0-beta.30. Official testing docs focus on Playwright, not Selenium.
   - What's unclear: Are there Selenium-specific challenges with NextAuth beta? How to handle session tokens reliably?
   - Recommendation: Use standard login flow via UI for most tests. For tests not focused on auth, create test-only bypass (environment variable to allow test session token) or helper to programmatically create session. Monitor NextAuth GitHub issues for Selenium-specific problems.

## Sources

### Primary (HIGH confidence)
- Selenium WebDriver npm package v4.38.0 - https://www.npmjs.com/package/selenium-webdriver
- @types/selenium-webdriver v4.35.x - https://www.npmjs.com/package/@types/selenium-webdriver
- Selenium Official Documentation: Waiting Strategies - https://www.selenium.dev/documentation/webdriver/waits/
- Selenium Official Documentation: Page Object Models - https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/
- Selenium Official Documentation: Common Errors - https://www.selenium.dev/documentation/webdriver/troubleshooting/errors/
- Prisma Testing Guide: End-to-End Testing - https://www.prisma.io/blog/testing-series-4-OVXtDis201
- Prisma Documentation: Seeding - https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding

### Secondary (MEDIUM confidence)
- WebDriverIO TypeScript Setup - https://webdriver.io/docs/typescript/
- Mocha JavaScript Testing Framework - https://mochajs.org/ (via LambdaTest guide)
- GitHub Actions Selenium Examples - https://github.com/jsoma/selenium-github-actions
- Page Object Model Pattern Guide - https://martinfowler.com/bliki/PageObject.html
- BrowserStack Guide: Selenium Best Practices 2025 - https://www.browserstack.com/guide/selenium-best-practices-for-web-testing
- LambdaTest: Mocha JavaScript Tutorial with Selenium - https://www.lambdatest.com/blog/mocha-javascript-tutorial-with-examples-for-selenium-testing/
- Next.js + Prisma E2E Testing Guide - https://www.iflair.com/end-to-end-testing-a-fullstack-next-js-prisma-app/

### Tertiary (LOW confidence - community/blog sources)
- ZenRows: Selenium with Node.js Tutorial 2026 - https://www.zenrows.com/blog/selenium-nodejs
- Medium: Mastering Selenium with Page Object Models (TDD/BDD approach) - https://medium.com/@Chiuzu.Chilumbu/mastering-selenium-with-page-object-models-a-tdd-and-bdd-approach-8227b0dbddb7
- Medium: Front-end JavaScript Test Coverage with Istanbul + Selenium - https://medium.com/@oresoftware/front-end-javascript-test-coverage-with-istanbul-selenium-372b3292733
- Selenium Flaky Tests Prevention Strategies (multiple community sources)
- Data-testid Attributes Best Practices - https://bugbug.io/blog/software-testing/data-testid-attributes/
- TestLeaf: Cross-Browser Testing with Selenium 2026 - https://www.testleaf.com/blog/cross-browser-testing-with-selenium-webdriver-step-by-step-guide-for-2026/

### Comparison Research
- BrowserStack: Playwright vs Selenium 2026 - https://www.browserstack.com/guide/playwright-vs-selenium
- ZenRows: Playwright vs. Selenium In-Depth Comparison 2026 - https://www.zenrows.com/blog/playwright-vs-selenium
- TheLinuxCode: Cypress vs Selenium 2026 - https://thelinuxcode.com/cypress-vs-selenium-in-2026-what-actually-changes-your-test-suite-and-what-doesnt/

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Verified npm packages and versions, but couldn't access npmjs.com directly (403 error). Cross-verified with multiple community sources and version mentioned in search results.
- Architecture: HIGH - Patterns verified from official Selenium docs, Prisma official blog, and Martin Fowler's authoritative Page Object article. Code examples based on official API documentation.
- Pitfalls: HIGH - Verified from official Selenium troubleshooting docs and consistent across multiple authoritative sources (BrowserStack, LambdaTest, Selenium.dev).
- TDD patterns: MEDIUM - Sourced from "Test-Driven Development with Python" book (Obey the Testing Goat) and general TDD best practices, but Selenium-specific TDD workflow less documented than Playwright.
- NextAuth testing: LOW - Official Auth.js testing docs focus on Playwright, minimal Selenium-specific guidance found. This is an open question.

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - Selenium is stable, but Next.js/NextAuth versions evolving quickly)
