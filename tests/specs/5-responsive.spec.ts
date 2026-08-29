import { test, expect } from '../fixtures/fixtures';

/**
 * Responsive layout is listed as a feature (README-Vue.md) but the app
 * defines no breakpoints — css/style.css has no @media queries and sizes
 * several boxes in viewport units (e.g. 80vw, 45vh). There is therefore no
 * mobile design to assert against, so this file carries a single, minimal
 * guard rather than a suite.
 *
 * The one thing worth pinning is the most common real mobile bug: content
 * spilling sideways. This test checks that the login page produces no
 * horizontal overflow at a phone-sized viewport. It exists mainly as a
 * placeholder so the gap is not forgotten; expand it into real coverage
 * only once the app grows a deliberate responsive layout. See TESTING.md,
 * "Deliberate limits".
 */
test.describe('Responsive layout', () => {
  test('login page has no horizontal overflow at a mobile viewport', async ({ page, loginPage }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginPage.expectVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows, 'page should not scroll horizontally at 375px wide').toBe(false);
  });
});
