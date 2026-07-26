# Implementation Plan: Boucle de preuve de résultat des playbooks

**Branch**: `feature/chantier-c-outcome-tracking` | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-playbook-outcome-tracking/spec.md`

## Summary

Ajouter, côté frontend uniquement, une boucle de preuve de résultat autour des
playbooks : marquage manuel "exécuté" avec fenêtre d'attribution affichée, une vue
dédiée comparant le taux de résolution des comptes avec/sans playbook exécuté, et un
nudge de confirmation qualitative post-fenêtre. Ce plan ne couvre que les
composants et hooks React consommant des données déjà calculées côté backend — il ne
spécifie aucune logique de calcul d'attribution, de fenêtre ou de taux de résolution,
qui reste entièrement backend.

## Technical Context

**Language/Version**: TypeScript (strict, cible ES5) sur React 18

**Primary Dependencies**: React Query v5 (TanStack) pour les hooks de données,
shadcn/ui (Radix) + Tailwind pour l'UI, react-hook-form + zod si un formulaire de
réponse au nudge s'avère nécessaire (probablement un simple choix binaire, pas un
formulaire complexe)

**Storage**: N/A côté frontend — toute persistance (marquage exécuté, fenêtre
d'attribution, taux de résolution, réponse au nudge) est backend (Supabase / Edge
Functions), non traitée par ce plan

**Testing**: Vitest + @testing-library/react (unitaire), Playwright (E2E) — tests
écrits avant l'implémentation quand possible, conformément aux conventions du repo

**Target Platform**: Web (SPA Vite), comportement derrière `<ProtectedRoute>` — aucune
implication SEO/SSR, cette feature est 100% dans l'app authentifiée

**Project Type**: Frontend uniquement (web application, un seul projet — ce repo)

**Performance Goals**: Cohérent avec les patterns existants du repo (staleTime 5min
type `useBenchmarkData`, gcTime 10min) — pas d'exigence de performance spécifique
au-delà des standards déjà en place

**Constraints**: Aucune donnée personnelle affichée (zero-PII, principe I de la
constitution) ; TypeScript strict/ES5 (principe III) ; UI 100% anglais (principe IV) ;
toute donnée API doit respecter un contrat documenté dans `docs/API_CONTRACTS.md`
(principe V) — **contrainte bloquante actuelle : ce contrat n'existe pas encore**,
voir Dependencies plus bas

**Scale/Scope**: 3 user stories (P1/P2/P3), 1 nouvelle vue dédiée, modifications sur
les composants playbooks existants (`ActionList`/cartes playbook), pas de nouvelle
page de routing majeure au-delà de la vue de résolution

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Note |
|---|---|---|
| I. Zero-PII | ✅ PASS | Aucune donnée personnelle affichée ; uniquement des états de playbook/compte et des taux agrégés |
| II. Stack & Structure | ✅ PASS | Reste dans Vite/React/TS, nouvelle vue dans `src/pages/` |
| III. TypeScript strict, ES5 | ✅ PASS | Aucune syntaxe non-ES5 anticipée (pas de spread de `Set` prévu) |
| IV. English-Only UI | ✅ PASS | Tous les libellés UI seront en anglais (`fr.ts` gardé pour cohérence interne du repo mais UI produit reste en-US) |
| V. API Contract Compliance | ⚠️ **GATE BLOQUANT** | Aucun contrat n'existe dans `docs/API_CONTRACTS.md` pour le marquage exécuté, la fenêtre d'attribution, le taux de résolution, ni la réponse au nudge. **Ce plan ne doit pas inventer de forme de données** — voir Dependencies. L'implémentation ne peut démarrer qu'une fois ces contrats documentés côté backend. |
| Edits ciblés (str_replace) | ✅ PASS applicable à l'implémentation, sans impact sur le plan lui-même |
| Identité graphique figée | ✅ PASS | Réutilisation des composants shadcn/ui existants (Button, Card, Badge), pas de nouvelle palette |

**Verdict** : le plan peut être documenté et review, mais l'implémentation
(`/speckit-tasks` puis `/speckit-implement`, hors scope de cette tâche) est bloquée
tant que le principe V n'est pas satisfait.

## Project Structure

### Documentation (this feature)

```text
specs/001-playbook-outcome-tracking/
├── spec.md                          # Spécification (User Stories 1-3, FR-001..008)
├── plan.md                          # Ce fichier
└── checklists/
    └── requirements.md              # Checklist qualité de la spec
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── types/
│   │   └── playbook.ts              # Étendre avec les types d'exécution manuelle
│   │                                 # (ExecutionMark, AttributionWindow, NudgeResponse)
│   │                                 # — formes exactes dépendantes du contrat backend,
│   │                                 # NE PAS inventer ici tant que non documenté
│   └── queries/
│       └── playbook-queries.ts      # Nouvelles fonctions de fetch (marquer exécuté,
│                                     # récupérer taux de résolution, répondre au nudge)
├── hooks/
│   ├── usePlaybookExecutionMark.ts  # Nouveau hook (mutation) — marquer/annuler exécuté
│   ├── usePlaybookResolutionRate.ts # Nouveau hook (query) — vue taux de résolution
│   └── usePlaybookOutcomeNudge.ts   # Nouveau hook (query + mutation) — nudge post-fenêtre
├── components/
│   └── playbooks/
│       ├── ActionList.tsx           # Ajouter bouton "marquer comme exécuté" +
│       │                             # indicateur de fenêtre d'attribution sur la carte
│       └── OutcomeNudge.tsx         # Nouveau composant — nudge "Ce playbook a-t-il aidé ?"
└── pages/
    └── playbooks/
        └── PlaybookResolutionRate.tsx # Nouvelle vue dédiée (Story 2), route à définir
                                        # sous /playbooks (ex. /playbooks/resolution-rate)

