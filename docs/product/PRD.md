# Product Requirements Document — FC 27 UT Manager

| Field          | Value          |
| -------------- | -------------- |
| Status         | **Approved**   |
| Version        | 1.0.0          |
| Owner          | Emre Hekimoğlu |
| Target release | v0.1.0         |
| Last updated   | 2026-10-07     |

---

## 1. Overview

FC 27 UT Manager is a private web application for building and evaluating EA SPORTS FC 27
Ultimate Team squads. Users pick a formation, place cards into positions and immediately see
the squad's rating, chemistry, line strengths, a more realistic "true rating" and total market
value. For every empty slot the app recommends cards, balancing performance against price
under a user-defined budget, and re-computes recommendations whenever the squad changes.

The app has exactly two users (the owner and his father) and is used on both mobile phones
and desktop computers.

## 2. Goals and non-goals

### 2.1 Goals (v0.1)

- G1. Build a squad in any FC 27 formation (starting XI, 7 substitutes, manager) on phone or desktop.
- G2. Show accurate squad metrics that match the game: squad rating and chemistry.
- G3. Provide an independent, documented **true rating** that reflects in-game effectiveness better than the card's overall rating.
- G4. Recommend cards for empty slots with an adjustable price/performance trade-off and budget constraints.
- G5. Use near-real-time console market prices.
- G6. Sync squads and owned-club data between devices for each user.

### 2.2 Non-goals (v0.1)

- Automation of users' EA accounts (no Web App / Companion App automation, no trading, no auto-buying).
- Importing the club from the EA account (a v0.2 candidate, see §6.4).
- PC market prices.
- SBC cards and SBC cost estimation (planned for v0.2).
- Evolutions (planned for v0.2).
- Multiple saved squads per user (planned for v0.2).
- Role-based true rating with per-slot role selection (planned for v0.2).
- Public access, sign-up, or any users beyond the two allow-listed accounts.

## 3. Users

| Persona | Description                                            | Primary devices |
| ------- | ------------------------------------------------------ | --------------- |
| Owner   | Plays UT, plans upgrades, wants value-for-money picks. | Phone, desktop  |
| Father  | Plays UT, same needs, may prefer simpler flows.        | Phone, desktop  |

Both users have identical permissions. Each user has their own squad and their own club
(owned cards). Users can view, but not edit, each other's squad.

## 4. Glossary

| Term             | Meaning                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Card             | A specific item version of a player (e.g. Gold Rare, TOTW, Icon, Holographic). Identified by EA's `eaId`. |
| Overall (OVR)    | The rating printed on the card.                                                                           |
| Squad rating     | The team rating the game shows, computed by EA's (reverse-engineered) formula.                            |
| Chemistry (chem) | 0–3 per player, 0–33 for the starting XI, from club/league/nation counts.                                 |
| Chemistry style  | A modifier (Hunter, Shadow, Engine, …) that boosts attributes depending on the player's chem.             |
| True rating      | This app's position-specific effectiveness score, derived from in-game attributes and traits.             |
| Meta rating      | A third-party effectiveness rating (e.g. from FUT.GG), shown for comparison when available.               |
| Club             | The set of cards a user owns. Owned cards cost 0 in recommendations.                                      |

## 5. Functional requirements

Priorities: **P0** = required for v0.1, **P1** = desirable for v0.1, **P2** = v0.2 or later.

### 5.1 Authentication and users

| ID     | Requirement                                                                         | Priority |
| ------ | ----------------------------------------------------------------------------------- | -------- |
| AUTH-1 | Users sign in with Google.                                                          | P0       |
| AUTH-2 | Only allow-listed Google accounts (2) can access the app; others are rejected.      | P0       |
| AUTH-3 | Sessions persist on the device; signing in on one device does not sign out another. | P0       |

### 5.2 Card catalog and search

