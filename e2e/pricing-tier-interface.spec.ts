import { test, expect } from '@playwright/test';

// Requires a live backend with the "Pricing & Billing" contract deployed (GET
// pricing-status, POST sentio-billing/subscribe) plus seeded test organizations at
// different plan tiers (free/growth for US2, scale/enterprise for US3). Not runnable in
// this sandbox (no browser, no live backend) — written per the spec's acceptance
// scenarios for T012/T016.
test.describe('Pricing tier interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@sentio.ai');
    await page.fill('input[type="password"]', 'SentioAI2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  // US1 — Acceptance Scenarios 1 & 2
  test('dashboard shows the current tier and either a progress ratio or "Unlimited"', async ({ page }) => {
    await expect(page.getByText('Current plan')).toBeVisible();
    const hasRatio = await page.getByText(/accounts tracked/).first().isVisible().catch(() => false);
    const hasUnlimited = await page.getByText('Unlimited accounts').isVisible().catch(() => false);
    expect(hasRatio || hasUnlimited).toBe(true);
  });

  // US2 — Acceptance Scenario 2 (requires a seeded Free/Growth org): call proposal
  // appears only on /onboarding/stripe, not before/elsewhere
  test('Free/Growth org sees no call proposal outside the Stripe-connect screen, but sees it there', async ({ page }) => {
    await expect(page.getByText('Want a higher account limit or a custom plan?')).toHaveCount(0);

    await page.goto('/onboarding/stripe');
    await expect(page.getByText('Want a higher account limit or a custom plan?')).toBeVisible({ timeout: 10000 });
  });

  // Core of this task: clicking "Upgrade to Growth" must never look like it silently
  // succeeded — it should end in an explicit "not available yet" state
  test('upgrading to Growth shows an explicit "coming soon" state instead of a fake success', async ({ page }) => {
    const upgradeButton = page.getByRole('button', { name: 'Upgrade to Growth' });
    await expect(upgradeButton).toBeVisible();
    await upgradeButton.click();

    await expect(page.getByText('Online payment coming soon')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Upgrade to Growth' })).toHaveCount(0);
  });

  // US3 — SC-002 (requires a seeded Scale/Enterprise org): 100% of Scale/Enterprise
  // orgs never see a self-serve CTA across tested screens, including Stripe
  test('Scale/Enterprise org only ever sees "Request a meeting", including on the Stripe-connect screen', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Upgrade to Growth' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Request a meeting' })).toBeVisible();

    await page.goto('/onboarding/stripe');
    await expect(page.getByRole('button', { name: 'Request a meeting' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Want a higher account limit or a custom plan?')).toHaveCount(0);
  });
});
