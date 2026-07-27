---

description: "Task list for feature implementation"

---

# Tasks: Boucle de preuve de résultat des playbooks

**Input**: Design documents from `/specs/001-playbook-outcome-tracking/`

**Prerequisites**: plan.md (loaded), spec.md (loaded). No data-model.md, contracts/, or research.md exist for this feature — tasks below are derived from plan.md's Project Structure and spec.md's user stories/FRs only.

**Tests**: Included (repo convention per `CLAUDE.md` — "Écrire le test AVANT l'implémentation quand c'est possible" — and plan.md's Testing section).

**Organization**: Tasks are grouped by user story (US1/US2/US3, per spec.md priorities P1/P2/P3) to enable independent implementation and testing.

**Contract status** (`API_CONTRACTS.md` § "Playbook Outcome Tracking", merged from `sentio-dev-backend` branches `main`+`feat/playbook-outcome-tracking`+`feat/pricing-billing-implementation`, refreshed 2026-07-27 at commit `da6decd` on `feat/playbook-outcome-tracking`; distinct from `docs/API_CONTRACTS.md`, which is the unrelated Scoring Engine V2 contract): **provisional, not yet merged by backend on its own repo's main**. Covers `GET /playbook-execute/{execution_id}/attribution-status`, `GET /playbook-outcome-stats?playbook_id={uuid}`, `POST /playbook-execute/{execution_id}/nudge-response`, `POST /playbook-execute/{execution_id}/mark-executed` (§8.1), and now also `POST /playbook-execute/{execution_id}/unmark-executed` (§8.1.1) — the cancel action for FR-003.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 per spec.md
- Paths are relative to repo root (`src/`, `tests/`), per plan.md's Project Structure (single frontend project)

---

## Phase 1: Setup

**Purpose**: Confirm preconditions before touching code

- [ ] T001 **NOT VERIFIABLE FROM HERE**: `API_CONTRACTS.md` § "Playbook Outcome Tracking" is confirmed on the backend's `feat/playbook-outcome-tracking` branch (commit `1d4b4c9`), but merge status onto `sentio-dev-backend`'s `main` cannot be checked from this sandbox (no access to the backend repo's PR/merge state beyond public branch refs). Implementation proceeded per plan.md's verdict ("US1/US2/US3 fully covered"), but re-confirm the merge before this ships
- [X] T002 [P] Confirm React Query v5, react-hook-form, zod, shadcn/ui (Button, Card, Badge) are already available in `package.json` (no new dependencies expected per plan.md) — confirmed, all already in use elsewhere in the repo

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types/queries consumed by more than one user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Extend `src/lib/types/playbook.ts` with `AttributionStatus` type: `execution_id` (string), `executed_at` (string | null), `attribution_deadline_at` (string | null), `attribution_status` (`'not_executed' | 'active' | 'expired' | 'resolved'`), `time_remaining_seconds` (number | null) — per contract § 8.1
- [X] T004 [P] Extend `src/lib/types/playbook.ts` with `PlaybookOutcomeStats` type: `playbook_id` (string), `executed` and `not_executed` groups each with `sample_size` (number), `resolved_count` (number), `resolution_rate` (number | null), `sample_size_warning` (boolean) — per contract § 8.2. Implemented as `PlaybookOutcomeStats` + `PlaybookOutcomeStatsGroup` (shape-equivalent, split for reuse across both groups)
- [X] T005 [P] Extend `src/lib/types/playbook.ts` with `NudgeResponse` type: `response` body (`'resolved' | 'not_resolved' | 'unsure'`), `nudge_response` (same union | null), `nudge_responded_at` (string | null) — per contract § 8.3. Implemented as `NudgeResponseValue` (the union) + `NudgeResponseResult` (the response shape), shape-equivalent

**Checkpoint**: Shared types available — user story implementation can now begin

---

## Phase 3: User Story 1 - Marquer un playbook comme exécuté (Priority: P1) 🎯 MVP

**Goal**: Bouton "marquer comme exécuté" sur chaque carte de playbook actif, affichant la fenêtre d'attribution en cours après marquage (FR-001, FR-002, FR-003)

**Independent Test**: Marquer un playbook actif comme exécuté et vérifier qu'une fenêtre d'attribution démarre et s'affiche sur sa carte

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T006 [P] [US1] Unit test for attribution-status read/derive logic — implemented at `src/hooks/__tests__/usePlaybookExecutionMark.test.tsx` (repo convention is colocated `__tests__/`, not a top-level `tests/unit/`; path in this task adjusted accordingly — see deviations in final report). Covers `not_executed`, `active` (within/outside the 5-min cancel window), and the mark→refetch flow
- [ ] T007 [P] [US1] **NOT RUN — no environment available**: E2E test for the mark-executed flow, written at `e2e/playbook-outcome-tracking.spec.ts` (repo's real E2E dir is `e2e/` at root, not `tests/e2e/`) per spec.md Acceptance Scenario 2. Requires a live backend + browser + seeded workflow execution data, none of which exist in this sandbox — file exists but has never been executed, do not treat as passing

### Implementation for User Story 1

- [X] T008 [US1] Add `getAttributionStatus(executionId)` fetch function in `src/lib/queries/playbook-queries.ts` calling `GET /playbook-execute/{execution_id}/attribution-status` (contract § 8.1, documented — proceed)
- [X] T009 [US1] Add mark-executed mutation function in `src/lib/queries/playbook-queries.ts` calling `POST /playbook-execute/{execution_id}/mark-executed` (contract `API_CONTRACTS.md` § 8.1, documented — proceed). No request body. Response `{ execution_id, executed_at, attribution_deadline_at }`. Idempotent: calling it again on an already-marked execution returns `200` with the original `executed_at` unchanged — the mutation must not assume a fresh timestamp on every call
- [X] T010 [US1] Implement `usePlaybookExecutionMark.ts` in `src/hooks/` — query wrapping T008 (`getAttributionStatus`), mark mutation wrapping T009 (depends on T008, T009); extended in T012 with the unmark mutation
- [X] T011 [US1] **DEVIATION**: implemented in a new `src/components/playbooks/ExecutionAttributionCell.tsx` wired into `ExecutionTimeline.tsx` (rendered per-execution-row in `WorkflowDetail.tsx`'s Executions tab), not in `ActionList.tsx` as this task originally said. Reason: `ActionList.tsx` renders a playbook's static action *definitions* (type/config/order) and has no `execution_id`/account context at all — there is no execution to mark there. `ExecutionTimeline.tsx` is the only component in the codebase that lists individual `PlaybookExecutionRow`s (with `.id` = `execution_id`), so the button/window indicator was added there instead. Button conditionally rendered per FR-001/FR-002, replaced by window indicator once `attribution_status !== 'not_executed'` per Acceptance Scenario 2
- [X] T012 [US1] Add `unmarkExecuted(executionId)` mutation function in `src/lib/queries/playbook-queries.ts` calling `POST /playbook-execute/{execution_id}/unmark-executed` (contract § 8.1.1, documented — proceed), wired into `usePlaybookExecutionMark.ts` (extends T010), and a "cancel" affordance on the window indicator from T011 (in `ExecutionAttributionCell.tsx`, see T011 deviation) for FR-003. UI rules per contract:
  - Only renders/enables the cancel affordance while `now() - executed_at < 5 minutes` (not for the full attribution window — the contract deliberately restricts this to catching an accidental click, not retroactively editing outcome history per SC-006). Computed client-side from `executed_at` (T008's `attribution-status` payload); hidden once the 5-minute window elapses, no need to wait for a `409`
  - Never renders the cancel affordance once `attribution_status === 'resolved'` (the contract's own derivation rule ties `'resolved'` to `account_converted = true`, so this is a reliable proxy — confirmed against the contract text, not guessed) — this covers the first documented `409` case. **Partial gap on the second `409` case** (nudge already answered): `attribution-status` (§8.2) does not return `nudge_response`/`nudge_responded_at` as a field — that shape is only ever returned by the nudge-response POST itself (§8.4), never by a GET. There is no way to know from a fresh page load whether a nudge was already answered. Implemented a session-scoped workaround (`usePlaybookOutcomeNudge` tracks the response in local component state after a successful submit, and gates the cancel affordance on it) — this correctly prevents cancelling after answering *within the same page visit*, but the gate is lost on reload, unlike the auto-resolution check. Flagged as a real contract gap, not fabricated
  - On success (`200`), the attribution-status query is invalidated and refetched (rather than assuming a specific end-state), so the "mark as executed" button reappearing per FR-001 reflects the server's own derived state; the same refetch-on-settle happens on `409` (window race or conflict slipped through the client-side gate), so the UI self-corrects rather than assuming success

**Checkpoint**: US1 fully functional — mark-executed (T009-T011) and unmark-executed/cancel (T012) both implemented against documented contract, with one flagged gap (nudge-answered gating is session-scoped, not durable — see T012 note)

---

## Phase 4: User Story 2 - Vue du taux de résolution exécuté vs non-exécuté (Priority: P2)

**Goal**: Vue dédiée comparant le taux de résolution des comptes avec/sans playbook exécuté, avec taille d'échantillon et avertissement si insuffisante (FR-004, FR-005)

**Independent Test**: Consulter la vue avec un jeu de comptes ayant des playbooks exécutés et non-exécutés, vérifier que les deux taux s'affichent avec la taille d'échantillon, et qu'un échantillon insuffisant (`sample_size_warning`) affiche un message plutôt qu'un taux

### Tests for User Story 2 ⚠️

- [X] T013 [P] [US2] Unit test for `usePlaybookResolutionRate.ts` — implemented at `src/hooks/__tests__/usePlaybookResolutionRate.test.tsx` (colocated convention, see T006 note). Covers `resolution_rate: null` when `sample_size = 0` (never defaults to `0`, per contract § 8.2) and the `sample_size_warning` branch
- [ ] T014 [P] [US2] **NOT RUN — no environment available**: E2E test for the resolution-rate view, written at `e2e/playbook-outcome-tracking.spec.ts` — covers Acceptance Scenarios 1 (both rates + sample sizes visible) and 2 (insufficient-sample message instead of a misleading rate). Same environment gap as T007 — file exists, never executed
- [X] T015 [US2] Add `getPlaybookOutcomeStats(playbookId)` fetch function in `src/lib/queries/playbook-queries.ts` calling `GET /playbook-outcome-stats?playbook_id={uuid}` (contract § 8.2)
- [X] T016 [US2] Implement `usePlaybookResolutionRate.ts` in `src/hooks/` — React Query hook wrapping T015 (depends on T015). Note: gated on `!!playbookId` rather than `!!user?.organization_id` — this endpoint is scoped by `playbook_id`, not by org directly, and the page-level playbook selector (T017) already only lists the current org's playbooks via the existing `usePlaybooks` hook
- [X] T017 [US2] Create `src/pages/playbooks/PlaybookResolutionRate.tsx` — new page rendering `executed` vs `not_executed` groups (rate + sample size), sample-size-warning message when `sample_size_warning === true`, using `usePlaybookResolutionRate` (depends on T016). Added a playbook selector (`Select`, reusing `usePlaybooks`) since the contract's endpoint is per-`playbook_id` and the spec didn't pin the view to one specific playbook
- [X] T018 [US2] Register `/playbooks/resolution-rate` protected route for `PlaybookResolutionRate.tsx` in the router config (`App.tsx`, before the `/playbooks/:id` catch-all). Also added a discoverability link ("Resolution rate" button) on `Playbooks.tsx`'s header, since the route had no entry point otherwise — not explicitly requested by this task but needed for the page to be reachable

**Checkpoint**: US1 and US2 both independently functional

---

## Phase 5: User Story 3 - Nudge de confirmation manuelle post-attribution (Priority: P3)

**Goal**: Nudge "Ce playbook a-t-il aidé ?" affiché après expiration de la fenêtre d'attribution, réponse persistée et non ré-affichée une fois répondue (FR-006, FR-007)

**Independent Test**: Simuler l'expiration d'une fenêtre d'attribution, vérifier que le nudge apparaît, que la réponse est enregistrée, et qu'il ne réapparaît plus

### Tests for User Story 3 ⚠️

- [X] T019 [P] [US3] Unit test for `usePlaybookOutcomeNudge.ts` — implemented at `src/hooks/__tests__/usePlaybookOutcomeNudge.test.tsx` (colocated convention, see T006 note), plus a component test at `src/components/playbooks/__tests__/OutcomeNudge.test.tsx`. Covers nudge due only when `attribution_status === 'expired'` and no response yet recorded; covers that the mutation call only ever forwards `(executionId, response)` — no `account_converted`/`resolved_via` field exists anywhere in that call path (non-écrasement rule, contract § 8.4 — this section is § 8.4, not § 8.3, in the actual merged contract; the § 8.3 reference in this task predates the mark-executed/unmark-executed insertion that shifted numbering)
- [ ] T020 [P] [US3] **NOT RUN — no environment available**: E2E test for the nudge flow, written at `e2e/playbook-outcome-tracking.spec.ts` — covers Acceptance Scenarios 1 (nudge appears post-expiration) and 2 (nudge does not reappear after response). Same environment gap as T007/T014
- [X] T021 [US3] Add `postNudgeResponse(executionId, response)` mutation function in `src/lib/queries/playbook-queries.ts` calling `POST /playbook-execute/{execution_id}/nudge-response` (contract § 8.4)
- [X] T022 [US3] Implement `usePlaybookOutcomeNudge.ts` in `src/hooks/` — nudge-due logic from `attribution_status` (passed in from T010's hook) + mutation wrapping T021 (depends on T008 via the caller, T021). **Deviation**: no GET-backed query for "already answered" state — see the gap noted in T012 (§8.2 attribution-status doesn't expose `nudge_response`); implemented as local component state instead, seeded `null` and set only by a successful mutation
- [X] T023 [US3] Create `src/components/playbooks/OutcomeNudge.tsx` — "Did this playbook help?" prompt (resolved/not_resolved/unsure), using `usePlaybookOutcomeNudge` (depends on T022); displays the declarative CSM response as separate text alongside (never merged with) the automatic `account_converted`/window-status badge, per contract's non-overwrite rule
- [X] T024 [US3] **DEVIATION** (same reason as T011): wired `OutcomeNudge.tsx` into `ExecutionAttributionCell.tsx` (rendered per-row in `ExecutionTimeline.tsx`), not `ActionList.tsx` — `ActionList.tsx` has no execution context to key the nudge off of. Shown for executions with `attribution_status === 'expired'` and no prior nudge response this session

**Checkpoint**: All three user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T025 [P] Verify zero-PII compliance across all new components — confirmed: only `execution_id` (uuid), timestamps, and aggregated rates/counts are displayed; no account name/email introduced (pre-existing truncated `account_id` display in `ExecutionTimeline.tsx` is unchanged)
- [X] T026 [P] Verify all new UI strings are American English (en-US) per constitution principle IV — confirmed. Note: this repo's UI strings actually live in `src/i18n/en.ts` (via `useT()`), not `fr.ts` — `docs/CLAUDE.md`'s references to `fr.ts` predate the repo's full English migration (see `fix/m03-remaining-french-strings` branch history) and no longer match the current tree; all new strings were added to `en.ts`, additive only
- [X] T027 Run `npx tsc --noEmit` and fix any strict-mode violations (no `any`, `as any`, `@ts-ignore`, `@ts-expect-error`) — clean, no output
- [X] T028 Run `npm run build` to confirm the build passes — succeeded
- [X] T029 [P] Run `npm run lint` — clean on every file touched by this feature; 3 pre-existing errors and several warnings remain in unrelated files (`src/components/ui/*.tsx`, `tailwind.config.ts`, `scripts/seed-stripe-customers.ts`) not modified by this change

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (T003). Fully unblocked — read path (T008, T010, T011), mark-executed (T009), and cancel-mark (T012) all documented in the contract
- **US2 (Phase 4)**: Depends on Foundational (T004). Independent of US1 — contract fully documented, unblocked
- **US3 (Phase 5)**: Depends on Foundational (T005) and on US1's T008 (attribution-status data feeds "is nudge due" logic)
- **Polish (Phase 6)**: Depends on all desired stories being complete

### Parallel Opportunities

- T004, T005 in parallel with T003 (Foundational — same file, different type blocks; sequential edits recommended in practice despite `[P]` marking, to avoid merge conflicts within `playbook.ts`)
- T006, T007 in parallel (US1 tests, different files)
- T013, T014 in parallel (US2 tests)
- T019, T020 in parallel (US3 tests)
- US2 (Phase 4) can proceed fully in parallel with US1 (T008-T012), since US2 has no dependency on the mark/unmark-executed mutations

---

## Implementation Strategy

### MVP First (User Story 1 read path only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (T008-T012) — ships attribution-status display, "mark as executed" button, and cancel affordance (5-minute window, both conflict cases handled)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US2 (fully unblocked) → Test independently → Deploy/Demo
3. US1 → Deploy once available (T008-T012 fully unblocked)
4. US3 → Test independently → Deploy/Demo (depends on US1's attribution-status data)

---

## Notes

- [P] tasks = different files, no dependencies (see caveat above for T003-T005 sharing `playbook.ts`)
- T009 is unblocked: `API_CONTRACTS.md` § 8.1 documents `POST /playbook-execute/{execution_id}/mark-executed` (merged 2026-07-27 from `sentio-dev-backend`, base+`feat/playbook-outcome-tracking`+`feat/pricing-billing-implementation`)
- T012 is unblocked: `API_CONTRACTS.md` § 8.1.1 documents `POST /playbook-execute/{execution_id}/unmark-executed` (refreshed 2026-07-27 at commit `da6decd` on `feat/playbook-outcome-tracking`) — 5-minute window from `executed_at`, and two `409` conflict cases (auto-resolution already detected, nudge response already recorded) that must gate the UI affordance, not just be caught as errors after the fact
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