| ID    | Requirement                                                                                                                                                                                                                                                                     | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| CAT-1 | The catalog contains all FC 27 UT cards that can be bought on the transfer market, plus every card in either user's club, including untradeable ones.                                                                                                                           | P0       |
| CAT-2 | Each card has: name, card version, overall, positions (primary + alternates), all face stats and sub-attributes, weak foot, skill moves, foot, height, weight, AcceleRATE type, PlayStyles / PlayStyles+, Player Roles with +/++ familiarity, club, league, nation, image URLs. | P0       |
| CAT-3 | Quick search by name, available everywhere a card can be chosen.                                                                                                                                                                                                                | P0       |
| CAT-4 | Advanced search: filter by position, league, nation, club, card version, price range, overall range, any face stat range, PlayStyle(+), AcceleRATE type, weak foot, skill moves, owned only. Sort by overall, true rating, price, value.                                        | P1       |
| CAT-5 | Card detail view with all stats, true rating per eligible position, current price, price history, and meta rating when available.                                                                                                                                               | P0       |

### 5.3 Squad builder

| ID    | Requirement                                                                                              | Priority |
| ----- | -------------------------------------------------------------------------------------------------------- | -------- |
| SQD-1 | Choose any formation available in FC 27; the pitch layout updates accordingly.                           | P0       |
| SQD-2 | Place a card into any starting-XI slot, any of the 7 substitute slots, or the manager slot.              | P0       |
| SQD-3 | Move or swap cards between slots (tap-to-select on mobile, drag-and-drop on desktop).                    | P0       |
| SQD-4 | Remove a card from a slot.                                                                               | P0       |
| SQD-5 | Changing formation keeps placed cards in the closest matching slots.                                     | P1       |
| SQD-6 | Each user has one squad, auto-saved and synced across devices.                                           | P0       |
| SQD-7 | Each player's chemistry style is auto-selected (best for the slot and chem); the user can override it.   | P0       |
| SQD-8 | Visual style resembles FUT cards: player image, card-version styling, overall, position, chem indicator. | P0       |
| SQD-9 | Multiple named squads per user (create, duplicate, delete, compare).                                     | P2       |

### 5.4 Squad metrics

Metrics update instantly on every squad change.

| ID    | Requirement                                                                                                                                 | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| MET-1 | **Squad rating** using the game's formula (see §7.2).                                                                                       | P0       |
| MET-2 | **Chemistry**: team total (0–33) and per-player (0–3), including icon, hero, Hall of FUT and manager contributions.                         | P0       |
| MET-3 | For each player not at full chem, show what would raise it (e.g. "+1 Premier League player").                                               | P1       |
| MET-4 | **Line ratings**: attack, midfield and defence averages.                                                                                    | P0       |
| MET-5 | **Face-stat averages** (PAC, SHO, PAS, DRI, DEF, PHY) for the XI, including chemistry-style boosts.                                         | P0       |
| MET-6 | **True rating**: per player (at their slot) and squad aggregate (see §7.4).                                                                 | P0       |
| MET-7 | Third-party meta rating, shown next to true rating when the data source provides it.                                                        | P1       |
| MET-8 | **Value**: total squad market value, the value of cards still to buy (excluding owned), the remaining budget, and the most expensive cards. | P0       |

### 5.5 Club (owned cards)

| ID    | Requirement                                                                      | Priority |
| ----- | -------------------------------------------------------------------------------- | -------- |
| CLB-1 | Each user can mark cards as owned (manual search and add).                       | P0       |
| CLB-2 | Owned cards are treated as cost 0 in recommendations and are flagged as "owned". | P0       |
| CLB-3 | Owned untradeable cards are supported.                                           | P0       |
| CLB-4 | Bulk import of the club (e.g. CSV).                                              | P2       |
| CLB-5 | Import owned cards from the user's EA account (see §6.4).                        | P2       |

### 5.6 Recommendations

| ID     | Requirement                                                                                                                                                                   | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REC-1  | **Per-slot recommendations**: selecting an empty slot lists the top 5–10 candidates.                                                                                          | P0       |
| REC-2  | **Auto-complete**: one action fills all empty slots with the best combination, optimising jointly for chemistry, performance and budget.                                      | P0       |
| REC-3  | After any squad change (accepting a recommendation or placing a card manually), recommendations for the remaining empty slots are recomputed.                                 | P0       |
| REC-4  | **Total budget** input; empty or zero means unlimited.                                                                                                                        | P0       |
| REC-5  | Optional **per-slot price cap**, which overrides the total budget for that slot.                                                                                              | P0       |
| REC-6  | **Price/performance slider**, from "performance first" to "cheapest first".                                                                                                   | P0       |
| REC-7  | **Minimum chemistry constraints**: per-player minimum (default 2) and team minimum (default 30). Both are adjustable; 0 disables the constraint.                              | P0       |
| REC-8  | Each recommendation shows: true rating at the slot, the change in squad true rating, the change in chemistry (team and affected players), price (or "owned") and value score. | P0       |
| REC-9  | Candidate scope: tradeable market cards plus the user's owned cards.                                                                                                          | P0       |
| REC-10 | The user can exclude specific cards or card versions from recommendations.                                                                                                    | P1       |
| REC-11 | Include SBC cards with estimated cost, and evolution paths.                                                                                                                   | P2       |

