import { test, expect, type Page } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './e2e-credentials';

/**
 * Étape 6 (QA) — replays "Login → Overview → Accounts → AccountDetail →
 * Segments → Playbooks" as one continuous session, called out explicitly as
 * a gap this project's history had never closed: every other e2e spec here
 * either checks one screen at a time via direct page.goto
 * (five-screens-smoke.spec.ts) or exercises a single feature in isolation
 * (playbook-outcome-tracking.spec.ts). This one drives the journey through
 * real UI interactions instead — sidebar nav clicks, a table row click, an
 * in-page link — the way an actual user moves through the app in one
 * session, so it can catch a broken transition (a click that silently goes
 * nowhere, a route that 404s from a real link elsewhere in the app) that a
 * set of independent page.goto checks cannot.
 *
 * AccountDetail has two real surfaces in this app, not one — a row click on
 * /accounts opens a slide-over detail panel (Sheet/role="dialog"), while
 * the standalone /accounts/:id route is only ever reached from a link
 * elsewhere (Segments, Today, Insights). This journey exercises both: the
 * panel from Accounts, then the full page via the account link
 * SegmentDetailView renders once inside a segment.
 *
 * Could not be executed against live data from the authoring sandbox:
 * outbound HTTPS to *.supabase.co is denied by this session's egress policy
 * (confirmed via the agent proxy's /__agentproxy/status — recorded as a
 * policy denial ("gateway answered 403 to CONNECT"), not a transient
 * failure).
 *
 * VERIFIED ON ITS FIRST REAL CI RUN (2026-08-23, PR #31, run 32652774497):
 * every spec here that logs in with these credentials — including
 * login.spec.ts, which predates this PR — failed identically at
 * `page.waitForURL('**\/dashboard**')` right after submitting the login
 * form. Root cause confirmed directly against the live project's own
 * GoTrue auth logs (not guessed): every attempt in that CI run got
 * `400: Invalid login credentials`, consistently, including the very first
 * attempt of the run. Not a network issue (CI reached Supabase fine — the
 * sibling "shows error on invalid credentials" test, which submits
 * deliberately wrong creds, got its error UI back quickly), not MFA (0
 * verified factors on this account), not a ban/deletion/unconfirmed-email
 * (checked directly — none apply). The hardcoded `SentioAI2026!` password
 * for `admin@sentio.ai` simply did not authenticate against this project as
 * configured at the time — a pre-existing gap in every e2e spec that used
 * this credential pair, not something introduced by this journey. The
 * account's password has since been reset — credentials now come from
 * E2E_TEST_EMAIL/E2E_TEST_PASSWORD (see e2e-credentials.ts), never
 * hardcoded.
 */

const ERROR_TEXT_PATTERN = /An error occurred|Unable to load|Your trial has ended/i;

async function assertNoBrokenState(page: Page, label: string) {
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText, `${label} rendered a broken/error state`).not.toMatch(ERROR_TEXT_PATTERN);
}

test.describe('Full user journey — Login → Overview → Accounts → AccountDetail → Segments → Playbooks', () => {
  test('replays the golden path with a real authenticated session, via real UI navigation', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', E2E_EMAIL);
    await page.fill('input[type="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // 2. Overview
    await assertNoBrokenState(page, 'Overview');

    // 3. Accounts — via the sidebar nav link, not page.goto. `exact: true` is
    // required: the sidebar's per-segment links ("Stable 1 accounts", "At risk
    // 0 accounts"...) all contain "accounts" in their accessible name, so a
    // non-exact match resolves to 5 elements (strict-mode violation) instead
    // of the one nav link intended.
    await page.getByRole('link', { name: 'Accounts', exact: true }).click();
    await page.waitForURL('**/accounts**');
    await assertNoBrokenState(page, 'Accounts');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // 4a. AccountDetail (panel) — the real interaction an Accounts-list user
    // has: click a row, a slide-over opens in place rather than navigating.
    //
    // `table tbody tr` alone is not enough: Accounts.tsx renders a real <tr>
    // for the loading skeleton too (5 rows, no onClick), and the table check
    // above passes the instant the <Table> wrapper mounts — before the
    // accounts query resolves. Under real latency the old locator could grab
    // a skeleton row, click it, and get silent nothing (no handler, no
    // error) — exactly the "dialog never opens, zero console errors"
    // signature this test hit in CI. Only real data rows carry
    // `cursor-pointer` (the onClick is on the same element).
    const firstRow = page.locator('table tbody tr.cursor-pointer').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();
    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible({ timeout: 10000 });
    await assertNoBrokenState(page, 'AccountDetail (panel)');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden({ timeout: 5000 });

    // 5. Segments — via the sidebar nav link
    await page.getByRole('link', { name: 'Segments' }).click();
    await page.waitForURL('**/segments**');
    await assertNoBrokenState(page, 'Segments');

    // 4b. AccountDetail (full page) — drill into a segment, then into the
    // standalone /accounts/:id route via the link SegmentDetailView renders.
    // Skips gracefully if this segment/org has no accounts to click through
    // (a real, common state — an empty segment is not a bug).
    const firstSegmentLink = page.locator('a[href^="/segments/"]').first();
    if (await firstSegmentLink.count() > 0) {
      await firstSegmentLink.click();
      await page.waitForURL('**/segments/**');
      await assertNoBrokenState(page, 'SegmentDetail');

      const firstAccountLink = page.locator('a[href^="/accounts/"]').first();
      if (await firstAccountLink.count() > 0) {
        await firstAccountLink.click();
        await page.waitForURL('**/accounts/**');
        await assertNoBrokenState(page, 'AccountDetail (full page)');
      }

      // Back to Segments for a stable jumping-off point into Playbooks.
      await page.getByRole('link', { name: 'Segments' }).click();
      await page.waitForURL('**/segments**');
    }

    // 6. Playbooks — via the sidebar nav link
    await page.getByRole('link', { name: 'Playbooks' }).click();
    await page.waitForURL('**/playbooks**');
    await assertNoBrokenState(page, 'Playbooks');

    expect(pageErrors, 'the journey threw an uncaught page error').toHaveLength(0);
    expect(consoleErrors, 'the journey logged a console error').toHaveLength(0);
  });
});
