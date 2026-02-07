import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"], input#email');
    this.passwordInput = page.locator('input[type="password"], input[name="password"], input#password');
    this.loginButton = page.locator('button[type="submit"]:has-text("Login"), button[type="submit"]:has-text("Sign in"), button[type="submit"]:has-text("Submit")');
    this.errorMessage = page.locator('.error-message, .alert-error, [role="alert"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isLoggedIn(): Promise<boolean> {
    // Check if we're redirected away from login page
    const currentUrl = this.page.url();
    return !currentUrl.includes('/login') && !currentUrl.includes('/signin');
  }
}