# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Playground pitch: the XI stands in its formation as FUT-style cards; the slot panel shows what the chemistry style adds to each stat.
- UI foundation (ADR-0007): design tokens, an app shell with a main menu (bottom tab bar on phones, header links on desktop), a skip link, 44 px touch targets and a restyled landing, catalog, card detail, playground and source page.
- Product requirements document for v0.1.
- pnpm monorepo with a React + Vite web app, strict TypeScript, ESLint and Prettier.
- Test tooling: Vitest with coverage thresholds, Stryker mutation testing, and Playwright end-to-end tests on desktop and 360 px mobile.
- CI pipeline with format, lint, type, unit, mutation, e2e, commit-message and secret-scan checks.
- Landing page showing the deployed build (version, commit, environment).
- Contributing guide, security policy, ADR log and deployment guide.
- Data source spike results: ADR-0003 (card data sources) and ADR-0004 (price acquisition via a home price agent).
- `@fc27/data-sync` package with schema-validated FUT.GG and EA card adapters and a source health check.
- `/kaynaklar` page and `/api/source-health` endpoint showing the live status of both card sources and the price-access results.
- Scheduled live contract tests for the card sources.
- All-rights-reserved license.
- Catalog storage in Supabase (ADR-0005): migrations, a daily sync workflow that reads FUT.GG in overall-rating partitions, validates the result and keeps the last good catalog on failure, and a production migration workflow.
- Catalog sync status on the `/kaynaklar` page.
- Database integration tests against a local Supabase stack in CI.
- `/katalog` card catalog: search by name ignoring case and accents, filter by a position the card can play, 30 cards per page, best first. `/katalog/:eaId` card detail with all facts and the face stats with their attributes, in Turkish.
- `@fc27/domain` package (ADR-0006): FC 27 rules data (29 formations, 24 chemistry styles with attribute boosts, chemistry thresholds, face-stat weights), squad chemistry, squad rating and chemistry-style boosts.
- `/oyun-alani` squad playground: pick a formation and a card per slot, and see each player's chemistry, team chemistry, squad rating and the stats with a chemistry style.

### Changed

- The `/kaynaklar` page reports FUT.GG from the stored catalog: status of the latest sync, active card count, last successful fetch and the top-rated cards. FUT.GG rejects requests from Vercel's servers, so `/api/source-health` now checks only EA live.

### Fixed

- Cards without a club, such as heroes, no longer fail FUT.GG validation. They broke the catalog sync and the FUT.GG health check, and the source page names their league instead of a club.
- EA cards no longer show FC 25 card images, which EA's API still links and which show outdated cards; the source page shows a placeholder instead.
- A catalog bootstrapped from EA keeps the reason FUT.GG could not be used in its sync record, so the source page shows it.
