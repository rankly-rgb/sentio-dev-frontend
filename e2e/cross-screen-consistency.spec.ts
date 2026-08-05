import { test, expect } from '@playwright/test';

// Overview (Dashboard) and Accounts both derive active-account count and total MRR
// from the same get_portfolio_snapshot RPC (accounts-api total_count/total_mrr_cents).
// This guards against the two screens drifting apart again.
test.describe('Cross-screen KPI consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@sentio.ai');
    await page.fill('input[type="password"]', 'SentioAI2026!');
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
  test('MRR and NRR match between Dashboard and MRR dashboard', async ({ page }) => {
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
