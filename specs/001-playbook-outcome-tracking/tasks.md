---

description: "Task list for feature implementation"

---

# Tasks: Boucle de preuve de résultat des playbooks

**Input**: Design documents from `/specs/001-playbook-outcome-tracking/`

**Prerequisites**: plan.md (loaded), spec.md (loaded). No data-model.md, contracts/, or research.md exist for this feature — tasks below are derived from plan.md's Project Structure and spec.md's user stories/FRs only.

**Tests**: Included (repo convention per `CLAUDE.md` — "Écrire le test AVANT l'implémentation quand c'est possible" — and plan.md's Testing section).

**Organization**: Tasks are grouped by user story (US1/US2/US3, per spec.md priorities P1/P2/P3) to enable independent implementation and testing.

**Contract status** (`API_CONTRACTS.md` § "Playbook Outcome Tracking", merged from `sentio-dev-backend` branches `main`+`feat/playbook-outcome-tracking`+`feat/pricing-billing-implementation` on 2026-07-27; distinct from `docs/API_CONTRACTS.md`, which is the unrelated Scoring Engine V2 contract): **provisional, not yet merged by backend on its own repo's main**. Covers `GET /playbook-execute/{execution_id}/attribution-status`, `GET /playbook-outcome-stats?playbook_id={uuid}`, `POST /playbook-execute/{execution_id}/nudge-response`, and now also `POST /playbook-execute/{execution_id}/mark-executed` (§8.1) — the mutation that marks a playbook as "executed" (FR-001/FR-003). No unmark/cancel endpoint exists in this contract's V1 scope (see T012).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 per spec.md
- Paths are relative to repo root (`src/`, `tests/`), per plan.md's Project Structure (single frontend project)

---

## Phase 1: Setup

**Purpose**: Confirm preconditions before touching code

- [ ] T001 Confirm `API_CONTRACTS.md` § "Playbook Outcome Tracking" is merged on `sentio-dev-backend` (not "pas encore livré") before opening implementation PRs; if still provisional, implementation may proceed for US1/US2/US3 (contract now covers `attribution-status`, `playbook-outcome-stats`, `nudge-response`, and `mark-executed`) — only T012 (cancel-mark, FR-003) stays blocked, on a product-scope gap rather than a missing contract
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
- [ ] T009 [US1] Add mark-executed mutation function in `src/lib/queries/playbook-queries.ts` calling `POST /playbook-execute/{execution_id}/mark-executed` (contract `API_CONTRACTS.md` § 8.1, documented — proceed). No request body. Response `{ execution_id, executed_at, attribution_deadline_at }`. Idempotent: calling it again on an already-marked execution returns `200` with the original `executed_at` unchanged — the mutation must not assume a fresh timestamp on every call. There is no unmark/cancel counterpart in this contract (see T012)
- [ ] T010 [US1] Implement `usePlaybookExecutionMark.ts` in `src/hooks/` — query wrapping T008 (`getAttributionStatus`), mutation wrapping T009 (depends on T008, T009)
- [ ] T011 [US1] Add "mark as executed" button + attribution-window indicator to `src/components/playbooks/ActionList.tsx`, using `usePlaybookExecutionMark` (depends on T010); button conditionally rendered per FR-001/FR-002, replaced by window indicator once `attribution_status !== 'not_executed'` per Acceptance Scenario 2
- [ ] T012 [US1] **BLOCKED — product/contract gap, not a missing-payload-shape problem**: FR-003 requires users to be able to cancel a mistaken "executed" mark while the attribution window is still open, but `API_CONTRACTS.md` § 8.1 explicitly states there is no unmark/cancel action in this contract's V1 scope ("aucune action d'« annulation » du marquage n'existe... pas de besoin produit identifié à ce jour"). Do not build a client-side-only undo (it would desync from `attribution_deadline_at`, which the backend freezes at mark time) and do not invent `POST .../unmark-executed`. Flag this FR-003/contract mismatch back to backend/product — either FR-003 is dropped for V1 or backend adds the dedicated sub-route the contract note already anticipates

**Checkpoint**: US1 read path (attribution-status display) and mark-executed write path (T008-T011) fully functional; cancel-mark (T012, FR-003) blocked on a product/contract gap, not on missing documentation

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

**Checkpoint**: All three user stories independently functional (T012's cancel-mark affordance remains blocked on a product/contract gap, not on missing documentation)

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
- **US1 (Phase 3)**: Depends on Foundational (T003). Read path (T008, T010, T011) and mark-executed write path (T009) unblocked now; cancel-mark (T012) blocked on a product/contract gap (no unmark endpoint in V1 scope)
- **US2 (Phase 4)**: Depends on Foundational (T004). Independent of US1 — contract fully documented, unblocked
- **US3 (Phase 5)**: Depends on Foundational (T005) and on US1's T008 (attribution-status data feeds "is nudge due" logic) — not on T012's blocked cancel-mark affordance
- **Polish (Phase 6)**: Depends on all desired stories being complete

### Parallel Opportunities

- T004, T005 in parallel with T003 (Foundational — same file, different type blocks; sequential edits recommended in practice despite `[P]` marking, to avoid merge conflicts within `playbook.ts`)
- T006, T007 in parallel (US1 tests, different files)
- T013, T014 in parallel (US2 tests)
- T019, T020 in parallel (US3 tests)
- US2 (Phase 4) can proceed fully in parallel with US1 (T009-T012), since US2 has no dependency on the mark-executed mutation

---

## Implementation Strategy

### MVP First (User Story 1 read path only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 minus T012 (blocked) — ships attribution-status display with a working "mark as executed" button (T008-T011), no cancel affordance yet
3. Flag the FR-003/contract gap (T012) to backend/product before deciding whether to drop cancel from V1 or request the unmark sub-route

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US2 (fully unblocked) → Test independently → Deploy/Demo
3. US1 → Deploy once available (T008-T011 fully unblocked); T012 (cancel-mark) deferred until the FR-003/contract gap is resolved with backend/product
4. US3 → Test independently → Deploy/Demo (depends on US1's attribution-status data, not on T012's blocked cancel-mark affordance)

---

## Notes

- [P] tasks = different files, no dependencies (see caveat above for T003-T005 sharing `playbook.ts`)
- T009 is unblocked: `API_CONTRACTS.md` § 8.1 documents `POST /playbook-execute/{execution_id}/mark-executed` (merged 2026-07-27 from `sentio-dev-backend`, base+`feat/playbook-outcome-tracking`+`feat/pricing-billing-implementation`)
- T012 stays blocked, but the gap is now product-level, not documentation-level: the contract explicitly scopes out an unmark/cancel action for V1. Do not implement a guessed `unmark-executed` endpoint or a client-only undo
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
