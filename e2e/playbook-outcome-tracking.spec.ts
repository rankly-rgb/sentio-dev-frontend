import { test, expect } from '@playwright/test';

// Requires a live backend with the "Playbook Outcome Tracking" contract deployed
// (POST/GET playbook-execute/{id}/mark-executed, unmark-executed, attribution-status,
// nudge-response, and GET playbook-outcome-stats) plus at least one workflow playbook
// with executions on the seeded test account. Not runnable in this sandbox (no browser,
// no live backend) — written to the spec's acceptance scenarios per T007/T014/T020.
test.describe('Playbook outcome tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@sentio.ai');
    await page.fill('input[type="password"]', 'SentioAI2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  // US1 — Acceptance Scenario 2: mark button is replaced by the attribution
  // window indicator, and does not reappear on a fresh visit
  test('marking a workflow execution as executed shows the attribution window and hides the button', async ({ page }) => {
    await page.goto('/playbooks');
    await page.getByText('Workflows').click();
    await page.locator('a, [role="button"]').filter({ hasText: /./ }).first().click();
    await page.getByRole('tab', { name: /executions/i }).click();

    const markButton = page.getByRole('button', { name: /mark as executed/i }).first();
    await expect(markButton).toBeVisible();
    await markButton.click();

    await expect(page.getByText(/remaining/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /mark as executed/i })).toHaveCount(0);

    await page.reload();
    await page.getByRole('tab', { name: /executions/i }).click();
    await expect(page.getByText(/remaining/i).first()).toBeVisible({ timeout: 10000 });
  });

  // US1 — FR-003: cancel affordance is available within 5 minutes of marking,
  // and puts the row back into "not executed" state
  test('cancelling a mark within the 5-minute window restores the mark-executed button', async ({ page }) => {
    await page.goto('/playbooks');
    await page.getByText('Workflows').click();
    await page.locator('a, [role="button"]').filter({ hasText: /./ }).first().click();
    await page.getByRole('tab', { name: /executions/i }).click();

    const markButton = page.getByRole('button', { name: /mark as executed/i }).first();
    await markButton.click();

    const cancelButton = page.getByRole('button', { name: /cancel/i }).first();
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
    await cancelButton.click();

    await expect(page.getByRole('button', { name: /mark as executed/i }).first()).toBeVisible({ timeout: 10000 });
  });

  // US2 — Acceptance Scenarios 1 & 2: both rates + sample sizes visible, or an
  // explicit insufficient-sample message instead of a misleading rate
  test('resolution rate view shows both groups or an insufficient-sample message', async ({ page }) => {
    await page.goto('/playbooks/resolution-rate');
    await expect(page.getByText('Executed vs. non-executed resolution rate')).toBeVisible();

    const hasRateNumbers = await page.getByText('%').first().isVisible().catch(() => false);
    const hasInsufficientMessage = await page.getByText(/insufficient data/i).first().isVisible().catch(() => false);
    expect(hasRateNumbers || hasInsufficientMessage).toBe(true);
  });

  // US3 — Acceptance Scenarios 1 & 2: nudge appears post-expiration and does not
  // reappear once answered
  test('outcome nudge appears once the attribution window has expired and disappears after a response', async ({ page }) => {
    // Requires a seeded execution whose attribution_deadline_at is already in the past
    await page.goto('/playbooks');
    await page.getByText('Workflows').click();
    await page.locator('a, [role="button"]').filter({ hasText: /./ }).first().click();
    await page.getByRole('tab', { name: /executions/i }).click();

    const nudge = page.getByText('Did this playbook help?').first();
    await expect(nudge).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Yes' }).first().click();
    await expect(page.getByText('Did this playbook help?')).toHaveCount(0);
    await expect(page.getByText(/feedback: helped/i)).toBeVisible();
  });
});
