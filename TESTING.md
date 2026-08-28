# Test approach

## Scope

The assignment asks for automated tests of the login functionality. I treated "login" as the full authentication lifecycle a user experiences: signing in, being rejected, the session surviving a reload, and signing out — plus the accessibility of that journey. Everything runs end-to-end through the UI with Playwright and TypeScript against the real dev server; the app has no isolated business logic that would justify a unit layer.

## How to run

```bash
npm ci
npx playwright install
npm test                     # full suite, three browsers, dev server auto-starts
npx playwright show-report   # HTML report with traces for any failure
```

`npm run test:headed` watches the tests run in a visible browser. `npm run typecheck` type-checks the suite without running it. No test requires the app to be started manually: Playwright's `webServer` owns the lifecycle locally and in CI.

## What is tested, and why

Priorities follow risk: the door must open for the right people (happy paths, one per seeded account, parameterised over `js/users.js`), stay shut for everyone else (a rejection table asserting one contract everywhere: generic error, form intact, no session written), and fail safely under hostile input (XSS and SQL-style strings, 5,000-character and unicode credentials, repeated failures). Session tests cover what happens after the door: reload persistence and complete teardown on logout. Accessibility is covered twice: axe-core scans for static state and a keyboard-only journey for what scanning cannot see.

Two conventions are worth knowing when reading results:

- **Expected-failure tests.** Two genuine defects found during test design are asserted as the *intended* behaviour and marked `test.fail()`. They show as expected failures while the defects exist and will flag loudly the moment either is fixed. Each carries a `known defect` annotation, visible on the test in the HTML report.
- **Behaviour-documenting tests.** Some tests record current behaviour rather than a requirement (case-sensitive matching, no lockout, forged localStorage granting access). Their comments say so explicitly and the notable ones carry `observation` annotations in the report; passing is evidence, not endorsement.

Spec files are prefixed `1-` to `4-` purely so the report reads in priority order (happy paths first, accessibility last); execution itself is parallel and order-independent.

## Findings

Defects (each carries a test):

1. **The shipped `package-lock.json` was unusable outside the issuing network.** Every resolved URL pointed at an internal Nexus repository, so `npm ci` failed for any external clone and any CI runner. Fixed in the first commit by regenerating the lockfile against the public registry; dependency versions unchanged.
2. **The main content never appears after login.** `css/style.css` sets `.content { display: none }`; the original vanilla implementation overrode it with an inline style on login, and the Vue port dropped that without adding a class binding. Login is only observable through the navigation bar and session storage.
3. **The avatar's Sign Out dropdown can never open.** Same root cause, different element: `.logout` is hidden unless an `active` class is applied, and the Vue port only toggles `v-if`. The Logout button is the sole working sign-out path.

Observations (documented, not defects I would block a release on here — though several would be findings in a production banking context):

- Authentication is entirely client-side: credentials ship in the bundle in plain text, and writing any value to `localStorage.logged` grants access. Recorded as an executable test.
- Matching is exact-string: uppercased or whitespace-padded valid credentials are rejected, which will fail genuine users (autocomplete commonly appends a space).
- No lockout, back-off or CAPTCHA after repeated failures; no maxlength on either field.
- Axe: the logged-in page has two violations — the Logout button's text contrast (serious) and no level-one heading (moderate). The login page scans clean. Both are pinned as a baseline so new violations fail the suite. The error message also lacks a live region, so screen readers get no announcement on a failed attempt.
- `npm audit` reports moderate/high advisories against vite 4's dev server (dev-time only); upgrading vite is a breaking change I left out of scope since the app is the assignment's fixture, not mine to rework.

## What is deliberately not covered

- Visual styling and layout regression — no baseline exists to compare against, and pixel tests on someone else's CSS produce noise, not signal.
- The legacy vanilla JS implementation (`js/index.js`) — dead code; the Vue app is what runs.
- Load and performance testing — meaningless against a static-file dev server.
- Manual-audit accessibility (meaningful alt text, cognitive load) — automated scanning catches only a minority of WCAG issues; I note it as a limit rather than pretending coverage.

## Determinism

No sleeps anywhere: every wait is a web-first assertion with auto-retry. Locators are role- and label-based, so they track the accessible UI rather than DOM structure. CI retries twice and keeps traces and screenshots on failure so any flake would arrive with evidence attached; across the three engines the suite has run flake-free. The external font and icon CDNs the page references are not blocked or mocked — no assertion depends on them; if they ever cause instability, routing those hosts to a stub is the first mitigation I would apply.
