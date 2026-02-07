import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { NavigationPage } from '../pages/navigation.page';

// Define different user types for testing
export type UserRole = 'admin' | 'employee' | 'hr';

export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

// Test users - These should be created in your test database
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

// Extend base test with our fixtures
export const test = base.extend<{
  authenticatedPage: Page;
  loginPage: LoginPage;
  navigationPage: NavigationPage;
  userRole: UserRole;
}>({
  // Default user role
  userRole: ['employee', { option: true }],

  // Authenticated page fixture
  authenticatedPage: async ({ page, userRole }, use) => {
    const loginPage = new LoginPage(page);
    const user = testUsers[userRole];
    
    // Navigate to login page
    await page.goto('/login');
    
    // Perform login
    await loginPage.login(user.email, user.password);
    
    // Wait for navigation after login
    await page.waitForURL(/\/dashboard|\/home/, { timeout: 10000 });
    
    // Use the authenticated page
    await use(page);
  },

  // Page object fixtures
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  navigationPage: async ({ authenticatedPage }, use) => {
    await use(new NavigationPage(authenticatedPage));
  },
});

export { expect } from '@playwright/test';