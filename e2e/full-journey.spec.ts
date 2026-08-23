import { test, expect, type Page } from '@playwright/test';

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
 * Like five-screens-smoke.spec.ts, this could not be executed against live
 * data from the authoring sandbox: outbound HTTPS to *.supabase.co is
 * denied by this session's egress policy (confirmed via the agent proxy's
 * /__agentproxy/status — recorded as a policy denial ("gateway answered 403
 * to CONNECT"), not a transient failure). Must be verified on its first
 * real CI run, same as that spec.
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
    await page.fill('input[type="email"]', 'admin@sentio.ai');
    await page.fill('input[type="password"]', 'SentioAI2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // 2. Overview
    await assertNoBrokenState(page, 'Overview');

    // 3. Accounts — via the sidebar nav link, not page.goto
    await page.getByRole('link', { name: 'Accounts' }).click();
    await page.waitForURL('**/accounts**');
    await assertNoBrokenState(page, 'Accounts');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // 4a. AccountDetail (panel) — the real interaction an Accounts-list user
    // has: click a row, a slide-over opens in place rather than navigating.
    const firstRow = page.locator('table tbody tr').first();
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
