---

description: "Task list for feature implementation"

---

# Tasks: Interface différenciée selon le palier tarifaire

**Input**: Design documents from `/specs/002-pricing-tier-interface/`

**Prerequisites**: plan.md (loaded), spec.md (loaded). No data-model.md, contracts/, or research.md exist for this feature — tasks below are derived from plan.md's Project Structure and spec.md's user stories/FRs only.

**Tests**: Included (repo convention per `CLAUDE.md` — "Écrire le test AVANT l'implémentation quand c'est possible" — and plan.md's Testing section).

**Organization**: Tasks are grouped by user story (US1/US2/US3, per spec.md priorities P1/P2/P3) to enable independent implementation and testing.

**Contract status** (`API_CONTRACTS.md`, root of this repo — merged from `sentio-dev-backend` `main` + `feat/playbook-outcome-tracking` + `feat/pricing-billing-implementation` (commit `f97d9f4`, refreshed 2026-07-27); distinct from `docs/API_CONTRACTS.md`, the unrelated Scoring Engine V2 contract, which still carries a stale/uncorrected copy of this section from 2026-07-26 — do not read from there): **provisional, not yet merged by backend on its own repo's `main`**. Covers `GET /pricing-status` (`plan_tier` incl. "scale", `active_accounts_count`/`max_active_accounts`/`usage_pct`/`alert_active`, `requires_appointment`), the `ai_insights` `plan_limit_warning` type, the RDV CTA's action (§ resolved in a prior session — `VITE_APPOINTMENT_BOOKING_URL`, no backend call), and `POST /sentio-billing/subscribe` (§ 8.3, **corrected 2026-07-27**: calls the Stripe Subscriptions API directly, not Stripe Checkout — no redirect URL, no `client_secret` returned; see the note below T018's checkpoint for how this is surfaced to the user).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 per spec.md
- Paths are relative to repo root (`src/`, `tests/`), per plan.md's Project Structure (single frontend project)

---

## Phase 1: Setup

**Purpose**: Confirm preconditions before touching code

- [ ] T001 **NOT VERIFIABLE FROM HERE**: `API_CONTRACTS.md` (root) § "Pricing & Billing" reflects `sentio-dev-backend`'s `feat/pricing-billing-implementation` branch (commit `f97d9f4`), but merge status onto that repo's `main` cannot be checked from this sandbox — `main` (commit `7f7f148`) still has no "Pricing & Billing" section as of this check. Implementation proceeded per the contract as documented on the feature branch; re-confirm the merge before this ships
- [X] T002 [P] Confirm React Query v5, react-router-dom, shadcn/ui (`Progress`, `Card`, `Button`) are already available in `package.json` (no new dependencies expected per plan.md) — confirmed, all already in use elsewhere in the repo

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types/hook consumed by all three user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create `src/lib/types/plan-tier.ts` with `PricingStatus` type: `plan_tier` (`'free' | 'growth' | 'scale' | 'enterprise'`, non-nullable — `'starter'` never expected), `active_accounts_count` (number), `max_active_accounts` (number | null, `null` = unlimited), `usage_pct` (number | null, `null` if unlimited, can exceed 100), `alert_active` (boolean), `requires_appointment` (boolean) — per contract § 8.1. Does not reuse `PlanType` from `src/lib/types/trial.ts`. Also added `SelfServeTargetTier`, `SubscribeToPlanPayload`, `SubscribeToPlanResult` (§ 8.3) — needed for T013's actual click behavior, not explicitly called out as a separate task but required to implement it
- [X] T004 Add `getPricingStatus()` fetch function in a new `src/lib/queries/pricing-queries.ts` calling `GET /pricing-status` (contract § 8.1). Also added `subscribeToPlan()` calling `POST /sentio-billing/subscribe` (§ 8.3) — same note as T003
- [X] T005 Implement `usePlanTierStatus.ts` in `src/hooks/` — React Query hook wrapping T004, `enabled: !!user?.organization_id` per repo convention, staleTime 5min per plan.md (depends on T003, T004). Also added `useSubscribeToPlan.ts` wrapping the subscribe mutation, invalidating `pricing-status` on success

**Checkpoint**: Shared plan-tier state available — user story implementation can now begin

---

## Phase 3: User Story 1 - Voir son palier actuel et sa progression vers la limite de comptes (Priority: P1) 🎯 MVP

**Goal**: Afficher le palier tarifaire actuel et la progression vers la limite de comptes actifs suivis (FR-001, FR-002, FR-003, FR-008)

**Independent Test**: Consulter l'interface avec des organisations à différents paliers/niveaux de progression et vérifier que le palier et la progression affichés correspondent à l'état renvoyé par l'API, y compris le cas "illimité" et les états loading/error

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T006 [P] [US1] Unit test for `usePlanTierStatus.ts` — implemented at `src/hooks/__tests__/usePlanTierStatus.test.tsx` (repo convention is colocated `__tests__/`, not `tests/unit/` — same deviation as chantiers B/C). Covers loading/error states (FR-008) and the `max_active_accounts === null` → unlimited branch
- [X] T007 [P] [US1] Unit test for `PlanTierProgress.tsx` — implemented at `src/components/billing/__tests__/PlanTierProgress.test.tsx` (colocated convention). Covers Acceptance Scenarios 1 ("42 / 50 accounts tracked") and 2 ("Unlimited accounts" display, no ratio against a nonexistent limit)

### Implementation for User Story 1

- [X] T008 [US1] Create `src/components/billing/PlanTierProgress.tsx` — displays `plan_tier` name + `active_accounts_count`/`max_active_accounts` progress bar (shadcn/ui `Progress`), or "Unlimited" label when `max_active_accounts === null`, using `usePlanTierStatus` (depends on T005)
- [X] T009 [US1] Add explicit loading and error states to `PlanTierProgress.tsx` per FR-008 — no default/guessed CTA or tier rendered while loading or on fetch failure (depends on T008). Implemented together with T008 in the same file
- [X] T010 [US1] Mount `PlanTierProgress.tsx` on the dashboard screen, next to a new `SubscriptionCta` card, directly below `BenchmarkSection` (`src/pages/Dashboard.tsx`) — targeted edit, no new route. Not also mounted on Settings — not explicitly required by FR-001/002/003, and plan.md left exact placement open ("dashboard and/or settings")

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - CTA self-serve par défaut (Free/Growth), proposition d'appel uniquement à la connexion Stripe (Priority: P2)

**Goal**: CTA self-serve par défaut pour Free/Growth partout dans l'app, proposition d'appel commercial affichée uniquement sur l'écran de connexion Stripe (FR-004, FR-005)

**Independent Test**: Visiter l'app en tant qu'organisation Free/Growth à divers endroits et vérifier qu'aucune proposition d'appel n'apparaît hors de l'écran Stripe, puis vérifier qu'elle y apparaît

### Tests for User Story 2 ⚠️

- [X] T011 [P] [US2] Unit test for `SubscriptionCta.tsx` — implemented at `src/components/billing/__tests__/SubscriptionCta.test.tsx` (colocated convention). Covers the "Free/Growth, off Stripe screen" branch (self-serve CTA only, no call proposal) per Acceptance Scenario 1
- [ ] T012 [P] [US2] **NOT RUN — no environment available**: E2E test written at `e2e/pricing-tier-interface.spec.ts` (repo's real E2E dir is `e2e/` at root, not `tests/e2e/`) — covers Acceptance Scenario 2 (call proposal appears only on `/onboarding/stripe`). Requires a live backend + browser + seeded Free/Growth/Scale/Enterprise test orgs, none of which exist in this sandbox — file exists but has never been executed

### Implementation for User Story 2

- [X] T013 [US2] Create `src/components/billing/SubscriptionCta.tsx` — renders self-serve CTA by default for `plan_tier` in `['free', 'growth']`, using `usePlanTierStatus` (depends on T005); `requires_appointment` from the API gates the RDV branch, never derived locally (FR-007). **Beyond the task's literal text**: also wires the actual click behavior — "Upgrade to Growth" (free) calls `POST /sentio-billing/subscribe` for real via `useSubscribeToPlan`, "Downgrade to Free" (growth) does the same with the opposite target. See the dedicated note below the checkpoint for the upgrade button's exact behavior (this turn's core ask)
- [X] T014 [US2] Targeted edit to `src/pages/onboarding/StripeConnect.tsx` — insert `<SubscriptionCta context="stripe-connect" />` after the zero-PII badge block, rendered only on this screen (depends on T013). The RDV branch inside `SubscriptionCta` still overrides this for Scale/Enterprise (per T018), so it's a single shared component rather than a separate conditional block

**Checkpoint**: User Stories 1 AND 2 both independently functional

---

## Phase 5: User Story 3 - CTA "demander un rendez-vous" exclusif pour Scale et Enterprise (Priority: P3)

**Goal**: CTA "demander un rendez-vous" exclusif (sans alternative self-serve) sur tous les écrans, y compris Stripe, pour Scale/Enterprise (FR-006)

**Independent Test**: Visiter l'app en tant qu'organisation Scale/Enterprise et vérifier qu'aucun CTA self-serve n'est jamais présenté, quel que soit l'écran, y compris Stripe

### Tests for User Story 3 ⚠️

- [X] T015 [P] [US3] Unit test for `SubscriptionCta.tsx` — implemented at `src/components/billing/__tests__/SubscriptionCta.test.tsx` (colocated convention, same file as T011). Covers the Scale/Enterprise branch (`requires_appointment === true`): RDV CTA only, no self-serve alternative, including on the Stripe-connect screen; also covers that this is gated purely on `requires_appointment`, never on `plan_tier` locally (FR-007)
- [ ] T016 [P] [US3] **NOT RUN — no environment available**: E2E test written at `e2e/pricing-tier-interface.spec.ts` — covers SC-002. Same environment gap as T012
- [X] T017 [US3] Wire the "request a meeting" CTA's click action in `SubscriptionCta.tsx`: on click, open `import.meta.env.VITE_APPOINTMENT_BOOKING_URL` in a new tab — no backend call. *(Note: T017 was unblocked in `tasks.md`/`plan.md` in a prior session, but `SubscriptionCta.tsx` itself didn't exist yet — this is the first pass that actually writes the component and this click handler.)*
- [X] T018 [US3] Extend `SubscriptionCta.tsx` to render only the RDV CTA (no self-serve alternative) when `requires_appointment === true`, on every screen including `/onboarding/stripe` (depends on T013 and T017) — the RDV branch returns before any self-serve/call-proposal JSX is reached, so it cannot leak through on any screen (verified by the "gates the RDV branch purely on requires_appointment" and "only ever sees Request a meeting" tests)

**Checkpoint**: All three user stories independently functional

**Growth self-serve upgrade — known limitation, handled explicitly (not simulated)**:
`API_CONTRACTS.md` § 8.3 confirms the real implementation calls the Stripe Subscriptions
API directly (`payment_behavior: default_incomplete`), **not Stripe Checkout** — no
redirect URL or `client_secret` is ever returned, so there is currently no way for the
frontend to collect a payment method. Clicking "Upgrade to Growth" in `SubscriptionCta.tsx`
still calls `POST /sentio-billing/subscribe` for real (via `useSubscribeToPlan`) — this
does create a genuine (if unpayable) Stripe subscription object server-side — but the
button is immediately replaced by an explicit "Online payment coming soon" card
(`fr.pricingTiers.upgradePendingTitle`/`upgradePendingBody`) whenever the returned
`status` isn't `'active'`, which is what the endpoint will realistically always return
today. The button never lingers looking clickable/functional with nothing behind it.
Downgrading Growth → Free is unaffected by this gap and works end-to-end today (the
contract confirms `status: 'active'` is returned synchronously for that direction, no
payment collection needed).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T019 [P] Verify zero-PII compliance across all new components — confirmed: only tier name, account counts/ratios, and CTA labels are displayed; no account names/emails introduced
- [X] T020 [P] Verify all new UI strings are American English (en-US) per constitution principle IV — confirmed, all new strings added to `src/i18n/en.ts` (`fr.ts` doesn't exist in this repo — see the equivalent note already recorded on chantier C's tasks.md)
- [ ] T021 **NOT RUN — no environment available**: visual regression on dashboard/settings/onboarding Stripe screens requires a running dev server viewed in a browser to compare against; this sandbox has no headed browser/screenshot tool. `npm run build` (T023) confirms the bundle compiles and the new components don't crash the build, but that is not the same as a visual check — do not treat this as verified
- [X] T022 Run `npx tsc --noEmit` and fix any strict-mode violations (no `any`, `as any`, `@ts-ignore`, `@ts-expect-error`) — clean, no output
- [X] T023 Run `npm run build` to confirm the build passes — succeeded
- [X] T024 [P] Run `npm run lint` — clean on every file touched by this feature; pre-existing errors/warnings remain in unrelated files (`src/components/ui/*.tsx`, `tailwind.config.ts`, `scripts/seed-stripe-customers.ts`, `src/hooks/use-toast.ts`), not modified by this change

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
