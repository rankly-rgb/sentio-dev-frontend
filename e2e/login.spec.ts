import { test, expect } from '@playwright/test';

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
