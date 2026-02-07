import { test, expect } from './fixtures/base';

test.describe('AI Chat Access Tests', () => {
  test.describe('Employee AI Chat Access', () => {
    test.use({ userRole: 'employee' });

    test('should have access to AI chat functionality', async ({ navigationPage, page }) => {
      // Check if AI chat is visible
      const isVisible = await navigationPage.isAIChatVisible();
      expect(isVisible, 'AI Chat should be accessible to employees').toBeTruthy();
      
      // If AI chat button exists, click it
      if (await navigationPage.aiChatButton.isVisible()) {
        await navigationPage.openAIChat();
        
        // Verify chat interface is visible
        await expect(navigationPage.aiChatSection).toBeVisible();
      }
    });

    test('should send message to AI chat', async ({ navigationPage, page }) => {
      // Open AI chat if needed
      if (await navigationPage.aiChatButton.isVisible()) {
        await navigationPage.openAIChat();
      }
      
      // Look for chat input
      const chatInput = page.locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"], textarea[placeholder*="Type"], input[placeholder*="Type"], .chat-input');
      await expect(chatInput).toBeVisible();
      
      // Type a test message
      const testMessage = 'What is my leave balance?';
      await chatInput.fill(testMessage);
      
      // Send message (try different patterns)
      const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label="Send"]');
      if (await sendButton.isVisible()) {
        await sendButton.click();
      } else {
        // Try pressing Enter
        await chatInput.press('Enter');
      }
      
      // Wait for response (look for message in chat)
      const messageContainer = page.locator('.message, .chat-message, [data-testid="message"]');
      await expect(messageContainer).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Admin AI Chat Access', () => {
    test.use({ userRole: 'admin' });

    test('should have access to AI chat with admin capabilities', async ({ navigationPage, page }) => {
      // Check if AI chat is visible
      const isVisible = await navigationPage.isAIChatVisible();
      expect(isVisible, 'AI Chat should be accessible to admins').toBeTruthy();
    });

    test('should access advanced AI features', async ({ navigationPage, page }) => {
      // Open AI chat if needed
      if (await navigationPage.aiChatButton.isVisible()) {
        await navigationPage.openAIChat();
      }
      
      // Look for any admin-specific AI features
      // This might include system queries, bulk operations, etc.
      const chatInput = page.locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"], textarea[placeholder*="Type"], input[placeholder*="Type"], .chat-input');
      await expect(chatInput).toBeVisible();
      
      // Test admin-specific query
      const adminQuery = 'Generate employee report for all departments';
      await chatInput.fill(adminQuery);
      
      // Send message
      const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label="Send"]');
      if (await sendButton.isVisible()) {
        await sendButton.click();
      } else {
        await chatInput.press('Enter');
      }
      
      // Wait for response
      const messageContainer = page.locator('.message, .chat-message, [data-testid="message"]');
      await expect(messageContainer).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('HR AI Chat Access', () => {
    test.use({ userRole: 'hr' });

    test('should have access to AI chat for HR queries', async ({ navigationPage, page }) => {
      // Check if AI chat is visible
      const isVisible = await navigationPage.isAIChatVisible();
      expect(isVisible, 'AI Chat should be accessible to HR').toBeTruthy();
      
      // Open AI chat if needed
      if (await navigationPage.aiChatButton.isVisible()) {
        await navigationPage.openAIChat();
      }
      
      // Test HR-specific query
      const chatInput = page.locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"], textarea[placeholder*="Type"], input[placeholder*="Type"], .chat-input');
      await expect(chatInput).toBeVisible();
      
      const hrQuery = 'Show pending leave requests';
      await chatInput.fill(hrQuery);
      
      // Send message
      const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label="Send"]');
      if (await sendButton.isVisible()) {
        await sendButton.click();
      } else {
        await chatInput.press('Enter');
      }
      
      // Wait for response
      const messageContainer = page.locator('.message, .chat-message, [data-testid="message"]');
      await expect(messageContainer).toBeVisible({ timeout: 10000 });
    });
  });

  // Debug test to identify AI chat elements
  test('debug: identify AI chat elements', async ({ page }) => {
    const navigationPage = new (await import('./pages/navigation.page')).NavigationPage(page);
    const loginPage = new (await import('./pages/login.page')).LoginPage(page);
    
    // Login as employee
    await page.goto('/login');
    await loginPage.login('employee@test.com', 'TestEmployee123!');
    await page.waitForURL(/\/dashboard|\/home/, { timeout: 10000 });
    
    // Log all potential AI chat elements
    console.log('\n=== AI Chat Element Discovery ===');
    
    const patterns = [
      'button:has-text("AI")',
      'button:has-text("Chat")',
      'button:has-text("Assistant")',
      '[aria-label*="AI"]',
      '[aria-label*="Chat"]',
      '.ai-chat',
      '.chat-container',
      '[data-testid*="chat"]',
      '[data-testid*="ai"]'
    ];
    
    for (const pattern of patterns) {
      const count = await page.locator(pattern).count();
      if (count > 0) {
        console.log(`Found ${count} elements matching: ${pattern}`);
        const texts = await page.locator(pattern).allTextContents();
        console.log('  Texts:', texts);
      }
    }
  });
});