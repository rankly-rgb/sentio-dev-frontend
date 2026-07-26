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
dans `docs/API_CONTRACTS.md` (principe V) — **contrainte bloquante actuelle : le
contrat complet (palier + limite de comptes + indicateur self-serve/RDV) n'existe pas
encore**, voir Dependencies ; le frontend ne doit jamais décider lui-même du palier ou
de la bascule self-serve/RDV (contrainte explicite de la spec, FR-007)

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
| V. API Contract Compliance | ⚠️ **GATE BLOQUANT** | Aucun contrat complet n'existe dans `docs/API_CONTRACTS.md` pour le palier + limite de comptes + indicateur self-serve/RDV. Un contrat partiel existe (`GET /trial-status`) mais insuffisant (pas de "Scale", pas de limite/progression de comptes, pas d'indicateur self-serve/RDV explicite). **Ce plan ne doit pas inventer de forme de données** — voir Dependencies. |
| Edits ciblés (str_replace) | ✅ PASS applicable à l'implémentation |
| Identité graphique figée | ✅ PASS | Réutilisation des composants shadcn/ui existants (`Progress`, `Card`, `Button`), pas de nouvelle palette |

**Verdict** : le plan peut être documenté et review, mais l'implémentation
(`/speckit-tasks` puis `/speckit-implement`, hors scope de cette tâche) est bloquée
tant que le principe V n'est pas satisfait — en particulier la clarification du
palier "Scale" et de l'indicateur self-serve/RDV.

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
│       └── plan-tier.ts             # Nouveau : PlanTierStatus, AccountLimitProgress,
│                                     # SubscriptionCtaMode ('self_serve' | 'request_meeting')
│                                     # — formes exactes dépendantes du contrat backend,
│                                     # NE PAS inventer ici tant que non documenté ;
│                                     # étendre potentiellement src/lib/types/trial.ts
│                                     # plutôt que dupliquer, à trancher une fois le
│                                     # contrat backend connu
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

## Dependencies (backend — à demander explicitement, non inventées ici)

Avant `/speckit-tasks` puis `/speckit-implement` sur cette feature, les points
suivants doivent être clarifiés/documentés côté backend dans `docs/API_CONTRACTS.md` :

1. **État de palier complet** : endpoint (extension de `GET /trial-status` ou nouveau
   contrat dédié) exposant le palier actuel de l'organisation, incluant une valeur
   "Scale" si elle doit exister distinctement d'"Enterprise" (le type frontend actuel
   `PlanType` dans `src/lib/types/trial.ts` ne connaît que
   `'free' | 'starter' | 'growth' | 'enterprise'`).
2. **Limite et progression de comptes actifs suivis** : nombre de comptes actuellement
   suivis vs limite du palier (ou indicateur "illimité"), non présent aujourd'hui dans
   le contrat de palier existant.
3. **Indicateur self-serve/RDV explicite** : champ exposant si l'organisation doit voir
   un CTA self-serve ou "demander un rendez-vous" — le frontend ne doit jamais dériver
   cette logique lui-même (FR-007), même si la bascule métier (chantier A) est déjà
   active côté backend.
4. **Mécanisme de "demander un rendez-vous"** : forme du lien/action (URL externe fixe,
   endpoint de génération de lien personnalisé, etc.) à utiliser pour le CTA RDV.

Tant que ces contrats ne sont pas documentés, ce plan reste au niveau de la structure
et de l'architecture frontend — aucun type de données ni shape de payload n'est fixé
au-delà de ce qui est déjà nommé ci-dessus comme "à définir côté backend".
