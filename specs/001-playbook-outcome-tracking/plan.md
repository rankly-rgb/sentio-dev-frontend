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
(principe V) — contrat désormais documenté (§ "Playbook Outcome Tracking",
`docs/API_CONTRACTS.md`), **marqué provisoire par le backend** ("spec en cours, pas
encore livré", pas encore mergé) ; un écart subsiste — voir Dependencies plus bas

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
| V. API Contract Compliance | ⚠️ **GATE PARTIEL** | Contrat documenté dans `docs/API_CONTRACTS.md` (§ "Playbook Outcome Tracking") pour la fenêtre d'attribution (`GET .../attribution-status`), le taux de résolution (`GET /playbook-outcome-stats`) et la réponse au nudge (`POST .../nudge-response`) — **mais marqué provisoire par le backend** ("pas encore livré", non mergé) **et le marquage manuel "exécuté" (mutation qui fixe `executed_at`) n'est toujours pas documenté**. **Ce plan ne doit pas inventer cette forme de données** — voir Dependencies. |
| Edits ciblés (str_replace) | ✅ PASS applicable à l'implémentation, sans impact sur le plan lui-même |
| Identité graphique figée | ✅ PASS | Réutilisation des composants shadcn/ui existants (Button, Card, Badge), pas de nouvelle palette |

**Verdict** : `/speckit-tasks` peut être lancé sur la base du contrat provisoire
documenté (3 des 4 dépendances couvertes). `/speckit-implement` reste bloqué tant que
(a) le contrat n'est pas mergé côté backend et (b) le marquage manuel "exécuté" n'est
pas documenté (voir Dependencies).

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

## Dependencies (backend)

Statut au 2026-07-26, contrat provisoire `docs/API_CONTRACTS.md` § "Playbook Outcome
Tracking" (non mergé côté backend — à re-vérifier avant `/speckit-implement`) :

1. **Marquage manuel "exécuté"** — ⚠️ **toujours non documenté**. Le contrat expose
   `GET /playbook-execute/{execution_id}/attribution-status` qui *lit* `executed_at`,
   mais aucune mutation ne documente comment `executed_at` est fixé (marquer/annuler).
   **Ne pas inventer cet endpoint** — à redemander explicitement au backend avant
   d'implémenter le bouton "marquer comme exécuté" de `ActionList.tsx`.
2. **État de la fenêtre d'attribution** — ✅ documenté : `GET
   /playbook-execute/{execution_id}/attribution-status` retourne `execution_id`,
   `executed_at` (nullable), `attribution_deadline_at` (nullable, figé au marquage),
   `attribution_status` (`'not_executed'|'active'|'expired'|'resolved'`, dérivé, jamais
   stocké), `time_remaining_seconds` (nullable).
3. **Taux de résolution exécuté vs non-exécuté** — ✅ documenté : `GET
   /playbook-outcome-stats?playbook_id={uuid}` retourne `executed.sample_size`,
   `executed.resolved_count`, `executed.resolution_rate` (nullable, jamais `0` par
   défaut si `sample_size = 0`), `executed.sample_size_warning` (`true` si
   `sample_size < 20` — le frontend DOIT afficher l'avertissement plutôt qu'un
   pourcentage nu), et la même structure sous `not_executed.*`.
4. **Réponse au nudge "a aidé ?"** — ✅ documenté : `POST
   /playbook-execute/{execution_id}/nudge-response` avec body `response`
   (`'resolved'|'not_resolved'|'unsure'`), retourne `nudge_response` et
   `nudge_responded_at` (nullable, persistés sur `playbook_executions`). **Règle de
   non-écrasement** : ne modifie jamais `account_converted`/`resolved_via` — ce sont
   deux signaux distincts (déclaratif CSM vs détection factuelle), à afficher côte à
   côte dans `OutcomeNudge.tsx`, jamais fusionnés.

`src/lib/types/playbook.ts` peut désormais typer `AttributionStatus`,
`PlaybookOutcomeStats` et `NudgeResponse` sur la forme ci-dessus (points 2-4). Le type
couvrant le marquage manuel "exécuté" (point 1) reste à définir tant que le backend ne
l'a pas documenté — ne pas l'inventer dans `/speckit-tasks`.
