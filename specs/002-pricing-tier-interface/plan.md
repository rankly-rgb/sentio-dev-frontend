# Implementation Plan: Interface différenciée selon le palier tarifaire

**Branch**: `feature/chantier-d-pricing-tiers` | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-pricing-tier-interface/spec.md`

## Summary

Ajouter, côté frontend uniquement, un affichage du palier tarifaire de l'organisation
et de sa progression vers la limite de comptes actifs suivis, ainsi qu'une
différenciation de CTA d'abonnement selon le palier : self-serve par défaut pour
Free/Growth (avec proposition d'appel uniquement à la connexion de la clé Stripe), et
"demander un rendez-vous" exclusif et sans alternative pour Scale/Enterprise. Ce plan
consomme un état de palier fourni par l'API ; il ne recalcule ni ne décide d'aucune
logique métier de palier ou de bascule self-serve/RDV — cette dernière est déjà active
par défaut côté backend (chantier A confirmé livré).

## Technical Context

**Language/Version**: TypeScript (strict, cible ES5) sur React 18

**Primary Dependencies**: React Query v5 (TanStack) pour le hook d'état de palier,
shadcn/ui (Radix) + Tailwind (`Progress`, `Card`, `Button`) pour l'affichage,
react-router-dom pour le placement contextuel du CTA d'appel à l'étape de connexion
Stripe (`/onboarding/stripe` existant)

**Storage**: N/A côté frontend — l'état de palier, la limite de comptes et
l'indicateur self-serve/RDV sont entièrement backend

**Testing**: Vitest + @testing-library/react (unitaire, notamment les branches
self-serve vs RDV selon palier), Playwright (E2E) — tests écrits avant
l'implémentation quand possible

**Target Platform**: Web (SPA Vite), affiché dans l'app authentifiée (dashboard/
settings) et dans le flux d'onboarding existant (`/onboarding/stripe`) — aucune
implication SEO/SSR

**Project Type**: Frontend uniquement (web application, un seul projet — ce repo)

**Performance Goals**: Cohérent avec les patterns existants (staleTime 5min type
`useTrialStatus`/`useBenchmarkData`) — pas d'exigence de performance spécifique

**Constraints**: Zero-PII (principe I) ; TypeScript strict/ES5 (principe III) ; UI
100% anglais (principe IV) ; toute donnée API doit respecter un contrat documenté
(principe V) — contrat désormais documenté pour le palier (dont "Scale"), la
progression de comptes et l'indicateur self-serve/RDV (§ "Pricing & Billing",
`API_CONTRACTS.md` à la racine de ce repo, fusionné le 2026-07-27 depuis
`sentio-dev-backend` ; distinct de `docs/API_CONTRACTS.md`, qui est le contrat
Scoring Engine V2 et ne contient qu'une copie non corrigée de cette section),
**marqué provisoire par le backend** ("spec en cours, pas encore livré", pas
encore mergé côté `sentio-dev-backend`) ; le CTA "demander un rendez-vous" ouvre
un lien externe statique via `VITE_APPOINTMENT_BOOKING_URL` (pas d'appel API —
voir Dependencies #4) ; le paiement self-serve Growth (`POST
/sentio-billing/subscribe`, §8.3) appelle directement l'API Stripe Subscriptions
et non Stripe Checkout — aucune collecte de moyen de paiement n'est possible
aujourd'hui côté frontend, voir Dependencies #5 ; le frontend ne doit jamais
décider lui-même du palier ou de la bascule self-serve/RDV (contrainte explicite
de la spec, FR-007)

**Scale/Scope**: 3 user stories (P1/P2/P3), modification de composants existants
(dashboard/settings pour l'affichage palier, `StripeConnect.tsx` pour le CTA d'appel
contextuel), pas de nouvelle page de routing majeure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Note |
|---|---|---|
| I. Zero-PII | ✅ PASS | Aucune donnée personnelle affichée ; uniquement palier, compteurs de comptes, CTA |
| II. Stack & Structure | ✅ PASS | Reste dans Vite/React/TS, modifications dans `src/pages`/`src/components` existants |
| III. TypeScript strict, ES5 | ✅ PASS | Aucune syntaxe non-ES5 anticipée |
| IV. English-Only UI | ✅ PASS | Tous les libellés UI seront en anglais |
| V. API Contract Compliance | ⚠️ **GATE PARTIEL** | Contrat documenté dans `API_CONTRACTS.md` (racine, § "Pricing & Billing") : `GET /pricing-status` couvre les 4 paliers (`free\|growth\|scale\|enterprise`, `starter` supprimé), `active_accounts_count`/`max_active_accounts`/`usage_pct`, et `requires_appointment` (indicateur self-serve/RDV explicite) — **mais marqué provisoire par le backend** ("pas encore livré", non mergé côté `sentio-dev-backend`). Le mécanisme du CTA "demander un rendez-vous" est hors gate (lien externe statique via `VITE_APPOINTMENT_BOOKING_URL`). Le paiement self-serve Growth (§8.3) reste un gap **produit/technique non tranché** côté backend lui-même (pas un manque de documentation frontend) : aucun `client_secret`/URL Checkout n'est renvoyé, donc aucune collecte de moyen de paiement n'est possible — géré côté frontend par un état explicite plutôt qu'un bouton qui semble fonctionner. |
| Edits ciblés (str_replace) | ✅ PASS applicable à l'implémentation |
| Identité graphique figée | ✅ PASS | Réutilisation des composants shadcn/ui existants (`Progress`, `Card`, `Button`), pas de nouvelle palette |

**Verdict** : `/speckit-tasks` peut être lancé — le palier "Scale", l'indicateur
self-serve/RDV et le mécanisme du CTA RDV sont désormais clarifiés (voir
Dependencies). `/speckit-implement` reste bloqué uniquement tant que le contrat
`API_CONTRACTS.md` § "Pricing & Billing" n'est pas mergé côté backend
(US1/US2/US3-display en dépendent) ; le clic du CTA RDV (T017) n'a plus de
dépendance backend. Le paiement Growth self-serve (§8.3) est implémenté pour de
vrai contre le contrat réel, mais reste un flux non complétable bout-en-bout
tant que le backend n'a pas tranché la collecte de moyen de paiement — traité
comme une limitation connue et assumée, jamais simulé comme fonctionnel.

## Project Structure

### Documentation (this feature)

```text
specs/002-pricing-tier-interface/
├── spec.md                          # Spécification (User Stories 1-3, FR-001..008)
├── plan.md                          # Ce fichier
└── checklists/
    └── requirements.md              # Checklist qualité de la spec
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── types/
│       └── plan-tier.ts             # Nouveau : PricingStatus (plan_tier: 'free'|
│                                     # 'growth'|'scale'|'enterprise', active_accounts_count,
│                                     # max_active_accounts, usage_pct, alert_active,
│                                     # requires_appointment) — per API_CONTRACTS.md
│                                     # § "Pricing & Billing" 8.1 ; noter que
│                                     # `src/lib/types/trial.ts` (`PlanType`) est obsolète —
│                                     # contient encore 'starter' (supprimé par le contrat)
│                                     # et pas 'scale' ; ne pas réutiliser tel quel ; ce
│                                     # fichier type aussi SubscribeToPlanPayload/Result (§8.3)
├── hooks/
│   ├── usePlanTierStatus.ts         # Nouveau hook (query) — état de palier consommé
│   │                                 # tel quel depuis l'API, aucune logique de
│   │                                 # décision côté frontend
│   └── useSubscribeToPlan.ts        # Nouveau hook (mutation) — POST /sentio-billing/subscribe
│                                     # ; invalide pricing-status au succès
├── components/
│   └── billing/
│       ├── PlanTierProgress.tsx     # Nouveau — affichage palier + progression
│       │                             # vers limite de comptes (Story 1)
│       └── SubscriptionCta.tsx      # Nouveau — CTA self-serve ou "demander un
│                                     # rendez-vous" selon palier/contexte (Stories 2-3) ;
│                                     # le clic RDV ouvre VITE_APPOINTMENT_BOOKING_URL
│                                     # (lien externe statique, pas d'appel API) ; le clic
│                                     # "Upgrade to Growth" appelle useSubscribeToPlan pour
│                                     # de vrai, puis affiche un état "coming soon" explicite
│                                     # si status !== 'active' (voir Dependencies #5)
└── pages/
    └── onboarding/
        └── StripeConnect.tsx        # Existant — modification ciblée (str_replace)
                                      # pour insérer la proposition d'appel Free/Growth
                                      # uniquement à cet endroit (Story 2)

