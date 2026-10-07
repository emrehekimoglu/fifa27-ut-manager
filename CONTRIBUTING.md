# Contributing

This guide is binding for every change to the repository, whether a person or a tool writes it. The rationale is in [PRD §10](docs/product/PRD.md#10-development-process).

## Workflow at a glance

1. Create a branch from `main` (see [Branches](#branches)).
2. **Red:** write tests that specify the change, run them, see them fail for the right reason, then commit (`test: …`).
3. **Green:** implement the minimum code that makes them pass, then commit (`feat: …` / `fix: …`).
4. **Refactor** with the tests green, then commit (`refactor: …`).
5. Make sure all local checks pass, then push and open a pull request using the template.
6. The owner verifies the change on the preview deployment, then reviews and merges. Only the owner merges.

## Test-first rules

**Order**

- Tests are committed **before** the code they cover, and the PR history must show this. A PR whose implementation precedes its tests is not merged.
- A red-phase stub is allowed only to make the failure an assertion failure rather than a compile error. A stub throws `Error('Not implemented')` and contains no logic.
- Every bug fix starts with a failing test that reproduces the bug.

**Test quality**

- **Assert exact values.** Do not settle for `> 0`, `toBeDefined()` or `toBeTruthy()` when the exact expected value is known.
- **Expected values are derived independently,** from in-game references, documented game rules or hand calculation, never by running the code under test and copying its output.
- **Use real data.** Fixtures come from real card data captured from the data sources. Do not invent card data when real data exists.
- **Mock only at process boundaries** (network, clock, database). Never mock the unit under test. Contract tests keep boundary mocks honest.
- **No snapshot-only tests** for logic.
- **No trivial tests.** Do not test getters, framework behaviour or guarantees the type system already enforces.

**Quality gates (enforced in CI)**

| Gate                                                           | Threshold                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------- |
| Line, branch, function and statement coverage of logic modules | ≥ 90 %                                                         |
| Stryker mutation score                                         | ≥ 80 % (the build breaks below this)                           |
| End-to-end tests                                               | Every user-facing flow, at desktop and 360 px mobile viewports |

If mutants survive, improve the tests. Never lower the thresholds.

## Prototype-driven increments

- Every PR delivers something the owner can see and try on its Vercel preview deployment.
- Work without a UI ships with a minimal demo page.
- Every PR description has a **How to verify** section with step-by-step instructions.

## Branches

Format: `<type>/<short-descriptive-name>` in kebab-case.

| Prefix      | Use for                               |
| ----------- | ------------------------------------- |
| `feat/`     | New user-facing functionality         |
| `fix/`      | Bug fixes                             |
| `refactor/` | Code changes without behaviour change |
| `test/`     | Test-only changes                     |
| `docs/`     | Documentation only                    |
| `chore/`    | Tooling, scaffolding, maintenance     |
| `ci/`       | CI/CD configuration                   |
| `perf/`     | Performance improvements              |
| `build/`    | Build system or dependencies          |

Examples: `feat/squad-builder-pitch`, `fix/chemistry-icon-nation-count`.

## Commits

- Follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`. The summary is imperative and lower-case, with no trailing period, and the header is at most 72 characters.
- Scopes match the package or area, e.g. `web`, `domain`, `data-sync`, `price-worker`, `deps`.
- The commit body explains **why** when it is not obvious from the diff.
- **No AI attribution.** Commit messages, PR titles and descriptions, and review comments contain no AI-tool attribution, no `Co-Authored-By` trailers for tools, and no "generated with" notes.
- commitlint enforces the format in the local `commit-msg` hook and in CI.

## Pull requests

- PRs are opened without asking first. **Only the owner merges**, after verifying the change.
- Keep each PR to one increment that can be reviewed and verified in one sitting.
- Fill in every section of the template, including the test-first evidence (the red and green commits) and How to verify.
- CI must be green before a PR is merged.

## Secrets and personal data

The repository is **public**.

- Never commit API keys, tokens, service-role keys, database URLs or personal data such as the allow-listed e-mail addresses.
- CI and scheduled jobs read secrets from **GitHub repository secrets**. Runtime services read them from their platform's encrypted environment variables.
- Document every variable in `.env.example` with a placeholder. Real `.env*` files are git-ignored.
- gitleaks scans every push and pull request. If a secret is ever committed, rotate it immediately; removing the commit is not enough.

## Local checks

Run these before pushing. They are the same checks CI runs.

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:mutation
pnpm test:e2e      # first run: pnpm --filter @fc27/web exec playwright install chromium
```

If Chromium is preinstalled somewhere else, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its path.

## Architecture decisions

Significant technical decisions are recorded as ADRs in [`docs/adr`](docs/adr/README.md). Copy the template, use the next free number, and link the ADR from the PR.
