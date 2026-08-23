import { test, expect } from '@playwright/test';

// The 'admin@sentio.ai' / 'SentioAI2026!' pair used below and by every
// other e2e spec that logs in currently does NOT authenticate against the
// live dev project — confirmed directly against its GoTrue auth logs on
// this file's first real CI run (Étape 6 QA, 2026-08-23, PR #31, run
// 32652774497): every attempt got `400: Invalid login credentials`,
// including the very first attempt of that run, while the sibling "shows
// error on invalid credentials" test below (deliberately wrong creds) got
// its error UI back normally — so this is a real credential problem, not a
// network/timeout/MFA/ban issue (all checked and ruled out; see
// e2e/five-screens-smoke.spec.ts's header for the full diagnosis). Needs
// the actual current credentials or a password reset on this account, not
// a code change — flagging here since this file established the pattern
// every other login-dependent spec still copies.
test.describe('Login page', () => {
  test('displays the login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sentio AI')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'fake@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should show an error message (fr.auth.invalidCredentials)
    await expect(page.locator('.text-destructive')).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated users are redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login**', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('navigates to dashboard on successful login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@sentio.ai');
    await page.fill('input[type="password"]', 'SentioAI2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });
});

test.describe('Navigation (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@sentio.ai');
    await page.fill('input[type="password"]', 'SentioAI2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test('sidebar navigation links work', async ({ page }) => {
    // Check that key nav items are visible in the sidebar
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('can navigate to accounts page', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
    // Should not redirect to login
    expect(page.url()).toContain('/accounts');
  });

  test('can navigate to insights page', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/insights');
  });
});