### 5.7 Prices

| ID    | Requirement                                                                                                            | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| PRC-1 | Prices are **console** (PlayStation/Xbox shared market) prices.                                                        | P0       |
| PRC-2 | Prices are fetched on demand for the cards being evaluated and cached for **30 minutes**.                              | P0       |
| PRC-3 | A "refresh price now" action bypasses the cache for one card.                                                          | P0       |
| PRC-4 | Every fetched price is stored with a timestamp, building our own price history.                                        | P0       |
| PRC-5 | Price history chart on the card detail view.                                                                           | P1       |
| PRC-6 | A user can enter a price manually; a manual price overrides fetched prices until it expires or a newer fetch succeeds. | P0       |
| PRC-7 | Every displayed price shows its age (e.g. "12 min ago") and its source.                                                | P0       |
| PRC-8 | A card whose price cannot be fetched is clearly marked "price unknown" and handled per §7.5.                           | P0       |

### 5.8 Comparison

| ID    | Requirement                                                                                                  | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------ | -------- |
| CMP-1 | Compare 2–3 cards side by side: face stats, key sub-attributes, true rating per position, PlayStyles, price. | P1       |

## 6. Data sources and acquisition

### 6.1 Card data (stats, metadata)

| Order       | Source                                               | Use                                                              |
| ----------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| Primary     | **FUT.GG** (its JSON endpoints, as used by the site) | All card versions, stats, PlayStyles, roles, AcceleRATE, images. |
| Fallback    | **FUTDatabase API** (free key)                       | Used when FUT.GG fails or returns invalid data.                  |
| Cross-check | **EA ratings API** (`drop-api.ea.com`)               | Base-card validation; mismatches are logged, not auto-applied.   |

- Cards are keyed by EA's `eaId`; holographic variants are distinct cards.
- A scheduled job syncs the catalog **daily**, and can also be triggered manually during promo releases.
- Each sync validates the schema and row counts before replacing data. On failure, the last good catalog is kept and the failure is reported.

### 6.2 Prices

- Prices come from publicly visible price information, read the way a normal browser would display it. Volume is low and rate-limited, and requests are restricted to cards being evaluated.
- Source order: **FUT.GG → FUTWIZ → manual entry**. The final order depends on the M1 data spike.
- **Constraint:** the project does not implement any mechanism to circumvent bot protection (Cloudflare challenge bypass, stealth/fingerprint evasion, CAPTCHA solving, reverse-engineering request signatures). If a source blocks normal access, it is dropped, not defeated.
- The project never automates EA services and never handles EA credentials.

### 6.3 Game rules data

Chemistry thresholds, special-card contributions, chemistry-style boosts, formations, position
eligibility and the squad-rating formula are stored as **versioned configuration data**, not
hard-coded. A mid-season game update then only requires a data change.

### 6.4 Club import from EA account (v0.2 candidate)

EA's Community API, which grants official club access, is only open to authorised partners
(FUT.GG, FUTBIN, FUTWIZ). The only feasible route is a user-initiated, read-only script
(e.g. a bookmarklet). The user runs it while logged in to the EA Web App, and it exports the
club list for import into this app.

- Credentials never leave the user's browser. The app never stores EA credentials or session tokens.
- No automation: the script runs once, on explicit user action, and only reads data.
- **Risk:** EA's rules prohibit third-party tools that interact with the Web App, and the penalties include account bans. The decision to build this feature is deferred to v0.2. That decision is preceded by a dedicated spike and a risk review, recorded in an ADR.

## 7. Domain rules

The rules below reflect FC 27 at launch, based on research dated 2026-10-07. Every item marked
⚠ must be verified in milestone M1.

### 7.1 Chemistry

