import { expect, type Locator, type Page } from '@playwright/test';

// Expected error copy lives in one place; specs import it instead of
// repeating the string.
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password. Please try again.';

/**
 * The login screen. Locators are role- and label-based where the markup
 * allows it, so they track what a user perceives rather than DOM structure.
 * The error message has no ARIA role to target (see TESTING.md, a11y
 * observations), hence the class locator.
 */
export class LoginPage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /automation doesn't stop at testing/i });
    this.emailInput = page.getByLabel('User');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'LOGIN' });
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/');
  }

  /** Fill both fields and submit via the LOGIN button. */
  async logIn({ email, password }: { email: string; password: string }) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Fill both fields and submit by pressing Enter in the password field. */
  async logInWithEnter({ email, password }: { email: string; password: string }) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.passwordInput.press('Enter');
  }

  async expectVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectInvalidCredentialsError() {
    await expect(this.errorMessage).toHaveText(INVALID_CREDENTIALS_MESSAGE);
  }
}
