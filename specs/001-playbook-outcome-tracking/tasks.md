---

description: "Task list for feature implementation"

---

# Tasks: Boucle de preuve de résultat des playbooks

**Input**: Design documents from `/specs/001-playbook-outcome-tracking/`

**Prerequisites**: plan.md (loaded), spec.md (loaded). No data-model.md, contracts/, or research.md exist for this feature — tasks below are derived from plan.md's Project Structure and spec.md's user stories/FRs only.

**Tests**: Included (repo convention per `CLAUDE.md` — "Écrire le test AVANT l'implémentation quand c'est possible" — and plan.md's Testing section).

**Organization**: Tasks are grouped by user story (US1/US2/US3, per spec.md priorities P1/P2/P3) to enable independent implementation and testing.

**Contract status** (`docs/API_CONTRACTS.md` § "Playbook Outcome Tracking", as of 2026-07-26): **provisional, not yet merged by backend**. Covers `GET /playbook-execute/{execution_id}/attribution-status`, `GET /playbook-outcome-stats?playbook_id={uuid}`, `POST /playbook-execute/{execution_id}/nudge-response`. Does **not** cover the mutation that marks/unmarks a playbook as "executed" (FR-001/FR-003) — that endpoint remains undocumented. Tasks touching it are marked **BLOCKED** below and must not invent a payload shape.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 per spec.md
- Paths are relative to repo root (`src/`, `tests/`), per plan.md's Project Structure (single frontend project)

---

## Phase 1: Setup

**Purpose**: Confirm preconditions before touching code

- [ ] T001 Confirm `docs/API_CONTRACTS.md` § "Playbook Outcome Tracking" is merged (not "pas encore livré") before opening implementation PRs; if still provisional, implementation may proceed for US2/US3 (contract available) but **not** for the "mark executed" mutation in US1 (contract missing)
- [ ] T002 [P] Confirm React Query v5, react-hook-form, zod, shadcn/ui (Button, Card, Badge) are already available in `package.json` (no new dependencies expected per plan.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types/queries consumed by more than one user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Extend `src/lib/types/playbook.ts` with `AttributionStatus` type: `execution_id` (string), `executed_at` (string | null), `attribution_deadline_at` (string | null), `attribution_status` (`'not_executed' | 'active' | 'expired' | 'resolved'`), `time_remaining_seconds` (number | null) — per contract § 8.1
- [ ] T004 [P] Extend `src/lib/types/playbook.ts` with `PlaybookOutcomeStats` type: `playbook_id` (string), `executed` and `not_executed` groups each with `sample_size` (number), `resolved_count` (number), `resolution_rate` (number | null), `sample_size_warning` (boolean) — per contract § 8.2
- [ ] T005 [P] Extend `src/lib/types/playbook.ts` with `NudgeResponse` type: `response` body (`'resolved' | 'not_resolved' | 'unsure'`), `nudge_response` (same union | null), `nudge_responded_at` (string | null) — per contract § 8.3

**Checkpoint**: Shared types available — user story implementation can now begin

---

## Phase 3: User Story 1 - Marquer un playbook comme exécuté (Priority: P1) 🎯 MVP

**Goal**: Bouton "marquer comme exécuté" sur chaque carte de playbook actif, affichant la fenêtre d'attribution en cours après marquage (FR-001, FR-002, FR-003)

**Independent Test**: Marquer un playbook actif comme exécuté et vérifier qu'une fenêtre d'attribution démarre et s'affiche sur sa carte

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [ ] T006 [P] [US1] Unit test for attribution-status read/derive logic in `tests/unit/usePlaybookExecutionMark.test.ts` (covers `attribution_status` display states: `not_executed`/`active`/`expired`/`resolved`)
- [ ] T007 [P] [US1] E2E test for the mark-executed flow in `tests/e2e/playbook-outcome-tracking.spec.ts` (button visible on active playbook → click → attribution window displayed → button replaced by indicator, per spec.md Acceptance Scenario 2)

### Implementation for User Story 1

- [ ] T008 [US1] Add `getAttributionStatus(executionId)` fetch function in `src/lib/queries/playbook-queries.ts` calling `GET /playbook-execute/{execution_id}/attribution-status` (contract § 8.1, documented — proceed)
- [ ] T009 [US1] **BLOCKED — contract missing**: add mark/unmark-executed mutation function in `src/lib/queries/playbook-queries.ts`. Do not invent the endpoint path or payload shape. Re-request contract from backend before implementing (see plan.md Dependencies #1)
- [ ] T010 [US1] Implement `usePlaybookExecutionMark.ts` in `src/hooks/` — query wrapping T008 (`getAttributionStatus`) now; mutation wrapping T009 once contract lands (depends on T008, T009)
- [ ] T011 [US1] Add "mark as executed" button + attribution-window indicator to `src/components/playbooks/ActionList.tsx`, using `usePlaybookExecutionMark` (depends on T010); button conditionally rendered per FR-001/FR-002, replaced by window indicator once `attribution_status !== 'not_executed'` per Acceptance Scenario 2
- [ ] T012 [US1] Add cancel-mark UI affordance on `ActionList.tsx` for FR-003 ("annuler tant que la fenêtre n'a pas expiré") — wired once T009's mutation is unblocked; until then, render as disabled/hidden with no fabricated behavior

**Checkpoint**: US1 read path (attribution-status display) fully functional; write path (mark/cancel) blocked on backend contract per T009

---

## Phase 4: User Story 2 - Vue du taux de résolution exécuté vs non-exécuté (Priority: P2)

**Goal**: Vue dédiée comparant le taux de résolution des comptes avec/sans playbook exécuté, avec taille d'échantillon et avertissement si insuffisante (FR-004, FR-005)

**Independent Test**: Consulter la vue avec un jeu de comptes ayant des playbooks exécutés et non-exécutés, vérifier que les deux taux s'affichent avec la taille d'échantillon, et qu'un échantillon insuffisant (`sample_size_warning`) affiche un message plutôt qu'un taux

### Tests for User Story 2 ⚠️

- [ ] T013 [P] [US2] Unit test for `usePlaybookResolutionRate.ts` in `tests/unit/usePlaybookResolutionRate.test.ts` — covers `resolution_rate: null` when `sample_size = 0` (never defaults to `0`, per contract § 8.2) and `sample_size_warning` branch
- [ ] T014 [P] [US2] E2E test for the resolution-rate view in `tests/e2e/playbook-outcome-tracking.spec.ts` — covers Acceptance Scenarios 1 (both rates + sample sizes visible) and 2 (insufficient-sample message instead of a misleading rate)

### Implementation for User Story 2

- [ ] T015 [US2] Add `getPlaybookOutcomeStats(playbookId)` fetch function in `src/lib/queries/playbook-queries.ts` calling `GET /playbook-outcome-stats?playbook_id={uuid}` (contract § 8.2)
- [ ] T016 [US2] Implement `usePlaybookResolutionRate.ts` in `src/hooks/` — React Query hook wrapping T015, `enabled: !!user?.organization_id` per repo convention (depends on T015)
- [ ] T017 [US2] Create `src/pages/playbooks/PlaybookResolutionRate.tsx` — new page rendering `executed` vs `not_executed` groups (rate + sample size), sample-size-warning message when `sample_size_warning === true`, using `usePlaybookResolutionRate` (depends on T016)
- [ ] T018 [US2] Register `/playbooks/resolution-rate` protected route for `PlaybookResolutionRate.tsx` in the router config

**Checkpoint**: US1 and US2 both independently functional

---

## Phase 5: User Story 3 - Nudge de confirmation manuelle post-attribution (Priority: P3)

**Goal**: Nudge "Ce playbook a-t-il aidé ?" affiché après expiration de la fenêtre d'attribution, réponse persistée et non ré-affichée une fois répondue (FR-006, FR-007)

**Independent Test**: Simuler l'expiration d'une fenêtre d'attribution, vérifier que le nudge apparaît, que la réponse est enregistrée, et qu'il ne réapparaît plus

### Tests for User Story 3 ⚠️

- [ ] T019 [P] [US3] Unit test for `usePlaybookOutcomeNudge.ts` in `tests/unit/OutcomeNudge.test.tsx` — covers nudge shown only when `attribution_status === 'expired'` and `nudge_responded_at === null`; covers that submitting a response never mutates `account_converted`/`resolved_via` (non-écrasement rule, contract § 8.3)
- [ ] T020 [P] [US3] E2E test for the nudge flow in `tests/e2e/playbook-outcome-tracking.spec.ts` — covers Acceptance Scenarios 1 (nudge appears post-expiration) and 2 (nudge does not reappear after response)

### Implementation for User Story 3

- [ ] T021 [US3] Add `postNudgeResponse(executionId, response)` mutation function in `src/lib/queries/playbook-queries.ts` calling `POST /playbook-execute/{execution_id}/nudge-response` (contract § 8.3)
- [ ] T022 [US3] Implement `usePlaybookOutcomeNudge.ts` in `src/hooks/` — query (nudge due? via `attribution_status`/`nudge_responded_at` from T008's attribution-status data) + mutation wrapping T021, `retry: false` per repo convention (depends on T008, T021)
- [ ] T023 [US3] Create `src/components/playbooks/OutcomeNudge.tsx` — "Ce playbook a-t-il aidé ?" prompt (resolved/not_resolved/unsure), rendered on `ActionList.tsx` cards when nudge is due, using `usePlaybookOutcomeNudge` (depends on T022); displays declarative CSM response alongside (never merged with) the automatic `account_converted` signal, per contract's non-overwrite rule
- [ ] T024 [US3] Wire `OutcomeNudge.tsx` into `src/components/playbooks/ActionList.tsx` for playbooks with `attribution_status === 'expired'` and no prior nudge response

**Checkpoint**: All three user stories independently functional (US1's write path remains blocked per T009/T012 pending backend contract)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T025 [P] Verify zero-PII compliance across all new components (only IDs/rates/timestamps displayed, no account names/emails) per constitution principle I
- [ ] T026 [P] Verify all new UI strings are American English (en-US) per constitution principle IV — no French strings, `fr.ts` untouched or additive only
- [ ] T027 Run `npx tsc --noEmit` and fix any strict-mode violations (no `any`, `as any`, `@ts-ignore`, `@ts-expect-error`)
- [ ] T028 Run `npm run build` to confirm the build passes
- [ ] T029 [P] Run `npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (T003). Read path (T008, T010, T011) unblocked now; write path (T009, T012) blocked on backend contract
- **US2 (Phase 4)**: Depends on Foundational (T004). Independent of US1 — contract fully documented, unblocked
- **US3 (Phase 5)**: Depends on Foundational (T005) and on US1's T008 (attribution-status data feeds "is nudge due" logic) — not on US1's blocked write path
- **Polish (Phase 6)**: Depends on all desired stories being complete

### Parallel Opportunities

- T004, T005 in parallel with T003 (Foundational — same file, different type blocks; sequential edits recommended in practice despite `[P]` marking, to avoid merge conflicts within `playbook.ts`)
- T006, T007 in parallel (US1 tests, different files)
- T013, T014 in parallel (US2 tests)
- T019, T020 in parallel (US3 tests)
- US2 (Phase 4) can proceed fully in parallel with US1's blocked write path (T009/T012), since US2 has no dependency on the mark-executed mutation

---

## Implementation Strategy

### MVP First (User Story 1 read path only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 minus T009/T012 (blocked) — ships attribution-status display without the mark/cancel button, OR ships with a disabled/"coming soon" button state until the mutation contract lands
3. **STOP and VALIDATE** with backend on T009 before enabling the full mark-executed flow

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US2 (fully unblocked) → Test independently → Deploy/Demo — recommend delivering **before** US1's write path if the backend contract for marking-executed is still pending, since US2 has no such gap
3. US1 read path → Deploy once available; write path (T009/T012) only once contract is documented
4. US3 → Test independently → Deploy/Demo (depends on US1's attribution-status data, not its blocked write path)

---

## Notes

- [P] tasks = different files, no dependencies (see caveat above for T003-T005 sharing `playbook.ts`)
- T009 and T012 must not be implemented against a guessed payload shape — re-open the backend contract request from plan.md Dependencies #1 first
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
