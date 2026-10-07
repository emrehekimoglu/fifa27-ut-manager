# ADR-0002: Monorepo and toolchain

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The PRD (§9) foresees several deployable parts: the web app, a price worker and a catalog sync job. They share pure domain logic and game-rule data. The development process (PRD §10) requires strict test-first development with coverage and mutation-score gates, end-to-end tests on mobile and desktop, and a preview deployment for every pull request.

## Decision

We will use:

**Repository and runtime**

- **A pnpm workspace monorepo.** Deployables go in `apps/*` and shared libraries in `packages/*`.
- **Node.js 24 (LTS)**, pinned via `.nvmrc` and `engines`.

**Language and code style**

- **TypeScript 6.0** in strict mode with additional strictness flags (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, …), shared through `tsconfig.base.json`.
  - TypeScript 7 is available, but `typescript-eslint` 8 supports only TypeScript < 6.1. We will move to 7 when the linter supports it.
- **ESLint** (flat config) with the `typescript-eslint` strict and stylistic type-checked presets.
- **Prettier** for formatting.

**Web app**

- **React 19 + Vite 8**, deployed on **Vercel**, which gives every pull request its own preview URL.

**Testing**

- **Vitest 4.1** for unit tests with V8 coverage thresholds.
  - Vitest 5 is available, but with `@stryker-mutator/vitest-runner` 10.0 it never activates runtime mutants. Every mutant in a function body is reported as survived regardless of the tests.
  - We verified this on this repository: 44 % with Vitest 5 versus 100 % with Vitest 4.1, using the same tests.
  - We will upgrade when the runner supports Vitest 5.
- **Stryker** for mutation testing. The break threshold is 80 %.
- **Playwright** for end-to-end tests, with a desktop project and a 360 px mobile project.

**Commits and dependencies**

- **commitlint + husky + lint-staged** to enforce Conventional Commits and pre-commit checks locally. CI runs the same checks again.
- **Dependabot** for dependency updates. It holds back the Vitest and TypeScript majors that would break the toolchain.

## Alternatives considered

- **Separate repositories per deployable:** they would duplicate tooling, and sharing domain code would mean publishing packages.
- **npm or Yarn workspaces:** pnpm is faster, and its strict dependency isolation catches undeclared dependencies.
- **Jest:** slower, and it needs separate TypeScript and ESM configuration, while Vitest shares the Vite pipeline.
- **Next.js:** server rendering is unnecessary for a two-user app, and a static Vite app is simpler to host and to test.
- **Lowering or skipping mutation testing** to stay on Vitest 5: this would remove the main safeguard against loose tests (PRD §10.1).

## Consequences

- One install and one CI pipeline cover every package.
- Two pinned versions (Vitest 4.1 and TypeScript 6.0) must be revisited when their blockers are resolved. Dependabot is configured to not propose those majors in the meantime.
- Stryker needs its runner plugin listed explicitly (`plugins` in `stryker.config.json`), because pnpm's isolated `node_modules` prevents plugin auto-discovery.
