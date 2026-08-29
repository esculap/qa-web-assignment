import { test, expect } from '../fixtures/fixtures';
import { validUsers } from '../data/credentials';

test.describe('Login: happy path', () => {
  for (const user of validUsers) {
    /**
     * Proves: each seeded account can sign in through the UI and the app
     * establishes a session (navigation shown, login form gone, session
     * key written). Parameterised over js/users.js so a change to the
     * seed data is picked up without touching the test.
     * Risk: the primary user journey; if this fails nothing else matters.
     */
    test(`signs in ${user.email} and establishes a session`, async ({ loginPage, homePage }) => {
      await loginPage.logIn(user);
      await homePage.expectLoggedIn();
      await expect(loginPage.loginButton).toBeHidden();
      expect(await homePage.storedSession()).toBe(user.email);
    });
  }

  /**
   * Proves: submitting with the Enter key works the same as clicking LOGIN.
   * Risk: keyboard submission is the habitual path for many users and a
   * common regression when a form's submit handling changes.
   */
  test('signs in when the form is submitted with the Enter key', async ({ loginPage, homePage }) => {
    await loginPage.logInWithEnter(validUsers[0]);
    await homePage.expectLoggedIn();
  });

  /**
   * Proves: the password field masks its input.
   * Risk: shoulder-surfing; a regression here (e.g. type switched to text
   * during debugging) leaks credentials on screen.
   */
  test('masks the password while typing', async ({ loginPage }) => {
    await loginPage.passwordInput.fill('secret');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  /**
   * Proves: credentials do not linger in the form after a login/logout
   * cycle; the next person at a shared machine cannot recover them.
   * Risk: credential exposure on shared or kiosk devices.
   */
  test('does not retain credentials in the form after logout', async ({ loggedIn, loginPage }) => {
    await loggedIn.logOut();
    await expect(loginPage.emailInput).toHaveValue('');
    await expect(loginPage.passwordInput).toHaveValue('');
  });

  /**
   * Documents a known defect: after login the main content section stays
   * hidden. css/style.css sets `.content { display: none }` and the Vue
   * port never overrides it (the original vanilla implementation set an
   * inline display style on login). Asserted as the intended behaviour and
   * marked test.fail(), so the suite flags loudly when the defect is fixed.
   * See TESTING.md, "Application defects".
   */
  test('shows the main content after login (known defect: stays hidden)', { tag: '@known-defect' }, async ({ loggedIn }) => {
    test.info().annotations.push({
      type: 'known defect',
      description:
        'css/style.css sets .content to display:none and the Vue port never overrides it, so the main content never appears. See TESTING.md, Application defects.',
    });
    test.fail();
    await expect(loggedIn.content).toBeVisible();
  });
});
