import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The authenticated view: navigation bar, avatar with its Sign Out dropdown,
 * Logout button and the main content section. The content section and the
 * dropdown are subject to known display defects (see TESTING.md), so specs
 * assert login success on the navigation and Logout button, which do render.
 */
export class HomePage {
  readonly navigation: Locator;
  readonly logoutButton: Locator;
  readonly avatar: Locator;
  readonly signOutMenu: Locator;
  readonly content: Locator;

  constructor(readonly page: Page) {
    this.navigation = page.getByRole('navigation');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.avatar = page.locator('.user-section');
    this.signOutMenu = page.locator('.logout');
    this.content = page.locator('section.content');
  }

  async expectLoggedIn() {
    await expect(this.navigation).toBeVisible();
    await expect(this.logoutButton).toBeVisible();
  }

  async logOut() {
    await this.logoutButton.click();
  }

  async openAvatarMenu() {
    await this.avatar.click();
  }

  /** The email the app stored for the active session, or null. */
  async storedSession(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('logged'));
  }
}
