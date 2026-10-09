# Assistant instructions

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/product/PRD.md](docs/product/PRD.md) before making changes. They are binding. The rules below are the ones most often relevant.

[docs/STATUS.md](docs/STATUS.md) records where the project stands and what comes next. Read it at the start of a session, and update it in every pull request that changes the state it describes.

## Hard rules

- **No AI attribution anywhere.** No `Co-Authored-By` trailers, "Generated with" lines or tool names in commits, PR titles and descriptions, or GitHub comments. If a tool appends such a footer automatically, remove it immediately and verify that it is gone.
- **Commit identity:** use the repository owner's configured git identity, never a tool identity.
- **Branches:** `<type>/<descriptive-name>` (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `ci/`, `perf/`, `build/`). Never push to `main` directly. Never push to auto-generated tool branches.
- **Pull requests:** open PRs without asking. Never merge; the owner merges.
- **Strict test-first:** commit failing tests (`test:`) before the implementation (`feat:`/`fix:`). Tests assert exact, independently derived values. No loose, trivial or snapshot-only logic tests. Keep the coverage (≥ 90 %) and mutation score (≥ 80 %) gates; never lower them.
- **Prototype-driven:** every PR includes something the owner can see on the preview deployment, plus a "How to verify" section.
- **Public repo:** never commit secrets or personal data. Use GitHub repository secrets and `.env.example` placeholders.
- **Data acquisition:** never implement bot-protection circumvention (Cloudflare bypass, stealth or fingerprint evasion, CAPTCHA solving, request-signature reverse engineering). Never automate EA accounts or services.
- **Language:** the UI is in Turkish. Code, comments, commits and docs are in English.
- **Owner instructions:** whenever the owner must do something by hand (accounts, dashboards, secrets, workflows), explain it from scratch, step by step:
  - Name every page, button and field exactly as the UI labels it.
  - Say what the value looks like and where it goes.
  - Never assume earlier context.
  - Keep `docs/guides` equally detailed.

## Toolchain notes

- Node 24 and pnpm 10 workspaces.
- Vitest is pinned to 4.1 and TypeScript to 6.0 (see [ADR-0002](docs/adr/0002-monorepo-and-toolchain.md)).
- Run `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm test:mutation && pnpm test:e2e` before pushing.
