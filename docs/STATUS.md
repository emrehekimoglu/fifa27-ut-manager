# Project status and handover

This file tells a new working session where the project stands and what comes next. Read it after [CLAUDE.md](../CLAUDE.md), [CONTRIBUTING.md](../CONTRIBUTING.md) and the [PRD](product/PRD.md). Update it in the pull request that changes the state it describes.

- **Last updated:** 2026-10-09
- **Current milestone:** M3 (domain engine); part 1 merged, part 2 (true rating) design in review

## 1. Milestones

| Milestone             | State       | Pull requests           | What the owner can see                                                                               |
| --------------------- | ----------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| M0 Foundation         | Done        | #2, #9                  | Placeholder page with build info, CI, preview deployments                                            |
| M1 Data spike         | Done        | #8                      | `/kaynaklar` source page; ADR-0003 (card sources), ADR-0004 (prices via a home agent)                |
| M2 Catalog pipeline   | Done        | #10, #11, #12, #13, #14 | Daily catalog sync into Supabase (ADR-0005); `/katalog` with search, position filter and card detail |
| M3 Domain engine      | In progress | #15, #16                | `/oyun-alani` playground: formation, 11 slots, chemistry, squad rating, chemistry styles (ADR-0006)  |
| M4 Squad builder      | Not started | —                       | —                                                                                                    |
| M5 Prices             | Not started | —                       | —                                                                                                    |
| M6 Recommendations    | Not started | —                       | —                                                                                                    |
| M7 Search and compare | Not started | —                       | —                                                                                                    |
| M8 Release            | Not started | —                       | —                                                                                                    |

## 2. What runs in production

- **Web app:** https://fifa27-ut-manager.vercel.app (Vercel, root `apps/web`).
  - The production domain is public.
  - Preview deployments are behind Vercel Authentication.
  - No personal data is stored yet; sign-in arrives in M4.
- **Database:** Supabase Postgres with `cards` and `catalog_syncs` (migrations in `supabase/migrations`).
  - RLS allows reads only.
  - Writes need the secret key.
- **Catalog sync:** `.github/workflows/catalog-sync.yml`, daily at 03:47 UTC and on demand.
  - It reads FUT.GG in seven overall bands, about 19,958 cards.
  - GitHub often starts the scheduled run hours late (the first scheduled run started at 10:57 UTC); the run itself succeeds.
- **Migrations:** `.github/workflows/db-migrate.yml` runs on pushes to `main` that touch `supabase/migrations`.

### Configuration

The secret values live only in GitHub and Vercel, never in the repository.

| Name                                                     | Where                                           | State |
| -------------------------------------------------------- | ----------------------------------------------- | ----- |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL` | GitHub Actions secrets                          | Set   |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`     | Vercel, type **Config**, Production and Preview | Set   |

Cloud sessions need these hosts on the environment's network allowlist: `www.fut.gg` and `assets.fut.gg`. Both are already added.

## 3. Decisions and known limitations

- **FUT.GG blocks Vercel** (HTTP 403) but serves GitHub Actions runners. The web app therefore never calls FUT.GG. It reads the stored catalog, and the source page reports FUT.GG from it. Bot protection is never circumvented.
- **FUT.GG prices are only served to residential IPs.** They will come from a price agent on the owner's Windows PC (ADR-0004, M5).
- **EA's ratings API** links only FC 25 card images, so EA cards show a placeholder. Its data is current, and it is used only to bootstrap an empty catalog.
- **Heroes have no club** (`club: null`). Their chemistry comes from league and nation only.
- **The squad rating uses the starting XI only** (confirmed by the owner). Its rounding follows the community formula and has not yet been compared with in-game squads.
- **The rules data** (formations, chemistry styles, face-stat weights) comes from FUT.GG's site bundle, cross-checked against FUT.GG's pages (ADR-0006). A rules change is a data change in `packages/domain/src/rules`.
- **AcceleRATE with a chemistry style** comes from FUT.GG's per-card table of the type each style gives at full chemistry (`accelerateTypeByStyle`). Below full chemistry the card's own type is used, an approximation (true-rating design §2.3). Cards get the table at their next catalog sync.
- **The manager** is not supported yet, because there is no manager catalog.
- **The playground** is not saved.

## 4. Next steps, in order

1. **Check M3 part 1 against the game.**
   - The owner builds a full XI from their club in `/oyun-alani` and compares squad rating and chemistry with the game.
   - Fix any mismatch the owner reports, especially in the squad-rating rounding.
2. **PlayStyle names.**
   - `https://www.fut.gg/api/fut/playstyles/` returns 36 PlayStyles with the `eaId` the catalog stores.
   - Add them as rules data and show names on the card detail and in the playground.
3. **M3 part 2: true rating** (PRD §7.4).
   - The design is [`docs/domain/true-rating.md`](domain/true-rating.md). It needs the owner's approval before any implementation starts.
   - After approval, follow its delivery plan (§7), one PR per step: PlayStyle and role rules data (this also covers step 2 above), per-style AcceleRATE in the catalog, the calibration workflow, then the true rating and chemistry-style auto-selection in `@fc27/domain` and the UI.
   - AcceleRATE needs no rules: FUT.GG's card data lists each card's AcceleRATE type per chemistry style (`accelerateTypes`).
   - Calibration uses FUT.GG's per-role, per-style meta ratings (`/api/fut/metarank/player/{eaId}/`), fetched by a manual GitHub Actions workflow and never committed.
4. **Manager support.** Find a source for FC 27 managers (nation, league), then add a manager slot to the chemistry calculation and the playground.
5. **M4 squad builder.**
   - Google sign-in with an allow-list of the two users.
   - RLS on reads.
   - Saved squads with 7 substitutes and a manager.
   - Pitch UI and club management (owned cards cost 0).
6. **M5 prices:** the home price agent (ADR-0004), with a Windows setup guide written step by step for the owner.
7. **M6 recommendations, M7 search and compare, M8 release,** as in PRD §12.

## 5. Working notes for a new session

- **Owner instructions:** the owner expects every manual step explained from scratch, in Turkish, naming each page, button and field (see CLAUDE.md). Never ask for secret values in chat.
- **Pull requests:** open them without asking. The owner merges. Follow the PR template, including test-first evidence and "How to verify". No AI attribution anywhere.
- **Commits:** a `test:` commit before every `feat:`/`fix:`. Coverage ≥ 90 % and mutation score ≥ 80 % per package; all packages are currently at 100 %.
- **Local checks:** `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm test:mutation && pnpm test:e2e`.
  - With a preinstalled Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
  - Database integration tests need Docker and run in CI (CONTRIBUTING.md).
- **Packages:**
  - `@fc27/data-sync`: source adapters and the catalog sync.
  - `@fc27/domain`: pure game logic.
  - `@fc27/web`: React app and the `/api/source-health` function.
  - The web app's tests alias both packages to their sources.