tests/
├── unit/
│   ├── usePlaybookExecutionMark.test.ts
│   ├── usePlaybookResolutionRate.test.ts
│   └── OutcomeNudge.test.tsx
└── e2e/
    └── playbook-outcome-tracking.spec.ts
```

**Structure Decision**: Frontend uniquement, dans l'arborescence existante du repo
(`src/lib/types`, `src/lib/queries`, `src/hooks`, `src/components/playbooks`,
`src/pages/playbooks`). Pas de nouvelle app ni de structure `backend/`/`frontend/` —
ce repo est déjà 100% frontend, le backend vit dans le repo Supabase Edge Functions
séparé. La nouvelle vue de résolution est ajoutée comme route protégée
supplémentaire sous `/playbooks`, cohérente avec le routing existant.

## Complexity Tracking

Aucune violation de la constitution ne nécessite de justification de complexité
(la seule non-conformité actuelle — principe V, API Contract Compliance — est un
gate bloquant de dépendance externe, pas un choix de complexité à justifier).

## Dependencies (backend — à demander explicitement, non inventées ici)

Avant `/speckit-tasks` puis `/speckit-implement` sur cette feature, les contrats
suivants doivent être documentés dans `docs/API_CONTRACTS.md` (ou équivalent) côté
backend :

1. **Marquage manuel "exécuté"** : endpoint pour marquer/annuler un playbook actif
   comme exécuté sur un compte (mutation), avec horodatage de démarrage de la fenêtre
   d'attribution.
2. **État de la fenêtre d'attribution** : forme de donnée exposant la durée totale,
   le temps restant, et si la fenêtre est expirée, pour un playbook exécuté donné.
3. **Taux de résolution exécuté vs non-exécuté** : endpoint agrégé retournant les
   deux taux de résolution avec taille d'échantillon par groupe, et un signal explicite
   d'insuffisance de données en dessous d'un seuil.
4. **Réponse au nudge "a aidé ?"** : endpoint de mutation pour enregistrer la réponse
   qualitative, et un champ exposant si un nudge est dû/déjà répondu pour un playbook
   exécuté donné.

Tant que ces contrats ne sont pas documentés, ce plan reste au niveau de la
structure et de l'architecture frontend — aucun type de données ni shape de payload
n'est fixé au-delà de ce qui est déjà named ci-dessus comme "à définir côté backend".
