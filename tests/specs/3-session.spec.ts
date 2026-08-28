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
   * defect 3.
   */
  test('opens the Sign Out menu from the avatar (known defect: never appears)', async ({ loggedIn }) => {
    test.info().annotations.push({
      type: 'known defect',
      description:
        'css/style.css hides .logout unless an "active" class is applied, and the Vue port only toggles v-if, so the dropdown can never appear. See TESTING.md, defect 3.',
    });
    test.fail();
    await loggedIn.openAvatarMenu();
    await expect(loggedIn.signOutMenu).toBeVisible();
  });

  /**
   * Documents current behaviour, deliberately: writing any value into
   * localStorage grants full access without credentials, because
   * authentication is entirely client-side. This test passing IS the
   * security observation (TESTING.md): there is no server-side session to
   * validate against. Recorded as a test so the risk is executable
   * evidence, not just a remark.
   */
  test('documents: a forged localStorage entry grants access without credentials', async ({ page, homePage }) => {
    test.info().annotations.push({
      type: 'security observation',
      description:
        'Authentication is entirely client-side; this test passing is the evidence. See TESTING.md, observations.',
    });
    await page.addInitScript(() => localStorage.setItem('logged', 'forged@attacker.example'));
    await page.goto('/');
    await homePage.expectLoggedIn();
  });
});
