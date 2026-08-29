# Test approach

## Scope

I treat login as the complete authentication lifecycle: successful and rejected sign-in, session persistence, logout, and accessibility of the journey. The suite runs end-to-end with Playwright and TypeScript against the supplied Vue application. There is no API or separate authentication layer that would justify a unit or API test suite.

The application is treated as a fixed test target. Where expected behaviour is clear, tests assert it directly. Unspecified or insecure current behaviour is recorded as an observation rather than presented as a requirement.

## Risk-based coverage

Detailed comments stay next to each test to explain what it proves and why it matters. At strategy level, coverage is prioritised as follows:

| Area | Coverage |
| --- | --- |
| Successful access | Every seeded account, button and Enter submission, password masking, and cleared credentials after logout |
| Rejected access | Wrong, unknown, empty, mismatched, case-changed, and whitespace-padded credentials; generic error, no session, and successful retry after correction |
| Edge input | Script and SQL-style strings, long values, Unicode, and repeated failures |
| Session lifecycle | Persistence after reload, complete logout, and rejection of a forged localStorage session |
| Accessibility | Axe scans of logged-out and logged-in states plus a keyboard-only login journey |
| Responsive layout | A focused horizontal-overflow check at a mobile-sized viewport |

Valid accounts are imported from `js/users.js`, the source named by the assignment. Page objects hold locators and user actions; fixtures provide a fresh login page or an authenticated session. Every test receives an isolated browser context and can run independently in Chromium, Firefox, and WebKit.

Spec prefixes `1-` to `5-` keep the HTML report in a useful reading order. Execution remains parallel and order-independent.

## Result conventions

- **Expected failures:** known defects assert the intended behaviour with `test.fail()`. Each also carries a `@known-defect` tag and a report annotation describing the finding. They remain green while failing as expected; an unexpected pass forces the baseline to be reviewed.
- **Observations:** some tests intentionally demonstrate current behaviour, such as exact-string matching or absent throttling. A passing observation records evidence; it does not endorse the behaviour.
- **Accessibility regression baseline:** the logged-in axe scan expects exactly the two known violation IDs. This keeps CI sensitive to both new violations and confirmed fixes; it is not a claim that the page complies with accessibility standards.

Known-defect scenarios can be filtered with:

```bash
npx playwright test --grep @known-defect
```

## Findings

### Application defects

1. **Main content remains hidden after login.** `.content` has `display: none`, and the Vue implementation never overrides it.
2. **The avatar Sign Out menu cannot open.** `.logout` remains hidden because the Vue implementation does not apply the CSS `active` class. The separate Logout button still works.
3. **A forged session bypasses login.** Any non-empty `localStorage.logged` value grants access without validated credentials.

### Accessibility findings

- The login page has no axe-detected violations.
- The logged-in page has insufficient Logout button contrast and no level-one heading.
- The invalid-credentials message has no live region, so screen readers are not notified when it appears.

### Other observations

- Authentication and credential matching are entirely client-side, and credentials are shipped with the application.
- Credential matching is case-sensitive and does not trim surrounding whitespace.
- The form has no attempt throttling or input-length limits.
- The original lockfile referenced a private package registry. It was regenerated against the public npm registry without changing dependency versions.
- Dependency advisories remain in the supplied Vite 4 development tooling. Upgrading the application fixture is outside this assignment's scope.

## Deliberate limits

- No visual regression testing: there is no approved visual baseline.
- Responsive coverage is limited to horizontal overflow because the supplied CSS defines no responsive breakpoints or expected mobile states.
- The legacy `js/index.js` implementation is not tested; the active application uses Vue.
- No load or performance testing against the local static-file development server.
- No claim of full accessibility compliance: automated scanning and one keyboard journey do not replace a manual audit.
- The suite uses one Vite development-server setup. A production-bundle run would exercise the same UI behaviour and is not duplicated here.

## Reliability and diagnostics

Playwright owns the development-server lifecycle. Tests use role- and label-based locators, web-first assertions, and no arbitrary sleeps. No assertion depends on the external font or icon CDNs used by the page.

CI retries unexpected failures twice, retains screenshots for failed attempts, and records a trace on the first retry. Local runs have retries disabled and therefore do not capture traces by default. The HTML report is uploaded by CI and can be opened locally with:

```bash
npx playwright show-report
```

Installation and execution commands are documented in [README.md](README.md).
