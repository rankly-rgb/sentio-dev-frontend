---

description: "Task list for feature implementation"

---

# Tasks: Interface différenciée selon le palier tarifaire

**Input**: Design documents from `/specs/002-pricing-tier-interface/`

**Prerequisites**: plan.md (loaded), spec.md (loaded). No data-model.md, contracts/, or research.md exist for this feature — tasks below are derived from plan.md's Project Structure and spec.md's user stories/FRs only.

**Tests**: Included (repo convention per `CLAUDE.md` — "Écrire le test AVANT l'implémentation quand c'est possible" — and plan.md's Testing section).

**Organization**: Tasks are grouped by user story (US1/US2/US3, per spec.md priorities P1/P2/P3) to enable independent implementation and testing.

**Contract status** (`docs/API_CONTRACTS.md` § "Pricing & Billing", as of 2026-07-26): **provisional, not yet merged by backend**. Covers `GET /pricing-status` (`plan_tier` incl. "scale", `active_accounts_count`/`max_active_accounts`/`usage_pct`/`alert_active`, `requires_appointment`) and the `ai_insights` `plan_limit_warning` type. Does **not** cover the mechanism behind the "request a meeting" CTA (FR-006/US3) — only the self-serve subscribe endpoint (`POST /sentio-billing/subscribe`) is documented. Tasks touching the RDV CTA's action are marked **BLOCKED** below and must not invent a payload/link shape.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 per spec.md
- Paths are relative to repo root (`src/`, `tests/`), per plan.md's Project Structure (single frontend project)

---

## Phase 1: Setup

**Purpose**: Confirm preconditions before touching code

- [ ] T001 Confirm `docs/API_CONTRACTS.md` § "Pricing & Billing" is merged (not "pas encore livré") before opening implementation PRs; if still provisional, implementation may proceed for US1/US2 (contract available) — US3's RDV CTA (T017) no longer depends on this backend contract (static external link via env var)
- [ ] T002 [P] Confirm React Query v5, react-router-dom, shadcn/ui (`Progress`, `Card`, `Button`) are already available in `package.json` (no new dependencies expected per plan.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types/hook consumed by all three user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create `src/lib/types/plan-tier.ts` with `PricingStatus` type: `plan_tier` (`'free' | 'growth' | 'scale' | 'enterprise'`, non-nullable — `'starter'` never expected), `active_accounts_count` (number), `max_active_accounts` (number | null, `null` = unlimited), `usage_pct` (number | null, `null` if unlimited, can exceed 100), `alert_active` (boolean), `requires_appointment` (boolean) — per contract § 8.1. Do not reuse `PlanType` from `src/lib/types/trial.ts` as-is — it still has `'starter'` and lacks `'scale'`
- [ ] T004 Add `getPricingStatus()` fetch function in a new `src/lib/queries/pricing-queries.ts` calling `GET /pricing-status` (contract § 8.1)
- [ ] T005 Implement `usePlanTierStatus.ts` in `src/hooks/` — React Query hook wrapping T004, `enabled: !!user?.organization_id` per repo convention, staleTime 5min per plan.md (depends on T003, T004)

**Checkpoint**: Shared plan-tier state available — user story implementation can now begin

---

## Phase 3: User Story 1 - Voir son palier actuel et sa progression vers la limite de comptes (Priority: P1) 🎯 MVP

**Goal**: Afficher le palier tarifaire actuel et la progression vers la limite de comptes actifs suivis (FR-001, FR-002, FR-003, FR-008)

**Independent Test**: Consulter l'interface avec des organisations à différents paliers/niveaux de progression et vérifier que le palier et la progression affichés correspondent à l'état renvoyé par l'API, y compris le cas "illimité" et les états loading/error

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [ ] T006 [P] [US1] Unit test for `usePlanTierStatus.ts` in `tests/unit/usePlanTierStatus.test.ts` — covers loading/error states (FR-008) and the `max_active_accounts === null` → unlimited branch (no misleading progress bar)
- [ ] T007 [P] [US1] Unit test for `PlanTierProgress.tsx` in `tests/unit/PlanTierProgress.test.tsx` — covers Acceptance Scenarios 1 ("42 / 50 comptes suivis") and 2 ("Illimité" display, no ratio against a nonexistent limit)

### Implementation for User Story 1

- [ ] T008 [US1] Create `src/components/billing/PlanTierProgress.tsx` — displays `plan_tier` name + `active_accounts_count`/`max_active_accounts` progress bar (shadcn/ui `Progress`), or "Unlimited" label when `max_active_accounts === null`, using `usePlanTierStatus` (depends on T005)
- [ ] T009 [US1] Add explicit loading and error states to `PlanTierProgress.tsx` per FR-008 — no default/guessed CTA or tier rendered while loading or on fetch failure (depends on T008)
- [ ] T010 [US1] Mount `PlanTierProgress.tsx` on the dashboard and/or settings screen (per plan.md, exact placement per design) — targeted edit, no new route

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - CTA self-serve par défaut (Free/Growth), proposition d'appel uniquement à la connexion Stripe (Priority: P2)

**Goal**: CTA self-serve par défaut pour Free/Growth partout dans l'app, proposition d'appel commercial affichée uniquement sur l'écran de connexion Stripe (FR-004, FR-005)

**Independent Test**: Visiter l'app en tant qu'organisation Free/Growth à divers endroits et vérifier qu'aucune proposition d'appel n'apparaît hors de l'écran Stripe, puis vérifier qu'elle y apparaît

### Tests for User Story 2 ⚠️

- [ ] T011 [P] [US2] Unit test for `SubscriptionCta.tsx` in `tests/unit/SubscriptionCta.test.tsx` — covers the "Free/Growth, off Stripe screen" branch (self-serve CTA only, no call proposal) per Acceptance Scenario 1
- [ ] T012 [P] [US2] E2E test in `tests/e2e/pricing-tier-interface.spec.ts` — covers Acceptance Scenario 2 (call proposal appears only on `/onboarding/stripe`, not before/elsewhere per Edge Case)

### Implementation for User Story 2

- [ ] T013 [US2] Create `src/components/billing/SubscriptionCta.tsx` — renders self-serve CTA (manage subscription / change tier) by default for `plan_tier` in `['free', 'growth']`, using `usePlanTierStatus` (depends on T005); `requires_appointment` from the API gates the branch, never derived locally (FR-007)
- [ ] T014 [US2] Targeted edit to `src/pages/onboarding/StripeConnect.tsx` — insert the commercial call proposal, rendered only on this screen, only for `plan_tier` in `['free', 'growth']` (depends on T013)

**Checkpoint**: User Stories 1 AND 2 both independently functional

---

## Phase 5: User Story 3 - CTA "demander un rendez-vous" exclusif pour Scale et Enterprise (Priority: P3)

**Goal**: CTA "demander un rendez-vous" exclusif (sans alternative self-serve) sur tous les écrans, y compris Stripe, pour Scale/Enterprise (FR-006)

**Independent Test**: Visiter l'app en tant qu'organisation Scale/Enterprise et vérifier qu'aucun CTA self-serve n'est jamais présenté, quel que soit l'écran, y compris Stripe

### Tests for User Story 3 ⚠️

- [ ] T015 [P] [US3] Unit test for `SubscriptionCta.tsx` in `tests/unit/SubscriptionCta.test.tsx` — covers the Scale/Enterprise branch (`requires_appointment === true`): RDV CTA only, no self-serve alternative, on every screen including Stripe, per Acceptance Scenario 1
- [ ] T016 [P] [US3] E2E test in `tests/e2e/pricing-tier-interface.spec.ts` — covers SC-002 (100% of Scale/Enterprise orgs never see a self-serve CTA across tested screens)

### Implementation for User Story 3

- [ ] T017 [US3] Wire the "request a meeting" CTA's click action in `SubscriptionCta.tsx`: on click, open `import.meta.env.VITE_APPOINTMENT_BOOKING_URL` in a new tab (`window.open(url, '_blank', 'noopener,noreferrer')`) — no backend call, no endpoint. Product decision (2026-07-27): the CTA is a static external link (e.g. Calendly-type), not a backend-driven mechanism. Read the URL from the env var only; do not hardcode it. The env var's placeholder value is documented in `.env.example` ("to be replaced before implementation") — do not invent a real URL
- [ ] T018 [US3] Extend `SubscriptionCta.tsx` to render only the RDV CTA (no self-serve alternative) when `requires_appointment === true`, on every screen including `/onboarding/stripe` (overrides US2's Stripe-only call proposal for this tier) (depends on T013 and T017)

**Checkpoint**: All three user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T019 [P] Verify zero-PII compliance across all new components (only tier name/counts/CTAs displayed, no account names/emails) per constitution principle I
- [ ] T020 [P] Verify all new UI strings are American English (en-US) per constitution principle IV — no French strings, `fr.ts` untouched or additive only
- [ ] T021 Verify no visual regression on dashboard/settings/onboarding Stripe screens (SC-004)
- [ ] T022 Run `npx tsc --noEmit` and fix any strict-mode violations (no `any`, `as any`, `@ts-ignore`, `@ts-expect-error`)
- [ ] T023 Run `npm run build` to confirm the build passes
- [ ] T024 [P] Run `npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (T003-T005). Fully unblocked — contract complete for tier/progression display
- **US2 (Phase 4)**: Depends on Foundational and on US1's `SubscriptionCta.tsx` base (T013 created here, extended in US3) — fully unblocked, `requires_appointment` documented
- **US3 (Phase 5)**: Depends on Foundational and on US2's `SubscriptionCta.tsx` (T013). Fully unblocked — RDV click action (T017) opens a static external link via `VITE_APPOINTMENT_BOOKING_URL`, no backend dependency
- **Polish (Phase 6)**: Depends on all desired stories being complete

### Parallel Opportunities

- T006, T007 in parallel (US1 tests, different files)
- T011, T012 in parallel (US2 tests); T015, T016 in parallel (US3 tests)
- US1 (Phase 3) can proceed fully in parallel with US2/US3 setup once Foundational is done, though `SubscriptionCta.tsx` (T013) is shared between US2 and US3 — sequence T013 before T018 in practice

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (US1) — ships tier + progress display, no CTA differentiation yet
3. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Test independently → Deploy/Demo (MVP)
3. US2 → Test independently → Deploy/Demo (self-serve CTA + Stripe-screen call proposal, fully unblocked)
4. US3 (T015-T018) → Deploy once ready; RDV CTA opens `VITE_APPOINTMENT_BOOKING_URL` (static external link, no backend mechanism needed)

---

## Notes

- [P] tasks = different files, no dependencies
- T017: product decision (2026-07-27) — the RDV CTA opens an external link (Calendly-type) read from `VITE_APPOINTMENT_BOOKING_URL`, no backend call. Placeholder value in `.env.example` must be replaced with the real URL before implementation ships
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
