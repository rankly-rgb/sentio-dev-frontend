/// <reference types="vite/client" />

// Fusionne avec l'ImportMetaEnv de vite/client (dont les clés VITE_* sont
// sinon typées `any`, interdit par la règle TypeScript stricte du projet).
interface ImportMetaEnv {
  /** DSN Sentry du projet `sentio-frontend`. Absent en dev → Sentry no-op. */
  readonly VITE_SENTRY_DSN?: string;
}
