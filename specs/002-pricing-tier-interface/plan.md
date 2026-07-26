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
dans `docs/API_CONTRACTS.md` (principe V) — contrat désormais documenté pour le
palier (dont "Scale"), la progression de comptes et l'indicateur self-serve/RDV
(§ "Pricing & Billing", `docs/API_CONTRACTS.md`), **marqué provisoire par le
backend** ("spec en cours, pas encore livré", pas encore mergé) ; le mécanisme concret
du CTA "demander un rendez-vous" reste non documenté — voir Dependencies ; le frontend
ne doit jamais décider lui-même du palier ou de la bascule self-serve/RDV (contrainte
explicite de la spec, FR-007)

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
| V. API Contract Compliance | ⚠️ **GATE PARTIEL** | Contrat documenté dans `docs/API_CONTRACTS.md` (§ "Pricing & Billing") : `GET /pricing-status` couvre les 4 paliers (`free\|growth\|scale\|enterprise`, `starter` supprimé), `active_accounts_count`/`max_active_accounts`/`usage_pct`, et `requires_appointment` (indicateur self-serve/RDV explicite) — **mais marqué provisoire par le backend** ("pas encore livré", non mergé) **et le mécanisme concret du CTA "demander un rendez-vous" (lien/action) n'est toujours pas documenté** (le contrat ne couvre que `POST /sentio-billing/subscribe`, côté self-serve). **Ce plan ne doit pas inventer cette forme de données** — voir Dependencies. |
| Edits ciblés (str_replace) | ✅ PASS applicable à l'implémentation |
| Identité graphique figée | ✅ PASS | Réutilisation des composants shadcn/ui existants (`Progress`, `Card`, `Button`), pas de nouvelle palette |

**Verdict** : `/speckit-tasks` peut être lancé — le palier "Scale" et l'indicateur
self-serve/RDV sont désormais clarifiés (3 des 4 dépendances couvertes).
`/speckit-implement` reste bloqué tant que (a) le contrat n'est pas mergé côté
backend et (b) le mécanisme du CTA "demander un rendez-vous" n'est pas documenté
(voir Dependencies).

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
│                                     # requires_appointment) — per docs/API_CONTRACTS.md
│                                     # § "Pricing & Billing" 8.1 ; le mécanisme du CTA RDV
│                                     # (lien/action derrière "demander un rendez-vous")
│                                     # reste non documenté, NE PAS l'inventer ; noter que
│                                     # `src/lib/types/trial.ts` (`PlanType`) est obsolète —
│                                     # contient encore 'starter' (supprimé par le contrat)
│                                     # et pas 'scale' ; ne pas réutiliser tel quel
├── hooks/
│   └── usePlanTierStatus.ts         # Nouveau hook (query) — état de palier consommé
│                                     # tel quel depuis l'API, aucune logique de
│                                     # décision côté frontend
├── components/
│   └── billing/
│       ├── PlanTierProgress.tsx     # Nouveau — affichage palier + progression
│       │                             # vers limite de comptes (Story 1)
│       └── SubscriptionCta.tsx      # Nouveau — CTA self-serve ou "demander un
│                                     # rendez-vous" selon palier/contexte (Stories 2-3)
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

Statut au 2026-07-26, contrat provisoire `docs/API_CONTRACTS.md` § "Pricing & Billing"
(non mergé côté backend — à re-vérifier avant `/speckit-implement`) :

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
4. **Mécanisme de "demander un rendez-vous"** — ⚠️ **toujours non documenté**. Le
   contrat couvre `POST /sentio-billing/subscribe` + webhook `sentio-billing-webhook`
   côté self-serve uniquement (§8.3) ; aucune forme n'est donnée pour l'action derrière
   le CTA RDV (lien externe fixe, endpoint de génération de lien, etc.). **Ne pas
   inventer cet endpoint/lien** — à redemander explicitement au backend avant
   d'implémenter le clic du CTA RDV dans `SubscriptionCta.tsx`. Note : le contrat
   renvoie vers `specs/003-pricing-billing-implementation/contracts/pricing-billing-api.md`
   pour le détail complet de §8.3, mais ce dossier `specs/003-pricing-billing-implementation/`
   **n'existe pas dans ce repo** (seul `specs/002-pricing-tier-interface/` existe pour ce
   chantier) — écart à signaler au backend, pas à combler par supposition.

`src/lib/types/plan-tier.ts` peut désormais typer `PricingStatus` sur la forme
ci-dessus (points 1-3). Le mécanisme du CTA RDV (point 4) reste à définir tant que le
backend ne l'a pas documenté — ne pas l'inventer dans `/speckit-tasks`.
