// Shared e2e login credentials — sourced from environment variables, never
// hardcoded. Locally: set E2E_TEST_EMAIL/E2E_TEST_PASSWORD in your shell
// before running `npm run test:e2e`. In CI: set as GitHub Actions repo
// secrets (Settings → Secrets and variables → Actions) and passed through
// via `.github/workflows/ci.yml`'s e2e job `env:` block.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — required for e2e tests that log in`);
  }
  return value;
}

export const E2E_EMAIL = requireEnv('E2E_TEST_EMAIL');
export const E2E_PASSWORD = requireEnv('E2E_TEST_PASSWORD');
