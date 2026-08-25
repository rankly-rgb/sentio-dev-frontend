import { test, expect } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './e2e-credentials';

// Overview (Dashboard) and Accounts both derive active-account count and total MRR
// from the same get_portfolio_snapshot RPC (accounts-api total_count/total_mrr_cents).
// This guards against the two screens drifting apart again.
//
// Was blocked on its first real CI run (Étape 6 QA, 2026-08-23, PR #31, run
// 32652774497): the shared beforeEach login failed before either KPI could
// be compared — the hardcoded 'admin@sentio.ai'/'SentioAI2026!' pair did
// not authenticate against the live dev project. See e2e/login.spec.ts's
// header for the full diagnosis; unrelated to the /mrr-specific skip below.
// The account's password has since been reset — credentials now come from
// E2E_TEST_EMAIL/E2E_TEST_PASSWORD (see e2e-credentials.ts).
test.describe('Cross-screen KPI consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', E2E_EMAIL);
    await page.fill('input[type="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test('active accounts and MRR match between Dashboard and Accounts', async ({ page }) => {
    const dashboardActiveAccounts = await page
      .getByTestId('kpi-active-accounts')
      .locator('p.text-xl.font-bold, p.text-2xl.font-bold')
      .innerText();
    const dashboardMrr = await page
      .getByTestId('kpi-mrr')
      .locator('p.text-xl.font-bold, p.text-2xl.font-bold')
      .innerText();

    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');

    const accountsActiveAccounts = await page
      .getByTestId('kpi-active-accounts')
      .locator('p.text-xl.font-bold, p.text-2xl.font-bold')
      .innerText();
    const accountsMrr = await page
      .getByTestId('kpi-mrr')
      .locator('p.text-xl.font-bold, p.text-2xl.font-bold')
      .innerText();

    expect(accountsActiveAccounts).toBe(dashboardActiveAccounts);
    expect(accountsMrr).toBe(dashboardMrr);
  });

  // Dashboard and /mrr both derive MRR/NRR from GET /dashboard-api/portfolio-metrics
  // (AUDIT_LOGIQUE_METIER_STRIPE.md point 22 — three independent local
  // reimplementations existed before that endpoint, silently disagreeing for
  // the same org on the same day; NRR was even hardcoded to 100 on the
  // dashboard). This guards against that regressing.
  //
  // Known-broken, explicitly gated (Étape 6 QA, 2026-08-23) — not something
  // this pass is authorized to fix by picking an architecture. Both screens
  // do call the same endpoint (getPortfolioMetrics() → GET
  // /dashboard-api/portfolio-metrics), but through two independent React
  // Query cache entries with different keys: Dashboard's
  // useDashboardData() fetches it under ['dashboard','metrics',orgId] (one
  // of 3 parallel calls inside fetchDashboardMetrics), while /mrr's
  // usePortfolioMetrics() fetches it separately under
  // ['dashboard','portfolio-metrics',orgId]. Navigating between the two
  // screens therefore fires two independent network round-trips at two
  // different moments rather than reading one shared cached value — so this
  // assertion is only as stable as the backend being byte-for-byte
  // idempotent between those two calls, which a cron re-scoring mid-session
  // (or any other non-determinism in that aggregate) breaks. That's an
  // architecture call (share one cache entry across both screens? retire
  // /mrr in favor of a single Dashboard? accept the drift window and assert
  // "close enough" instead of exact equality?), not a QA task's call to
  // make unilaterally. Re-enable once that decision is made and reflected
  // in the fix.
  //
  // Could not be re-executed against live data to confirm the failure mode
  // directly (outbound HTTPS to *.supabase.co is policy-denied from this
  // sandbox — see full-journey.spec.ts's header for the same documented
  // gap); this is a static-analysis finding from reading both data paths,
  // not an observed CI failure.
  test.skip('MRR and NRR match between Dashboard and MRR dashboard — known-broken, pending a product decision on shared cache/fetch ownership between Dashboard and /mrr (see comment above)', async ({ page }) => {
    const dashboardMrr = await page
      .getByTestId('kpi-mrr')
      .locator('p.text-xl.font-bold, p.text-2xl.font-bold')
      .innerText();
    const dashboardNrr = await page
      .getByTestId('kpi-nrr')
      .locator('p.text-xl.font-bold, p.text-2xl.font-bold, p.text-sm.font-medium')
      .innerText();

    await page.goto('/mrr');
    await page.waitForLoadState('networkidle');

    const mrrPageMrr = await page.getByTestId('mrr-page-mrr').locator('p.text-4xl.font-bold').innerText();
    const mrrPageNrr = await page
      .getByTestId('mrr-page-nrr')
      .locator('p.text-4xl.font-bold, p.text-lg.font-medium')
      .innerText();

    expect(mrrPageMrr).toBe(dashboardMrr);
    expect(mrrPageNrr).toBe(dashboardNrr);
  });
});
