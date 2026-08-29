import { test, expect } from '../fixtures/fixtures';
import { primaryUser, secondaryUser, unknownUser } from '../data/credentials';

/**
 * Every rejection case must behave identically: the error message appears,
 * the login form stays in place and no session key is written. The single
 * generic error message is correct behaviour for a login form: it does not
 * reveal whether the account exists.
 */
const rejectionCases = [
  {
    name: 'valid email with a wrong password',
    creds: { email: primaryUser.email, password: 'wrong-password' },
    why: 'the most common real-world failure; must not leak that the email exists',
  },
  {
    name: 'an email that is not registered',
    creds: unknownUser,
    why: 'unknown accounts must be rejected with the same generic message',
  },
  {
    name: 'both fields empty',
    creds: { email: '', password: '' },
    why: 'submitting the pristine form must fail cleanly, not crash or pass',
  },
  {
    name: 'email filled, password empty',
    creds: { email: primaryUser.email, password: '' },
    why: 'partial input is the commonest slip; empty password must never match',
  },
  {
    name: 'password filled, email empty',
    creds: { email: '', password: primaryUser.password },
    why: 'a valid password alone must not identify an account',
  },
  {
    name: "one user's email with another user's password",
    creds: { email: primaryUser.email, password: secondaryUser.password },
    why: 'credentials must be validated as a pair, not independently',
  },
  {
    name: 'valid credentials with the email uppercased',
    creds: { email: primaryUser.email.toUpperCase(), password: primaryUser.password },
    why: 'documents current behaviour: matching is case-sensitive, although RFC 5321 treats the domain part as case-insensitive and most real systems accept this input',
  },
  {
    name: 'valid credentials with surrounding whitespace',
    creds: { email: ` ${primaryUser.email} `, password: primaryUser.password },
    why: 'documents current behaviour: input is not trimmed; a trailing space from autocomplete is enough to fail a genuine user',
  },
];

test.describe('Login: rejected credentials', () => {
  for (const { name, creds } of rejectionCases) {
    // Why each case matters is captured in the `why` field of its data above.
    test(`rejects ${name}`, async ({ loginPage, homePage }) => {
      await loginPage.logIn(creds);
      await loginPage.expectInvalidCredentialsError();
      await loginPage.expectVisible();
      expect(await homePage.storedSession()).toBeNull();
    });
  }

  /**
   * Proves: the error message is dismissed as soon as the user starts
   * correcting either field.
   * Risk: a stale error alongside valid input confuses users and support.
   */
  test('clears the error message as soon as the user types again', async ({ loginPage }) => {
    await loginPage.logIn(unknownUser);
    await loginPage.expectInvalidCredentialsError();
    await loginPage.emailInput.pressSequentially('a');
    await expect(loginPage.errorMessage).toBeHidden();
  });

  /**
   * Proves: after a rejected attempt, the user can correct only the password
   * and sign in successfully without refreshing the page.
   * Risk: stale validation or form state could leave a genuine user stuck
   * after one typing mistake.
   */
  test('allows a user to correct the password and retry without reloading', async ({ loginPage, homePage }) => {
    await loginPage.logIn({ email: primaryUser.email, password: 'wrong-password' });
    await loginPage.expectInvalidCredentialsError();

    await loginPage.passwordInput.fill(primaryUser.password);
    await loginPage.loginButton.click();

    await homePage.expectLoggedIn();
    expect(await homePage.storedSession()).toBe(primaryUser.email);
  });
});

test.describe('Login: hostile and extreme input', () => {
  /**
   * Proves: markup and script fragments entered as credentials are treated
   * as inert data: nothing executes, the generic error appears and the app
   * stays responsive.
   * Risk: stored or reflected XSS through the login form.
   */
  test('treats HTML and script input as inert text', async ({ loginPage, page }) => {
    await loginPage.logIn({
      email: '<script>window.__xss = 1</script>',
      password: '<img src=x onerror="window.__xss = 1">',
    });
    await loginPage.expectInvalidCredentialsError();
    expect(await page.evaluate(() => (window as { __xss?: number }).__xss)).toBeUndefined();
  });

  /**
   * Proves: SQL-style input is rejected like any other wrong credential.
   * The check matters even against a client-side matcher: it documents
   * that no interpreter ever sees this input, and it guards the contract
   * if authentication later moves to a backend.
   */
  test('rejects SQL-injection-style input', async ({ loginPage, homePage }) => {
    await loginPage.logIn({ email: "' OR '1'='1", password: "' OR '1'='1' --" });
    await loginPage.expectInvalidCredentialsError();
    expect(await homePage.storedSession()).toBeNull();
  });

  /**
   * Proves: pathologically long input does not hang or crash the page.
   * Risk: unbounded input is a classic denial-of-service vector; the form
   * has no maxlength (an observation in itself).
   */
  test('survives 5,000-character credentials', async ({ loginPage }) => {
    const long = 'x'.repeat(5000);
    await loginPage.logIn({ email: `${long}@example.com`, password: long });
    await loginPage.expectInvalidCredentialsError();
    await loginPage.expectVisible();
  });

  /**
   * Proves: non-ASCII input is handled cleanly and rejected with the
   * normal error, not mangled or crashing string handling.
   */
  test('rejects unicode credentials cleanly', async ({ loginPage }) => {
    await loginPage.logIn({ email: 'пользователь@пример.рф', password: 'wachtwoord-密码' });
    await loginPage.expectInvalidCredentialsError();
  });

  /**
   * Documents current behaviour: there is no lockout, back-off or CAPTCHA,
   * and a valid login still succeeds immediately after repeated failures.
   * For a real banking login the absence of throttling would be a finding;
   * here it is recorded as an observation (TESTING.md).
   */
  test('allows a valid login immediately after five failed attempts', async ({ loginPage, homePage }) => {
    test.info().annotations.push({
      type: 'security observation',
      description:
        'No lockout, back-off or CAPTCHA exists; in a production banking context this would be a finding. See TESTING.md, observations.',
    });
    for (let attempt = 0; attempt < 5; attempt++) {
      await loginPage.logIn({ email: primaryUser.email, password: `wrong-${attempt}` });
      await loginPage.expectInvalidCredentialsError();
    }
    await loginPage.logIn(primaryUser);
    await homePage.expectLoggedIn();
  });
});
