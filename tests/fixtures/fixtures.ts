import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '../pages/home.page';
import { primaryUser } from '../data/credentials';

interface Fixtures {
  /** Login page, already navigated to the app root. */
  loginPage: LoginPage;
  homePage: HomePage;
  /**
   * A session authenticated through the UI as the primary seeded user.
   * Logging in through the UI is deliberate: it is the behaviour under test
   * and costs two fills and a click. For a larger app this fixture would
   * reuse Playwright storage state instead.
   */
  loggedIn: HomePage;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loggedIn: async ({ loginPage, homePage }, use) => {
    await loginPage.logIn(primaryUser);
    await homePage.expectLoggedIn();
    await use(homePage);
  },
});

export { expect } from '@playwright/test';
