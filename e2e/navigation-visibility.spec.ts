import { test, expect } from './fixtures/base';

test.describe('Navigation Visibility Tests', () => {
  test.describe('Employee Navigation', () => {
    test.use({ userRole: 'employee' });

    test('should display employee-specific navigation items', async ({ navigationPage }) => {
      // Expected navigation items for employees
      const expectedItems = ['Dashboard', 'Leave', 'Profile'];
      
      // Get visible navigation items
      const visibleItems = await navigationPage.getVisibleNavigationItems();
      console.log('Employee navigation items:', visibleItems);
      
      // Verify expected items are visible
      for (const item of expectedItems) {
        expect(await navigationPage.isNavigationItemVisible(item), 
          `Navigation item "${item}" should be visible for employees`).toBeTruthy();
      }
      
      // Verify admin-only items are NOT visible
      const adminOnlyItems = ['Users', 'Settings', 'Reports'];
      for (const item of adminOnlyItems) {
        expect(await navigationPage.isNavigationItemVisible(item), 
          `Admin-only item "${item}" should NOT be visible for employees`).toBeFalsy();
      }
    });

    test('should navigate to leave page successfully', async ({ navigationPage, page }) => {
      // Click on Leave navigation item
      await navigationPage.clickNavigationItem('Leave');
      
      // Verify navigation
      await expect(page).toHaveURL(/\/leave/);
      
      // Verify page loaded
      await expect(page.locator('h1, h2').filter({ hasText: /leave/i })).toBeVisible();
    });
  });

  test.describe('Admin Navigation', () => {
    test.use({ userRole: 'admin' });

    test('should display all navigation items for admin', async ({ navigationPage }) => {
      // Expected navigation items for admin
      const expectedItems = ['Dashboard', 'Users', 'Leave', 'Reports', 'Settings'];
      
      // Get visible navigation items
      const visibleItems = await navigationPage.getVisibleNavigationItems();
      console.log('Admin navigation items:', visibleItems);
      
      // Verify all expected items are visible
      for (const item of expectedItems) {
        expect(await navigationPage.isNavigationItemVisible(item), 
          `Navigation item "${item}" should be visible for admin`).toBeTruthy();
      }
    });

    test('should access admin-only pages', async ({ navigationPage, page }) => {
      // Test accessing Users page
      await navigationPage.clickNavigationItem('Users');
      await expect(page).toHaveURL(/\/users/);
      
      // Go back to dashboard
      await page.goto('/dashboard');
      
      // Test accessing Settings page
      await navigationPage.clickNavigationItem('Settings');
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe('HR Navigation', () => {
    test.use({ userRole: 'hr' });

    test('should display HR-specific navigation items', async ({ navigationPage }) => {
      // Expected navigation items for HR
      const expectedItems = ['Dashboard', 'Employees', 'Leave', 'Reports'];
      
      // Get visible navigation items
      const visibleItems = await navigationPage.getVisibleNavigationItems();
      console.log('HR navigation items:', visibleItems);
      
      // Verify expected items are visible
      for (const item of expectedItems) {
        expect(await navigationPage.isNavigationItemVisible(item), 
          `Navigation item "${item}" should be visible for HR`).toBeTruthy();
      }
      
      // Verify system settings are NOT visible (admin only)
      expect(await navigationPage.isNavigationItemVisible('Settings'), 
        'System Settings should NOT be visible for HR').toBeFalsy();
    });
  });

  // Debug test to help identify navigation structure
  test('debug: log navigation structure for all roles', async ({ page }) => {
    const navigationPage = new (await import('./pages/navigation.page')).NavigationPage(page);
    const loginPage = new (await import('./pages/login.page')).LoginPage(page);
    
    for (const [role, user] of Object.entries(await import('./fixtures/base').then(m => m.testUsers))) {
      console.log(`\n=== Testing ${role.toUpperCase()} role ===`);
      
      await page.goto('/login');
      await loginPage.login(user.email, user.password);
      await page.waitForURL(/\/dashboard|\/home/, { timeout: 10000 });
      
      const structure = await navigationPage.getNavigationStructure();
      console.log(`Navigation structure for ${role}:`, JSON.stringify(structure, null, 2));
      
      // Logout for next iteration
      await page.goto('/logout');
    }
  });
});