import { test, expect } from '../fixtures/fixtures';
import { primaryUser } from '../data/credentials';

test.describe('Session lifecycle', () => {
  /**
   * Proves: a logged-in session survives a page reload; the app restores
   * state from localStorage on mount.
   * Risk: users losing their session on every refresh would make the app
   * unusable in practice.
   */
  test('keeps the session across a page reload', async ({ loggedIn }) => {
    await loggedIn.page.reload();
    await loggedIn.expectLoggedIn();
    expect(await loggedIn.storedSession()).toBe(primaryUser.email);
  });

  /**
   * Proves: the Logout button ends the session completely: the login form
   * returns, the session key is removed, and a reload does not resurrect
   * the session.
   * Risk: a half-cleared session that reappears on refresh is a security
   * defect on any shared machine.
   */
  test('ends the session with the Logout button, permanently', async ({ loggedIn, loginPage }) => {
    await loggedIn.logOut();
    await loginPage.expectVisible();
    expect(await loggedIn.storedSession()).toBeNull();
    await loggedIn.page.reload();
    await loginPage.expectVisible();
  });

  /**
   * Documents a known defect: clicking the avatar should reveal the
   * Sign Out dropdown, but css/style.css hides `.logout` unless an
   * `active` class is applied, and the Vue port only toggles `v-if`
   * without ever applying that class (the vanilla implementation set an
   * inline display style instead). The dropdown can therefore never
   * appear. Asserted as the intended behaviour and marked test.fail() so
   * the suite flags loudly when the defect is fixed. See TESTING.md,
   * "Application defects".
   */
  test('opens the Sign Out menu from the avatar (known defect: never appears)', { tag: '@known-defect' }, async ({ loggedIn }) => {
    test.info().annotations.push({
      type: 'known defect',
      description:
        'css/style.css hides .logout unless an "active" class is applied, and the Vue port only toggles v-if, so the dropdown can never appear. See TESTING.md, Application defects.',
    });
    test.fail();
    await loggedIn.openAvatarMenu();
    await expect(loggedIn.signOutMenu).toBeVisible();
  });

  /**
   * Proves the intended security boundary: a value injected directly into
   * browser storage must not establish an authenticated session.
   * Risk: the current app trusts any non-empty value, allowing login to be
   * bypassed without valid credentials. Marked as an expected failure so the
   * finding remains executable without blocking CI.
   */
  test(
    'rejects a forged localStorage session (known defect: grants access)',
    { tag: '@known-defect' },
    async ({ page, loginPage, homePage }) => {
      test.info().annotations.push({
        type: 'security finding',
        description:
          'The app trusts any non-empty localStorage.logged value and grants access without validated credentials. See TESTING.md, Application defects.',
      });
      test.fail();
      await page.addInitScript(() => localStorage.setItem('logged', 'forged@attacker.example'));
      await page.goto('/');
      await loginPage.expectVisible();
      await expect(homePage.navigation).toBeHidden();
    },
  );
});
