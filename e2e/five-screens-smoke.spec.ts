import { test, expect, type Page } from '@playwright/test';

/**
 * a16 (incident 2026-08-13, tour 5): a13 on the backend proves the Edge
 * Functions respond with real data. It cannot prove a screen actually
 * renders — the whole incident was a real, deterministic 402 that a real
 * browser turned into a broken-looking page while every backend endpoint
 * was individually healthy. This is the client-side equivalent of a13:
 * load the five main screens with a real authenticated session and fail
 * on either a rendered error state or a console/page error, exactly the
 * gap a13 alone leaves open.
 *
 * Real Playwright, not the degraded (HTTP + component-render) fallback —
 * this repo already has a working headless Chromium + `npm run dev`
 * Playwright setup (see playwright.config.ts, e2e/login.spec.ts), and CI
 * runners have full internet access to the real Supabase backend, unlike
 * the sandbox this was authored in (confirmed blocked outbound to
 * *.supabase.co and app.sentioapp.io from that sandbox — see the incident
 * report). This test could not be executed end-to-end from that sandbox
 * for that reason; it must be verified on its first real CI run.
 */

const SCREENS = [
  { path: '/today', label: 'Today' },
  { path: '/dashboard', label: 'Overview' },
  { path: '/accounts', label: 'Accounts' },
  { path: '/segments', label: 'Segments' },
  { path: '/playbooks', label: 'Playbooks' },
];

// Any of these visible on a screen means it rendered a broken/error state —
// including the trial-expired state, which is a real terminal error state
// for a16's purposes even though it's now the *intended* one for an
// expired-trial org (see TrialExpiredState). a16 runs against a known-good
// paid account (see login.spec.ts's credentials), so it should never appear
// here; if it does, something regressed either in account state or in
// how a gated endpoint is being called.
const ERROR_TEXT_PATTERN = /An error occurred|Unable to load|Your trial has ended/i;

async function assertScreenHealthy(page: Page, path: string, label: string) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (msg: import('@playwright/test').ConsoleMessage) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  };
  const onPageError = (err: Error) => pageErrors.push(err.message);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  await page.goto(path);
  await page.waitForLoadState('networkidle');
  // Give React Query a moment to settle past the loading skeleton.
  await page.waitForTimeout(1500);

  page.off('console', onConsole);
  page.off('pageerror', onPageError);

  const bodyText = await page.locator('body').innerText();

  expect(bodyText, `${label} (${path}) rendered a broken/error state`).not.toMatch(ERROR_TEXT_PATTERN);
  expect(pageErrors, `${label} (${path}) threw an uncaught page error`).toHaveLength(0);
  expect(consoleErrors, `${label} (${path}) logged a console error`).toHaveLength(0);
}

test.describe('a16 — five main screens render without error, real session', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@sentio.ai');
    await page.fill('input[type="password"]', 'SentioAI2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  for (const screen of SCREENS) {
    test(`${screen.label} renders without an error state`, async ({ page }) => {
      await assertScreenHealthy(page, screen.path, screen.label);
    });
  }
});
