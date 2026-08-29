import { AxeBuilder } from '@axe-core/playwright';
import { test, expect } from '../fixtures/fixtures';
import { primaryUser } from '../data/credentials';

/**
 * Automated scans use axe-core's full default ruleset (WCAG plus
 * best-practice rules) deliberately: it is stricter than a bare WCAG AA
 * run. Automated scanning catches only a minority of accessibility
 * problems, so a keyboard-only journey backs it up; the remainder needs
 * human audit and is out of scope (TESTING.md).
 */
test.describe('Accessibility', () => {
  /**
   * Proves: the login page has no detectable accessibility violations at
   * all: inputs are properly labelled, contrast passes, structure is sound.
   * Risk: login is the front door; if it is not operable with assistive
   * technology, nothing behind it matters.
   */
  test('login page passes an axe scan with zero violations', async ({ loginPage, page }) => {
    await loginPage.expectVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  /**
   * Uses the logged-in page's two known axe violations as a regression
   * baseline, not as a claim of accessibility compliance. A new violation
   * fails this test; fixing a known one also fails it so the baseline must be
   * reviewed and updated consciously. Known issues (details in TESTING.md):
   *   - color-contrast (serious): the red Logout button's white text
   *     misses the 4.5:1 minimum ratio.
   *   - page-has-heading-one (moderate): the logged-in view renders no h1;
   *     the only h1 belongs to the login screen.
   */
  test('logged-in page has exactly the two documented axe violations', async ({ loggedIn, page }) => {
    test.info().annotations.push({
      type: 'accessibility baseline',
      description:
        'Known-issue regression baseline, not a compliance pass: Logout button contrast (serious) and missing level-one heading (moderate). See TESTING.md, Accessibility findings.',
    });
    const knownViolations = ['color-contrast', 'page-has-heading-one'];
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => v.id).sort()).toEqual(knownViolations.sort());
  });

  /**
   * Proves: the entire login journey works without a pointing device:
   * focus starts in the email field (autofocus), Tab reaches the password
   * field, Enter submits.
   * Risk: keyboard operability is the baseline requirement (WCAG 2.1.1)
   * for motor-impaired and power users alike; axe cannot verify a journey,
   * only static state.
   */
  test('login journey is completable with the keyboard alone', async ({ loginPage, homePage, page }) => {
    await expect(loginPage.emailInput).toBeFocused();
    await page.keyboard.type(primaryUser.email);
    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();
    await page.keyboard.type(primaryUser.password);
    await page.keyboard.press('Enter');
    await homePage.expectLoggedIn();
  });
});
