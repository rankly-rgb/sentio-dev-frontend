# Sentio Frontend Constitution

## Core Principles

### I. Zero-PII
No personal data may be stored client-side, whether in application state or in
any persistent storage. Only anonymous Stripe IDs may be displayed — never
emails, names, or other personally identifying information.

### II. Stack & Structure
Vite SPA + React 18 + TypeScript. Routing lives in `src/pages/`.

### III. TypeScript Strict, ES5 Target
TypeScript strict mode, targeting ES5. Syntax incompatible with ES5 — such as
`[...new Set()]` — is forbidden.

### IV. English-Only UI
The entire UI is in English. Never reintroduce French strings into the
interface.

### V. API Contract Compliance
Any data coming from the API must conform to the contracts defined in
`API_CONTRACTS.md`. Never invent a field or a data shape that is not
documented there.

## Additional Constraints

- **Targeted edits only**: code modifications must be made via targeted
  string replacement (str_replace). Never rewrite a file wholesale.
- **Visual identity is frozen**: never modify the graphic identity (color
  palette, typography) without an explicit instruction distinct from the
  task at hand.

## Development Workflow

- All changes go through a PR to `main`, validated via a Vercel preview
  before merge. Never push directly to `main`.

## Governance

This constitution supersedes ad-hoc practices for any feature developed
through the Spec Kit pipeline. All specs, plans, and implementations must
verify compliance with these principles before proceeding to the next stage.

**Version**: 1.0.0 | **Ratified**: 2026-07-26 | **Last Amended**: 2026-07-26
