# Sentio AI SaaS — Frontend

## Stack
- Vite 5 + React 18 + React Router v6 (SPA, PAS Next.js)
- UI: Tailwind CSS 3 + shadcn/ui (Radix) + lucide-react
- Data: Supabase JS + React Query v5 (TanStack)
- Charts: Recharts | Forms: react-hook-form + zod
- I18n: objet `fr` dans `src/i18n/fr.ts`
- Path alias: `@/*` → `./src/*`

## Commandes
- `npm run build` — tsc -b && vite build
- `npm run test` — vitest run
- `npm run test:watch` — vitest (watch mode)
- `npm run test:e2e` — playwright test
- `npm run lint` — eslint .
- `npm run dev` — vite (port 8080)

## Règles strictes
- IMPORTANT: TypeScript `strict: true` — JAMAIS de `any`, `as any`, `@ts-ignore`, `@ts-expect-error`
- YOU MUST exécuter `npx tsc --noEmit` avant de considérer une tâche terminée
- YOU MUST exécuter `npm run build` pour vérifier que le build passe
- Toute l'interface est en français (traductions dans `src/i18n/fr.ts`)
- Zero PII côté client — pas d'email/nom affiché (uniquement IDs Stripe anonymes)
- DOMPurify.sanitize() obligatoire sur tout `dangerouslySetInnerHTML`

## Architecture
- Frontend UNIQUEMENT dans ce repo — backend = Edge Functions Supabase (repo séparé)
- Pas de Next.js API routes — Edge Functions appelées directement depuis le navigateur
- `useQuery`/`useMutation` partout — JAMAIS `useEffect` + `fetch` / `useState` + `try/catch`
- Code splitting via `manualChunks` dans `vite.config.ts`
- Appels Edge Functions : `invokeWithServiceRole<T>()` ou `fetchWithUserJwt<T>()`

## Fichiers clés
- `src/contexts/AuthContext.tsx` — session + profil, onAuthStateChange
- `src/lib/supabase.ts` — client Supabase browser
- `src/lib/invokeEdgeFunction.ts` — appels Edge Functions (service_role)
- `src/components/ErrorBoundary.tsx` — error boundary global (dans AuthProvider)
- `src/hooks/` — tous les hooks React Query (usePlaybooks, useInsights, useManualSync…)
- `src/lib/types/` — types métier (playbook.ts, accounts.ts)
- `src/types/` — types Supabase (database.ts, insights.ts, ops.ts)

## Patterns
- AuthContext : `queryClient.clear()` au logout, profilePromiseRef pour race condition
- Hooks : `enabled: !!user?.organization_id` systématique
- Mutations : `retry: false`, optimistic updates avec rollback `onError`
- Queries : retry intelligent (skip 401/403/404), gcTime 10min
- Composants : ErrorBoundary wrapping DANS AuthProvider

## Conventions Git
- Commits en anglais, préfixés : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Une branche par tâche : `feature/*`, `fix/*`, `refactor/*`

## Tests
- Vitest + @testing-library/react pour les tests unitaires
- Playwright pour les tests E2E
- Écrire le test AVANT l'implémentation quand c'est possible

## Quand compacter
Préserver : liste des fichiers modifiés, commandes de test, erreurs en cours de résolution
