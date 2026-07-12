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
});
