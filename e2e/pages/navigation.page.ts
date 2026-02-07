import { Page, Locator } from '@playwright/test';

export class NavigationPage {
  readonly page: Page;
  readonly navigation: Locator;
  readonly sidebar: Locator;
  readonly navItems: Locator;
  readonly aiChatButton: Locator;
  readonly aiChatSection: Locator;

  constructor(page: Page) {
    this.page = page;
    // Common navigation selectors
    this.navigation = page.locator('nav, [role="navigation"], .navigation, .navbar, .sidebar');
    this.sidebar = page.locator('.sidebar, aside, [data-testid="sidebar"]');
    this.navItems = page.locator('nav a, nav button, .nav-item, .menu-item, [role="navigation"] a');
    
    // AI Chat specific selectors
    this.aiChatButton = page.locator('button:has-text("AI"), button:has-text("Chat"), [aria-label*="AI"], [aria-label*="Chat"]');
    this.aiChatSection = page.locator('.ai-chat, .chat-container, [data-testid="ai-chat"]');
  }

  async getVisibleNavigationItems(): Promise<string[]> {
    // Wait for navigation to be visible
    await this.navigation.first().waitFor({ state: 'visible', timeout: 5000 });
    
    // Get all visible navigation items
    const items = await this.navItems.evaluateAll(elements => 
      elements
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map(el => el.textContent?.trim() || '')
        .filter(text => text.length > 0)
    );
    
    return items;
  }

  async isNavigationItemVisible(itemText: string): Promise<boolean> {
    const items = await this.getVisibleNavigationItems();
    return items.some(item => item.toLowerCase().includes(itemText.toLowerCase()));
  }

  async clickNavigationItem(itemText: string) {
    const item = this.navItems.filter({ hasText: itemText }).first();
    await item.click();
  }

  async isAIChatVisible(): Promise<boolean> {
    try {
      // Check if AI chat button is visible
      const buttonVisible = await this.aiChatButton.isVisible({ timeout: 3000 });
      if (buttonVisible) return true;
      
      // Check if AI chat section is visible
      const sectionVisible = await this.aiChatSection.isVisible({ timeout: 3000 });
      return sectionVisible;
    } catch {
      return false;
    }
  }

  async openAIChat() {
    if (await this.aiChatButton.isVisible()) {
      await this.aiChatButton.click();
      await this.aiChatSection.waitFor({ state: 'visible' });
    }
  }

  async getNavigationStructure(): Promise<Record<string, string[]>> {
    // Get navigation structure for debugging
    const structure: Record<string, string[]> = {};
    
    // Try different navigation patterns
    const patterns = [
      { selector: 'nav', name: 'nav' },
      { selector: '.sidebar', name: 'sidebar' },
      { selector: '[role="navigation"]', name: 'navigation-role' },
      { selector: 'aside', name: 'aside' }
    ];
    
    for (const pattern of patterns) {
      const elements = await this.page.locator(pattern.selector).all();
      if (elements.length > 0) {
        const links = await this.page.locator(`${pattern.selector} a, ${pattern.selector} button`).evaluateAll(
          els => els.map(el => el.textContent?.trim() || '').filter(t => t.length > 0)
        );
        if (links.length > 0) {
          structure[pattern.name] = links;
        }
      }
    }
    
    return structure;
  }
}