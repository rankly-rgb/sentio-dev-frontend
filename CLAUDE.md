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
- IMPORTANT: The product UI is 100% American English (en-US). Do not add French strings anywhere.
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
- `src/lib/types/` — types métier (playbook.ts, accounts.ts, webhook-destinations.ts)
- `src/types/` — types Supabase (database.ts, insights.ts, ops.ts)

## Actions HubSpot dans les playbooks

Deux types d'actions opérationnelles qui s'intègrent dans les composants existants de création/édition :

- `hubspot_enroll_sequence` : enrôle les contacts HubSpot d'un compte dans une séquence.
  Config : `{ sequence_id: string, sender_id: string }` (sender_id = ID numérique HubSpot)
- `hubspot_update_company` : met à jour des propriétés HubSpot d'une company.
  Config : `{ properties: Record<string, string> }` (ex: `hs_lead_status`, `lifecyclestage`)

Fichiers impactés :
- `src/lib/types/playbook.ts` — `ActionType` union (ajouter les deux types ici si de nouveaux types arrivent)
- `src/components/playbooks/ActionEditor.tsx` — `ACTION_TYPES`, `ACTIVE_ACTIONS`, `defaultConfig()`, `ActionConfigFields` (switch), `PropertyEditor` sub-component pour l'éditeur clé/valeur
- `src/components/playbooks/ActionList.tsx` — `actionIcons` Record + `summarizeConfig()` switch
- `src/components/playbooks/PlaybookActionsSection.tsx` — `ACTION_ICON_CONFIG`
- `src/components/playbooks/ExecutionTimeline.tsx` — badge gris "Ignoré" pour `status: 'skipped'`
- `src/lib/queries/playbook-queries.ts` — `IMPLEMENTED_ACTIONS` set (contrôle badge "Actif" vs "Bientôt")
- `src/i18n/fr.ts` — `playbooks.actionType.*`, `playbooks.actionSkipped`, `playbooks.form.*`

Contrat backend (`POST /functions/v1/playbook-execute`) :
```json
{ "type": "hubspot_enroll_sequence", "order": 1, "config": { "sequence_id": "12345", "sender_id": "98765" } }
{ "type": "hubspot_update_company",  "order": 2, "config": { "properties": { "hs_lead_status": "MQL" } } }
```

Statut d'action `skipped` : retourné quand pas de `hubspot_company_id` associé au compte.
Affiché dans `ExecutionTimeline` avec un badge `bg-gray-100 text-gray-500` + message backend.

## Benchmarks sectoriels (Dashboard)

Section sous les KPIs du dashboard affichant NRR, taux de churn et croissance MRR par rapport aux standards SaaS B2B.

**Fichiers clés :**
- `src/lib/types/benchmark.ts` — `BenchmarkRating`, `MetricBenchmark`, `BenchmarkResponse`, `BenchmarkPeers` (union discriminée `available: true | false`), `PeerPercentiles`
- `src/lib/queries/benchmark-queries.ts` — `getBenchmarkData()` → `GET /dashboard-api/benchmarks` (enveloppe `{ data: ... }`)
- `src/hooks/useBenchmarkData.ts` — hook React Query (`queryKey: ['dashboard', 'benchmark', orgId]`, staleTime 5min)
- `src/components/dashboard/BenchmarkSection.tsx` — composant principal (3 cards, skeleton, error card)

**Logique barre de spectre (`RangeBar`) :**
- 4 zones CSS égales (rouge → orange → bleu → vert), pas de librairie
- `higher_is_better: false` (churn) → ordre inversé (vert à gauche)
- Curseur interpolé via `computeCursorPosition()` : thresholds triés ascending ancrent les positions 25/50/75%
- `value === null` → aucun curseur affiché

**Comparaison pairs (`PeerComparison`) :**
- `peers.available = false` → message italique avec seuil `min_orgs_required`
- `peers.available = true` → affiche p25/p50/p75 + label "au-dessus/en dessous de la médiane" (logique inversée pour churn)

**Contrat API backend :**
```
GET /dashboard-api/benchmarks → { data: BenchmarkResponse }
```

**i18n :** `fr.benchmark.*` — labels, ratings, messages pairs (`aboveMedian`, `belowMedian`, `atMedian`, `peerUnavailable(n)`)

## Destinations webhook sortantes (`/settings/destinations`)
Feature complète permettant de configurer des outils externes (Brevo, Slack, Lemlist,
ActiveCampaign, Mailchimp, custom) qui reçoivent un payload JSON quand un compte est à risque.

Fichiers :
- `src/lib/types/webhook-destinations.ts` — types (`OutboundWebhookDestination`, `SegmentKey`, `LogTrigger`…)
- `src/lib/queries/webhook-destination-queries.ts` — appels Edge Functions via `fetchWithUserJwt`
- `src/hooks/useWebhookDestinations.ts` — hooks React Query (liste, CRUD, test, logs)
- `src/pages/WebhookDestinations.tsx` — page principale, gère les dialogs form + logs
- `src/components/destinations/DestinationsList.tsx` — grille de cartes (test inline, toggle, suppression)
- `src/components/destinations/DestinationForm.tsx` — formulaire contrôlé (pas de `<form>`, validation manuelle)
- `src/components/destinations/DestinationDocPanel.tsx` — aide contextuelle par provider (statique)
- `src/components/destinations/DestinationTestResult.tsx` — affichage résultat test inline
- `src/components/destinations/DestinationLogs.tsx` — tableau des 20 derniers envois

Edge Functions backend attendues :
- `GET/POST outbound-webhook-destinations` — liste et création
- `PATCH/DELETE outbound-webhook-destinations/:id` — mise à jour et suppression
- `POST outbound-webhook-test` — test de connexion `{ destination_id }`
- `GET outbound-webhook-logs?destination_id=&limit=20` — logs de livraison