- Only the starting XI counts. A player earns chem only in a position listed on the card.
- Points per player = club points + league points + nation points, capped at 3.

  | Attribute | 1 pt | 2 pts | 3 pts |
  | --------- | ---- | ----- | ----- |
  | Club      | 2    | 4     | 7     |
  | Nation    | 2    | 5     | 8     |
  | League    | 3    | 5     | 8     |

- Icons always have 3 chem in position. They count +1 toward every league and +1 toward their nation (FC 27 change: previously +2).
- Heroes and Hall of FUT cards always have 3 chem in position. They count +1 toward their nation and +1 toward their league (FC 27 change: previously +2).
- The manager adds +1 count for players sharing his nation or league.
- ⚠ The three-alternate-position cap is removed, and wide players always get their same-flank alternate.

### 7.2 Squad rating

The formula is community reverse-engineered:

1. `sum = Σ ratings`, `avg = sum / n`
2. `cf = Σ max(0, rating_i − avg)`
3. `rating = floor(round(sum + cf) / n)`

⚠ The value of `n` must be confirmed: 11 (starting XI only), or 18 (XI plus substitutes). This
will be verified against in-game examples.

### 7.3 Chemistry styles

- 24 styles: 19 outfield and 5 goalkeeper.
- The boost scales with chem: 1/3 of the boost at 1 chem, 2/3 at 2 chem, the full boost at 3 chem, and nothing at 0 chem.
- ⚠ The per-attribute boost tables still need to be sourced.
- Auto-selection picks the style that maximises the player's true rating at their slot, given their current chem.

### 7.4 True rating

- **Inputs:**
  - Sub-attributes after chemistry-style boosts, weighted per position.
  - Bonuses for weak foot, skill moves, AcceleRATE type, height/build, and PlayStyles / PlayStyles+, weighted per position.
  - A small bonus for Role+ / Role++ familiarity at the slot's position.
- **Output:** a 0–99 score per card per position. The squad aggregate is a positional-weight average over the XI.
- **Documentation:** the formula lives in [`docs/domain/true-rating.md`](../domain/true-rating.md) (created in M3). Its weights are versioned configuration data, editable without a code change.
- **Calibration:** the formula is calibrated against third-party meta ratings, so the result is sensible without copying them.

### 7.5 Recommendation engine

- **Candidate generation:** for each empty slot, cards eligible at the slot's position that respect the per-slot cap. Candidates are pruned to a Pareto front of true rating vs. price.
- **Objective:** maximise `Σ trueRating(chem, style)` over the XI minus `λ · cost`, where λ comes from the price/performance slider.
  - Substitutes are optimised independently by value at their position.
  - Hard constraints: total budget, per-slot caps, minimum chemistry.
- **Auto-complete:** a greedy fill, followed by local-search improvement (swap or replace) under the constraints. The exact algorithm is decided in M5 and recorded in an ADR.
- **Owned cards:** cost 0.
- **Unknown prices:** cards with an unknown price are excluded from budget-constrained results and listed separately as "price unknown".
- **Latency:** results stream progressively as prices arrive (see NFR-2).

## 8. Non-functional requirements

| ID    | Requirement                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-1 | Responsive layout. It is fully usable on a 360 px wide phone screen and on desktop.                                                                                   |
| NFR-2 | Squad metrics update in under 100 ms after a change. The first per-slot recommendations appear in under 3 s; prices that are not yet fetched fill in progressively.   |
| NFR-3 | Installable as a PWA. Card and squad data stay viewable offline (prices are shown as stale).                                                                          |
| NFR-4 | If a data source is down, the app keeps working with the last good data.                                                                                              |
| NFR-5 | Security: only allow-listed accounts. Database row-level security ensures users only edit their own data. Secrets and personal data are handled as described in §9.1. |
| NFR-6 | Cost: free tiers by default. Up to **$10 per month** is acceptable if price fetching requires a dedicated worker.                                                     |
| NFR-7 | The UI is in Turkish. Code, comments, commits and documentation are in English.                                                                                       |
| NFR-8 | Domain logic (chemistry, ratings, recommendations) has at least 90 % unit-test coverage.                                                                              |
| NFR-9 | Accessibility: WCAG 2.1 AA colour contrast. All actions are reachable without drag-and-drop.                                                                          |

## 9. Proposed architecture (to be confirmed by ADRs)