tests/
├── unit/
│   ├── usePlanTierStatus.test.ts
│   ├── PlanTierProgress.test.tsx
│   └── SubscriptionCta.test.tsx     # Couvre les 3 branches : Free/Growth hors Stripe,
│                                     # Free/Growth sur écran Stripe, Scale/Enterprise
└── e2e/
    └── pricing-tier-interface.spec.ts
```

**Structure Decision**: Frontend uniquement, dans l'arborescence existante
(`src/lib/types`, `src/hooks`, nouveau dossier `src/components/billing/` pour isoler
ces composants d'abonnement, modification ciblée de `src/pages/onboarding/
StripeConnect.tsx` existant). Pas de nouvelle route — l'affichage palier/progression
s'intègre dans les écrans existants (dashboard et/ou settings, à confirmer selon
maquette), et le CTA d'appel contextuel s'insère dans l'écran Stripe déjà en place.

## Complexity Tracking

Aucune violation de la constitution ne nécessite de justification de complexité (la
seule non-conformité actuelle — principe V, API Contract Compliance — est un gate
bloquant de dépendance externe, pas un choix de complexité à justifier).

## Dependencies (backend)

Statut au 2026-07-27, contrat provisoire `API_CONTRACTS.md` § "Pricing & Billing"
(fichier à la racine de ce repo — fusion de `sentio-dev-backend` `main` +
`feat/pricing-billing-implementation` (commit `f97d9f4`) ; distinct de
`docs/API_CONTRACTS.md`, le contrat Scoring Engine V2 sans rapport, qui ne porte
qu'une copie non corrigée de cette section datée du 2026-07-26 ; non mergé côté
backend — à re-vérifier avant que ce chantier ne soit considéré livré) :

1. **État de palier complet** — ✅ documenté : `GET /pricing-status` retourne
   `plan_tier` (`'free'|'growth'|'scale'|'enterprise'`, non nullable). Décision produit
   confirmée dans le contrat (2026-07-26) : `starter` supprimé, ne plus jamais l'attendre
   côté frontend — `PlanType` dans `src/lib/types/trial.ts` est donc obsolète pour ce
   chantier (garde `'starter'`, n'a pas `'scale'`) ; ne pas le réutiliser tel quel pour
   `plan-tier.ts`.
2. **Limite et progression de comptes actifs suivis** — ✅ documenté :
   `active_accounts_count` (non nullable, `COUNT(*) ... WHERE mrr_cents > 0`),
   `max_active_accounts` (nullable, `null` = illimité), `usage_pct` (nullable, `null`
   si illimité, peut dépasser 100 en cas de dépassement de palier), `alert_active`
   (`true` si `usage_pct >= alert_threshold_pct`, défaut 90).
3. **Indicateur self-serve/RDV explicite** — ✅ documenté : `requires_appointment`
   (boolean, `true` pour `scale`/`enterprise`) — le frontend consomme ce champ tel
   quel, ne dérive rien lui-même (FR-007 respecté par construction).
4. **Mécanisme de "demander un rendez-vous"** — ✅ **résolu, aucune dépendance
   backend**. Décision produit (2026-07-27) : le CTA RDV ouvre un lien externe
   statique (type Calendly), configuré via la variable d'environnement
   `VITE_APPOINTMENT_BOOKING_URL` — pas d'appel API, pas d'endpoint de génération
   de lien. `SubscriptionCta.tsx` lit cette variable et ouvre l'URL dans un nouvel
   onglet au clic (`window.open(url, '_blank', 'noopener,noreferrer')`). La valeur
   réelle de l'URL est un placeholder documenté dans `.env.example` ("à remplacer
   avant implémentation") — à ne jamais deviner ni coder en dur. Ce point ne
   dépend donc plus du contrat backend `POST /sentio-billing/subscribe` (§8.3) ni
   du dossier `specs/003-pricing-billing-implementation/` (toujours absent de ce
   repo, écart sans impact désormais pour ce chantier).
5. **Paiement self-serve Growth** — ⚠️ **documenté, mais gap produit/technique ouvert
   côté backend lui-même** (pas un manque de contrat). `POST /sentio-billing/subscribe`
   (§8.3, corrigé le 2026-07-27) appelle l'API Stripe `Subscriptions` directement
   (`payment_behavior: default_incomplete`) — **pas Stripe Checkout, pas de Billing
   Portal**. Réponse synchrone `{ organization_id, plan_tier, status, current_period_end? }`,
   sans `client_secret` ni URL de redirection. Concrètement : downgrade vers `free`
   fonctionne bout-en-bout (`status: "active"` immédiat), mais upgrade vers `growth`
   ne peut aujourd'hui aboutir à un paiement réel — Stripe attend une confirmation de
   moyen de paiement que rien ne permet de collecter. Traité côté frontend comme une
   limitation connue et assumée (état explicite "coming soon" après l'appel réel),
   jamais comme un flux qui semble fonctionner — voir `SubscriptionCta.tsx` et la note
   sous le Checkpoint de tasks.md.

`src/lib/types/plan-tier.ts` peut désormais typer `PricingStatus` sur la forme
ci-dessus (points 1-3), ainsi que `SubscribeToPlanPayload`/`SubscribeToPlanResult`
(point 5). Le mécanisme du CTA RDV (point 4) est un lien externe statique via
variable d'environnement, sans dépendance backend — voir T017.