Providers supportés : `brevo | mailchimp | lemlist | activecampaign | slack | custom`
Segments déclencheurs : `champions | expanding | stable | at_risk | critical | past_due | churned | new`

## Patterns
- AuthContext : `queryClient.clear()` au logout, profilePromiseRef pour race condition
- Hooks : `enabled: !!user?.organization_id` systématique
- Mutations : `retry: false`, optimistic updates avec rollback `onError`
- Queries : retry intelligent (skip 401/403/404), gcTime 10min
- Composants : ErrorBoundary wrapping DANS AuthProvider

## Conventions Git
- Commits en anglais, préfixés : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Une branche par tâche : `feature/*`, `fix/*`, `refactor/*`
- **Avant de démarrer un chantier substantiel** : `git branch -r` sur les deux repos (backend + frontend) et vérifier qu'aucune branche existante (mergée ou non) ne couvre déjà tout ou partie du périmètre. Deux fonctionnalités complètes ont été construites deux fois en juillet 2026 (tracking d'outcome playbook, tiers de pricing) — la seconde implémentation a divergé du nom et de la forme de la première au point de rendre la duplication invisible sans ce contrôle explicite (audit branches 2026-08-06).

## Tests
- Vitest + @testing-library/react pour les tests unitaires
- Playwright pour les tests E2E
- Écrire le test AVANT l'implémentation quand c'est possible

## Flux d'onboarding (`/signup` → `/onboarding/*`)

Feature complète guidant un nouvel utilisateur de l'inscription jusqu'au dashboard.

**Routes (toutes sauf `/signup` wrappées dans `<ProtectedRoute>` sans `<AppLayout>`) :**
- `/signup` — création de compte (Supabase `signUp`), validation inline, redirect → `/onboarding/stripe`
- `/onboarding/stripe` — saisie clé API Stripe restreinte, affiche les permissions requises vs non-requises
- `/onboarding/sync` — attend la fin de la sync Stripe (polling 3s sur `GET /onboarding-status`), timeout 3min
- `/onboarding/hubspot` — connexion OAuth HubSpot (optionnel), lien "Passer" → `/onboarding/done`
- `/onboarding/done` — "First Win" : métriques réelles + top 3 comptes à risque, appelle `PATCH /onboarding-status`

**Guard Dashboard :** `Dashboard.tsx` charge `useOnboardingFlowStatus` et redirige vers `/onboarding/done`
si `onboarding_completed === false && stripe_sync_completed === true`.

**Fichiers clés :**
- `src/lib/types/onboarding-flow.ts` — `OnboardingFlowStatus`, `OnboardingFirstWin`, `OnboardingFirstWinAccount`
- `src/hooks/useOnboardingFlow.ts` — `useOnboardingFlowStatus`, `useOnboardingFirstWin`, `useConnectStripe`, `useMarkOnboardingField`
- `src/components/onboarding/OnboardingHeader.tsx` — header logo + points de progression réutilisable
- `src/pages/onboarding/` — Signup, StripeConnect, SyncWait, HubSpot, Done
- `src/contexts/AuthContext.tsx` — méthode `signUp(email, password, companyName)` exposée

**Contrats API backend (`fetchWithUserJwt`) :**
```
GET  /onboarding-status  → OnboardingFlowStatus
POST /stripe-connect     body: { api_key }
PATCH /onboarding-status body: { field: 'first_win_seen' | 'onboarding_completed', value: true }
GET  /onboarding-first-win → OnboardingFirstWin
GET  /hubspot-oauth-init → redirect OAuth HubSpot (via window.location.href)
```

**Note :** `useOnboardingFlowStatus` (nouveau, `queryKey: ['onboarding-flow-status']`) est distinct
de l'ancien `useOnboardingStatus` (queryKey `['onboarding-status']`) utilisé par `AhaMomentModal`.
Les deux appellent le même endpoint mais avec des shapes de réponse différentes — à unifier côté backend.

## Quand compacter
Préserver : liste des fichiers modifiés, commandes de test, erreurs en cours de résolution

## Spec Kit

Ce repo utilise [GitHub Spec Kit](https://github.com/github/spec-kit) pour structurer le
développement des features substantielles selon un pipeline spec-driven, en cohérence avec
l'installation faite sur sentio-backend.

- **Constitution** : `.specify/memory/constitution.md` — règles non-négociables du projet
  (zero-PII, stack, TypeScript strict/ES5, UI en anglais, contrats API, edits ciblés,
  identité graphique figée, workflow PR/Vercel). Reprise fidèle des règles de ce fichier.
- **Templates** : `.specify/templates/` — gabarits spec/plan/tasks utilisés par les commandes ci-dessous
- **Skills installées** dans `.claude/skills/` :
  - `/speckit-constitution` — établit/modifie les principes du projet (source de vérité : la constitution)
  - `/speckit-specify` — crée la spécification de base d'une feature (le "quoi", pas le "comment")
  - `/speckit-plan` — transforme la spec en plan d'implémentation technique
  - `/speckit-tasks` — génère la liste de tâches actionnables à partir du plan
  - `/speckit-implement` — exécute l'implémentation à partir des tâches générées
  - Skills optionnelles : `/speckit-clarify` (désambiguïser avant `/speckit-plan`),
    `/speckit-analyze` (cohérence croisée avant `/speckit-implement`),
    `/speckit-checklist` (checklist qualité après `/speckit-plan`)

**IMPORTANT** : toute feature substantielle doit passer par ce pipeline
(`specify` → `plan` → `tasks`) avant d'exécuter `/speckit-implement`. Ne pas sauter directement
à l'implémentation pour des features non triviales.