```
                       ┌─────────────────────────────┐
  Phone / Desktop ───▶ │ Web app (PWA)               │  React + TypeScript + Vite
                       │ - squad builder UI          │  hosted on Vercel
                       │ - domain engine (pure TS)   │
                       └──────┬───────────────┬──────┘
                              │               │
                    auth, data│               │price requests
                              ▼               ▼
                 ┌──────────────────┐   ┌──────────────────────┐
                 │ Supabase         │◀──│ Price worker         │  Node + Playwright
                 │ - Postgres       │   │ - on-demand fetch    │  free tier or ≤ $10/mo
                 │ - Google auth    │   │ - rate limit, cache  │
                 │ - row-level sec. │   └──────────────────────┘
                 └────────▲─────────┘
                          │ daily upsert
                 ┌────────┴─────────┐
                 │ Catalog sync job │  GitHub Actions (scheduled)
                 │ FUT.GG → FUTDB   │
                 └──────────────────┘
```

- **Monorepo** (pnpm workspaces):
  - `apps/web`: the web app.
  - `apps/price-worker`: the price worker.
  - `packages/domain`: chemistry, ratings and recommendations; framework-free and fully unit-tested.
  - `packages/data-sync`: the catalog sync.
  - `packages/game-data`: versioned rules configuration.
- **Tooling:**
  - TypeScript (strict), ESLint, Prettier.
  - Vitest for unit tests, Playwright for end-to-end tests, Stryker for mutation testing.
  - Commitlint (Conventional Commits) and GitHub Actions CI.
  - Releases follow SemVer, with a changelog.

### 9.1 Secrets and public-repository safety

The repository is **public**. Anything that would be risky to expose is kept out of it:

- **No sensitive values in Git.** API keys, service-role keys, database URLs, worker tokens and OAuth client secrets are never committed. CI and scheduled jobs read them from **GitHub repository secrets**. Runtime services (Vercel, Supabase, price worker) read them from their own encrypted environment-variable stores.
- **Personal data stays out too.** The allow-listed e-mail addresses are personal data and live in a secret or in the database, never in code.
- **Placeholders only.** `.env.example` documents every variable with placeholder values. Real `.env*` files are git-ignored.
- **Automated leak checks.** CI runs secret scanning (gitleaks) on every push and pull request. GitHub secret scanning and push protection are enabled.
- **Public client values.** Some values are public by design, such as the Supabase URL and anon key, which every browser must receive. They are still injected from secrets at build time rather than committed. They are documented as public, and security relies on row-level security, not on hiding them.

## 10. Development process

### 10.1 Test-first (strict TDD)

1. **Tests come before code.** Every change starts with tests that specify the expected behaviour. The tests are committed first and fail in CI for the right reason (red). Only then is the implementation written (green), then refactored.
2. **The history proves it.** The commit history of each pull request shows this order: a `test:` commit before the matching `feat:`/`fix:` commit. A pull request whose implementation precedes its tests is not merged.
3. **Rules for test quality:**
   - **Exact assertions.** Domain results such as chemistry and squad rating are asserted to the exact value. No "greater than 0" or "is defined" checks.
   - **Real data.** Fixtures are real card data captured from the sources. Expected results come from verifiable references (in-game screenshots or documented game rules), never from running the code under test.
   - **No mocking the unit under test.** Mocks are allowed only at process boundaries (network, clock, database), and contract tests verify those mocks against real responses.
   - **No snapshot-only tests** for logic.
   - **No trivial tests.** Getters, framework behaviour and type-system guarantees are not tested.
   - **Every bug fix starts with a failing test that reproduces it.**
4. **Quality gates in CI:**
   - Line and branch coverage of at least 90 % for `packages/domain`.
   - A **mutation score** of at least 80 % (Stryker). This catches tests that pass regardless of the code.
   - End-to-end tests (Playwright, at mobile and desktop viewports) for every user-facing flow.

### 10.2 Prototype-driven increments

- **Something you can see in every pull request.** Every pull request delivers something the owner can see and try in a browser, not only tests and documentation.
- **Preview deployment.** Each pull request gets its own preview URL (Vercel preview deployments), usable on both phone and desktop.
- **"How to verify" checklist.** Each pull request description contains step-by-step instructions, so the owner can confirm the behaviour visually.
- **Visible work before the full UI exists.** Work that would otherwise be invisible ships with a minimal demo page:
  - Data pipeline: a source-health and catalog browser page.
  - Domain engine: a chemistry and rating playground.

### 10.3 Branches, commits and pull requests

- **Branch names** use a type prefix and a descriptive name: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `ci/`, `perf/`. For example: `feat/squad-builder-pitch`.
- **Commits** follow Conventional Commits.
- **No AI attribution.** Commits, pull requests and comments contain no AI-tool attribution, no co-author trailers and no "generated with" notes.
- **Pull requests** are opened without asking for approval. **Only the owner merges.** No pull request is merged without the owner's approval.
- **Pull request scope:** each pull request covers one increment from §11, small enough to review and verify in one sitting.

## 11. Milestones

Every milestone ends with a demo the owner can open on the preview URL (§10.2).

| Milestone                   | Scope                                                                                                                                 | Owner-visible demo                                                         | Exit criteria                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **M0 — Foundation**         | Repository structure, tooling, CI (lint, types, tests, mutation, secret scan), contributing guide, ADR template, deployment pipeline. | A deployed placeholder page in Turkish, reachable from phone and desktop.  | CI green; preview deployments work.                                |
| **M1 — Data spike**         | Verify every ⚠ item and every data source in §6, including whether prices are reachable through normal browser access.                | Source-health page: live sample cards and prices per source, with status.  | ADRs for card source, price source and squad-rating `n`.           |
| **M2 — Catalog pipeline**   | Database schema, daily sync with fallback and validation.                                                                             | Catalog browser: searchable list of all FC 27 cards with card detail.      | Full FC 27 catalog in the database; sync failures are handled.     |
| **M3 — Domain engine**      | Chemistry, squad rating, chemistry styles, true rating.                                                                               | Playground: pick 11 cards and see chemistry, squad rating and true rating. | Coverage and mutation gates met; results match in-game references. |
| **M4 — Squad builder**      | Auth, formations, pitch UI, slots, metrics panel, club management.                                                                    | Full squad builder with sign-in and cross-device sync.                     | Both users can build and sync a squad on phone and desktop.        |
| **M5 — Prices**             | Price worker, cache, manual override, history.                                                                                        | Live prices with age and source on cards and squad value.                  | Prices shown with age and source; history recorded.                |
| **M6 — Recommendations**    | Per-slot recommendations and auto-complete with constraints.                                                                          | Recommendations panel and "complete squad" button.                         | REC-1 to REC-9 met.                                                |
| **M7 — Search and compare** | Advanced search, comparison, price chart.                                                                                             | Search filters, comparison view, price chart.                              | CAT-4, CMP-1, PRC-5 met.                                           |
| **M8 — Release**            | PWA, performance and accessibility pass, production deployment, v0.1.0.                                                               | Installable app on both phones.                                            | All P0 requirements met; release tagged.                           |

## 12. Risks

| Risk                                         | Impact | Mitigation                                                                                                                     |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Price sources block access or change markup. | High   | Multiple sources, manual entry, cached history, source health monitoring.                                                      |
| FUT.GG's internal API changes or disappears. | High   | FUTDatabase fallback, schema validation, last-good-data retention.                                                             |
| Fetching prices for many candidates is slow. | Medium | Pareto pruning, prefer list pages that show many prices per request, background warm-up of popular cards, progressive results. |
| Game rules change mid-season.                | Medium | Rules stored as versioned data (§6.3).                                                                                         |
| True rating is subjective.                   | Low    | Documented formula, configurable weights, comparison with meta ratings.                                                        |

## 13. Open questions

1. Squad-rating `n` (11 vs 18). Resolved in M1.
2. The exact list of FC 27 formations. Resolved in M1.
3. Chemistry-style per-attribute tables. Resolved in M1.
4. Which price source is reachable without circumvention. Resolved in M1.
5. Whether to build club import from the EA account (§6.4). Decided before v0.2 planning.

## 14. Roadmap after v0.1

- **v0.2:**
  - SBC cards with estimated cost.
  - Evolutions.
  - Multiple saved squads.
  - Role-based true rating with per-slot role selection.
  - Club bulk import.
  - Club import from the EA account, subject to §6.4.
  - Editable true-rating weights in the UI.
